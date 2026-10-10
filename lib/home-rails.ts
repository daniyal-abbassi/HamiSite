import { queryProducts } from "@/lib/catalog";

/**
 * The homepage's two product rails, read from the seam on the server.
 *
 * Both used to fetch `/api/products` from an effect after hydration — the same
 * round-trip Constitution III forbids for browsing, and the reason the served
 * homepage contained no products at all.
 *
 * The main homepage shelf and its continuation share the catalog's stable
 * creation-time ordering without repeating products.
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
};

/** Six of the merchant's own special offers, in default (buyable-first) order. */
export function featuredOfferRail(): RailProduct[] {
  return queryProducts({ specialOffer: true, sort: "newest", includeVariants: false, page: 1, pageSize: 6 })
    .data as unknown as RailProduct[];
}

/** The same offers re-sorted by the offer comparator — see `contracts/shop-url.md`. */
export function featuredSpecialRail(): RailProduct[] {
  return queryProducts({ specialOffer: true, sort: "special", includeVariants: false, page: 1, pageSize: 6 })
    .data as unknown as RailProduct[];
}

/**
 * Six more products after the twelve already shown in the main homepage shelf.
 */
export function additionalProductsRail(): RailProduct[] {
  return queryProducts({ sort: "newest", includeVariants: false, page: 3, pageSize: 6 })
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
export function obtainableNowRail(limit = 6): { products: RailProduct[]; total: number } {
  const all = queryProducts({ purchasableOnly: true, sort: "price-asc", page: 1, pageSize: 1_000 })
    .data.filter((p) => p.displayPrice > 0);
  return {
    products: all.slice(0, limit) as unknown as RailProduct[],
    total: all.length,
  };
}
