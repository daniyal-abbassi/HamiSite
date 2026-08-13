import { StockType, type Prisma, type PrismaClient } from "@prisma/client";
import type { LegacyProductDetail, LegacyVariantAttribute } from "./types";

export function normalizeUniqueText(value: string | null | undefined): string | null {
  return value ? value : null;
}

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
    price: raw.price,
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

  // Full replace of images/variants on every run — see spec's Idempotency section.
  await prisma.productVariant.deleteMany({ where: { productId: product.id } });
  await prisma.productImage.deleteMany({ where: { productId: product.id } });

  const legacyImageIdMap = new Map<number, number>();
  for (const image of raw.images) {
    const created = await prisma.productImage.create({
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

  const variantIdMap = new Map<number, number>();
  for (const variant of raw.variants) {
    const { color, storage } = mapVariantAttributes(variant.attributes);
    const created = await prisma.productVariant.create({
      data: {
        productId: product.id,
        color,
        storage,
        guarantee: raw.guarantee,
        price: variant.price,
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
        imageId: variant.image ? legacyImageIdMap.get(variant.image.id) ?? null : null,
      },
    });
    variantIdMap.set(variant.id, created.id);
  }

  return { productId: product.id, variantIdMap };
}
