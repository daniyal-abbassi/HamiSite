import { randomBytes } from "node:crypto";
import { PaymentStatus } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { getPaymentGateway } from "@/lib/payment/gateway";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/serializers";

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid order id");
  }
  return id;
}

export const POST = withAuth<{ id: string }>(async (_request, { user, params }) => {
  return withErrorHandling(async () => {
    const orderId = parseId(params.id);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    if (order.userId !== user.id) {
      throw new ApiError(403, "You do not have access to this order");
    }

    const amount = toNumber(order.totalAmount) ?? 0;
    const callbackUrl = new URL("/api/payments/callback", process.env.APP_BASE_URL ?? "http://localhost:3000").toString();

    const gateway = await getPaymentGateway();
    const { redirectUrl, authority } = await gateway.requestPayment({
      orderId: order.id,
      amount,
      callbackUrl,
      description: `Order ${order.orderNumber}`,
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: user.id,
        transactionNumber: `${order.orderNumber}-${randomBytes(4).toString("hex")}`,
        amount,
        method: "zarinpal",
        psp: "zarinpal",
        status: PaymentStatus.INITIATED,
      },
    });

    return ok({ redirectUrl, authority }, { message: "Payment initiated" });
  });
});
