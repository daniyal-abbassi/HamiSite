import type { Prisma, PrismaClient } from "@prisma/client";
import type { LegacyBrand } from "./types";

export function deriveBrandSlug(name: string, legacyId: number, existingSlugs: Set<string>): string {
  const base = name.trim().replace(/[\s|]+/g, "-").toLowerCase();
  return existingSlugs.has(base) ? `${base}-${legacyId}` : base;
}

export function mapLegacyBrand(raw: LegacyBrand, slug: string): Prisma.BrandUncheckedCreateInput {
  return {
    name: raw.name,
    slug,
    imageUrl: raw.image_url,
    imageAlt: raw.image_alt,
    iconUrl: null,
    seoTitle: raw.seo_title,
    seoDescription: raw.seo_description,
    isActive: true,
    order: 0,
  };
}

export async function importBrands(prisma: PrismaClient, rows: LegacyBrand[]): Promise<Map<number, number>> {
  const idMap = new Map<number, number>();
  const usedSlugs = new Set<string>();

  for (const raw of rows) {
    const slug = deriveBrandSlug(raw.name, raw.id, usedSlugs);
    usedSlugs.add(slug);
    const data = mapLegacyBrand(raw, slug);

    const brand = await prisma.brand.upsert({
      where: { slug },
      update: data,
      create: data,
    });

    idMap.set(raw.id, brand.id);
  }

  return idMap;
}
