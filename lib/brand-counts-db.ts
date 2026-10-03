import { listBrands, queryProducts } from "@/lib/catalog-db";
import { brandSlugByName } from "@/lib/content/home";
import { resolveFilter } from "@/lib/shop-filters";

/**
 * How many products each display brand actually has.
 *
 * Its own module because of who is allowed to read it: `lib/catalog.ts` parses a 2.2 MB
 * JSON export, so this runs in the server component and the number is handed to the row as
 * a plain value — the catalogue never reaches the client bundle. The unit test calls the
 * same function, which is what makes "the count on the row" and "the listing its link
 * leads to" the same fact rather than two claims that happen to agree today.
 *
 * Resolution goes through `resolveFilter`, the same resolver the row's own href is matched
 * by, so a count can never be attributed to a different brand than the link reaches.
 */
export async function brandProductCounts(): Promise<Record<string, number>> {
  const brands = await listBrands();
  return Object.fromEntries(
    Object.entries(brandSlugByName).map(([name, slug]) => {
      const outcome = resolveFilter(brands, slug);
      return [name, outcome.status === "resolved" ? outcome.item.productCount : 0];
    }),
  );
}

/**
 * How many products each display brand can a shopper actually buy today.
 *
 * `brandProductCounts()` answers "how big is this brand's shelf", and 162 of the 189 products in the
 * export are out of stock — so a surface that shows that number is claiming breadth the shop cannot
 * deliver. Feature 008's deck shows a count on a card only when there is something behind it, which
 * needs this second figure: the same query the brand's own listing page runs for its «قابل خرید»
 * number, `app/(main)/brands/[slug]/page.tsx:63`, word for word, so the card and the destination
 * cannot drift apart into two claims that merely agree today.
 *
 * Resolution goes through `resolveFilter` for the same reason as above: the number must belong to the
 * brand the link actually reaches. An unresolved slug reports 0, which is honest — there is no shelf.
 */
export async function brandPurchasableCounts(): Promise<Record<string, number>> {
  const brands = await listBrands();
  return Object.fromEntries(await Promise.all(
    Object.entries(brandSlugByName).map(async ([name, slug]) => {
      const outcome = resolveFilter(brands, slug);
      if (outcome.status !== "resolved") return [name, 0];
      return [
        name,
        (await queryProducts({ brandId: outcome.item.id, purchasableOnly: true, page: 1, pageSize: 1 })).total,
      ];
    }),
  ));
}
