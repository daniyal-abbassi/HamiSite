import { describe, expect, it } from "vitest";
import type { Product } from "@shared/commerce/types";
import { toNewArrivalCard } from "./newArrivals";

const product: Product = {
  id: "gid://shopify/Product/1",
  handle: "new-phone",
  title: "Nova Edition",
  description: "",
  descriptionHtml: "",
  productType: "موبایل",
  vendor: "Nova",
  tags: [],
  images: [{ url: "https://example.com/phone.jpg", altText: "گوشی Nova" }],
  priceRange: { min: { amount: "599000000", currencyCode: "IRR" }, max: { amount: "599000000", currencyCode: "IRR" } },
  options: [],
  variants: [{ id: "gid://shopify/ProductVariant/1", title: "Default Title", price: { amount: "599000000", currencyCode: "IRR" }, compareAtPrice: null, availableForSale: true, selectedOptions: [] }],
};

describe("new arrival mapper", () => {
  it("maps a newest product into a compact rail card without inventing arrival time or stock quantity", () => {
    expect(toNewArrivalCard(product)).toEqual({
      handle: "new-phone",
      title: "Nova Edition",
      brand: "Nova",
      image: "https://example.com/phone.jpg",
      imageAlt: "گوشی Nova",
      price: { amount: "599000000", currencyCode: "IRR" },
      available: true,
      availabilityLabel: "موجود",
    });
  });

  it("keeps an unavailable product explicit and supplies a safe image fallback label", () => {
    const unavailable = { ...product, vendor: null, images: [], variants: [{ ...product.variants[0], availableForSale: false }] };
    expect(toNewArrivalCard(unavailable)).toMatchObject({
      brand: "HAMI",
      image: null,
      imageAlt: "Nova Edition",
      available: false,
      availabilityLabel: "ناموجود",
    });
  });
});
