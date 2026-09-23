import { describe, expect, it } from "vitest";
import {
  categorySubtreeCounts,
  findProductBySlug,
  listCategories,
  queryProducts,
  relatedProducts,
} from "@/lib/catalog";
import { foldPersian, persianIncludes } from "@/lib/persian";
import { isPurchasable } from "@/lib/product-identity";
import { buildShopView } from "@/lib/shop-query";

/**
 * Guards for the band-2 seam additions, written as relations rather than snapshots:
 * every number below is derived from the export on the run, because the export is
 * refreshed and a literal is how a test starts asserting things that stopped being
 * true. What these do pin is the *promises* — that a related product shares a real
 * relationship (FR-035), that a price bound means what it says (FR-022), that an
 * unpriced record is never the cheapest thing on the page (FR-021), and that a
 * category doorway shows what its name covers (FR-028).
 */

const ALL = queryProducts({ page: 1, pageSize: 1000 });

describe("foldPersian — the three measured failures", () => {
  /*
   * Each pair measured 0 results on one side before lib/persian.ts existed:
   * `سیستم عامل` (plain space) against a name stored with ZWNJ, `105` typed in Latin
   * digits against a Persian-digit name, and `موبايل` with an Arabic kaf against
   * `موبایل`. FR-011 *requires* the interface to display Persian digits, so the
   * third is not a typo tolerance — it is the site failing to find its own output.
   */
  it.each([
    ["سیستم‌عامل", "سیستم عامل"],
    ["۱۰۵", "105"],
    ["موبايل", "موبایل"],
  ])("folds %s and %s onto one string", (a, b) => {
    expect(foldPersian(a)).toBe(foldPersian(b));
    expect(foldPersian(a).length).toBeGreaterThan(0);
  });

  it("matches in both directions, so neither side of a comparison is privileged", () => {
    const haystack = "گوشی موبایل شیائومی مدل 105";
    expect(persianIncludes(haystack, "موبايل")).toBe(true);
    expect(persianIncludes("موبايل شیائومی", "موبایل")).toBe(true);
    expect(persianIncludes(haystack, "   ")).toBe(false);
  });
});

describe("queryProducts — price bounds and the unpriced records", () => {
  const unpriced = ALL.data.filter((p) => p.displayPrice === 0).map((p) => p.id);

  it("has unpriced records to test against", () => {
    // If the export ever prices everything, the assertions below go vacuous. Say so.
    expect(unpriced.length).toBeGreaterThan(0);
  });

  it("does not let a minimum price silently admit a record with no price", () => {
    const bounded = queryProducts({ minPrice: 1, page: 1, pageSize: 1000 });
    for (const id of unpriced) expect(bounded.data.map((p) => p.id)).not.toContain(id);
  });

  it("does not let a maximum price file a record with no price as cheap", () => {
    const bounded = queryProducts({ maxPrice: 10_000_000, page: 1, pageSize: 1000 });
    for (const id of unpriced) expect(bounded.data.map((p) => p.id)).not.toContain(id);
  });

  it("sorts unpriced to the end in both directions", () => {
    const tail = (sort: "price-asc" | "price-desc") =>
      queryProducts({ sort, page: 1, pageSize: 1000 }).data.slice(-unpriced.length).map((p) => p.id);
    for (const sort of ["price-asc", "price-desc"] as const) {
      expect(tail(sort).sort((a, b) => a - b)).toEqual([...unpriced].sort((a, b) => a - b));
    }
  });

  it("answers «قابل خرید» with the merchant's flag, not the shelf label", () => {
    const buyable = queryProducts({ purchasableOnly: true, page: 1, pageSize: 1000 });
    expect(buyable.total).toBeGreaterThan(0);
    expect(buyable.total).toBeLessThan(ALL.total);
    for (const product of buyable.data) {
      expect(isPurchasable({ available: product.available, stockType: product.stockType })).toBe(true);
    }
    // The shelf state is a different question: «موجود محدود» holds records that are
    // not sellable, which is why the two controls coexist.
    const limited = queryProducts({ stockType: "limited", page: 1, pageSize: 1000 });
    expect(limited.total).toBeGreaterThanOrEqual(buyable.total);
  });
});

