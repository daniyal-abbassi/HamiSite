import { categoryDepartments } from "@/lib/category-departments";

/**
 * The shop page's category tiles, drawn from the same department list the homepage
 * carousel uses (`lib/category-departments.ts`).
 *
 * This file used to pick top-level categories out of the export and offer the stocked
 * ones. That is where the duplicate door came from: the export holds both
 * `موبایل و تبلت` — 135 products beneath it — and a `موبایل` leaf holding 8, plus an
 * `ارسال رایگان ویژه` root that is a promotion rather than a department. T056's merge is
 * exactly that these stop being three vocabularies describing one catalogue: the kinds
 * are decided once, the label a shopper reads is written once, and the count beside it is
 * the count that doorway's own route holds.
 *
 * Which also bounds what a tile may say. `countLabel` is null wherever the route is a
 * subset of its kind, so a tile can never promise 134 phones over a door that opens on
 * something else — the rule feature 005 established for its panels, now shared with the
 * shop page rather than reinvented beside it.
 */
export type ShopTile = { slug: string; label: string; href: string; countLabel: string | null };

export function shopCategoryTiles(limit = 6): ShopTile[] {
  return categoryDepartments().slice(0, limit).map((department) => ({
    slug: department.slug,
    label: department.label,
    href: department.href,
    countLabel: department.showsCount ? `${department.reachableCount.toLocaleString("fa-IR")} محصول` : null,
  }));
}
