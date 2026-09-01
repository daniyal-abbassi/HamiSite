import { HistoryAction } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { recordProductHistory } from "@/lib/productHistory";
import { prisma } from "@/lib/prisma";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;

beforeEach(async () => {
  seed = await seedMinimal();
});

describe("recordProductHistory", () => {
  it("writes a ProductHistory row with old/new values", async () => {
    await recordProductHistory({
      productId: seed.product.id,
      variantId: seed.variant.id,
      action: HistoryAction.UPDATED,
      field: "stock",
      oldValue: { stock: 20 },
      newValue: { stock: 15 },
      changedById: seed.admin.id,
    });

    const rows = await prisma.productHistory.findMany({ where: { productId: seed.product.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0].action).toBe(HistoryAction.UPDATED);
    expect(rows[0].field).toBe("stock");
    expect(rows[0].oldValue).toEqual({ stock: 20 });
    expect(rows[0].changedById).toBe(seed.admin.id);
  });
});
