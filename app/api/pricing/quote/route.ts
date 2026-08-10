import { B2BPaymentTerm, Role } from "@prisma/client";
import { z } from "zod";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { ensureB2BTermAllowed, normalizePaymentTerm, resolveMatchingTier } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/serializers";

const itemSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().optional(),
  quantity: z.number().int().positive(),
});

const bodySchema = z.object({
  userId: z.number().int().positive().optional(),
  role: z.nativeEnum(Role).optional(),
  paymentTerm: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid request body", parsed.error.flatten());
    }

    const input = parsed.data;
    const paymentTerm = normalizePaymentTerm(input.paymentTerm ?? "CASH");

    let role: Role = input.role ?? Role.RETAIL;
    let user = null as null | { id: number; role: Role; creditLimit: unknown; creditUsed: unknown };

    if (input.userId) {
      user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, role: true, creditLimit: true, creditUsed: true },
      });
      if (!user) throw new ApiError(404, "User not found");
      role = user.role;
    }

    ensureB2BTermAllowed(role, paymentTerm);

    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const variantIds = [...new Set(input.items.map((i) => i.variantId).filter((v): v is number => Boolean(v)))];

    const [products, variants] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, slug: true, price: true } }),
      prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: {
          id: true,
          productId: true,
          color: true,
          storage: true,
          price: true,
          priceTiers: {
            where: { isActive: true, paymentMethod: paymentTerm },
            orderBy: { minQuantity: "desc" },
            select: {
              id: true,
              minQuantity: true,
              maxQuantity: true,
              calculatedPrice: true,
              discountPercent: true,
              paymentMethod: true,
            },
          },
        },
      }),
    ]);

    const productById = new Map(products.map((p) => [p.id, p]));
    const variantById = new Map(variants.map((v) => [v.id, v]));

    let subtotal = 0;

    const lines = input.items.map((item) => {
      const product = productById.get(item.productId);
      if (!product) {
        throw new ApiError(404, `Product ${item.productId} not found`);
      }

      let unitPrice = toNumber(product.price) ?? 0;
      let matchedTier: {
        id: number;
        minQuantity: number;
        maxQuantity: number | null;
        discountPercent: number | null;
        calculatedPrice: number | null;
      } | null = null;

      let variantInfo: { id: number; color: string | null; storage: string | null } | null = null;

      if (item.variantId) {
        const variant = variantById.get(item.variantId);
        if (!variant || variant.productId !== product.id) {
          throw new ApiError(400, `Variant ${item.variantId} does not belong to product ${product.id}`);
        }

        unitPrice = toNumber(variant.price) ?? unitPrice;

        const tier = resolveMatchingTier({
          quantity: item.quantity,
          paymentTerm: paymentTerm as B2BPaymentTerm,
          tiers: variant.priceTiers,
        });

        if (tier) {
          unitPrice = toNumber(tier.calculatedPrice) ?? unitPrice;
          matchedTier = {
            id: tier.id,
            minQuantity: tier.minQuantity,
            maxQuantity: tier.maxQuantity,
            discountPercent: toNumber(tier.discountPercent),
            calculatedPrice: toNumber(tier.calculatedPrice),
          };
        }

        variantInfo = { id: variant.id, color: variant.color, storage: variant.storage };
      }

      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      return {
        product: { id: product.id, name: product.name, slug: product.slug },
        variant: variantInfo,
        quantity: item.quantity,
        pricing: {
          paymentTerm,
          unitPrice,
          lineTotal,
          matchedTier,
        },
      };
    });

    const credit = user
      ? {
          creditLimit: toNumber(user.creditLimit) ?? 0,
          creditUsed: toNumber(user.creditUsed) ?? 0,
        }
      : null;

    return ok({
      role,
      paymentTerm,
      lines,
      totals: {
        subtotal,
        shipping: 0,
        discount: 0,
        tax: 0,
        grandTotal: subtotal,
      },
      credit,
    });
  });
}
