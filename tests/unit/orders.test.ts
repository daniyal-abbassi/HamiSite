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
      items: [{ variantId: seed.variant.id, quantity: 3, variant: { stockType: StockType.LIMITED } }],
      user: { id: seed.retail.id, role: Role.RETAIL },
    };

    await prisma.$transaction(async (tx) => {
      await applyOrderStatusTransition(tx, order, OrderStatus.CANCELED);
    });

    const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: seed.variant.id } });
    expect(variant.stock).toBe(8);
  });

  it("does nothing when the order is already in a terminal status (no re-application)", async () => {
    await prisma.productVariant.update({ where: { id: seed.variant.id }, data: { stock: 5 } });

    const order = {
      id: 3,
      status: OrderStatus.CANCELED,
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
