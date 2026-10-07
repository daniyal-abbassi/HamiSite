import { queryProducts } from "@/lib/catalog-db";
import { findProductBySlug } from "@/lib/catalog";
import mirroredImages from "@/data/catalog-images.json";
import { isPurchasable } from "@/lib/product-identity";

const catalogImageMirror = mirroredImages as Record<string, string>;

/**
 * The homepage's two product rails, read from the seam on the server.
 *
 * Both read from the server-side catalog seam so browsing does not need a client
 * round-trip. The featured home shelf explicitly requests the globally newest
 * products and includes their serialized variants; the separate NewArrivals rail
 * retains its own buyability-oriented feed and presentation contract.
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

/** The globally newest live catalog products for the homepage featured shelf. */
export async function featuredLatestRail(): Promise<RailProduct[]> {
  const result = await queryProducts({
    sort: "newest",
    includeVariants: true,
    page: 1,
    pageSize: 12,
  });

  return result.data.map((product) => {
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

function hasPriceReduction(price: number | null | undefined, compareAtPrice: number | null | undefined) {
  return price != null && price > 0 && compareAtPrice != null && compareAtPrice > price;
}

function purchasableVariant(product: RailProduct, variant: NonNullable<RailProduct["variants"]>[number]) {
  return isPurchasable({ available: product.available, stockType: variant.stockType })
    && !(variant.stockType === "limited" && variant.stock <= 0);
}

/** Real, currently purchasable reductions for the homepage discount shelf. */
export async function discountedProductsRail(limit = 5): Promise<DiscountRailProduct[]> {
  const result = await queryProducts({ sort: "special", includeVariants: true, page: 1, pageSize: 1_000 });
  const products = result.data as unknown as RailProduct[];
  const candidates = products.flatMap((product) => {
    if (!product.available) return [];

    if (product.variants?.length) {
      const eligibleVariants = product.variants.filter((variant) =>
        purchasableVariant(product, variant)
        && hasPriceReduction(variant.price, variant.compareAtPrice),
      );
      if (!eligibleVariants.length) return [];
      const featuredVariant = eligibleVariants.reduce((best, variant) => {
        const bestRate = (best.compareAtPrice! - best.price) / best.compareAtPrice!;
        const rate = (variant.compareAtPrice! - variant.price) / variant.compareAtPrice!;
        return rate > bestRate ? variant : best;
      });
      const rate = (featuredVariant.compareAtPrice! - featuredVariant.price) / featuredVariant.compareAtPrice!;
      return [{ product: { ...product, initialVariantId: featuredVariant.id }, rate }];
    }

    if (!isPurchasable(product) || !hasPriceReduction(product.displayPrice, product.compareAtPrice)) return [];
    const rate = (product.compareAtPrice! - product.displayPrice) / product.compareAtPrice!;
    return [{ product, rate }];
  });

  return candidates
    .sort((a, b) => b.rate - a.rate)
    .slice(0, limit)
    .map(({ product }) => product);
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

/**
 * The bare six-record feed the «تازه‌ها» section has always shown.
 *
 * It is **not** a recency query, and this function deliberately does not pretend
 * otherwise: `serializeProduct` emits no `updatedAt`, so there is nothing to sort
 * on this side of the seam, and the default order leads with purchasable items.
 * The section heading is therefore inaccurate today — `audits/05` records it, and
 * T050 in band 2 owns the comparator that makes it true. Fixing the label by
 * inventing a date field here would be the same class of error this band exists to
 * remove.
 */
export async function newArrivalsRail(): Promise<RailProduct[]> {
  return (await queryProducts({ includeVariants: false, page: 1, pageSize: 6 }))
    .data as unknown as RailProduct[];
}

/**
 * Everything the merchant currently says can be bought, cheapest first.
 *
 * This is the only homepage rail whose heading is an availability claim, so the
 * predicate is the strict one: the `purchasable` flag *and* a price on the record.
 * A price-less product is not buyable however the stock field reads, and a shelf
 * that listed it would be selling «تماس بگیرید» under a promise of «قابل خرید».
 *
 * `total` is the whole count rather than the rendered count, so the section can say
 * how many there really are when the export grows past what the rail displays.
 */
export async function obtainableNowRail(limit = 6): Promise<{ products: RailProduct[]; total: number }> {
  const all = (await queryProducts({ purchasableOnly: true, sort: "price-asc", page: 1, pageSize: 1_000 }))
    .data.filter((p) => p.displayPrice > 0);
  return {
    products: all.slice(0, limit) as unknown as RailProduct[],
    total: all.length,
  };
}
