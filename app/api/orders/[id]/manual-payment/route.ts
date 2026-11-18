import { PaymentStatus } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { TERMINAL_CANCEL_STATUSES } from "@/lib/orders";
import { CARD_TO_CARD_BANK } from "@/lib/payment/card-to-card";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/serializers";
import { getCardToCardEnabled } from "@/lib/site-settings";

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Invalid order id");
  return id;
}

/** Transfer details for the signed-in owner of an unpaid order while card-to-card mode is on. */
export const GET = withAuth<{ id: string }>(async (_request, { user, params }) => {
  return withErrorHandling(async () => {
    const order = await prisma.order.findUnique({ where: { id: parseId(params.id) } });
    if (!order) throw new ApiError(404, "Order not found");
    if (order.userId !== user.id) throw new ApiError(403, "You do not have access to this order");
    const closed = TERMINAL_CANCEL_STATUSES.includes(order.status as (typeof TERMINAL_CANCEL_STATUSES)[number]);
    if (closed || (order.paymentStatus !== PaymentStatus.INITIATED && order.paymentStatus !== PaymentStatus.SENT)) {
      throw ApiError.coded(409, "ORDER_NOT_PAYABLE", "Order is already paid or closed");
    }
    if (!(await getCardToCardEnabled())) {
      throw ApiError.coded(409, "MANUAL_PAYMENT_DISABLED", "Card-to-card payment is not active");
    }
    return ok({
      orderNumber: order.orderNumber,
      amount: toNumber(order.totalAmount) ?? 0,
      paymentStatus: order.paymentStatus,
      bank: CARD_TO_CARD_BANK,
    });
  });
});
