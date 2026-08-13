import { randomBytes } from "node:crypto";
import { PaymentStatus } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { TERMINAL_CANCEL_STATUSES } from "@/lib/orders";
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

function resolveBaseUrl() {
  const configured = process.env.APP_BASE_URL;
  if (configured) {
    return configured;
  }
  if (process.env.NODE_ENV === "production") {
    throw new ApiError(500, "APP_BASE_URL is not configured");
  }
  return "http://localhost:3000";
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

    // An order that is already settled, or already closed/reversed, must never
    // start a fresh payment attempt: a later failure callback on that new
    // attempt would restock/reverse credit for an order that was already paid.
    const isClosed = TERMINAL_CANCEL_STATUSES.includes(order.status as (typeof TERMINAL_CANCEL_STATUSES)[number]);
    if (order.paymentStatus === PaymentStatus.COMPLETED || isClosed) {
      throw new ApiError(409, "Order is already paid or in a terminal state");
    }

    const amount = toNumber(order.totalAmount);
    if (amount === null || amount === undefined || !Number.isFinite(amount)) {
      throw new ApiError(500, "Order total amount could not be resolved");
    }

    const callbackUrl = new URL("/api/payments/callback", resolveBaseUrl()).toString();

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
        // The gateway authority is the trusted key the callback resolves by.
        authority,
        amount,
        method: "zarinpal",
        psp: "zarinpal",
        status: PaymentStatus.INITIATED,
      },
    });

    return ok({ redirectUrl, authority }, { message: "Payment initiated" });
  });
});
