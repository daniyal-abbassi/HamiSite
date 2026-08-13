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
  const usedNames = new Map<string, number>(); // trimmed name -> legacy id that claimed it

  // Sort by legacy id so slug-suffix assignment on collision is deterministic
  // regardless of the order the legacy API happens to return brands in.
  const sortedRows = [...rows].sort((a, b) => a.id - b.id);

  for (const raw of sortedRows) {
    const slug = deriveBrandSlug(raw.name, raw.id, usedSlugs);
    usedSlugs.add(slug);

    // Brand.name is ALSO @unique in the schema, independently of slug. Two
    // legacy brands with the same name (after trimming) collide on `name`
    // even if their derived slugs differ, and the second upsert will fail
    // with a P2002 at the database level. There's no way to store both as
    // distinct Brand rows under the current schema (no schema changes are
    // in scope for this plan), so we can't fully resolve this here — just
    // warn loudly instead of letting it fail with a cryptic, unattributed
    // error, and let the second upsert fail (or overwrite, on retry with
    // `update`) as it naturally would.
    const trimmedName = raw.name.trim();
    const priorId = usedNames.get(trimmedName);
    if (priorId !== undefined) {
      console.warn(
        `Legacy brands ${priorId} and ${raw.id} share the same name "${trimmedName}" — Brand.name is @unique, so only one can be stored as a distinct Brand row without a schema change. This upsert may fail with a unique-constraint error.`
      );
    } else {
      usedNames.set(trimmedName, raw.id);
    }

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
