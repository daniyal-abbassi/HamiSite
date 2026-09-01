import { OrderStatus, PaymentStatus, Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { applyOrderStatusTransition, orderListInclude, serializeOrderSummary } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

const updateOrderSchema = z
  .object({
    status: z.nativeEnum(OrderStatus).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    trackingCode: z.string().optional(),
    shippingMethodName: z.string().optional(),
    customerNote: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid order id");
  }
  return id;
}

export const GET = withAuth<{ id: string }>(async (_request, { user, params }) => {
  return withErrorHandling(async () => {
    const id = parseId(params.id);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        ...orderListInclude(),
        agent: { select: { id: true, username: true, role: true } },
        address: true,
        coupon: { select: { id: true, code: true, name: true, type: true } },
      },
    });

    if (!order || (order.userId !== user.id && user.role !== Role.ADMIN)) {
      throw new ApiError(404, "Order not found");
    }

    return ok({
      ...serializeOrderSummary(order),
      agent: order.agent,
      address: order.address,
      coupon: order.coupon,
      customerNote: order.customerNote,
    });
  });
});

export const PATCH = withAuth<{ id: string }>(
  async (request, { params }) => {
    return withErrorHandling(async () => {
      const id = parseId(params.id);
      const body = await request.json();
      const parsed = updateOrderSchema.safeParse(body);

      if (!parsed.success) {
        throw new ApiError(400, "Invalid request body", parsed.error.flatten());
      }

      const input = parsed.data;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            select: {
              variantId: true,
              quantity: true,
              variant: { select: { stockType: true } },
            },
          },
          user: { select: { id: true, role: true } },
        },
      });

      if (!order) {
        throw new ApiError(404, "Order not found");
      }

      const updated = await prisma.$transaction(async (tx) => {
        await applyOrderStatusTransition(tx, order, input.status ?? order.status);

        return tx.order.update({
          where: { id },
          data: {
            status: input.status,
            paymentStatus: input.paymentStatus,
            trackingCode: input.trackingCode,
            shippingMethodName: input.shippingMethodName,
            customerNote: input.customerNote,
          },
          include: orderListInclude(),
        });
      });

      return ok(serializeOrderSummary(updated), { message: "Order updated" });
    });
  },
  { roles: [Role.ADMIN] },
);
