import { describe, expect, it } from "vitest";
import { obtainableNowRail } from "@/lib/home-rails";
import { queryProducts } from "@/lib/catalog";
import { isPurchasable } from "@/lib/product-identity";

/**
 * The homepage's «همین حالا قابل خرید» shelf. Its whole point is that it is the one
 * rail on the site whose name is a claim about availability, so every case here is
 * about the claim holding when the export moves under it — an availability refresh is
 * coming (owner-confirmed), and a shelf that promises five buyable products and serves
 * a sixth that cannot be sold is the defect band 0 exists to remove.
 */
describe("obtainableNowRail", () => {
  const rail = obtainableNowRail();

  it("contains only what the merchant says is sellable", () => {
    expect(rail.products.length).toBeGreaterThan(0);
    for (const product of rail.products) {
      expect(isPurchasable({ available: product.available, stockType: product.stockType }), product.name).toBe(true);
    }
  });

  it("contains only what carries a price, because a price-less line is not buyable", () => {
    for (const product of rail.products) {
      expect(product.displayPrice, `${product.name} has no price`).toBeGreaterThan(0);
    }
  });

  it("reports the whole count, not the number it happened to render", () => {
    const all = queryProducts({ purchasableOnly: true, page: 1, pageSize: 1_000 }).data;
    const priced = all.filter((p) => p.displayPrice > 0);
    expect(rail.total).toBe(priced.length);
    expect(rail.products.length).toBeLessThanOrEqual(Math.min(6, priced.length));
  });

  it("cheapest-first order so the shelf answers 'what can I get, starting low'", () => {
    const prices = rail.products.map((p) => p.displayPrice);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});
