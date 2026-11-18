import { randomBytes } from "node:crypto";
import { PaymentStatus } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { TERMINAL_CANCEL_STATUSES } from "@/lib/orders";
import { CARD_TO_CARD_METHOD } from "@/lib/payment/card-to-card";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/serializers";
import { notifyAdminsPaymentReported } from "@/lib/telegram-bot";

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Invalid order id");
  return id;
}

/** "I have paid": moves INITIATED → SENT once, records the report and alerts the admins once. */
export const POST = withAuth<{ id: string }>(async (_request, { user, params }) => {
  return withErrorHandling(async () => {
    const orderId = parseId(params.id);
    const reportedAt = new Date();

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "orders" WHERE id = ${orderId} FOR UPDATE`;
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: { select: { id: true } } } });
      if (!order) throw new ApiError(404, "Order not found");
      if (order.userId !== user.id) throw new ApiError(403, "You do not have access to this order");
      const closed = TERMINAL_CANCEL_STATUSES.includes(order.status as (typeof TERMINAL_CANCEL_STATUSES)[number]);
      if (closed || order.paymentStatus === PaymentStatus.COMPLETED) {
        throw ApiError.coded(409, "ORDER_NOT_PAYABLE", "Order is already paid or closed");
      }
      if (order.paymentStatus === PaymentStatus.SENT) return { alreadyReported: true as const, order };

      // The WHERE keeps this atomic: of two concurrent reports only one claim succeeds.
      const claimed = await tx.order.updateMany({ where: { id: orderId, paymentStatus: PaymentStatus.INITIATED }, data: { paymentStatus: PaymentStatus.SENT } });
      if (claimed.count !== 1) return { alreadyReported: true as const, order };

      await tx.payment.create({
        data: {
          orderId,
          userId: order.userId,
          transactionNumber: `${order.orderNumber}-${randomBytes(4).toString("hex")}`,
          amount: order.totalAmount,
          method: CARD_TO_CARD_METHOD,
          status: PaymentStatus.SENT,
        },
      });
      return { alreadyReported: false as const, order };
    });

    if (!result.alreadyReported) {
      const { order } = result;
      // An alert that cannot be delivered must never fail or undo the recorded report.
      notifyAdminsPaymentReported({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: `${order.firstName} ${order.lastName}`.trim(),
        phone: order.phone,
        totalAmount: toNumber(order.totalAmount) ?? 0,
        itemCount: order.items.length,
        city: order.city,
        reportedAt,
      }).catch((err) => console.warn("Failed to dispatch Telegram payment alert:", err));
    }

    return ok({ paymentStatus: PaymentStatus.SENT, alreadyReported: result.alreadyReported });
  });
});
