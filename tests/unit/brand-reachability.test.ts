import { describe, expect, it } from "vitest";
import { partnerMarks } from "@/components/brand/BrandMarks";
import { buildBrandRows } from "@/lib/content/home";
import { brandProductCounts } from "@/lib/brand-counts";
import { listBrands } from "@/lib/catalog";
import { resolveFilter } from "@/lib/shop-filters";

/**
 * Whether every shopper can reach a brand's products in one action, whatever they are
 * holding. The row's destination and its assistive names are built by one pure function,
 * so all of it is checkable here rather than only in a browser: a destination that is
 * missing, duplicated, unresolvable, or spelled in Latin instead of Persian fails as a
 * unit test instead of shipping as a dead-end row.
 *
 * Counts come from `brandProductCounts()` — the same function the server component calls —
 * so the number a row shows and the listing its link leads to are proven to agree.
 */

const brands = listBrands();
const rows = buildBrandRows(partnerMarks, brandProductCounts());

describe("brand row model — one destination per brand", () => {
  it("covers every mark, in order, with no duplicates", () => {
    expect(rows).toHaveLength(partnerMarks.length);
    expect(new Set(rows.map((row) => row.href)).size).toBe(rows.length);
    expect(new Set(rows.map((row) => row.detailId)).size).toBe(rows.length);
  });

  it("gives every row a destination that resolves to that brand's products", () => {
    for (const row of rows) {
      expect(row.href, `${row.label} has no destination`).toBeTruthy();
      const outcome = resolveFilter(brands, row.slug);
      expect(outcome.status).toBe("resolved");
      if (outcome.status === "resolved") {
        expect(outcome.item.productCount).toBeGreaterThan(0);
        // The row must lead to the brand it names, not merely to a brand that exists.
        expect(outcome.item.name).toBe(row.label.replace(/\u200C/g, " "));
      }
    }
  });

  it("states a count that matches the catalogue it resolved against", () => {
    for (const row of rows) {
      const count = resolveFilter(brands, row.slug);
      if (count.status === "resolved") {
        expect(row.countLabel).toBe(`${count.item.productCount.toLocaleString("fa-IR")} محصول`);
      }
    }
  });
});

describe("brand row model — reachable without a pointer", () => {
  it("names the row as a destination in Persian, never in Latin", () => {
    for (const row of rows) {
      expect(row.linkLabel).toBe(`محصولات ${row.label}`);
      // FR-015: any instruction the shopper is told is Persian and right-to-left. An ASCII
      // letter in these strings means a Latin fallback slipped back in.
      expect(row.linkLabel).not.match(/[A-Za-z]/);
      expect(row.expandLabel).not.match(/[A-Za-z]/);
      expect(row.collapseLabel).not.match(/[A-Za-z]/);
    }
  });

  it("carries both an open and a close name, so release is described as well as entry", () => {
    for (const row of rows) {
      expect(row.expandLabel).toBe(`دیدن جزئیات ${row.label}`);
      expect(row.collapseLabel).toBe(`بستن جزئیات ${row.label}`);
      expect(row.expandLabel).not.toBe(row.collapseLabel);
    }
  });

  it("never makes the story a precondition of the destination", () => {
    const withStory = rows.filter((row) => row.hasStory);
    const without = rows.filter((row) => !row.hasStory);
    expect(withStory.map((row) => row.name)).toEqual(["APPLE", "SAMSUNG", "XIAOMI"]);
    // C37: the three without a written story still have a real, distinct destination.
    for (const row of without) expect(row.href).toBeTruthy();
    expect(without.every((row) => row.linkLabel === `محصولات ${row.label}`)).toBe(true);
  });

  it("numbers the rows in Persian digits", () => {
    expect(rows.map((row) => row.ordinal)).toEqual(["۰۱", "۰۲", "۰۳", "۰۴", "۰۵", "۰۶"]);
  });
});
