import { describe, expect, it } from "vitest";
import { findProductBySlug, queryProducts } from "@/lib/catalog";

/**
 * FR-001 / SC-004, and the drift guard research D1 exists for.
 *
 * Every product page in the store printed «قیمت فروشگاه» instead of a price
 * because `components/shop/ProductDetail.tsx` read `selectedVariant.unitPrice`
 * while `lib/catalog.ts` had long since renamed the field to `price` — and an
 * `apiGet<ProductDetail>` cast meant TypeScript could not see it. These
 * assertions pin the two halves: the seam must keep emitting the keys the
 * shopper surfaces read, and the values behind them must be the record's own.
 */

const PRODUCT_KEYS = [
  "id",
  "name",
  "slug",
  "descriptionText",
  "available",
  "stockType",
  "images",
  "specs",
  "basePrice",
  "displayPrice",
  "compareAtPrice",
  "variants",
] as const;

const VARIANT_KEYS = ["id", "color", "storage", "price", "compareAtPrice", "stock", "stockType"] as const;

describe("catalog seam shape (contracts/catalog-seam.md)", () => {
  it("emits every product key the product page reads", () => {
    const { data: products } = queryProducts({ page: 1, pageSize: 189 });
    expect(products.length).toBeGreaterThan(0);
    for (const product of products) {
      for (const key of PRODUCT_KEYS) {
        // A missing key used to look like a loaded product with no price.
        expect(product, `${product.slug} → ${key}`).toHaveProperty(key);
      }
    }
  });

  it("emits every variant key the product page reads, and no phantom unitPrice", () => {
    const withVariants = queryProducts({ page: 1, pageSize: 189 }).data.filter((p) => p.variants.length > 0);
    expect(withVariants.length).toBeGreaterThan(0);
    for (const product of withVariants) {
      for (const variant of product.variants) {
        for (const key of VARIANT_KEYS) expect(variant, `${product.slug} → ${key}`).toHaveProperty(key);
        // The name that broke the price display must never come back.
        expect(variant).not.toHaveProperty("unitPrice");
      }
    }
  });

  it("carries a usable unit price for every product that has one", () => {
    const { data: products } = queryProducts({ page: 1, pageSize: 189 });
    const priced = products.filter((p) => p.displayPrice > 0);
    expect(priced.length).toBeGreaterThan(0);
    for (const product of priced) {
      const variantPrice = product.variants.find((v) => v.isDefault)?.price ?? product.variants[0]?.price;
      const resolved = variantPrice ?? product.displayPrice;
      expect(resolved, product.slug).toBeGreaterThan(0);
      expect(Number.isFinite(resolved), product.slug).toBe(true);
    }
  });

  it("resolves the same record through the slug the URL carries", () => {
    const { data: products } = queryProducts({ page: 1, pageSize: 5 });
    for (const product of products) {
      const found = findProductBySlug(encodeURIComponent(product.slug));
      expect(found?.id, product.slug).toBe(product.id);
    }
  });
});
