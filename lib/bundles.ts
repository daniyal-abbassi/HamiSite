import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeStockType, toNumber } from "@/lib/serializers";
import type { PartnerBundleDTO, PartnerBundleItemDTO } from "@/types/bundles";

/**
 * Creates a URL-friendly slug from Persian / English title.
 */
export function slugifyBundleTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[\s\u200c]+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Calculates discount and savings for a bundle compared to individual constituent prices.
 */
export function calculateBundleSavings(
  bundlePrice: number,
  items: Array<{ unitPrice: number; quantity: number }>,
  customCompareAtPrice?: number | null
): {
  compareAtPrice: number;
  savingsAmount: number;
  savingsPercent: number;
} {
  const aggregateOriginalPrice = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const compareAt = customCompareAtPrice && customCompareAtPrice > bundlePrice
    ? customCompareAtPrice
    : Math.max(aggregateOriginalPrice, bundlePrice);

  const savingsAmount = Math.max(0, compareAt - bundlePrice);
  const savingsPercent = compareAt > 0 ? Math.round((savingsAmount / compareAt) * 100) : 0;

  return {
    compareAtPrice: compareAt,
    savingsAmount,
    savingsPercent,
  };
}

/**
 * Computes real-time availability and maximum purchasable bundles based on
 * both the bundle's allocated quota AND constituent products' physical warehouse stocks.
 */
export function checkBundleAvailability(
  bundleQuotaStock: number,
  items: Array<{
    quantity: number;
    stock: number;
    stockType?: string;
  }>
): {
  isAvailable: boolean;
  maxPurchasableUnits: number;
} {
  if (bundleQuotaStock <= 0) {
    return { isAvailable: false, maxPurchasableUnits: 0 };
  }

  let maxUnitsFromWarehouse = bundleQuotaStock;

  for (const item of items) {
    if (item.quantity <= 0) continue;
    if (item.stockType === "OUT_OF_STOCK" || item.stockType === "CALL") {
      return { isAvailable: false, maxPurchasableUnits: 0 };
    }
    if (item.stockType === "UNLIMITED") {
      continue;
    }
    const unitsSupported = Math.floor(Math.max(0, item.stock) / item.quantity);
    maxUnitsFromWarehouse = Math.min(maxUnitsFromWarehouse, unitsSupported);
  }

  const finalMaxUnits = Math.min(bundleQuotaStock, maxUnitsFromWarehouse);
  return {
    isAvailable: finalMaxUnits > 0,
    maxPurchasableUnits: Math.max(0, finalMaxUnits),
  };
}

export function bundleInclude() {
  return {
    items: {
      include: {
        product: {
          select: {
            id: true,
            name: true,
            englishName: true,
            slug: true,
            price: true,
            available: true,
            stock: true,
            stockType: true,
            images: {
              where: { isDefault: true },
              take: 1,
              select: { url: true, altText: true },
            },
          },
        },
        variant: {
          select: {
            id: true,
            color: true,
            storage: true,
            price: true,
            stock: true,
            stockType: true,
          },
        },
      },
      orderBy: { order: "asc" as const },
    },
  };
}

export type LoadedBundle = Prisma.PartnerBundleGetPayload<{ include: ReturnType<typeof bundleInclude> }>;

export function serializePartnerBundle(bundle: LoadedBundle): PartnerBundleDTO {
  const bundlePrice = toNumber(bundle.price) ?? 0;
  const rawCompareAt = toNumber(bundle.compareAtPrice);

  const serializedItems: PartnerBundleItemDTO[] = (bundle.items ?? []).map((line) => {
    const unitPrice = toNumber(line.variant?.price ?? line.product.price) ?? 0;
    const variantName = [line.variant?.color, line.variant?.storage].filter(Boolean).join(" - ") || null;
    const stock = line.variant ? line.variant.stock : line.product.stock;

    return {
      id: line.id,
      productId: line.productId,
      productName: line.product.name,
      productEnglishName: line.product.englishName ?? null,
      productSlug: line.product.slug,
      variantId: line.variantId,
      variantName,
      quantity: line.quantity,
      unitPrice,
      stock,
      imageUrl: line.product.images?.[0]?.url ?? null,
    };
  });

  const { compareAtPrice, savingsAmount, savingsPercent } = calculateBundleSavings(
    bundlePrice,
    serializedItems.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
    rawCompareAt
  );

  const availabilityItems = (bundle.items ?? []).map((line) => ({
    quantity: line.quantity,
    stock: line.variant ? line.variant.stock : line.product.stock,
    stockType: line.variant ? line.variant.stockType : line.product.stockType,
  }));

  const { isAvailable, maxPurchasableUnits } = checkBundleAvailability(bundle.stock, availabilityItems);

  const totalUnitsCount = serializedItems.reduce((acc, item) => acc + item.quantity, 0);

  return {
    id: bundle.id,
    title: bundle.title,
    slug: bundle.slug,
    description: bundle.description,
    price: bundlePrice,
    compareAtPrice,
    savingsAmount,
    savingsPercent,
    stock: bundle.stock,
    isActive: bundle.isActive,
    imageUrl: bundle.imageUrl,
    createdAt: bundle.createdAt.toISOString(),
    updatedAt: bundle.updatedAt.toISOString(),
    itemsCount: serializedItems.length,
    totalUnitsCount,
    isAvailable: bundle.isActive && isAvailable,
    maxPurchasableUnits: bundle.isActive ? maxPurchasableUnits : 0,
    items: serializedItems,
  };
}

