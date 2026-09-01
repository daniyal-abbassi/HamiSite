import { z } from "zod";
import { getOptionalSessionUser } from "@/lib/auth";
import { evaluateCoupon } from "@/lib/coupons";
import { ApiError, ok, withErrorHandling } from "@/lib/http";

const validateSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().min(0),
  shippingPrice: z.number().min(0).optional(),
  paymentMethod: z.string().optional(),
  productIds: z.array(z.number().int().positive()).optional(),
  categoryIds: z.array(z.number().int().positive()).optional(),
  brandIds: z.array(z.number().int().positive()).optional(),
});

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsed = validateSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid request body", parsed.error.flatten());
    }

    const sessionUser = await getOptionalSessionUser(request);

    const result = await evaluateCoupon({ ...parsed.data, userId: sessionUser?.id });

    return ok(
      result.valid
        ? {
            valid: true,
            coupon: { id: result.couponId, code: result.code, name: result.name, type: result.type },
            discountAmount: result.discountAmount,
          }
        : {
            valid: false,
            reason: result.reason,
            coupon: { id: result.couponId, code: result.code, name: result.name, type: result.type },
            discountAmount: 0,
          },
    );
  });
}
