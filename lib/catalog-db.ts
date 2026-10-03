import { Prisma, StockType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { persianIncludes } from "@/lib/persian";

const productRelations = {
  brand: true,
  mainCategory: true,
  otherCategories: true,
  tags: true,
  images: { orderBy: [{ order: "asc" as const }, { id: "asc" as const }] },
  variants: { orderBy: [{ isDefault: "desc" as const }, { id: "asc" as const }], include: { image: true } },
} satisfies Prisma.ProductInclude;

type ProductRecord = Prisma.ProductGetPayload<{ include: typeof productRelations }>;

function asNumber(value: Prisma.Decimal | null | undefined): number | null {
  return value == null ? null : value.toNumber();
}

function stockLabel(value: StockType): string {
  return value.toLowerCase();
}

function serializeProduct(product: ProductRecord, includeVariants: boolean) {
  const defaultVariant = product.variants.find((variant) => variant.isDefault) ?? product.variants[0];
  const basePrice = asNumber(product.price) ?? 0;
  const price = basePrice > 0 ? basePrice : asNumber(defaultVariant?.price) ?? 0;
  const compareAt = asNumber(product.compareAtPrice);
  const images = product.images.map((image) => ({
    id: image.id,
    url: image.url,
    altText: image.altText ?? product.name,
    isDefault: image.isDefault,
    order: image.order,
  }));
  const variants = includeVariants ? product.variants.map((variant) => {
    const options = variant.options && typeof variant.options === "object" && !Array.isArray(variant.options)
      ? variant.options as Record<string, unknown>
      : {};
    const variantPrice = asNumber(variant.price) ?? price;
    const variantCompareAt = asNumber(variant.compareAtPrice);
    return {
      id: variant.id,
      color: variant.color ?? (typeof options["رنگ"] === "string" ? options["رنگ"] : null),
      storage: variant.storage ?? (typeof options["حافظه"] === "string" ? options["حافظه"] : null),
      options: Object.entries(options).filter((entry): entry is [string, string] => typeof entry[1] === "string").map(([label, value]) => ({ label, value })),
      guarantee: variant.guarantee ?? product.guarantee,
      price: variantPrice,
      compareAtPrice: variantCompareAt != null && variantCompareAt > variantPrice ? variantCompareAt : null,
      stock: variant.stock,
      stockType: stockLabel(variant.stockType),
      barcode: variant.barcode,
      productIdentifier: variant.productIdentifier,
      isDefault: variant.isDefault,
      imageUrl: variant.image?.url ?? null,
      unitPrice: variantPrice,
      matchedTier: null,
      quoted: { quantity: 1, paymentTerm: "CASH", role: "RETAIL", unitPrice: variantPrice, matchedTier: null },
    };
  }) : [];
  const specs = Array.isArray(product.specs) ? product.specs.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const row = item as Prisma.JsonObject;
    return typeof row.name === "string" && typeof row.value === "string" ? [{ name: row.name, value: row.value }] : [];
  }) : [];

  return {
    id: product.id,
    name: product.name,
    englishName: product.englishName,
    slug: product.slug,
    description: product.description,
    descriptionText: product.descriptionText,
    analysis: product.analysis,
    kind: product.kind,
    isDigital: product.isDigital,
    showPrice: product.showPrice,
    guarantee: product.guarantee,
    batchSize: product.batchSize,
    minOrderQuantity: product.minOrderQuantity,
    maxOrderQuantity: product.maxOrderQuantity,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    specialOffer: product.specialOffer,
    specialOfferEnd: product.specialOfferEnd?.toISOString() ?? null,
    available: product.available,
    stock: product.stock,
    stockType: stockLabel(product.stockType),
    brand: product.brand ? { id: product.brand.id, name: product.brand.name, slug: product.brand.slug } : null,
    mainCategory: product.mainCategory ? { id: product.mainCategory.id, name: product.mainCategory.name, slug: product.mainCategory.slug } : null,
    otherCategories: product.otherCategories.map((category) => ({ id: category.id, name: category.name, slug: category.slug })),
    tags: product.tags.map((tag) => tag.value),
    images,
    specs,
    basePrice: price,
    compareAtPrice: compareAt != null && compareAt > price ? compareAt : null,
    displayPrice: price,
    price,
    costPerItem: asNumber(product.costPerItem),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    variants,
  };
}

