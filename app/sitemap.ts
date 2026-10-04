import type { MetadataRoute } from "next";
import { categorySubtreeCounts, listCategories, listBrands } from "@/lib/catalog-db";
import { prisma } from "@/lib/prisma";
import { SITE_ORIGIN } from "@/lib/seo-metadata";

export const dynamic = "force-dynamic";

const absoluteUrl = (path: string) => new URL(path, SITE_ORIGIN).toString();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, subtreeCounts, brands, products] = await Promise.all([
    listCategories(),
    categorySubtreeCounts(),
    listBrands(),
    prisma.product.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 50_000,
    }),
  ]);

  const categoryEntries = categories
    .filter((category) => (subtreeCounts.get(category.id) ?? 0) > 0)
    .map((category) => ({
      url: absoluteUrl(`/categories/${encodeURIComponent(category.slug)}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  const brandEntries = brands.map((brand) => ({
    url: absoluteUrl(`/brands/${encodeURIComponent(brand.slug)}`),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const productEntries = products.map((product) => ({
    url: absoluteUrl(`/shop/${encodeURIComponent(product.slug)}`),
    lastModified: product.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/shop"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/partners"), changeFrequency: "monthly", priority: 0.5 },
    ...categoryEntries,
    ...brandEntries,
    ...productEntries,
  ];
}
