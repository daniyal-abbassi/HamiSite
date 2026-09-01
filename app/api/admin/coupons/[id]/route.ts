import { CouponType, Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/serializers";

const updateCouponSchema = z
  .object({
    name: z.string().min(1),
    code: z.string().min(1),
    type: z.nativeEnum(CouponType),
    amount: z.number().min(0),
    usageLimitPerCoupon: z.number().int().positive(),
    usageLimitPerUser: z.number().int().positive(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    maxDiscountAmount: z.number().min(0),
    minCartPrice: z.number().min(0),
    minSuccessfulOrderCount: z.number().int().positive(),
    onlyFirstOrder: z.boolean(),
    paymentMethods: z.array(z.string()),
    isActive: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

function serializeAdminCoupon<T extends { amount: unknown; maxDiscountAmount: unknown; minCartPrice: unknown }>(coupon: T) {
  return {
    ...coupon,
    amount: toNumber(coupon.amount),
    maxDiscountAmount: toNumber(coupon.maxDiscountAmount),
    minCartPrice: toNumber(coupon.minCartPrice),
  };
}

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid coupon id");
  }
  return id;
}

export const PATCH = withAuth<{ id: string }>(
  async (request, { params }) => {
    return withErrorHandling(async () => {
      const id = parseId(params.id);
      const body = await request.json();
      const parsed = updateCouponSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, "Invalid request body", parsed.error.flatten());
      }

      const existing = await prisma.coupon.findUnique({ where: { id } });
      if (!existing) {
        throw new ApiError(404, "Coupon not found");
      }

      if (parsed.data.code && parsed.data.code !== existing.code) {
        const conflict = await prisma.coupon.findFirst({
          where: { code: parsed.data.code, id: { not: id } },
          select: { id: true },
        });
        if (conflict) {
          throw new ApiError(409, `A coupon with code "${parsed.data.code}" already exists`);
        }
      }

      const { startDate, endDate, ...rest } = parsed.data;

      const coupon = await prisma.coupon.update({
        where: { id },
        data: {
          ...rest,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        },
      });

      return ok(serializeAdminCoupon(coupon), { message: "Coupon updated" });
    });
  },
  { roles: [Role.ADMIN] },
);

export const DELETE = withAuth<{ id: string }>(
  async (_request, { params }) => {
    return withErrorHandling(async () => {
      const id = parseId(params.id);
      const existing = await prisma.coupon.findUnique({ where: { id } });
      if (!existing) {
        throw new ApiError(404, "Coupon not found");
      }

      await prisma.coupon.delete({ where: { id } });

      return ok({ id }, { message: "Coupon deleted" });
    });
  },
  { roles: [Role.ADMIN] },
);
