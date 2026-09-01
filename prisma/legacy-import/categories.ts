import type { Prisma, PrismaClient } from "@prisma/client";
import type { LegacyCategory } from "./types";

export function mapLegacyCategory(raw: LegacyCategory, parentId: number | null): Prisma.CategoryUncheckedCreateInput {
  return {
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    parentId,
    imageUrl: raw.image_url,
    iconUrl: raw.icon_url,
    imageAlt: raw.image_alt,
    available: raw.available,
    categoriesMenuShow: raw.categories_menu_show,
    topMenuSeparateShow: raw.top_menu_separate_show,
    order: raw.order,
    level: raw.level,
    seoTitle: raw.seo_title,
    seoDescription: raw.seo_description,
  };
}

export async function importCategories(prisma: PrismaClient, rows: LegacyCategory[]): Promise<Map<number, number>> {
  const idMap = new Map<number, number>();
  const sorted = [...rows].sort((a, b) => a.level - b.level);

  for (const raw of sorted) {
    const parentId = raw.parent_id !== null ? idMap.get(raw.parent_id) ?? null : null;
    const data = mapLegacyCategory(raw, parentId);

    const category = await prisma.category.upsert({
      where: { slug: raw.slug },
      update: data,
      create: data,
    });

    idMap.set(raw.id, category.id);
  }

  return idMap;
}
