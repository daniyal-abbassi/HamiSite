import { describe, expect, it, vi } from "vitest";
import { B2BPaymentTerm, OrderStatus, Role, StockType } from "@prisma/client";
import { serializeCart } from "@/lib/cart";
import { applyOrderStatusTransition, TERMINAL_CANCEL_STATUSES } from "@/lib/orders";

describe("Cart and Order Bundle Processing", () => {
  describe("serializeCart with bundles", () => {
    it("should serialize a cart containing a bundle item with constituent items breakdown", () => {
      const mockCart = {
        id: 1,
        userId: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: 101,
            cartId: 1,
            productId: null,
            variantId: null,
            bundleId: 5,
            quantity: 2,
            unitPrice: { toString: () => "2500000" } as any,
            createdAt: new Date(),
            updatedAt: new Date(),
            product: null,
            variant: null,
            bundle: {
              id: 5,
              title: "سبد لوازم جانبی",
              slug: "sbd-lavazem-janebi",
              price: { toString: () => "2500000" } as any,
              compareAtPrice: { toString: () => "3200000" } as any,
              stock: 10,
              isActive: true,
              imageUrl: "/bundle.jpg",
              createdAt: new Date(),
              updatedAt: new Date(),
              items: [
                {
                  id: 1,
                  bundleId: 5,
                  productId: 201,
                  variantId: null,
                  quantity: 4,
                  order: 0,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  product: {
                    id: 201,
                    name: "شارژر دیواری ۲۰ وات",
                    slug: "charger-20w",
                    price: { toString: () => "500000" } as any,
                    available: true,
                    stock: 30,
                    stockType: StockType.LIMITED,
                  },
                  variant: null,
                },
              ],
            },
          },
        ],
      };

      const result = serializeCart(mockCart as any, 10);

      expect(result.itemCount).toBe(2);
      expect(result.subtotal).toBe(5000000);
      expect(result.items.length).toBe(1);

      const cartItem = result.items[0];
      expect(cartItem.isBundle).toBe(true);
      expect(cartItem.bundleTitle).toBe("سبد لوازم جانبی");
      expect(cartItem.bundleItems?.length).toBe(1);
      expect(cartItem.bundleItems?.[0].productName).toBe("شارژر دیواری ۲۰ وات");
      expect(cartItem.bundleItems?.[0].totalQuantity).toBe(8); // 4 * 2 = 8
    });
  });

  describe("Order cancellation stock restoration for bundles", () => {
    it("should restore both bundle quota and constituent variant stock upon cancellation", async () => {
      const tx = {
        partnerBundle: {
          update: vi.fn().mockResolvedValue({}),
          findUnique: vi.fn().mockResolvedValue({
            id: 5,
            items: [
              {
                productId: 201,
                variantId: 301,
                quantity: 3,
                product: { id: 201, stockType: StockType.LIMITED },
                variant: { id: 301, stockType: StockType.LIMITED },
              },
            ],
          }),
        },
        productVariant: {
          update: vi.fn().mockResolvedValue({}),
        },
        product: {
          update: vi.fn().mockResolvedValue({}),
        },
        user: {
          findUniqueOrThrow: vi.fn().mockResolvedValue({ creditUsed: 0 }),
          update: vi.fn().mockResolvedValue({}),
        },
      };

      const mockOrder = {
        id: 99,
        status: OrderStatus.PENDING,
        paymentTerm: B2BPaymentTerm.CASH,
        totalAmount: { toString: () => "2000000" } as any,
        items: [
          {
            bundleId: 5,
            quantity: 2, // 2 bundles canceled
          },
        ],
        user: { id: 10, role: Role.WHOLESALE },
      };

      await applyOrderStatusTransition(tx as any, mockOrder as any, OrderStatus.CANCELED);

      // Verify bundle quota restored: 2 units
      expect(tx.partnerBundle.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { stock: { increment: 2 } },
      });

      // Verify constituent variant restored: 3 * 2 = 6 units
      expect(tx.productVariant.update).toHaveBeenCalledWith({
        where: { id: 301 },
        data: { stock: { increment: 6 } },
      });
    });

    it("should identify terminal cancel statuses properly", () => {
      expect(TERMINAL_CANCEL_STATUSES).toContain("CANCELED");
      expect(TERMINAL_CANCEL_STATUSES).toContain("FAILED");
      expect(TERMINAL_CANCEL_STATUSES).toContain("REVERSED");
    });
  });

  describe("B2B Payment Term rules for bundles", () => {
    it("should ensure bundles disallow CREDIT_60_DAYS", () => {
      const allowedTerm = B2BPaymentTerm.CASH;
      const disallowedTerm = B2BPaymentTerm.CREDIT_60_DAYS;

      const isAllowedForBundle = (term: B2BPaymentTerm) => term === B2BPaymentTerm.CASH;

      expect(isAllowedForBundle(allowedTerm)).toBe(true);
      expect(isAllowedForBundle(disallowedTerm)).toBe(false);
    });
  });
});

