import { describe, it, expect } from "vitest";
import { validateProductQuickUpdate, validateVariantQuickUpdate } from "@/lib/tma-service";

describe("tma-products quick update validation", () => {
  it("should validate product availability and stock updates", () => {
    const valid = validateProductQuickUpdate({
      available: false,
      stock: 10,
      price: 25000000,
    });
    expect(valid.valid).toBe(true);
    expect(valid.data?.available).toBe(false);
    expect(valid.data?.stock).toBe(10);
    expect(valid.data?.price).toBe(25000000);
  });

  it("should reject negative stock values", () => {
    const invalid = validateProductQuickUpdate({ stock: -5 });
    expect(invalid.valid).toBe(false);
    expect(invalid.error).toContain("موجودی نمی‌تواند منفی باشد");
  });

  it("should reject negative prices", () => {
    const invalid = validateProductQuickUpdate({ price: -1000 });
    expect(invalid.valid).toBe(false);
    expect(invalid.error).toContain("قیمت معتبر نیست");
  });

  it("should validate compareAtPrice greater than or equal to price", () => {
    const valid = validateProductQuickUpdate({
      price: 20000000,
      compareAtPrice: 22000000,
    });
    expect(valid.valid).toBe(true);

    const invalid = validateProductQuickUpdate({
      price: 20000000,
      compareAtPrice: 18000000, // compareAtPrice lower than price is logically invalid for strike-through
    });
    expect(invalid.valid).toBe(false);
  });

  it("should validate variant stock and price updates", () => {
    const valid = validateVariantQuickUpdate({
      variantId: 42,
      stock: 5,
      price: 31000000,
      compareAtPrice: 33000000,
    });
    expect(valid.valid).toBe(true);
    expect(valid.data?.variantId).toBe(42);
    expect(valid.data?.stock).toBe(5);
  });
});

