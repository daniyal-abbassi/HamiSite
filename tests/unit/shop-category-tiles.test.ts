import { describe, expect, it } from "vitest";
import { listCategories, queryProducts } from "@/lib/catalog";
import { stockedRootCategorySlugs } from "@/lib/shop-category-tiles";
import { resolveFilter } from "@/lib/shop-filters";

/**
 * The shop page's category tiles were the last place a tile could lead nowhere: the row
 * came from the first six roots the API happened to return, and three of them had no
 * products of their own, so pressing one rendered the empty state. This is the guard that
 * keeps that from coming back.
 */
describe("stockedRootCategorySlugs", () => {
  const slugs = stockedRootCategorySlugs();
  const categories = listCategories();

  it("returns a usable set, never an empty one", () => {
    expect(slugs.length).toBeGreaterThanOrEqual(3);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("names only root categories that actually hold products", () => {
    for (const slug of slugs) {
      const outcome = resolveFilter(categories, slug);
      expect(outcome.status, slug).toBe("resolved");
      if (outcome.status === "resolved") {
        expect(categories.find((c) => c.id === outcome.item.id)?.parentId, `${slug} is not a root`).toBeNull();
        expect(queryProducts({ categoryId: outcome.item.id, page: 1, pageSize: 1 }).total, slug).toBeGreaterThan(0);
      }
    }
  });

  it("excludes the roots that were on the page while empty", () => {
    for (const slug of ["موبایل-و-تبلت", "لوازم-جانبی", "لوازم-جانبی-لپ-تاپ"]) {
      const root = categories.find((c) => c.slug === slug);
      expect(root?.parentId, `${slug} should still be a root`).toBeNull();
      expect(queryProducts({ categoryId: root!.id, page: 1, pageSize: 1 }).total).toBe(0);
      expect(slugs, `${slug} must not be offered a tile`).not.toContain(slug);
    }
  });
});