export type CatalogProduct = ReturnType<typeof serializeProduct>;

export type CatalogQuery = {
  q?: string;
  brandId?: number;
  categoryId?: number;
  categorySubtreeId?: number;
  stockType?: string;
  purchasableOnly?: boolean;
  specialOffer?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "special";
  includeVariants?: boolean;
  page: number;
  pageSize: number;
};

function prismaStockType(value: string): StockType | undefined {
  const match = Object.values(StockType).find((item) => stockLabel(item) === value);
  return match;
}

function productPrice(record: ProductRecord): number {
  const price = asNumber(record.price) ?? 0;
  if (price > 0) return price;
  const defaultVariant = record.variants.find((variant) => variant.isDefault) ?? record.variants[0];
  return asNumber(defaultVariant?.price) ?? 0;
}

export async function queryProducts(input: CatalogQuery) {
  const where: Prisma.ProductWhereInput = {};
  if (input.brandId != null) where.brandId = input.brandId;
  if (input.purchasableOnly) where.available = true;
  if (input.stockType) {
    const stock = prismaStockType(input.stockType);
    if (stock) where.stockType = stock;
  }
  if (input.specialOffer != null) where.specialOffer = input.specialOffer;
  if (input.categoryId != null) {
    where.OR = [
      { mainCategoryId: input.categoryId },
      { otherCategories: { some: { id: input.categoryId } } },
    ];
  }
  if (input.categorySubtreeId != null) {
    const ids = await descendantCategoryIds(input.categorySubtreeId);
    where.AND = [{ OR: [{ mainCategoryId: { in: [...ids] } }, { otherCategories: { some: { id: { in: [...ids] } } } }] }];
  }

  // Persian search normalization includes ZWNJ and Arabic/Persian letter folding;
  // fetch only the already-filtered catalog candidates, then apply that same rule.
  let records = await prisma.product.findMany({ where, include: productRelations });
  if (input.q) {
    records = records.filter((product) => [product.name, product.englishName, product.slug]
      .some((value) => value && persianIncludes(value, input.q!)));
  }
  if (input.minPrice != null || input.maxPrice != null) {
    records = records.filter((product) => {
      const price = productPrice(product);
      return price > 0 && (input.minPrice == null || price >= input.minPrice) && (input.maxPrice == null || price <= input.maxPrice);
    });
  }

  const compareRecency = (a: ProductRecord, b: ProductRecord) => b.updatedAt.getTime() - a.updatedAt.getTime();
  if (input.sort === "newest") records.sort(compareRecency);
  else if (input.sort === "special") records.sort((a, b) => Number(b.specialOffer) - Number(a.specialOffer) || compareRecency(a, b));
  else if (input.sort === "price-asc" || input.sort === "price-desc") {
    const direction = input.sort === "price-asc" ? 1 : -1;
    records.sort((a, b) => {
      const pa = productPrice(a), pb = productPrice(b);
      if (pa <= 0 && pb > 0) return 1;
      if (pb <= 0 && pa > 0) return -1;
      return (pa - pb) * direction;
    });
  } else {
    records.sort((a, b) => Number(b.available) - Number(a.available) || Number(b.specialOffer) - Number(a.specialOffer) || compareRecency(a, b));
  }

  const total = records.length;
  const start = Math.max(0, (input.page - 1) * input.pageSize);
  return { data: records.slice(start, start + input.pageSize).map((record) => serializeProduct(record, input.includeVariants ?? true)), total };
}

/** Provenance remains in PostgreSQL so the UI can state the source snapshot's age honestly. */
export async function catalogGeneratedAt(): Promise<string | null> {
  const row = await prisma.catalogImportMetadata.findUnique({ where: { id: 1 }, select: { sourceGeneratedAt: true } });
  return row?.sourceGeneratedAt?.toISOString() ?? null;
}

export async function findProductBySlug(slug: string) {
  const decoded = decodeURIComponent(slug);
  const product = await prisma.product.findUnique({ where: { slug: decoded }, include: productRelations });
  return product ? serializeProduct(product, true) : null;
}

export async function findProductSlugById(id: number) {
  return (await prisma.product.findUnique({ where: { id }, select: { slug: true } }))?.slug ?? null;
}

