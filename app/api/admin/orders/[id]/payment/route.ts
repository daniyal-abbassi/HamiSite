import { PaymentStatus, Role } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { applyOrderStatusTransition, TERMINAL_CANCEL_STATUSES } from "@/lib/orders";
import { CARD_TO_CARD_METHOD } from "@/lib/payment/card-to-card";
import { prisma } from "@/lib/prisma";
import { revalidateHomepage } from "@/lib/revalidate-homepage";
import { toNumber } from "@/lib/serializers";
import { notifyAdminsNewOrder } from "@/lib/telegram-bot";

const bodySchema = z.object({ action: z.enum(["confirm", "reject"]) }).strict();

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Invalid order id");
  return id;
}

/** Admin verdict on a card-to-card payment. Confirm settles like the gateway callback does. */
export const POST = withAuth<{ id: string }>(
  async (request, { params }) => {
    return withErrorHandling(async () => {
      const orderId = parseId(params.id);
      const parsed = bodySchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) throw new ApiError(400, "Invalid request body", parsed.error.flatten());
      const { action } = parsed.data;

      const outcome = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "orders" WHERE id = ${orderId} FOR UPDATE`;
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: {
            items: { select: { variantId: true, quantity: true, variant: { select: { stockType: true } } } },
            user: { select: { id: true, role: true } },
          },
        });
        if (!order) throw new ApiError(404, "Order not found");
        const closed = TERMINAL_CANCEL_STATUSES.includes(order.status as (typeof TERMINAL_CANCEL_STATUSES)[number]);
        if (closed || order.paymentStatus === PaymentStatus.COMPLETED) {
          throw ApiError.coded(409, "ORDER_NOT_PAYABLE", "Order is already paid or closed");
        }

        if (action === "reject") {
          if (order.paymentStatus !== PaymentStatus.SENT) throw ApiError.coded(409, "NO_PAYMENT_REPORT", "No payment report to reject");
          await tx.payment.updateMany({ where: { orderId, method: CARD_TO_CARD_METHOD, status: PaymentStatus.SENT }, data: { status: PaymentStatus.FAILED } });
          await tx.order.update({ where: { id: orderId }, data: { paymentStatus: PaymentStatus.INITIATED } });
          return { paymentStatus: PaymentStatus.INITIATED, status: order.status, notify: null };
        }

        const reported = await tx.payment.updateMany({ where: { orderId, method: CARD_TO_CARD_METHOD, status: PaymentStatus.SENT }, data: { status: PaymentStatus.COMPLETED } });
        if (reported.count === 0) {
          await tx.payment.create({
            data: {
              orderId,
              userId: order.userId,
              transactionNumber: `${order.orderNumber}-${randomBytes(4).toString("hex")}`,
              amount: order.totalAmount,
              method: CARD_TO_CARD_METHOD,
              status: PaymentStatus.COMPLETED,
            },
          });
        }
        await applyOrderStatusTransition(tx, order, "PROCESSING");
        await tx.order.update({ where: { id: orderId }, data: { paymentStatus: PaymentStatus.COMPLETED, status: "PROCESSING" } });
        return { paymentStatus: PaymentStatus.COMPLETED, status: "PROCESSING" as const, notify: order };
      });

      revalidateHomepage();
      if (outcome.notify) {
        const o = outcome.notify;
        notifyAdminsNewOrder({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: `${o.firstName} ${o.lastName}`.trim(),
          phone: o.phone,
          totalAmount: toNumber(o.totalAmount) ?? 0,
          itemCount: o.items.length,
          city: o.city,
        }).catch((err) => console.warn("Failed to dispatch Telegram order alert:", err));
      }
      return ok({ orderId, paymentStatus: outcome.paymentStatus, status: outcome.status });
    });
  },
  { roles: [Role.ADMIN] },
);