describe("relatedProducts — FR-035's real relationship", () => {
  const sources = [findProductBySlug("موبایل-شیائومی-مدل-redmi-13-c-128-gb"), ...ALL.data.slice(0, 12)];

  it("returns nothing for a record that is not in the catalogue", () => {
    expect(relatedProducts(-1)).toEqual([]);
  });

  it("never recommends the product itself, and never an unrelated one", () => {
    for (const source of sources) {
      if (!source) continue;
      for (const { product, reason } of relatedProducts(source.id)) {
        expect(product.id).not.toBe(source.id);
        const sourceCategories = new Set([
          source.mainCategory?.id,
          ...source.otherCategories.map((c) => c.id),
        ].filter((id): id is number => id != null));
        const sharedCategory =
          (product.mainCategory != null && sourceCategories.has(product.mainCategory.id)) ||
          product.otherCategories.some((c) => sourceCategories.has(c.id));
        const sharedBrand = Boolean(source.brand && product.brand && source.brand.id === product.brand.id);
        // The tag must agree with the data, or the label is decoration.
        expect(reason === "same-brand" ? sharedBrand : sharedCategory).toBe(true);
        expect(sharedBrand || sharedCategory).toBe(true);
      }
    }
  });

  it("puts what a shopper can obtain before what they cannot", () => {
    for (const source of ALL.data.slice(0, 30)) {
      const items = relatedProducts(source.id, 8);
      const flags = items.map(({ product }) => isPurchasable({ available: product.available, stockType: product.stockType }));
      expect(flags).toEqual([...flags].sort((a, b) => Number(b) - Number(a)));
    }
  });

  it("honours the limit", () => {
    const busiest = ALL.data.map((p) => relatedProducts(p.id, 50).length).sort((a, b) => b - a)[0];
    expect(busiest).toBeGreaterThan(0);
    for (const product of ALL.data.slice(0, 20)) expect(relatedProducts(product.id, 4).length).toBeLessThanOrEqual(4);
  });
});

describe("categorySubtreeCounts — a doorway shows what its name covers", () => {
  const counts = categorySubtreeCounts();

  it("agrees with the query the category route runs", () => {
    for (const category of listCategories()) {
      const listed = queryProducts({ categorySubtreeId: category.id, page: 1, pageSize: 1 }).total;
      expect(counts.get(category.id)).toBe(listed);
    }
  });

  it("is never smaller than the exact-category number it contains", () => {
    for (const category of listCategories()) {
      const exact = queryProducts({ categoryId: category.id, page: 1, pageSize: 1 }).total;
      expect(counts.get(category.id)!).toBeGreaterThanOrEqual(exact);
    }
  });
});

describe("the shop's category facet agrees with the number beside it", () => {
  /**
   * The sidebar prints a subtree count next to a category name because that is what the
   * category's own page reports. A facet that filtered exactly would then be a number
   * that lies — «موبایل و تبلت 135» returning zero records is the same class of defect
   * as an empty door, one keystroke later.
   */
  const counts = categorySubtreeCounts();

  it("narrows to the subtree the label counted", () => {
    const candidates = listCategories().filter((category) => (counts.get(category.id) ?? 0) > 20);
    expect(candidates.length).toBeGreaterThan(0);
    for (const category of candidates) {
      const view = buildShopView({ category: category.slug });
      expect(view.unknownFilter, category.slug).toBeNull();
      expect(view.meta.total).toBe(counts.get(category.id));
    }
  });

  it("still refuses a category slug that is not in the catalogue", () => {
    const view = buildShopView({ category: "هیچ-چنین-دسته‌ای" });
    expect(view.unknownFilter).toBe("هیچ-چنین-دسته‌ای");
    expect(view.meta.total).toBe(0);
  });

  it("ignores a sort key it does not implement instead of casting it", () => {
    expect(buildShopView({ sort: "randn" }).products.length).toBeGreaterThan(0);
    expect(buildShopView({ sort: "price-asc" }).activeSort).toBe("price-asc");
  });
});
