import { StockType, type Prisma, type PrismaClient } from "@prisma/client";
import type { LegacyProductDetail, LegacyProductVariant, LegacyVariantAttribute } from "./types";
import { normalizeUniqueText } from "./normalize";

export function mapStockType(value: string): StockType {
  switch (value) {
    case "unlimited":
      return StockType.UNLIMITED;
    case "limited":
      return StockType.LIMITED;
    case "out_of_stock":
      return StockType.OUT_OF_STOCK;
    case "call":
      return StockType.CALL;
    default:
      throw new Error(`Unknown legacy stock_type value: ${value}`);
  }
}

export function mapVariantAttributes(attributes: Pick<LegacyVariantAttribute, "name" | "value">[]): { color: string | null; storage: string | null } {
  const colorAttr = attributes.find((a) => a.name === "رنگ");
  const otherAttrs = attributes.filter((a) => a.name !== "رنگ");

  return {
    color: colorAttr ? colorAttr.value : null,
    storage: otherAttrs.length > 0 ? otherAttrs.map((a) => `${a.name}: ${a.value}`).join(" | ") : null,
  };
}

function round(value: number | null): number | null {
  return value === null ? null : Math.round(value);
}

export function mapLegacyProduct(
  raw: LegacyProductDetail,
  ctx: { mainCategoryId: number | null; otherCategoryIds: number[]; brandId: number | null }
): Prisma.ProductUncheckedCreateInput {
  return {
    name: raw.name,
    englishName: raw.english_name,
    slug: raw.slug,
    description: raw.description,
    analysis: raw.analysis,
    mainCategoryId: ctx.mainCategoryId,
    brandId: ctx.brandId,
    isDigital: raw.is_digital,
    // The legacy API returns `price: null` for some has_variants=true products
    // (authoritative pricing lives on the variants). Product.price is a
    // non-nullable Decimal in our schema (@default(0)), so coalesce here —
    // passing `null` through causes Prisma to reject the whole create/update
    // payload with a confusing "Unknown argument" error.
    price: raw.price ?? 0,
    compareAtPrice: raw.compare_at_price,
    specialOffer: raw.special_offer,
    specialOfferEnd: raw.special_offer_end ? new Date(raw.special_offer_end) : null,
    costPerItem: raw.cost_per_item,
    batchSize: raw.batch_size,
    length: round(raw.length),
    width: round(raw.width),
    height: round(raw.height),
    weight: round(raw.weight),
    barcode: normalizeUniqueText(raw.barcode),
    available: raw.available,
    showPrice: raw.show_price,
    hasVariants: raw.has_variants,
    stock: raw.stock,
    stockType: mapStockType(raw.stock_type.value),
    minOrderQuantity: raw.min_order_quantity,
    maxOrderQuantity: raw.max_order_quantity,
    guarantee: raw.guarantee,
    productIdentifier: normalizeUniqueText(raw.product_identifier),
    processingTime: raw.processing_time,
    seoTitle: raw.seo_title,
    seoDescription: raw.seo_description,
    views: raw.views,
  };
}

export function mapLegacyVariant(
  variant: LegacyProductVariant,
  ctx: { guarantee: string | null; imageId: number | null }
): Omit<Prisma.ProductVariantUncheckedCreateInput, "productId"> {
  const { color, storage } = mapVariantAttributes(variant.attributes);

  return {
    color,
    storage,
    guarantee: ctx.guarantee,
    // Same null-price quirk as the product level (see mapLegacyProduct) —
    // ProductVariant.price is a non-nullable Decimal in our schema.
    price: variant.price ?? 0,
    compareAtPrice: variant.compare_at_price,
    stock: variant.stock,
    stockType: variant.stock > 0 ? StockType.LIMITED : StockType.OUT_OF_STOCK,
    barcode: normalizeUniqueText(variant.barcode),
    productIdentifier: normalizeUniqueText(variant.product_identifier),
    isDefault: variant.is_default,
    length: round(variant.length),
    width: round(variant.width),
    height: round(variant.height),
    weight: round(variant.weight),
    processingTime: variant.processing_time,
    imageId: ctx.imageId,
  };
}

export async function importProduct(
  prisma: PrismaClient,
  raw: LegacyProductDetail,
  categoryIdMap: Map<number, number>,
  brandIdMap: Map<number, number>
): Promise<{ productId: number; variantIdMap: Map<number, number> }> {
  const mainCategoryId = categoryIdMap.get(raw.main_category.id) ?? null;
  const otherCategoryIds = raw.other_categories.map((c) => categoryIdMap.get(c.id)).filter((id): id is number => id !== undefined);
  const brandId = raw.brand ? brandIdMap.get(raw.brand.id) ?? null : null;

  const data = mapLegacyProduct(raw, { mainCategoryId, otherCategoryIds, brandId });

  const product = await prisma.product.upsert({
    where: { slug: raw.slug },
    update: { ...data, otherCategories: { set: otherCategoryIds.map((id) => ({ id })) } },
    create: { ...data, otherCategories: { connect: otherCategoryIds.map((id) => ({ id })) } },
  });

  // Full replace of images/variants on every run — see spec's Idempotency
  // section. This is more destructive than "images/variants" alone:
  // ProductVariant has onDelete: Cascade relations to PriceTier (the B2B
  // pricing engine's own admin-created data — never legacy-sourced),
  // CartItem (live shopping carts), and ProductHistory (the audit trail) —
  // all of those rows are cascade-deleted for every variant on this product.
  // Any non-"LEGACY-"-prefixed OrderItem referencing one of these variants
  // has its variantId SET NULL (it is not recreated by this script). See
  // the final-review fix report (finding #1) for the full analysis.
  const cascadeImpact = await prisma.priceTier.count({ where: { variant: { productId: product.id } } });
  if (cascadeImpact > 0) {
    console.warn(
      `Re-importing product ${product.id} (${raw.slug}) will delete ${cascadeImpact} PriceTier row(s) on its variants (cascade). Re-create them after this import if needed.`
    );
  }

  const legacyImageIdMap = new Map<number, number>();
  const variantIdMap = new Map<number, number>();

  await prisma.$transaction(async (tx) => {
    await tx.productVariant.deleteMany({ where: { productId: product.id } });
    await tx.productImage.deleteMany({ where: { productId: product.id } });

    for (const image of raw.images) {
      const created = await tx.productImage.create({
        data: {
          productId: product.id,
          url: image.image,
          altText: image.image_alt,
          isDefault: image.default,
          order: image.order,
        },
      });
      legacyImageIdMap.set(image.id, created.id);
    }

    for (const variant of raw.variants) {
      const data = mapLegacyVariant(variant, {
        guarantee: raw.guarantee,
        imageId: variant.image ? legacyImageIdMap.get(variant.image.id) ?? null : null,
      });
      const created = await tx.productVariant.create({
        data: { productId: product.id, ...data },
      });
      variantIdMap.set(variant.id, created.id);
    }
  });

  return { productId: product.id, variantIdMap };
}
