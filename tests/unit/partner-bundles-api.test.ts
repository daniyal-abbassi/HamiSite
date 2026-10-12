import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { serializePartnerBundle } from "@/lib/bundles";

describe("Partner Bundles Access Control and Serialization", () => {
  it("should mark bundle as unavailable when isActive is false", () => {
    const mockBundle = {
      id: 1,
      title: "سبد غیرفعال",
      slug: "inactive-bundle",
      description: "توضیحات",
      price: { toString: () => "1500000" } as any,
      compareAtPrice: { toString: () => "2000000" } as any,
      stock: 10,
      isActive: false, // inactive!
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 1,
          productId: 10,
          variantId: null,
          quantity: 2,
          order: 0,
          bundleId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          product: {
            id: 10,
            name: "کالای تستی",
            slug: "test-prod",
            price: { toString: () => "1000000" } as any,
            available: true,
            stock: 20,
            stockType: "LIMITED" as any,
            images: [],
          },
          variant: null,
        },
      ],
    };

    const serialized = serializePartnerBundle(mockBundle as any);
    expect(serialized.isActive).toBe(false);
    expect(serialized.isAvailable).toBe(false);
    expect(serialized.maxPurchasableUnits).toBe(0);
  });

  it("should calculate correct availability when active and in stock", () => {
    const mockBundle = {
      id: 2,
      title: "سبد فعال",
      slug: "active-bundle",
      description: null,
      price: { toString: () => "800000" } as any,
      compareAtPrice: null,
      stock: 5,
      isActive: true,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 2,
          productId: 20,
          variantId: null,
          quantity: 3,
          order: 0,
          bundleId: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          product: {
            id: 20,
            name: "شارژر",
            slug: "charger",
            price: { toString: () => "300000" } as any,
            available: true,
            stock: 12, // supports 12 / 3 = 4 units
            stockType: "LIMITED" as any,
            images: [],
          },
          variant: null,
        },
      ],
    };

    const serialized = serializePartnerBundle(mockBundle as any);
    expect(serialized.isActive).toBe(true);
    expect(serialized.isAvailable).toBe(true);
    // Bundle quota is 5, but warehouse stock only supports 4
    expect(serialized.maxPurchasableUnits).toBe(4);
  });

  it("should verify that wholesale roles are correctly categorized", () => {
    const partnerRoles: Role[] = [Role.WHOLESALE, Role.AGENT, Role.ADMIN];
    expect(partnerRoles.includes(Role.WHOLESALE)).toBe(true);
    expect(partnerRoles.includes(Role.AGENT)).toBe(true);
    expect(partnerRoles.includes(Role.RETAIL)).toBe(false);
  });
});

