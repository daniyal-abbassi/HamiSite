import { OrderStatus, Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { applyOrderStatusTransition, orderListInclude, serializeOrderSummary } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  trackingCode: z.string().optional(),
});

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid order id");
  }
  return id;
}

export const PATCH = withAuth<{ id: string }>(
  async (request, { params }) => {
    return withErrorHandling(async () => {
      const id = parseId(params.id);
      const body = await request.json();
      const parsed = updateStatusSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, "Invalid request body", parsed.error.flatten());
      }

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: { select: { variantId: true, quantity: true, variant: { select: { stockType: true } } } },
          user: { select: { id: true, role: true } },
        },
      });
      if (!order) {
        throw new ApiError(404, "Order not found");
      }

      const updated = await prisma.$transaction(async (tx) => {
        await applyOrderStatusTransition(tx, order, parsed.data.status);

        return tx.order.update({
          where: { id },
          data: { status: parsed.data.status, trackingCode: parsed.data.trackingCode },
          include: orderListInclude(),
        });
      });

      return ok(serializeOrderSummary(updated), { message: "Order status updated" });
    });
  },
  { roles: [Role.ADMIN] },
);
