import { Role } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { ok, withErrorHandling } from "@/lib/http";
import { readCatalogSync } from "@/lib/catalog-store";
import { prisma } from "@/lib/prisma";

/** Authenticated dashboard snapshot: order metrics from the transactional DB and inventory from the authoritative JSON catalogue. */
export const GET = withAuth(async () => withErrorHandling(async () => {
  const catalog = readCatalogSync();
  const byStockState = catalog.products.reduce<Record<string, number>>((counts, product) => {
    const state = product.stock?.state ?? "unknown";
    counts[state] = (counts[state] ?? 0) + 1;
    return counts;
  }, {});
  const [users, orders, categories, brands] = await Promise.all([
    prisma.user.count(), prisma.order.count(), Promise.resolve(catalog.categories.length), Promise.resolve(catalog.brands.length),
  ]);
  return ok({
    totals: { products: catalog.products.length, categories, brands, users, orders },
    inventory: { byStockState, catalogGeneratedAt: typeof catalog.meta?.generated_at === "string" ? catalog.meta.generated_at : null },
    source: { orders: "database", catalog: "json" },
  });
}), { roles: [Role.ADMIN] });
