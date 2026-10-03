import { describe, expect, it } from "vitest";
import { categorySubtreeCounts, listCategories, queryProducts } from "@/lib/catalog";
import { shopCategoryTiles } from "@/lib/shop-category-tiles";
import { resolveFilter } from "@/lib/shop-filters";
import { categoryDepartments } from "@/lib/category-departments";

/**
 * The shop page's tile row was the last place a door could lead nowhere or, worse,
 * somewhere misleading: the row came from whichever roots the API happened to return,
 * three of them empty, and a `موبایل` leaf holding 8 sat beside `موبایل و تبلت`
 * holding 135 as though they were different departments.
 *
 * T056 merged the vocabularies, so the guard now has three jobs: a tile resolves to a
 * real route, a tile's number is the number that route holds, and no two tiles claim
 * the same department. What it must not do is pin the *count* of tiles or the totals —
 * SC-005 requires this to survive an availability refresh unedited.
 */
describe("shopCategoryTiles", () => {
  const tiles = shopCategoryTiles();
  const categories = listCategories();
  const counts = categorySubtreeCounts();

  it("returns a usable set, never an empty one", () => {
    expect(tiles.length).toBeGreaterThanOrEqual(3);
    expect(new Set(tiles.map((t) => t.slug)).size).toBe(tiles.length);
  });

  it("is drawn from the department list, so one vocabulary decides the shop", () => {
    const departments = categoryDepartments();
    expect(tiles.map((t) => t.slug)).toEqual(departments.slice(0, tiles.length).map((d) => d.slug));
  });

  it("names only categories whose route holds products", () => {
    for (const tile of tiles) {
      const outcome = resolveFilter(categories, tile.slug);
      expect(outcome.status, tile.slug).toBe("resolved");
      if (outcome.status !== "resolved") continue;
      const subtree = counts.get(outcome.item.id) ?? 0;
      expect(subtree, `${tile.slug} is an empty door`).toBeGreaterThan(0);
      // The destination lists the subtree, so that — not an exact-category match — is
      // the number a shopper arrives at.
      expect(queryProducts({ categorySubtreeId: outcome.item.id, page: 1, pageSize: 1 }).total).toBe(subtree);
    }
  });

  it("prints a count only where the door is the whole kind", () => {
    for (const tile of tiles) {
      const department = categoryDepartments().find((d) => d.slug === tile.slug)!;
      expect(tile.countLabel === null).toBe(!department.showsCount);
      if (tile.countLabel !== null) expect(tile.countLabel).toMatch(/^[۰-۹]+ محصول$/);
    }
  });

  it("offers no door for a root that is empty in every sense", () => {
    for (const slug of ["لوازم-جانبی-لپ-تاپ"]) {
      const root = categories.find((c) => c.slug === slug);
      expect(counts.get(root!.id) ?? 0).toBe(0);
      expect(tiles.map((t) => t.slug), `${slug} must not be offered a tile`).not.toContain(slug);
    }
  });

  it("never offers two tiles for the phone department", () => {
    // The export holds both, and under the old root-scan rule both were tiles.
    expect(tiles.map((t) => t.slug)).toContain("موبایل-و-تبلت");
    expect(tiles.map((t) => t.slug)).not.toContain("موبایل");
  });
});
