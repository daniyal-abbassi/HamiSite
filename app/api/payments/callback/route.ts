import { PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/http";
import { applyOrderStatusTransition, TERMINAL_CANCEL_STATUSES } from "@/lib/orders";
import { getPaymentGateway } from "@/lib/payment/gateway";
import { prisma } from "@/lib/prisma";
import { revalidateHomepage } from "@/lib/revalidate-homepage";
import { toNumber } from "@/lib/serializers";

/// Thrown inside the settlement transaction when another concurrent callback
/// already claimed this Payment row. Rolls the transaction back so nothing is
/// applied twice, and is translated into an idempotent 200 response.
class PaymentAlreadyProcessedError extends Error {}

type Result = "success" | "failed" | "verify_failed" | "notfound" | "error";

function resultRedirect(request: Request, result: Result, orderId?: number) {
  const url = new URL("/payment/result", request.url);
  url.searchParams.set("payment", result);
  if (orderId) url.searchParams.set("orderId", String(orderId));
  return NextResponse.redirect(url, 302);
}

export async function GET(request: Request) {
  const response = await withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const authority = searchParams.get("Authority");
    const status = searchParams.get("Status");
    const orderIdParam = searchParams.get("orderId");

    if (!authority || !status) return resultRedirect(request, "error");

    // This route is necessarily unauthenticated (the gateway calls it), so the
    // ONLY trustworthy input is the gateway-issued authority. The Payment row
    // it maps to is the sole source of truth for which order gets settled — a
    // query-string orderId is attacker-controlled and is never trusted.
    const payment = await prisma.payment.findUnique({
      where: { authority },
      include: { order: { select: { paymentStatus: true } } },
    });
    if (!payment) return resultRedirect(request, "notfound");

    const orderId = payment.orderId;

    // Defense in depth: if the caller also supplied an orderId, it must agree
    // with the one bound to this authority.
    if (orderIdParam !== null && Number(orderIdParam) !== orderId) return resultRedirect(request, "error");

    if (payment.status !== PaymentStatus.INITIATED) {
      return resultRedirect(request,
        payment.status === PaymentStatus.COMPLETED
          ? payment.order.paymentStatus === PaymentStatus.COMPLETED ? "success" : "error"
          : "failed", orderId);
    }

    const amount = toNumber(payment.amount);
    if (amount === null || !Number.isFinite(amount) || amount <= 0) return resultRedirect(request, "error", orderId);

    if (status !== "OK" && status !== "NOK") return resultRedirect(request, "error", orderId);

    let result: { success: boolean; refId?: string };
    if (status === "NOK") {
      result = { success: false };
    } else {
      try {
        const gateway = await getPaymentGateway();
        result = await gateway.verifyPayment({ authority, status, amount });
      } catch (error) {
        console.error("Payment verification was inconclusive", error);
        return resultRedirect(request, "error", orderId);
      }
    }

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

        // Serialize every callback that targets this order, not just those that
        // target the same Payment row. Stacked attempts have distinct Payment
        // ids, so the claim above lets two of them run concurrently; without an
        // order-level lock both would read the order in its pre-resolution state
        // under Read Committed and both would apply a status transition.
        // Prisma has no FOR UPDATE builder, hence the raw read.
        await tx.$queryRaw`SELECT id FROM "orders" WHERE id = ${orderId} FOR UPDATE`;

        // Re-read the order inside the transaction: the pre-transaction snapshot
        // predates any lock and may be stale.
        const current = await tx.order.findUniqueOrThrow({
          where: { id: orderId },
          include: {
            items: { select: { variantId: true, quantity: true, variant: { select: { stockType: true } } } },
            user: { select: { id: true, role: true } },
          },
        });

        // An order resolved by an earlier attempt must never be re-transitioned,
        // in EITHER direction:
        //  - paid -> FAILED would restock and reverse B2B credit for goods that
        //    were actually paid for;
        //  - failed/canceled -> PROCESSING would silently keep the stock and
        //    credit that the failing attempt already gave back, because
        //    applyOrderStatusTransition only reverses on open -> closed and
        //    never re-applies on closed -> open.
        // The Payment row's own outcome is already recorded by the claim above
        // and stays committed; only the order transition is skipped.
        if (current.paymentStatus === PaymentStatus.COMPLETED) {
          orderAlreadySettled = true;
          return;
        }
        if (TERMINAL_CANCEL_STATUSES.includes(current.status as (typeof TERMINAL_CANCEL_STATUSES)[number])) {
          orderAlreadySettled = true;
          return;
        }

        await applyOrderStatusTransition(tx, current, nextOrderStatus);

        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: nextPaymentStatus, status: nextOrderStatus },
        });
      });

      revalidateHomepage();
    } catch (error) {
      if (error instanceof PaymentAlreadyProcessedError) {
        const resolved = await prisma.payment.findUniqueOrThrow({
          where: { id: payment.id }, include: { order: { select: { paymentStatus: true } } },
        });
        return resultRedirect(request,
          resolved.status === PaymentStatus.COMPLETED
            ? resolved.order.paymentStatus === PaymentStatus.COMPLETED ? "success" : "error"
            : "failed", orderId);
      }
      throw error;
    }

    if (orderAlreadySettled) {
      return resultRedirect(request, result.success ? "error" : "failed", orderId);
    }

    return resultRedirect(request, result.success ? "success" : status === "NOK" ? "failed" : "verify_failed", orderId);
  });
  return response.status >= 400 ? resultRedirect(request, "error") : response;
}
