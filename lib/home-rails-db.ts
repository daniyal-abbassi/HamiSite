import { hasStudioPhoto, queryDiscountedRailProducts, queryProducts } from "@/lib/catalog-db";
import { findProductBySlug } from "@/lib/catalog";
import { isPurchasable, modelKey } from "@/lib/product-identity";
import mirroredImages from "@/data/catalog-images.json";

const catalogImageMirror = mirroredImages as Record<string, string>;

/**
 * The homepage's two product rails, read from the seam on the server.
 *
 * Both read from the server-side catalog seam so browsing does not need a client
 * round-trip. The main shelf requests twelve products; the continuation rail
 * uses the same catalog ordering without repeating those first twelve.
 */

export type RailProduct = {
  id: number;
  name: string;
  englishName: string | null;
  slug: string;
  brand: { id: number; name: string; slug: string } | null;
  mainCategory: { id: number; name: string; slug: string } | null;
  displayPrice: number;
  compareAtPrice: number | null;
  stockType: string;
  available: boolean;
  images?: Array<{ id: number; url: string; isDefault: boolean; order: number }>;
  specialOffer?: boolean;
  updatedAt?: string;
  variantColors?: string[];
  variants?: Array<{
    id: number;
    color: string | null;
    storage: string | null;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    stockType: string;
    isDefault: boolean;
    imageUrl: string | null;
  }>;
};

/** Twelve distinct models the shop can actually sell, studio photography first, then newest. */
export async function homepageProductsRail(): Promise<RailProduct[]> {
  const result = await queryProducts({
    sort: "newest",
    purchasableOnly: true,
    includeVariants: true,
    page: 1,
    // Pulls the whole sellable catalog so the studio-photo prioritization below
    // isn't fishing in just the newest 24 — most of those are still on old photos.
    pageSize: 200,
  });

  /* Product-level `purchasable` is not enough: a product can be sellable while its default variant is
     sold out. A card whose cart button is disabled is the one thing this shelf must not show, so the
     shelf keeps only products that have at least one variant a shopper can actually buy. */
  const sellable = result.data.filter((product) => {
    if (!(product.displayPrice > 0)) return false;
    if (!product.variants?.length) return isPurchasable(product);
    return product.variants.some((variant) =>
      isPurchasable({ available: product.available, stockType: variant.stockType })
      && !(variant.stockType === "limited" && variant.stock <= 0)
      && variant.price > 0,
    );
  });

  // Studio-photographed products lead the shelf; everything else fills the
  // remaining slots in its original (newest-first) order. Array.sort is stable,
  // so within each group the newest ordering from the query is preserved.
  const prioritized = [...sellable].sort(
    (a, b) => Number(hasStudioPhoto(b)) - Number(hasStudioPhoto(a)),
  );

  // One slot per model: storage configurations are separate catalogue records,
  // and without this a dozen slots came down to seven phones. The top configuration
  // represents the model; Map keeps the slot of the model's first appearance.
  const byModel = new Map<string, (typeof prioritized)[number]>();
  for (const product of prioritized) {
    const key = modelKey(product.name);
    const kept = byModel.get(key);
    const outranks = kept
      && hasStudioPhoto(product) === hasStudioPhoto(kept)
      && product.displayPrice > kept.displayPrice;
    if (!kept || outranks) byModel.set(key, product);
  }

  return [...byModel.values()].slice(0, 12).map((product) => {
    // The database query is authoritative for product, price, stock, and order.
    // Some imported DB variants have no ProductVariant.imageId even though the
    // catalog snapshot still has the merchant's explicit image_url per variant.
    // Use that association as an image-only fallback, matched by product slug and
    // variant axes; never infer a photo from color names or gallery position.
    const sourceVariants = findProductBySlug(product.slug)?.variants ?? [];
    const variants = product.variants.map((variant) => ({
      id: variant.id,
      color: variant.color ?? variant.options.find((option) => option.label.includes("رنگ"))?.value ?? null,
      storage: variant.storage ?? variant.options.find((option) => option.label.includes("حافظه"))?.value ?? null,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      stock: variant.stock,
      stockType: variant.stockType,
      isDefault: variant.isDefault,
      imageUrl: variant.imageUrl ?? (() => {
        const color = variant.color ?? variant.options.find((option) => option.label.includes("رنگ"))?.value ?? null;
        const storage = variant.storage ?? variant.options.find((option) => option.label.includes("حافظه"))?.value ?? null;
        if (!color) return null;
        const sameColor = sourceVariants.filter((source) => source.color === color);
        const exact = sameColor.find((source) => source.storage === storage && source.imageUrl);
        const unambiguous = sameColor.length === 1 ? sameColor[0] : null;
        return exact?.imageUrl ?? unambiguous?.imageUrl ?? null;
      })(),
    }));
    const variantColors = [...new Set(variants.flatMap((variant) => variant.color ? [variant.color] : []))];

    return {
      id: product.id,
      name: product.name,
      englishName: product.englishName,
      slug: product.slug,
      brand: product.brand,
      mainCategory: product.mainCategory,
      displayPrice: product.displayPrice,
      compareAtPrice: product.compareAtPrice,
      stockType: product.stockType,
      available: product.available,
      // The live database uses new product IDs, while the image mirror is keyed
      // by the IDs from the original export. The import already stored the
      // mirrored local URL on the primary image, so prefer that record and only
      // use the ID map as a compatibility fallback.
      images: product.images.map((image) => ({ id: image.id, url: image.url, isDefault: image.isDefault, order: image.order })),
      specialOffer: product.specialOffer,
      updatedAt: product.updatedAt,
      variantColors,
      variants,
    } satisfies RailProduct;
  });
}

export type DiscountRailProduct = RailProduct & { initialVariantId?: number };

/** Real, currently purchasable reductions for the homepage discount shelf. */
export async function discountedProductsRail(limit = 5): Promise<DiscountRailProduct[]> {
  return (await queryDiscountedRailProducts(limit)) as unknown as DiscountRailProduct[];
}

/** Six of the merchant's own special offers, in default (buyable-first) order. */
export async function featuredOfferRail(): Promise<RailProduct[]> {
  return (await queryProducts({ specialOffer: true, sort: "newest", includeVariants: false, page: 1, pageSize: 6 }))
    .data as unknown as RailProduct[];
}

/** The same offers re-sorted by the offer comparator — see `contracts/shop-url.md`. */
export async function featuredSpecialRail(): Promise<RailProduct[]> {
  return (await queryProducts({ specialOffer: true, sort: "special", includeVariants: false, page: 1, pageSize: 6 }))
    .data as unknown as RailProduct[];
}
