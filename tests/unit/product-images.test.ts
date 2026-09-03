import { describe, expect, it } from "vitest";
import { PRODUCT_IMAGE_FAMILIES, categoryImageFor, resolveProductImage } from "@/lib/product-images";

function isFromFamily(src: string, family: keyof typeof PRODUCT_IMAGE_FAMILIES) {
  return PRODUCT_IMAGE_FAMILIES[family].some((file) => src.endsWith(file));
}

describe("resolveProductImage", () => {
  it("maps watch products by English name", () => {
    const src = resolveProductImage({ name: "Apple Watch Series 9" });
    expect(isFromFamily(src, "watch")).toBe(true);
  });

  it("maps watch products by Persian name", () => {
    const src = resolveProductImage({ name: "ساعت هوشمند گلکسی واچ 4" });
    expect(isFromFamily(src, "watch")).toBe(true);
  });

  it("maps audio products by English and Persian keywords", () => {
    expect(isFromFamily(resolveProductImage({ name: "Sony WH-1000 Headphone" }), "audio")).toBe(true);
    expect(isFromFamily(resolveProductImage({ name: "هندزفری بی‌سیم پرو" }), "audio")).toBe(true);
  });

  it("maps laptop products, matching ZWNJ and spaced Persian variants", () => {
    expect(isFromFamily(resolveProductImage({ name: "لپ‌تاپ ایسوس VivoBook" }), "laptop")).toBe(true);
    expect(isFromFamily(resolveProductImage({ name: "لپ تاپ MSI Modern 14" }), "laptop")).toBe(true);
  });

  it("falls back to the category slug when the name has no keyword", () => {
    const src = resolveProductImage({
      name: "مدل ۲۰۲۴ پرو",
      mainCategory: { slug: "smartwatch", name: "ساعت هوشمند" },
    });
    expect(isFromFamily(src, "watch")).toBe(true);
  });

  it("falls back to the brand slug when name and category are generic", () => {
    const src = resolveProductImage({
      name: "مدل A54",
      mainCategory: { slug: "digital", name: "دیجیتال" },
      brand: { slug: "xiaomi", name: "شیائومی" },
    });
    expect(isFromFamily(src, "phone")).toBe(true);
  });

  it("defaults to the phone family for unmatched products", () => {
    const src = resolveProductImage({ name: "محصول ناشناخته" });
    expect(isFromFamily(src, "phone")).toBe(true);
  });

  it("is deterministic for the same product", () => {
    const product = { name: "گوشی سامسونگ گلکسی A15", brand: { slug: "samsung" } };
    expect(resolveProductImage(product)).toBe(resolveProductImage(product));
  });

  it("ignores legacy image URLs (local-first decision)", () => {
    const src = resolveProductImage({
      name: "گوشی ساده",
      images: [{ url: "https://legacy-shop.example/uploads/abc.jpg" }],
    });
    expect(src.startsWith("/images/products/")).toBe(true);
  });
});

describe("categoryImageFor", () => {
  it("maps known category slugs to their tile images", () => {
    expect(categoryImageFor("mobile", "موبایل")).toBe("/images/categories/phone.png");
    expect(categoryImageFor("audio", "صوتی")).toBe("/images/categories/headphone.png");
    expect(categoryImageFor("laptop", "لپ تاپ")).toBe("/images/categories/computer.png");
    expect(categoryImageFor("home", "خانگی")).toBe("/images/categories/home.png");
    expect(categoryImageFor("tv", "تلویزیون")).toBe("/images/categories/tv.png");
  });

  it("falls back to the phone tile for unknown categories", () => {
    expect(categoryImageFor("mystery", "ناشناخته")).toBe("/images/categories/phone.png");
  });

  it("handles nullish input", () => {
    expect(categoryImageFor(null, null)).toBe("/images/categories/phone.png");
  });
});
