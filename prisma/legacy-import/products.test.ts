import { describe, it, expect } from "vitest";
import { mapVariantAttributes, normalizeUniqueText, mapStockType, mapLegacyProduct } from "./products";
import { StockType } from "@prisma/client";
import type { LegacyProductDetail } from "./types";

describe("mapVariantAttributes", () => {
  it("maps رنگ to color and leaves storage null when it's the only attribute", () => {
    const result = mapVariantAttributes([{ name: "رنگ", value: "مشکی / Charcoal" }]);
    expect(result).toEqual({ color: "مشکی / Charcoal", storage: null });
  });

  it("joins non-رنگ attributes into storage", () => {
    const result = mapVariantAttributes([
      { name: "رنگ", value: "سفید" },
      { name: "سرور", value: "Vietnam" },
      { name: "نوع", value: "دو سیم‌کارت" },
    ]);
    expect(result).toEqual({ color: "سفید", storage: "سرور: Vietnam | نوع: دو سیم‌کارت" });
  });

  it("returns nulls for no attributes", () => {
    expect(mapVariantAttributes([])).toEqual({ color: null, storage: null });
  });
});

describe("normalizeUniqueText", () => {
  it("turns empty string into null", () => {
    expect(normalizeUniqueText("")).toBeNull();
  });

  it("turns null/undefined into null", () => {
    expect(normalizeUniqueText(null)).toBeNull();
    expect(normalizeUniqueText(undefined)).toBeNull();
  });

  it("passes non-empty strings through", () => {
    expect(normalizeUniqueText("6941234567890")).toBe("6941234567890");
  });
});

describe("mapStockType", () => {
  it("maps all 4 legacy values", () => {
    expect(mapStockType("unlimited")).toBe(StockType.UNLIMITED);
    expect(mapStockType("limited")).toBe(StockType.LIMITED);
    expect(mapStockType("out_of_stock")).toBe(StockType.OUT_OF_STOCK);
    expect(mapStockType("call")).toBe(StockType.CALL);
  });
});

describe("mapLegacyProduct", () => {
  const raw: LegacyProductDetail = {
    id: 384,
    name: "گوشی موبایل سامسونگ",
    english_name: "Galaxy A37",
    slug: "galaxy-a37",
    description: "desc",
    analysis: null,
    main_category: { id: 8, name: "SAMSUNG" },
    other_categories: [{ id: 80, name: "موبایل" }],
    brand: { id: 2, name: "سامسونگ" },
    is_digital: false,
    price: 81300000,
    compare_at_price: 81300000,
    special_offer: false,
    special_offer_end: null,
    cost_per_item: null,
    batch_size: 1,
    length: null,
    width: null,
    height: null,
    weight: null,
    barcode: "",
    available: true,
    show_price: false,
    has_variants: true,
    stock: 0,
    stock_type: { value: "limited", label: "محدود" },
    min_order_quantity: null,
    max_order_quantity: null,
    guarantee: "گارانتی 18 ماهه",
    product_identifier: "",
    processing_time: 0,
    seo_title: "seo title",
    seo_description: "seo desc",
    views: 12,
    tags: [],
    images: [],
    variants: [],
  };

  it("maps direct fields and resolves category/brand ids", () => {
    const mapped = mapLegacyProduct(raw, { mainCategoryId: 100, otherCategoryIds: [101], brandId: 200 });

    expect(mapped.name).toBe("گوشی موبایل سامسونگ");
    expect(mapped.englishName).toBe("Galaxy A37");
    expect(mapped.slug).toBe("galaxy-a37");
    expect(mapped.mainCategoryId).toBe(100);
    expect(mapped.brandId).toBe(200);
    expect(mapped.barcode).toBeNull();
    expect(mapped.productIdentifier).toBeNull();
    expect(mapped.stockType).toBe(StockType.LIMITED);
    expect(mapped.hasVariants).toBe(true);
    expect(mapped.views).toBe(12);
  });

  it("maps a null brand through as null", () => {
    const mapped = mapLegacyProduct({ ...raw, brand: null }, { mainCategoryId: 100, otherCategoryIds: [], brandId: null });
    expect(mapped.brandId).toBeNull();
  });
});
