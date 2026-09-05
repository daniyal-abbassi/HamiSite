import { db } from "@/db";
import { brands, categories, products, galleryImages } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { seedIfEmpty, refreshExpiredDeals } from "@/db/seed";

export type { ProductView, BrandView, CategoryView, GalleryView } from "./catalog";
export { discount } from "./catalog";
import { discount } from "./catalog";
import type { ProductView } from "./catalog";

let bootstrapped = false;
async function ensureData() {
  try {
    if (!bootstrapped) {
      await seedIfEmpty();
      bootstrapped = true;
    }
    await refreshExpiredDeals();
  } catch (err) {
    console.error("bootstrap failed", err);
  }
}

function mapRow(r: {
  p: typeof products.$inferSelect;
  b: typeof brands.$inferSelect;
  c: typeof categories.$inferSelect;
}): ProductView {
  return {
    id: r.p.id,
    slug: r.p.slug,
    name: r.p.name,
    price: r.p.price,
    dealPrice: r.p.dealPrice,
    dealEndsAt: r.p.dealEndsAt ? r.p.dealEndsAt.toISOString() : null,
    image: r.p.image,
    color: r.p.color,
    storage: r.p.storage,
    badge: r.p.badge,
    isNew: r.p.isNew,
    isFlagship: r.p.isFlagship,
    stock: r.p.stock,
    rating: r.p.rating,
    specs: r.p.specs,
    description: r.p.description,
    brandSlug: r.b.slug,
    brandName: r.b.nameFa,
    brandWorld: r.b.world,
    categorySlug: r.c.slug,
    categoryName: r.c.nameFa,
    categoryWorld: r.c.world,
  };
}

export async function getCatalog() {
  await ensureData();
  const [rows, brandRows, catRows, gallery] = await Promise.all([
    db
      .select({ p: products, b: brands, c: categories })
      .from(products)
      .innerJoin(brands, eq(products.brandId, brands.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(asc(products.id)),
    db.select().from(brands).orderBy(asc(brands.sort)),
    db.select().from(categories).orderBy(asc(categories.sort)),
    db.select().from(galleryImages).orderBy(asc(galleryImages.sort)),
  ]);
  const all = rows.map(mapRow);
  return {
    products: all,
    brands: brandRows,
    categories: catRows,
    gallery,
    deals: all.filter((p) => p.dealPrice !== null).sort((a, b) => discount(b) - discount(a)),
    newest: all.filter((p) => p.isNew).slice(0, 8),
  };
}

export async function getProductBySlug(slug: string) {
  await ensureData();
  const rows = await db
    .select({ p: products, b: brands, c: categories })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);
  return rows[0] ? mapRow(rows[0]) : null;
}
