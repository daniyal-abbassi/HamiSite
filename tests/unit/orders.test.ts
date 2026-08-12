import { OrderStatus, Role, StockType } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { applyOrderStatusTransition } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;

beforeEach(async () => {
  seed = await seedMinimal();
});

describe("applyOrderStatusTransition", () => {
  it("restocks a LIMITED variant when transitioning into a terminal cancel status", async () => {
    await prisma.productVariant.update({ where: { id: seed.variant.id }, data: { stock: 5 } });

    const order = {
      id: 1,
      status: OrderStatus.PENDING,
      paymentMethod: "card",
      totalAmount: { toString: () => "0" } as any,
      items: [{ variantId: seed.variant.id, quantity: 3, variant: { stockType: StockType.LIMITED } }],
      user: { id: seed.retail.id, role: Role.RETAIL },
    };

    await prisma.$transaction(async (tx) => {
      await applyOrderStatusTransition(tx, order, OrderStatus.CANCELED);
    });

    const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: seed.variant.id } });
    expect(variant.stock).toBe(8);
  });

  it("reverses WHOLESALE credit only when the order was paid on credit and becomes terminal", async () => {
    await prisma.user.update({ where: { id: seed.wholesale.id }, data: { creditUsed: 500000 } });

    const order = {
      id: 2,
      status: OrderStatus.PENDING,
      paymentMethod: "credit",
      totalAmount: { toString: () => "500000" } as any,
      items: [],
      user: { id: seed.wholesale.id, role: Role.WHOLESALE },
    };

    await prisma.$transaction(async (tx) => {
      await applyOrderStatusTransition(tx, order, OrderStatus.FAILED);
    });

    const wholesale = await prisma.user.findUniqueOrThrow({ where: { id: seed.wholesale.id } });
    expect(Number(wholesale.creditUsed)).toBe(0);
  });

  it("does nothing when the order is already in a terminal status (no re-application)", async () => {
    await prisma.productVariant.update({ where: { id: seed.variant.id }, data: { stock: 5 } });

    const order = {
      id: 3,
      status: OrderStatus.CANCELED,
      paymentMethod: "card",
      totalAmount: { toString: () => "0" } as any,
      items: [{ variantId: seed.variant.id, quantity: 3, variant: { stockType: StockType.LIMITED } }],
      user: { id: seed.retail.id, role: Role.RETAIL },
    };

    await prisma.$transaction(async (tx) => {
      await applyOrderStatusTransition(tx, order, OrderStatus.FAILED);
    });

    const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: seed.variant.id } });
    expect(variant.stock).toBe(5);
  });
});
