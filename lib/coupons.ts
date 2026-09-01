import { CouponType, OrderStatus } from "@prisma/client";
import { ApiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/serializers";

export type CouponEvaluationInput = {
  code: string;
  userId?: number;
  subtotal: number;
  shippingPrice?: number;
  paymentMethod?: string;
  productIds?: number[];
  categoryIds?: number[];
  brandIds?: number[];
};

type CouponOutcomeBase = {
  couponId: number;
  code: string;
  name: string;
  type: CouponType;
};

export type CouponEvaluation =
  | (CouponOutcomeBase & { valid: true; discountAmount: number })
  | (CouponOutcomeBase & { valid: false; reason: string; discountAmount: 0 });

/**
 * Single source of truth for coupon business rules — shared by the
 * standalone `/api/coupons/validate` endpoint and order creation, so a
 * coupon that "validates" always behaves identically when actually applied
 * to an order.
 *
 * Throws ApiError(404) if the code doesn't exist at all. Business-rule
 * failures (expired, limit reached, not applicable, ...) are returned as
 * `{ valid: false, reason }` instead of thrown, since callers may want to
 * surface these as either a soft UI message (validate endpoint) or a hard
 * checkout error (order creation).
 */
export async function evaluateCoupon(input: CouponEvaluationInput): Promise<CouponEvaluation> {
  const coupon = await prisma.coupon.findFirst({
    where: { code: { equals: input.code, mode: "insensitive" } },
    include: {
      products: { select: { id: true } },
      categories: { select: { id: true } },
      brands: { select: { id: true } },
    },
  });

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  const invalidate = (reason: string): CouponEvaluation => ({
    valid: false,
    reason,
    discountAmount: 0,
    couponId: coupon.id,
    code: coupon.code,
    name: coupon.name,
    type: coupon.type,
  });

  if (!coupon.isActive) {
    return invalidate("This coupon is no longer active");
  }

  const now = new Date();
  if (coupon.startDate && now < coupon.startDate) {
    return invalidate("This coupon is not active yet");
  }
  if (coupon.endDate && now > coupon.endDate) {
    return invalidate("This coupon has expired");
  }

  const minCartPrice = toNumber(coupon.minCartPrice);
  if (minCartPrice !== null && input.subtotal < minCartPrice) {
    return invalidate(`A minimum cart value of ${minCartPrice} is required for this coupon`);
  }

  if (coupon.paymentMethods.length > 0 && input.paymentMethod && !coupon.paymentMethods.includes(input.paymentMethod)) {
    return invalidate("This coupon is not valid for the selected payment method");
  }

  if (coupon.products.length > 0) {
    const allowedIds = new Set(coupon.products.map((p) => p.id));
    const hasMatch = (input.productIds ?? []).some((id) => allowedIds.has(id));
    if (!hasMatch) return invalidate("This coupon does not apply to the items in your cart");
  }

  if (coupon.categories.length > 0) {
    const allowedIds = new Set(coupon.categories.map((c) => c.id));
    const hasMatch = (input.categoryIds ?? []).some((id) => allowedIds.has(id));
    if (!hasMatch) return invalidate("This coupon does not apply to the items in your cart");
  }

  if (coupon.brands.length > 0) {
    const allowedIds = new Set(coupon.brands.map((b) => b.id));
    const hasMatch = (input.brandIds ?? []).some((id) => allowedIds.has(id));
    if (!hasMatch) return invalidate("This coupon does not apply to the items in your cart");
  }

  if (coupon.usageLimitPerCoupon) {
    const totalUsages = await prisma.couponUsage.count({ where: { couponId: coupon.id } });
    if (totalUsages >= coupon.usageLimitPerCoupon) {
      return invalidate("This coupon has reached its usage limit");
    }
  }

  if (input.userId) {
    if (coupon.usageLimitPerUser) {
      const userUsages = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId: input.userId },
      });
      if (userUsages >= coupon.usageLimitPerUser) {
        return invalidate("You have already used this coupon the maximum number of times");
      }
    }

    if (coupon.onlyFirstOrder) {
      const priorOrders = await prisma.order.count({
        where: { userId: input.userId, status: { notIn: [OrderStatus.CANCELED, OrderStatus.FAILED] } },
      });
      if (priorOrders > 0) {
        return invalidate("This coupon is valid for first orders only");
      }
    }

    if (coupon.minSuccessfulOrderCount) {
      const successfulOrders = await prisma.order.count({
        where: { userId: input.userId, status: OrderStatus.COMPLETED },
      });
      if (successfulOrders < coupon.minSuccessfulOrderCount) {
        return invalidate("You have not met the order history requirement for this coupon");
      }
    }
  }

  let discountAmount = 0;
  if (coupon.type === CouponType.PERCENT_BASED) {
    const percent = toNumber(coupon.amount) ?? 0;
    discountAmount = (input.subtotal * percent) / 100;
  } else if (coupon.type === CouponType.AMOUNT_BASED) {
    discountAmount = toNumber(coupon.amount) ?? 0;
  } else if (coupon.type === CouponType.SHIPPING_PRICE) {
    discountAmount = input.shippingPrice ?? 0;
  }

  const maxDiscountAmount = toNumber(coupon.maxDiscountAmount);
  if (maxDiscountAmount !== null) {
    discountAmount = Math.min(discountAmount, maxDiscountAmount);
  }

  if (coupon.type !== CouponType.SHIPPING_PRICE) {
    discountAmount = Math.min(discountAmount, input.subtotal);
  } else {
    discountAmount = Math.min(discountAmount, input.shippingPrice ?? 0);
  }

  discountAmount = Math.round(discountAmount * 100) / 100;

  return {
    valid: true,
    discountAmount,
    couponId: coupon.id,
    code: coupon.code,
    name: coupon.name,
    type: coupon.type,
  };
}
