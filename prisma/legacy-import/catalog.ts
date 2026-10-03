/**
 * Add missing rows from the reviewed JSON catalog export into PostgreSQL.
 *
 * Safe to run repeatedly: existing products are never updated or deleted, and
 * existing business data is never touched. Match by stable slug/name, not by
 * export IDs. Run only after reviewing a database inventory and a backup.
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Prisma, PrismaClient, StockType } from "@prisma/client";

type ExportImage = { url: string; alt?: string | null; is_default?: boolean; order?: number };
type ExportVariant = {
  is_default?: boolean;
  price?: number | null;
  compare_at_price?: number | null;
  stock?: number | null;
  barcode?: string | null;
  sku?: string | null;
  image_url?: string | null;
  guarantee?: string | null;
  options?: Record<string, string> | null;
};
type ExportRecord = {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  image_alt?: string | null;
  icon_url?: string | null;
  parent_id?: number | null;
  parent_name?: string | null;
  level?: number;
  order?: number;
  available?: boolean;
  is_active?: boolean;
};
type ExportProduct = {
  id: number;
  slug: string;
  name: string;
  kind?: string | null;
  english_name?: string | null;
  brand?: { name: string } | null;
  category?: { name: string } | null;
  other_categories?: Array<{ name: string }>;
  tags?: string[];
  price?: number | null;
  compare_at_price?: number | null;
  special_offer?: boolean;
  special_offer_end?: string | null;
  stock?: { state?: string; purchasable?: boolean; quantity?: number | null; min_order_quantity?: number | null; max_order_quantity?: number | null };
  guarantee?: string | null;
  is_digital?: boolean;
  primary_image?: string | null;
  images?: ExportImage[];
  variants?: ExportVariant[];
  specs?: Array<{ name: string; value: string }>;
  description_html?: string | null;
  description_text?: string | null;
  seo?: { title?: string | null; description?: string | null };
  shipping?: { batch_size?: number | null };
  barcode?: string | null;
  sku?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type CatalogExport = { meta?: { generated_at?: string }; categories: ExportRecord[]; brands: ExportRecord[]; products: ExportProduct[] };
const prisma = new PrismaClient();

function stockType(value?: string): StockType {
  switch (value) {
    case "limited": return StockType.LIMITED;
    case "out_of_stock": return StockType.OUT_OF_STOCK;
    case "unlimited": return StockType.UNLIMITED;
    default: return StockType.CALL;
  }
}

function slugify(value: string) {
  return value.trim().replace(/\s*\|\s*/g, "-").replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "").toLowerCase();
}

function decimal(value: number | null | undefined) {
  return value == null ? undefined : new Prisma.Decimal(value);
}

