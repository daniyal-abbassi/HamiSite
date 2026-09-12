import { listBrands } from "@/lib/catalog";
import { ok, withErrorHandling } from "@/lib/http";

/**
 * Brands, from the JSON catalogue export.
 *
 * Swapped off Prisma alongside the product routes: the shop page's brand filter
 * reads this, and against the empty database it returned zero, leaving the
 * filter blank while 189 products sat behind it. The Prisma version is kept in
 * `.prisma-route-backup/`.
 */
export async function GET() {
  return withErrorHandling(async () => {
    const brands = listBrands()
      .map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        imageUrl: null,
        imageAlt: null,
        iconUrl: null,
        seoTitle: null,
        seoDescription: null,
        productCount: b.productCount,
      }))
      .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name, "fa"));

    return ok(brands, { total: brands.length });
  });
}
