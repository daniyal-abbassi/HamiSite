import { findProductBySlug } from "@/lib/catalog";
import type { CatalogProduct } from "@/lib/catalog-db";

/**
 * The slim variant list a product card needs: which colours and storages exist, what each costs and
 * whether it can be sold, and the photograph that shows that colour.
 *
 * Some imported DB variants have no `ProductVariant.imageId` even though the catalog snapshot still
 * has the merchant's explicit image_url per variant. That association is used as an image-only
 * fallback, matched by product slug and variant axes; a photo is never inferred from a colour name or
 * a gallery position.
 */
export function cardVariants(product: Pick<CatalogProduct, "slug" | "variants">) {
  const sourceVariants = findProductBySlug(product.slug)?.variants ?? [];
  return product.variants.map((variant) => {
    const color = variant.color ?? variant.options.find((option) => option.label.includes("رنگ"))?.value ?? null;
    const storage = variant.storage ?? variant.options.find((option) => option.label.includes("حافظه"))?.value ?? null;
    return {
      id: variant.id,
      color,
      storage,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      stock: variant.stock,
      stockType: variant.stockType,
      isDefault: variant.isDefault,
      imageUrl: variant.imageUrl ?? (() => {
        if (!color) return null;
        const sameColor = sourceVariants.filter((source) => source.color === color);
        const exact = sameColor.find((source) => source.storage === storage && source.imageUrl);
        const unambiguous = sameColor.length === 1 ? sameColor[0] : null;
        return exact?.imageUrl ?? unambiguous?.imageUrl ?? null;
      })(),
    };
  });
}
