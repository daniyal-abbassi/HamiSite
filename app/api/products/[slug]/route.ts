import { z } from "zod";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { normalizePaymentTerm, resolveMatchingTier } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { serializeDate, serializeStockType, toNumber } from "@/lib/serializers";

const querySchema = z.object({
  quantity: z.coerce.number().int().positive().optional(),
  paymentTerm: z.string().optional(),
});

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()));

    if (!parsed.success) {
      throw new ApiError(400, "Invalid query parameters", parsed.error.flatten());
    }

    const quantity = parsed.data.quantity ?? 1;
    const paymentTerm = normalizePaymentTerm(parsed.data.paymentTerm ?? "CASH");

    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        mainCategory: { select: { id: true, name: true, slug: true } },
        otherCategories: { select: { id: true, name: true, slug: true } },
        tags: { select: { value: true } },
        images: {
          select: { id: true, url: true, altText: true, isDefault: true, order: true },
          orderBy: [{ isDefault: "desc" }, { order: "asc" }],
        },
        variants: {
          include: {
            priceTiers: {
              where: { isActive: true, paymentMethod: paymentTerm },
              orderBy: { minQuantity: "desc" },
            },
          },
          orderBy: [{ isDefault: "desc" }, { id: "asc" }],
        },
      },
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const variants = product.variants.map((variant) => {
      const basePrice = toNumber(variant.price) ?? 0;
      const matchedTier = resolveMatchingTier({
        quantity,
        paymentTerm,
        tiers: variant.priceTiers.map((tier) => ({
          id: tier.id,
          minQuantity: tier.minQuantity,
          maxQuantity: tier.maxQuantity,
          calculatedPrice: tier.calculatedPrice,
          discountPercent: tier.discountPercent,
        })),
      });

      const unitPrice = matchedTier ? (toNumber(matchedTier.calculatedPrice) ?? basePrice) : basePrice;

      return {
        id: variant.id,
        color: variant.color,
        storage: variant.storage,
        guarantee: variant.guarantee,
        price: basePrice,
        compareAtPrice: toNumber(variant.compareAtPrice),
        stock: variant.stock,
        stockType: serializeStockType(variant.stockType),
        barcode: variant.barcode,
        productIdentifier: variant.productIdentifier,
        isDefault: variant.isDefault,
        unitPrice,
        matchedTier: matchedTier
          ? {
              id: matchedTier.id,
              minQuantity: matchedTier.minQuantity,
              maxQuantity: matchedTier.maxQuantity,
              discountPercent: toNumber(matchedTier.discountPercent),
              calculatedPrice: toNumber(matchedTier.calculatedPrice),
            }
          : null,
      };
    });

    return ok({
      id: product.id,
      name: product.name,
      englishName: product.englishName,
      slug: product.slug,
      description: product.description,
      analysis: product.analysis,
      isDigital: product.isDigital,
      specialOffer: product.specialOffer,
      specialOfferEnd: serializeDate(product.specialOfferEnd),
      stockType: serializeStockType(product.stockType),
      stock: product.stock,
      brand: product.brand,
      mainCategory: product.mainCategory,
      otherCategories: product.otherCategories,
      tags: product.tags.map((t) => t.value),
      images: product.images,
      variants,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    });
  });
}
