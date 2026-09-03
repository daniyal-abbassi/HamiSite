import { Prisma, Role, StockType } from "@prisma/client";
import { z } from "zod";
import { ApiError, ok, parsePagination, withErrorHandling } from "@/lib/http";
import { normalizePaymentTerm, resolveMatchingTier } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { serializeDate, serializeStockType, toNumber } from "@/lib/serializers";

const querySchema = z.object({
  q: z.string().optional(),
  brandId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  stockType: z.enum(["unlimited", "limited", "out_of_stock", "call"]).optional(),
  specialOffer: z.enum(["true", "false"]).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "special"]).optional(),
  paymentTerm: z.string().optional(),
  quantity: z.coerce.number().int().positive().optional(),
  role: z.enum(["RETAIL", "WHOLESALE", "AGENT", "ADMIN"]).optional(),
  includeVariants: z.enum(["true", "false"]).optional(),
});

// Prisma's `findMany` return type can't statically resolve a runtime-conditional
// `include` (variants: includeVariants ? {...} : false), so it falls back to the
// narrower "variants without priceTiers" shape. This is the fully-included shape
// actually returned when `includeVariants` is true, per the query below.
type VariantWithTiers = Prisma.ProductVariantGetPayload<{
  include: { priceTiers: true };
}>;

const stockTypeFromQuery: Record<string, StockType> = {
  unlimited: StockType.UNLIMITED,
  limited: StockType.LIMITED,
  out_of_stock: StockType.OUT_OF_STOCK,
  call: StockType.CALL,
};

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);

    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      throw new ApiError(400, "Invalid query parameters", parsed.error.flatten());
    }

    const input = parsed.data;
    const includeVariants = input.includeVariants !== "false";
    const quantity = input.quantity ?? 1;
    const role = (input.role ?? "RETAIL") as Role;
    const paymentTerm = normalizePaymentTerm(input.paymentTerm ?? "CASH");

    const andFilters: Array<Record<string, unknown>> = [{ available: true }];

    if (input.q) {
      andFilters.push({
        OR: [
          { name: { contains: input.q, mode: "insensitive" } },
          { englishName: { contains: input.q, mode: "insensitive" } },
          { slug: { contains: input.q, mode: "insensitive" } },
        ],
      });
    }

    if (input.brandId) {
      andFilters.push({ brandId: input.brandId });
    }

    if (input.categoryId) {
      andFilters.push({
        OR: [{ mainCategoryId: input.categoryId }, { otherCategories: { some: { id: input.categoryId } } }],
      });
    }

    if (input.stockType) {
      andFilters.push({ stockType: stockTypeFromQuery[input.stockType] });
    }

    if (input.specialOffer) {
      andFilters.push({ specialOffer: input.specialOffer === "true" });
    }

    if (input.minPrice !== undefined || input.maxPrice !== undefined) {
      const priceCondition: { gte?: number; lte?: number } = {};
      if (input.minPrice !== undefined) priceCondition.gte = input.minPrice;
      if (input.maxPrice !== undefined) priceCondition.lte = input.maxPrice;
      andFilters.push({
        OR: [{ price: priceCondition }, { variants: { some: { price: priceCondition } } }],
      });
    }

    const where = { AND: andFilters };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy:
          input.sort === "price-asc"
            ? [{ price: "asc" }]
            : input.sort === "price-desc"
              ? [{ price: "desc" }]
              : [{ specialOffer: "desc" }, { updatedAt: "desc" }],
        skip: pagination.skip,
        take: pagination.take,
        include: {
          brand: { select: { id: true, name: true, slug: true } },
          mainCategory: { select: { id: true, name: true, slug: true } },
          tags: { select: { value: true } },
          images: {
            select: { id: true, url: true, altText: true, isDefault: true, order: true },
            orderBy: [{ isDefault: "desc" }, { order: "asc" }],
          },
          variants: includeVariants
            ? {
                include: {
                  priceTiers: {
                    where: {
                      isActive: true,
                      paymentMethod: paymentTerm,
                    },
                    orderBy: { minQuantity: "desc" },
                  },
                },
                orderBy: [{ isDefault: "desc" }, { id: "asc" }],
              }
            : false,
        },
      }),
    ]);

    const data = products.map((p) => {
      const productBasePrice = toNumber(p.price) ?? 0;
      const productCompareAt = toNumber(p.compareAtPrice);

      const serializedVariants = includeVariants
        ? (p.variants as VariantWithTiers[]).map((v) => {
            const basePrice = toNumber(v.price) ?? 0;
            const matchedTier = resolveMatchingTier({
              quantity,
              paymentTerm,
              tiers: v.priceTiers.map((tier) => ({
                id: tier.id,
                minQuantity: tier.minQuantity,
                maxQuantity: tier.maxQuantity,
                calculatedPrice: tier.calculatedPrice,
                discountPercent: tier.discountPercent,
              })),
            });

            const quotedUnitPrice = matchedTier ? (toNumber(matchedTier.calculatedPrice) ?? basePrice) : basePrice;

            return {
              id: v.id,
              color: v.color,
              storage: v.storage,
              guarantee: v.guarantee,
              price: basePrice,
              compareAtPrice: toNumber(v.compareAtPrice),
              stock: v.stock,
              stockType: serializeStockType(v.stockType),
              barcode: v.barcode,
              productIdentifier: v.productIdentifier,
              isDefault: v.isDefault,
              quoted: {
                quantity,
                paymentTerm,
                role,
                unitPrice: quotedUnitPrice,
                matchedTier: matchedTier
                  ? {
                      id: matchedTier.id,
                      minQuantity: matchedTier.minQuantity,
                      maxQuantity: matchedTier.maxQuantity,
                      discountPercent: toNumber(matchedTier.discountPercent),
                      calculatedPrice: toNumber(matchedTier.calculatedPrice),
                    }
                  : null,
              },
            };
          })
        : [];

      const defaultVariant = serializedVariants.find((v) => v.isDefault) ?? serializedVariants[0];

      return {
        id: p.id,
        name: p.name,
        englishName: p.englishName,
        slug: p.slug,
        description: p.description,
        specialOffer: p.specialOffer,
        specialOfferEnd: serializeDate(p.specialOfferEnd),
        available: p.available,
        stockType: serializeStockType(p.stockType),
        brand: p.brand,
        mainCategory: p.mainCategory,
        tags: p.tags.map((t) => t.value),
        images: p.images,
        basePrice: productBasePrice,
        compareAtPrice: productCompareAt,
        displayPrice: defaultVariant?.quoted.unitPrice ?? productBasePrice,
        variants: serializedVariants,
      };
    });

    return ok(data, {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      hasNextPage: pagination.page * pagination.pageSize < total,
    });
  });
}
