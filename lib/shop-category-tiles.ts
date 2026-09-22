import { listCategories, queryProducts } from "@/lib/catalog";

/**
 * Which top-level categories deserve a tile on the shop page.
 *
 * `components/shop/CategoryTiles.tsx` used to take whatever `/api/categories` returned and
 * show the first six roots. Three of those — `موبایل-و-تبلت`, `لوازم-جانبی` and
 * `لوازم-جانبی-لپ-تاپ` — have **no products of their own**, and `queryProducts` matches
 * `categoryId` exactly with no walk down the tree, so pressing one landed on an empty
 * listing. A tile that leads nowhere is worse than one fewer tile.
 *
 * The categories API carries no product counts and is frozen by Principle III, so the
 * count is resolved here, server-side, from the same catalogue the API reads, and handed
 * down as a short list of slugs.
 *
 * Note what "has products" means: products whose **own** main or secondary category is
 * this root. A parent whose children are stocked but that is never referenced directly
 * still measures zero, and that is correct — it is exactly what the shop's filter does
 * when the tile is pressed.
 */
export function stockedRootCategorySlugs(limit = 6): string[] {
  return listCategories()
    .filter((category) => category.parentId === null)
    .filter((category) => queryProducts({ categoryId: category.id, page: 1, pageSize: 1 }).total > 0)
    .slice(0, limit)
    .map((category) => category.slug);
}
