import { db } from "@/db";
import { brands, categories, products, galleryImages } from "@/db/schema";
import { sql } from "drizzle-orm";
import { BRAND_SEED, CATEGORY_SEED, PRODUCT_SEED, GALLERY_SEED } from "./seed-data";

export async function seedIfEmpty() {
  const existing = await db.select({ id: brands.id }).from(brands).limit(1);
  if (existing.length > 0) return;

  const insertedBrands = await db.insert(brands).values(BRAND_SEED).returning();
  const insertedCats = await db.insert(categories).values(CATEGORY_SEED).returning();
  const brandMap = new Map(insertedBrands.map((b) => [b.slug, b.id]));
  const catMap = new Map(insertedCats.map((c) => [c.slug, c.id]));

  const now = Date.now();
  await db.insert(products).values(
    PRODUCT_SEED.map((p) => ({
      slug: p.slug,
      name: p.name,
      brandId: brandMap.get(p.brand)!,
      categoryId: catMap.get(p.category)!,
      price: Math.round(p.price),
      dealPrice: p.dealPrice ? Math.round(p.dealPrice) : null,
      dealEndsAt: p.dealHours ? new Date(now + p.dealHours * 3600 * 1000) : null,
      image: p.image,
      color: p.color,
      storage: p.storage ?? null,
      badge: p.badge ?? null,
      isNew: p.isNew ?? false,
      isFlagship: p.isFlagship ?? false,
      stock: p.stock,
      rating: p.rating,
      specs: p.specs,
      description: p.description,
    })),
  );
  await db.insert(galleryImages).values(GALLERY_SEED);
}

/** Keep countdowns alive: roll expired deals forward so the promo is always live. */
export async function refreshExpiredDeals() {
  await db.execute(sql`
    update products
    set deal_ends_at = now() + ((id % 5 + 1) * interval '9 hours')
    where deal_price is not null and (deal_ends_at is null or deal_ends_at < now())
  `);
}
