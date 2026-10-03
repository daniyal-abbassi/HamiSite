import { Role } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

/** Authenticated dashboard snapshot, derived from persisted records. */
export const GET = withAuth(async () => withErrorHandling(async () => {
  const [products, stockGroups, users, orders, categories, brands] = await Promise.all([
    prisma.product.count(), prisma.product.groupBy({ by: ["stockType"], _count: { _all: true } }),
    prisma.user.count(), prisma.order.count(), prisma.category.count(), prisma.brand.count(),
  ]);
  const byStockState = Object.fromEntries(stockGroups.map(({ stockType, _count }) => [stockType.toLowerCase(), _count._all]));
  return ok({
    totals: { products, categories, brands, users, orders },
    inventory: { byStockState, catalogGeneratedAt: null },
    source: { orders: "database", catalog: "database" },
  });
}), { roles: [Role.ADMIN] });
