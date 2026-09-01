import { describe, expect, it } from "vitest";
import type { Product } from "@shared/commerce/types";
import { toFeaturedProductCard } from "./featuredProducts";

const product: Product = {
  id: "gid://shopify/Product/1",
  handle: "onyx",
  title: "Onyx",
  description: "یک محصول منتخب",
  descriptionHtml: "<p>یک محصول منتخب</p>",
  productType: "گوشی هوشمند",
  vendor: "HAMI",
  tags: ["hami-pick"],
  images: [{ url: "https://example.com/onyx.jpg", altText: "Onyx", width: 1200, height: 1200 }],
  priceRange: { min: { amount: "89900000", currencyCode: "IRR" }, max: { amount: "89900000", currencyCode: "IRR" } },
  options: [{ name: "رنگ", values: ["مشکی", "تیتانیوم"] }],
  variants: [{ id: "gid://shopify/ProductVariant/1", title: "256GB / مشکی", price: { amount: "89900000", currencyCode: "IRR" }, compareAtPrice: { amount: "94900000", currencyCode: "IRR" }, availableForSale: true, selectedOptions: [] }],
};

describe("toFeaturedProductCard", () => {
  it("maps only normalized commerce data to a concise product-card contract", () => {
    expect(toFeaturedProductCard(product)).toMatchObject({
      handle: "onyx",
      title: "Onyx",
      brand: "HAMI",
      category: "گوشی هوشمند",
      image: "https://example.com/onyx.jpg",
      available: true,
      hasDiscount: true,
      variantLabel: "256GB / مشکی",
    });
  });

  it("keeps unavailable products usable without inventing stock counts or an image", () => {
    const unavailable = { ...product, images: [], variants: [{ ...product.variants[0], availableForSale: false, compareAtPrice: null }] };
    expect(toFeaturedProductCard(unavailable)).toMatchObject({ image: null, available: false, hasDiscount: false, stockLabel: "ناموجود" });
  });
});
