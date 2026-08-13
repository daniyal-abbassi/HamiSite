import { PaymentStatus } from "@prisma/client";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { applyOrderStatusTransition } from "@/lib/orders";
import { getPaymentGateway } from "@/lib/payment/gateway";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/serializers";

/// Thrown inside the settlement transaction when another concurrent callback
/// already claimed this Payment row. Rolls the transaction back so nothing is
/// applied twice, and is translated into an idempotent 200 response.
class PaymentAlreadyProcessedError extends Error {}

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const authority = searchParams.get("Authority");
    const status = searchParams.get("Status");
    const orderIdParam = searchParams.get("orderId");

    if (!authority || !status) {
      throw new ApiError(400, "Missing Authority or Status");
    }

    // This route is necessarily unauthenticated (the gateway calls it), so the
    // ONLY trustworthy input is the gateway-issued authority. The Payment row
    // it maps to is the sole source of truth for which order gets settled — a
    // query-string orderId is attacker-controlled and is never trusted.
    const payment = await prisma.payment.findFirst({
      where: { authority, status: PaymentStatus.INITIATED },
    });
    if (!payment) {
      throw new ApiError(404, "No pending payment found for this authority");
    }

    const orderId = payment.orderId;

    // Defense in depth: if the caller also supplied an orderId, it must agree
    // with the one bound to this authority.
    if (orderIdParam !== null && Number(orderIdParam) !== orderId) {
      throw new ApiError(400, "orderId does not match this payment");
    }

    const amount = toNumber(payment.amount);
    if (amount === null || !Number.isFinite(amount)) {
      throw new ApiError(500, "Payment amount could not be resolved");
    }

    const gateway = await getPaymentGateway();
    const result = await gateway.verifyPayment({ authority, status, amount });

    const nextPaymentStatus = result.success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
    const nextOrderStatus = result.success ? ("PROCESSING" as const) : ("FAILED" as const);

    let orderAlreadySettled = false;

    try {
      await prisma.$transaction(async (tx) => {
        // Atomic claim: the INITIATED precondition lives in the WHERE clause, so
        // two concurrent callbacks for the same authority cannot both proceed.
        const claimed = await tx.payment.updateMany({
          where: { id: payment.id, status: PaymentStatus.INITIATED },
          data: {
            status: nextPaymentStatus,
            transactionNumber: result.refId ?? payment.transactionNumber,
          },
        });
        if (claimed.count !== 1) {
          throw new PaymentAlreadyProcessedError();
        }

        // Re-read the order inside the transaction: the pre-transaction snapshot
        // predates any lock and may be stale.
        const current = await tx.order.findUniqueOrThrow({
          where: { id: orderId },
          include: {
            items: { select: { variantId: true, quantity: true, variant: { select: { stockType: true } } } },
            user: { select: { id: true, role: true } },
          },
        });

        // An order settled by an earlier attempt must never be re-transitioned:
        // moving a paid order to FAILED would restock and reverse B2B credit for
        // goods that were actually paid for.
        if (current.paymentStatus === PaymentStatus.COMPLETED) {
          orderAlreadySettled = true;
          return;
        }

        await applyOrderStatusTransition(tx, current, nextOrderStatus);

        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: nextPaymentStatus, status: nextOrderStatus },
        });
      });
    } catch (error) {
      if (error instanceof PaymentAlreadyProcessedError) {
        return ok({ orderId, success: result.success, alreadyProcessed: true }, { message: "Payment already processed" });
      }
      throw error;
    }

    if (orderAlreadySettled) {
      return ok({ orderId, success: result.success, orderAlreadySettled: true }, { message: "Order is already settled" });
    }

    return ok({ orderId, success: result.success }, { message: result.success ? "Payment completed" : "Payment failed" });
  });
}
