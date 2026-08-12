import { PaymentStatus } from "@prisma/client";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { applyOrderStatusTransition, orderListInclude } from "@/lib/orders";
import { getPaymentGateway } from "@/lib/payment/gateway";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/serializers";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const authority = searchParams.get("Authority");
    const status = searchParams.get("Status");
    const orderIdParam = searchParams.get("orderId");

    if (!authority || !status || !orderIdParam) {
      throw new ApiError(400, "Missing Authority, Status, or orderId");
    }

    const orderId = Number(orderIdParam);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { select: { variantId: true, quantity: true, variant: { select: { stockType: true } } } },
        user: { select: { id: true, role: true } },
      },
    });
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const payment = await prisma.payment.findFirst({
      where: { orderId, status: PaymentStatus.INITIATED },
      orderBy: { createdAt: "desc" },
    });
    if (!payment) {
      throw new ApiError(404, "No pending payment found for this order");
    }

    const gateway = await getPaymentGateway();
    const result = await gateway.verifyPayment({ authority, status, amount: toNumber(payment.amount) ?? 0 });

    const nextPaymentStatus = result.success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
    const nextOrderStatus = result.success ? ("PROCESSING" as const) : ("FAILED" as const);

    await prisma.$transaction(async (tx) => {
      await applyOrderStatusTransition(tx, order, nextOrderStatus);

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: nextPaymentStatus, transactionNumber: result.refId ?? payment.transactionNumber },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: nextPaymentStatus, status: nextOrderStatus },
        include: orderListInclude(),
      });
    });

    return ok({ orderId, success: result.success }, { message: result.success ? "Payment completed" : "Payment failed" });
  });
}
