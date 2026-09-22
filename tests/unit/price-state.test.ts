import { describe, expect, it } from "vitest";
import { queryProducts } from "@/lib/catalog";
import { compareAtOf, discountPercent, priceState, unitPriceOf } from "@/lib/product-identity";
import { formatToman } from "@/lib/utils";

/**
 * FR-003 and FR-004, and the reason `priceState` exists at all.
 *
 * `priceOf()` coerces a missing price to 0 so sorting has something to compare,
 * which makes 0 mean "unpriced" rather than "free". Every display path has to
 * re-derive null from it: the shop's list view printed «۰ تومان» for the five
 * call-for-price records, and the product page printed the NaN guard string for
 * all 189. A comparison price gets the same discipline — FR-004 allows a strike
 * only above the real price, and 40 of 311 variants carry one that is not.
 */

describe("price rendering (contracts/honest-states.md)", () => {
  it("never renders a missing price as a number, a zero or a bare currency", () => {
    expect(unitPriceOf(null, 0)).toBeNull();
    expect(unitPriceOf(0, 0)).toBeNull();
    expect(unitPriceOf(undefined, undefined)).toBeNull();
    expect(priceState(0)).toBe("unavailable");
    // And the guard string must never reach a shopper as if it were a price.
    expect(formatToman(null)).not.toMatch(/[\u06F0-\u06F9]/);
    expect(formatToman(undefined)).not.toMatch(/[\u06F0-\u06F9]/);
  });

  it("keeps a real price real, at the record and at the variant", () => {
    expect(unitPriceOf(1200000, 900000)).toBe(1200000);
    expect(unitPriceOf(null, 900000)).toBe(900000);
    expect(priceState(900000)).toBe("plain");
    expect(formatToman(900000)).toMatch(/تومان$/);
  });

  it("refuses a discount unless the comparison is strictly higher", () => {
    expect(compareAtOf(100, 100)).toBeNull();
    expect(compareAtOf(100, 99)).toBeNull();
    expect(compareAtOf(100, 101)).toBe(101);
    expect(compareAtOf(null, 101)).toBeNull();
    expect(discountPercent(100, 100)).toBeNull();
    expect(priceState(100, 90)).toBe("plain");
    expect(priceState(100, 120)).toBe("sale");
  });

  it("emits no comparison price anywhere in the export that is not a saving", () => {
    const { data: products } = queryProducts({ page: 1, pageSize: 189 });
    for (const product of products) {
      if (product.compareAtPrice != null && product.displayPrice > 0) {
        expect(product.compareAtPrice, `${product.slug} product level`).toBeGreaterThan(product.displayPrice);
      }
      for (const variant of product.variants) {
        if (variant.compareAtPrice != null) {
          expect(variant.compareAtPrice, `${product.slug} variant ${variant.id}`).toBeGreaterThan(variant.price);
        }
      }
    }
  });

  it("keeps the unpriced records unpriced through the whole seam", () => {
    const { data: products } = queryProducts({ page: 1, pageSize: 189 });
    const unpriced = products.filter((p) => p.displayPrice <= 0);
    expect(unpriced.length).toBeGreaterThan(0);
    for (const product of unpriced) {
      expect(unitPriceOf(null, product.displayPrice), product.slug).toBeNull();
      expect(priceState(product.displayPrice), product.slug).toBe("unavailable");
    }
  });
});
