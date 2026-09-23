import { queryProducts } from "@/lib/catalog";

/**
 * The homepage's two product rails, read from the seam on the server.
 *
 * Both used to fetch `/api/products` from an effect after hydration — the same
 * round-trip Constitution III forbids for browsing, and the reason the served
 * homepage contained no products at all.
 *
 * Note what is *not* changed here: the queries are the ones the client issued, so
 * the rails show exactly what they showed before, including the defect that
 * `sort: "newest"` and `sort: "special"` have no comparators and so return the
 * default order (T050 fixes that in band 2, and the homepage's «تازه‌ها» label is
 * only honest once it does).
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
export function newArrivalsRail(): RailProduct[] {
  return queryProducts({ includeVariants: false, page: 1, pageSize: 6 })
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