async function main() {
  const file = path.join(process.cwd(), "data", "hami-products.json");
  const source = JSON.parse(await readFile(file, "utf8")) as CatalogExport;
  const mirrors = JSON.parse(await readFile(path.join(process.cwd(), "data", "catalog-images.json"), "utf8")) as Record<string, string>;
  const counts = { categoriesCreated: 0, brandsCreated: 0, productsCreated: 0, productsBackfilled: 0, productsSkipped: 0 };

  await prisma.$transaction(async (tx) => {
    const categoryBySourceId = new Map<number, number>();
    for (const row of [...source.categories].sort((a, b) => (a.level ?? 0) - (b.level ?? 0))) {
      const slug = row.slug;
      if (!slug) throw new Error(`Category ${row.name} has no stable slug`);
      const matches = await tx.category.findMany({ where: { OR: [{ slug }, { name: row.name }] } });
      if (matches.length > 1) throw new Error(`Ambiguous existing category identity for ${slug}`);
      const existing = matches[0];
      if (existing) {
        if (existing.slug !== slug && existing.name !== row.name) {
          throw new Error(`Category identity conflict for ${slug}`);
        }
        categoryBySourceId.set(row.id, existing.id);
        continue;
      }
      const parent = row.parent_id == null ? null : categoryBySourceId.get(row.parent_id) ?? null;
      const created = await tx.category.create({ data: {
        name: row.name, slug, description: row.description ?? null,
        parentId: parent, level: row.level ?? 0, order: row.order ?? 0,
        available: row.available ?? true, imageUrl: row.image_url ?? null,
        imageAlt: row.image_alt ?? null, iconUrl: row.icon_url ?? null,
      } });
      categoryBySourceId.set(row.id, created.id);
      counts.categoriesCreated++;
    }

    const brandIdByName = new Map<string, number>();
    for (const row of source.brands) {
      const slug = row.slug ?? slugify(row.name);
      const matches = await tx.brand.findMany({ where: { OR: [{ slug }, { name: row.name }] } });
      if (matches.length > 1) throw new Error(`Ambiguous existing brand identity for ${row.name}`);
      const existing = matches[0];
      if (existing) {
        if (existing.slug !== slug && existing.name !== row.name) throw new Error(`Brand identity conflict for ${row.name}`);
        brandIdByName.set(row.name, existing.id);
        continue;
      }
      const created = await tx.brand.create({ data: {
        name: row.name, slug, order: row.order ?? 0, isActive: row.is_active ?? true,
        imageUrl: row.image_url ?? null, imageAlt: row.image_alt ?? null, iconUrl: row.icon_url ?? null,
      } });
      brandIdByName.set(row.name, created.id);
      counts.brandsCreated++;
    }

    for (const row of source.products) {
      const existing = await tx.product.findUnique({ where: { slug: row.slug }, select: { id: true, kind: true, descriptionText: true, specs: true } });
      if (existing) {
        const data: Prisma.ProductUpdateInput = {};
        if (existing.kind == null && row.kind != null) data.kind = row.kind;
        if (existing.descriptionText == null && row.description_text != null) data.descriptionText = row.description_text;
        if (existing.specs == null && row.specs != null) data.specs = row.specs as Prisma.InputJsonValue;
        if (Object.keys(data).length) {
          await tx.product.update({ where: { id: existing.id }, data });
          counts.productsBackfilled++;
        } else counts.productsSkipped++;
        continue;
      }
      const category = row.category ? await tx.category.findFirst({ where: { name: row.category.name } }) : null;
      const brandId = row.brand ? brandIdByName.get(row.brand.name) : undefined;
      if (row.category && !category) throw new Error(`Missing category ${row.category.name} for product ${row.slug}`);
      if (row.brand && !brandId) throw new Error(`Missing brand ${row.brand.name} for product ${row.slug}`);
      const images = row.images ?? [];
      const defaultImage = row.primary_image ?? images.find((image) => image.is_default)?.url ?? images[0]?.url;
      const variants = row.variants ?? [];
      const stock = row.stock;
      const data: Prisma.ProductCreateInput = {
        name: row.name,
        englishName: row.english_name ?? null,
        kind: row.kind ?? null,
        slug: row.slug,
        description: row.description_html ?? null,
        descriptionText: row.description_text ?? null,
        specs: row.specs == null ? Prisma.JsonNull : row.specs,
        mainCategory: category ? { connect: { id: category.id } } : undefined,
        otherCategories: row.other_categories?.length ? { connect: await Promise.all(row.other_categories.map(async (item) => {
          const found = await tx.category.findFirst({ where: { name: item.name }, select: { id: true } });
          if (!found) throw new Error(`Missing category ${item.name} for product ${row.slug}`);
          return { id: found.id };
        })) } : undefined,
        brand: brandId ? { connect: { id: brandId } } : undefined,
        isDigital: row.is_digital ?? false,
        price: decimal(row.price) ?? new Prisma.Decimal(0),
        compareAtPrice: decimal(row.compare_at_price) ?? null,
        specialOffer: row.special_offer ?? false,
        specialOfferEnd: row.special_offer_end ? new Date(row.special_offer_end) : null,
        available: stock?.purchasable ?? false,
        stock: stock?.quantity ?? 0,
        stockType: stockType(stock?.state),
        minOrderQuantity: stock?.min_order_quantity ?? null,
        maxOrderQuantity: stock?.max_order_quantity ?? null,
        guarantee: row.guarantee ?? null,
        productIdentifier: row.sku ?? null,
        barcode: row.barcode ?? null,
        batchSize: row.shipping?.batch_size ?? 1,
        showPrice: (row.price ?? 0) > 0,
        hasVariants: variants.length > 0,
        seoTitle: row.seo?.title ?? null,
        seoDescription: row.seo?.description ?? null,
        createdAt: row.created_at ? new Date(row.created_at) : undefined,
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
        tags: row.tags?.length ? { create: row.tags.map((value) => ({ value })) } : undefined,
        images: images.length ? { create: images.map((image, index) => ({
          url: (image.is_default ?? image.url === defaultImage) && mirrors[String(row.id)] ? mirrors[String(row.id)] : image.url,
          altText: image.alt ?? row.name,
          isDefault: image.is_default ?? image.url === defaultImage, order: image.order ?? index,
        })) } : undefined,
        variants: variants.length ? { create: variants.map((variant) => ({
          color: variant.options?.["رنگ"] ?? null,
          storage: variant.options?.["حافظه"] ?? null,
          options: variant.options == null ? Prisma.JsonNull : variant.options,
          guarantee: variant.guarantee ?? row.guarantee ?? null,
          price: decimal(variant.price) ?? new Prisma.Decimal(row.price ?? 0),
          compareAtPrice: decimal(variant.compare_at_price) ?? null,
          stock: variant.stock ?? 0, stockType: stockType(stock?.state),
          barcode: variant.barcode ?? undefined,
          productIdentifier: variant.sku ?? undefined,
          isDefault: variant.is_default ?? false,
        })) } : undefined,
      };
      await tx.product.create({ data });
      counts.productsCreated++;
    }
    await tx.catalogImportMetadata.upsert({
      where: { id: 1 },
      create: { id: 1, sourceGeneratedAt: source.meta?.generated_at ? new Date(source.meta.generated_at) : null },
      update: { sourceGeneratedAt: source.meta?.generated_at ? new Date(source.meta.generated_at) : null, importedAt: new Date() },
    });
  }, { timeout: 120_000 });

  console.log(JSON.stringify(counts));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Catalog import failed");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
