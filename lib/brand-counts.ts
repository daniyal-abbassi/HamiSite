import { listBrands } from "@/lib/catalog";
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
export function brandProductCounts(): Record<string, number> {
  const brands = listBrands();
  return Object.fromEntries(
    Object.entries(brandSlugByName).map(([name, slug]) => {
      const outcome = resolveFilter(brands, slug);
      return [name, outcome.status === "resolved" ? outcome.item.productCount : 0];
    }),
  );
}
