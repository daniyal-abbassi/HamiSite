import { describe, expect, it } from "vitest";
import {
  calculateBundleSavings,
  checkBundleAvailability,
  slugifyBundleTitle,
} from "@/lib/bundles";

describe("Partner Bundles Helper Utilities", () => {
  describe("slugifyBundleTitle", () => {
    it("should produce a clean kebab-case slug for Persian titles", () => {
      const slug = slugifyBundleTitle("سبد ویژه لوازم جانبی پاییز");
      expect(slug).toBe("سبد-ویژه-لوازم-جانبی-پاییز");
    });

    it("should handle mixed Persian and English titles", () => {
      const slug = slugifyBundleTitle("بسته Anker 20W + کابل شارژ");
      expect(slug).toBe("بسته-anker-20w-کابل-شارژ");
    });
  });

  describe("calculateBundleSavings", () => {
    it("should compute correct aggregate compare price, savings amount, and percentage", () => {
      const items = [
        { unitPrice: 500000, quantity: 2 }, // 1,000,000
        { unitPrice: 200000, quantity: 5 }, // 1,000,000
      ]; // total aggregate: 2,000,000

      const bundlePrice = 1500000;
      const savings = calculateBundleSavings(bundlePrice, items);

      expect(savings.compareAtPrice).toBe(2000000);
      expect(savings.savingsAmount).toBe(500000);
      expect(savings.savingsPercent).toBe(25);
    });

    it("should respect custom compareAtPrice if explicitly provided and higher", () => {
      const items = [{ unitPrice: 100000, quantity: 1 }];
      const bundlePrice = 80000;
      const savings = calculateBundleSavings(bundlePrice, items, 120000);

      expect(savings.compareAtPrice).toBe(120000);
      expect(savings.savingsAmount).toBe(40000);
      expect(savings.savingsPercent).toBe(33);
    });
  });

  describe("checkBundleAvailability", () => {
    it("should be available if bundle quota > 0 and constituent warehouse stocks satisfy multipliers", () => {
      const bundleQuota = 10;
      const items = [
        { quantity: 2, stock: 20, stockType: "LIMITED" }, // supports 10
        { quantity: 5, stock: 40, stockType: "LIMITED" }, // supports 8
      ];

      const availability = checkBundleAvailability(bundleQuota, items);
      expect(availability.isAvailable).toBe(true);
      expect(availability.maxPurchasableUnits).toBe(8);
    });

    it("should be unavailable if bundle quota is 0", () => {
      const bundleQuota = 0;
      const items = [{ quantity: 1, stock: 50, stockType: "LIMITED" }];

      const availability = checkBundleAvailability(bundleQuota, items);
      expect(availability.isAvailable).toBe(false);
      expect(availability.maxPurchasableUnits).toBe(0);
    });

    it("should be unavailable if any constituent product has 0 stock", () => {
      const bundleQuota = 5;
      const items = [
        { quantity: 2, stock: 10, stockType: "LIMITED" },
        { quantity: 1, stock: 0, stockType: "LIMITED" },
      ];

      const availability = checkBundleAvailability(bundleQuota, items);
      expect(availability.isAvailable).toBe(false);
      expect(availability.maxPurchasableUnits).toBe(0);
    });

    it("should handle UNLIMITED stock types correctly without limiting units", () => {
      const bundleQuota = 5;
      const items = [
        { quantity: 2, stock: 0, stockType: "UNLIMITED" },
        { quantity: 1, stock: 3, stockType: "LIMITED" },
      ];

      const availability = checkBundleAvailability(bundleQuota, items);
      expect(availability.isAvailable).toBe(true);
      expect(availability.maxPurchasableUnits).toBe(3);
    });

    it("should mark unavailable if stockType is CALL or OUT_OF_STOCK", () => {
      const bundleQuota = 5;
      const items = [
        { quantity: 1, stock: 10, stockType: "OUT_OF_STOCK" },
      ];

      const availability = checkBundleAvailability(bundleQuota, items);
      expect(availability.isAvailable).toBe(false);
      expect(availability.maxPurchasableUnits).toBe(0);
    });
  });
});

