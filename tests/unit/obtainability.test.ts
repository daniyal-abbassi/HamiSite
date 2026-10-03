import { describe, expect, it } from "vitest";
import { queryProducts } from "@/lib/catalog";
import { isPurchasable, productAction } from "@/lib/product-identity";

/**
 * FR-002 and FR-056, and SC-005's "zero false availability".
 *
 * `lib/catalog.ts` has carried the merchant's own `purchasable` field since the
 * export was wired up, and until this band no shopper component read it: sixteen
 * records marked "limited" *and* unsellable rendered as obtainable, with a live
 * cart control. These assertions are the guard against that coming back, in
 * either direction — a refreshed export must never be able to create a false
 * positive by omission.
 */

const { data: products } = queryProducts({ page: 1, pageSize: 189 });

describe("sellability (contracts/honest-states.md)", () => {
  it("covers the whole export", () => {
    // Not `toBe(189)`: that is the snapshot total FR-053 forbids embedding, and
    // it would make this file fail for the wrong reason after a refresh.
    expect(products.length).toBeGreaterThan(0);
  });

  it("offers no cart action to a record the merchant cannot sell", () => {
    for (const product of products) {
      if (product.available === true) continue;
      expect(isPurchasable(product), `${product.slug} is not purchasable`).toBe(false);
      expect(productAction(product), product.slug).toBe("contact");
    }
  });

  it("treats out-of-stock and call-for-price as never buyable", () => {
    for (const product of products) {
      if (product.stockType === "out_of_stock" || product.stockType === "call") {
        expect(productAction(product), `${product.slug} / ${product.stockType}`).toBe("contact");
      }
    }
  });

  it("falls back to contact, never to a positive state, on an unrecognised label", () => {
    // FR-056: a refreshed export is allowed to introduce states nobody has seen.
    expect(isPurchasable({ available: true, stockType: "pre-order" })).toBe(false);
    expect(isPurchasable({ available: null, stockType: "pre-order" })).toBe(false);
    expect(isPurchasable({ available: true, stockType: "limited" })).toBe(true);
    expect(isPurchasable({ available: true, stockType: "unlimited" })).toBe(true);
    expect(isPurchasable({ available: true, stockType: null })).toBe(false);
    expect(isPurchasable({ available: true, stockType: "" })).toBe(false);
    expect(isPurchasable({})).toBe(false);
  });

  it("keeps the seam's own unknown-state fallback pointed at contact", () => {
    const states = new Set(products.map((p) => p.stockType));
    for (const state of states) expect(["unlimited", "limited", "out_of_stock", "call"]).toContain(state);
  });
});