export async function countProductsByKind(): Promise<Record<string, number>> {
  const groups = await prisma.product.groupBy({ by: ["kind"], _count: { _all: true } });
  return Object.fromEntries(groups.map((group) => [group.kind ?? "(none)", group._count._all]));
}

export async function relatedProducts(productId: number, limit = 8): Promise<Array<{ product: CatalogProduct; reason: "same-brand" | "same-category" }>> {
  const source = await prisma.product.findUnique({ where: { id: productId }, select: { brandId: true, mainCategoryId: true, otherCategories: { select: { id: true } } } });
  if (!source) return [];
  const categoryIds = [source.mainCategoryId, ...source.otherCategories.map((category) => category.id)].filter((id): id is number => id != null);
  const records = await prisma.product.findMany({
    where: { id: { not: productId }, OR: [
      ...(source.brandId == null ? [] : [{ brandId: source.brandId }]),
      ...(categoryIds.length ? [{ mainCategoryId: { in: categoryIds } }, { otherCategories: { some: { id: { in: categoryIds } } } }] : []),
    ] }, include: productRelations,
  });
  const rank = (a: ProductRecord, b: ProductRecord) => Number(b.available) - Number(a.available) || Number(b.specialOffer) - Number(a.specialOffer) || b.updatedAt.getTime() - a.updatedAt.getTime();
  const sameBrand = records.filter((record) => source.brandId != null && record.brandId === source.brandId).sort(rank);
  const sameBrandIds = new Set(sameBrand.map((record) => record.id));
  const sameCategory = records.filter((record) => !sameBrandIds.has(record.id)).sort(rank);
  return [...sameBrand, ...sameCategory].map((record) => ({
    product: serializeProduct(record, false),
    reason: record.brandId != null && record.brandId === source.brandId ? "same-brand" as const : "same-category" as const,
  })).slice(0, limit);
}

export async function listBrands() {
  const rows = await prisma.brand.findMany({
    where: { products: { some: {} } },
    include: { _count: { select: { products: true } } },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  return rows.map((brand) => ({
    id: brand.id, name: brand.name, slug: brand.slug, imageUrl: brand.imageUrl,
    imageAlt: brand.imageAlt, iconUrl: brand.iconUrl, seoTitle: brand.seoTitle,
    seoDescription: brand.seoDescription, productCount: brand._count.products,
  }));
}

export async function descendantCategoryIds(id: number): Promise<Set<number>> {
  const categories = await prisma.category.findMany({ select: { id: true, parentId: true } });
  const children = new Map<number, number[]>();
  for (const category of categories) {
    if (category.parentId == null) continue;
    const siblings = children.get(category.parentId) ?? [];
    siblings.push(category.id);
    children.set(category.parentId, siblings);
  }
  const seen = new Set([id]);
  const queue = [id];
  while (queue.length) for (const child of children.get(queue.shift()!) ?? []) {
    if (!seen.has(child)) { seen.add(child); queue.push(child); }
  }
  return seen;
}

export async function categorySubtreeCounts(): Promise<Map<number, number>> {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ select: { id: true, parentId: true } }),
    prisma.product.findMany({ select: { mainCategoryId: true, otherCategories: { select: { id: true } } } }),
  ]);
  const children = new Map<number, number[]>();
  for (const category of categories) if (category.parentId != null) {
    const siblings = children.get(category.parentId) ?? [];
    siblings.push(category.id); children.set(category.parentId, siblings);
  }
  return new Map(categories.map((category) => {
    const ids = new Set([category.id]);
    const queue = [category.id];
    while (queue.length) for (const child of children.get(queue.shift()!) ?? []) if (!ids.has(child)) { ids.add(child); queue.push(child); }
    const count = products.filter((product) => (product.mainCategoryId != null && ids.has(product.mainCategoryId)) || product.otherCategories.some((item) => ids.has(item.id))).length;
    return [category.id, count];
  }));
}

export async function listCategories() {
  const rows = await prisma.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });
  return rows.map((category) => ({
    id: category.id, name: category.name, slug: category.slug, parentId: category.parentId,
    level: category.level, description: category.description, imageUrl: category.imageUrl,
    imageAlt: category.imageAlt, iconUrl: category.iconUrl,
  }));
}
