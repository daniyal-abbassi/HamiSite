import { describe, expect, it } from "vitest";
import {
  createBundleInputSchema,
  updateBundleInputSchema,
} from "@/lib/schemas/admin-bundles";

describe("Admin Bundles Schema & Validation", () => {
  it("should validate a valid bundle input payload", () => {
    const validPayload = {
      title: "سبد ویژه شارژر و کابل",
      description: "تخفیف ویژه همکاران عمده",
      price: 2500000,
      compareAtPrice: 3000000,
      stock: 10,
      isActive: true,
      items: [
        { productId: 1, quantity: 5 },
        { productId: 2, variantId: 10, quantity: 2 },
      ],
    };

    const parsed = createBundleInputSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it("should reject when title is empty or too short", () => {
    const invalidPayload = {
      title: " ",
      price: 1000000,
      stock: 5,
      items: [{ productId: 1, quantity: 2 }],
    };

    const parsed = createBundleInputSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toContain("نام سبد");
    }
  });

  it("should reject when price is negative", () => {
    const invalidPayload = {
      title: "سبد تست",
      price: -5000,
      stock: 5,
      items: [{ productId: 1, quantity: 2 }],
    };

    const parsed = createBundleInputSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toContain("قیمت سبد نمی‌تواند منفی باشد");
    }
  });

  it("should reject when stock is negative", () => {
    const invalidPayload = {
      title: "سبد تست",
      price: 50000,
      stock: -1,
      items: [{ productId: 1, quantity: 2 }],
    };

    const parsed = createBundleInputSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });

  it("should reject when items list is empty", () => {
    const invalidPayload = {
      title: "سبد تست بدون کالا",
      price: 50000,
      stock: 5,
      items: [],
    };

    const parsed = createBundleInputSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });

  it("should reject when any constituent item quantity is less than 1", () => {
    const invalidPayload = {
      title: "سبد تست",
      price: 50000,
      stock: 5,
      items: [{ productId: 1, quantity: 0 }],
    };

    const parsed = createBundleInputSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });

  it("should allow partial payload for update schema", () => {
    const partialUpdate = {
      price: 2200000,
      stock: 8,
      isActive: false,
    };

    const parsed = updateBundleInputSchema.safeParse(partialUpdate);
    expect(parsed.success).toBe(true);
  });
});

