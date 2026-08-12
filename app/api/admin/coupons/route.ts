import { CouponType, Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/serializers";

const createCouponSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.nativeEnum(CouponType),
  amount: z.number().min(0).optional(),
  usageLimitPerCoupon: z.number().int().positive().optional(),
  usageLimitPerUser: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  minCartPrice: z.number().min(0).optional(),
  minSuccessfulOrderCount: z.number().int().positive().optional(),
  onlyFirstOrder: z.boolean().optional(),
  paymentMethods: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  productIds: z.array(z.number().int().positive()).optional(),
  categoryIds: z.array(z.number().int().positive()).optional(),
  brandIds: z.array(z.number().int().positive()).optional(),
});

function serializeAdminCoupon<T extends { amount: unknown; maxDiscountAmount: unknown; minCartPrice: unknown }>(coupon: T) {
  return {
    ...coupon,
    amount: toNumber(coupon.amount),
    maxDiscountAmount: toNumber(coupon.maxDiscountAmount),
    minCartPrice: toNumber(coupon.minCartPrice),
  };
}

export const POST = withAuth(
  async (request) => {
    return withErrorHandling(async () => {
      const body = await request.json();
      const parsed = createCouponSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, "Invalid request body", parsed.error.flatten());
      }

      const { productIds, categoryIds, brandIds, startDate, endDate, ...rest } = parsed.data;

      const existing = await prisma.coupon.findUnique({ where: { code: rest.code }, select: { id: true } });
      if (existing) {
        throw new ApiError(409, `A coupon with code "${rest.code}" already exists`);
      }

      const coupon = await prisma.coupon.create({
        data: {
          ...rest,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          products: productIds ? { connect: productIds.map((id) => ({ id })) } : undefined,
          categories: categoryIds ? { connect: categoryIds.map((id) => ({ id })) } : undefined,
          brands: brandIds ? { connect: brandIds.map((id) => ({ id })) } : undefined,
        },
      });

      return ok(serializeAdminCoupon(coupon), { message: "Coupon created" });
    });
  },
  { roles: [Role.ADMIN] },
);
