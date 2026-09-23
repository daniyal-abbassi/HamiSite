import catalogJson from "@/data/hami-products.json";
import mirroredImages from "@/data/catalog-images.json";
import { persianIncludes } from "@/lib/persian";

/**
 * The catalogue, read from a JSON export of the live shop instead of the
 * database.
 *
 * `data/hami-products.json` is a full dump of hamihamrah-shop.com — 189
 * products, 39 brands, 32 categories, 1570 image URLs, taken from the Mixin
 * platform API. It is the real inventory, with the shop's own photography.
 *
 * **Why this exists:** the dev database was emptied by a test run (`npm test`
 * resolves `.env.test`, which does not exist, so the suite ran against the dev
 * schema and left one row behind). Rather than restore it, the storefront now
 * reads the export. That also removes the site's dependency on a running
 * Postgres for anything the shopper can see.
 *
 * **The contract is deliberately unchanged.** Everything here maps the export
 * onto the exact response shape `/api/products` already returned from Prisma,
 * so every consumer — the home grids, the shop grid, the product page — keeps
 * working without edits. If a field looks redundant, it is there because the
 * old serializer emitted it.
 *
 * **What this does NOT cover:** carts, orders, auth and the whole admin still
 * read and write Prisma. Product ids here come from the export and are very
 * unlikely to match rows in the database, so add-to-cart and checkout should be
 * treated as unverified until someone signs in and tries them — the cart route
 * rejects on authentication before it ever reaches a product lookup, so this
 * has not actually been exercised. Browsing is what this makes work.
 */

/* ------------------------------------------------------------------ types */

type RawImage = { id: number; url: string; alt?: string | null; is_default?: boolean; order?: number };
type RawVariant = {
  id: number;
  is_default?: boolean;
  price?: number | null;
  compare_at_price?: number | null;
  stock?: number | null;
  barcode?: string | null;
  sku?: string | null;
  image_url?: string | null;
  options?: Record<string, string> | null;
};
type RawProduct = {
  id: number;
  slug: string;
  name: string;
  english_name?: string | null;
  kind?: string | null;
  brand?: { id: number; name: string } | null;
  category?: { id: number; name: string } | null;
  other_categories?: Array<{ id: number; name: string }> | null;
  tags?: string[] | null;
  price?: number | null;
  compare_at_price?: number | null;
  special_offer?: boolean;
  special_offer_end?: string | null;
  stock?: { state?: string; available?: boolean; purchasable?: boolean; quantity?: number | null } | null;
  primary_image?: string | null;
  images?: RawImage[] | null;
  has_variants?: boolean;
  variants?: RawVariant[] | null;
  specs?: Array<{ name: string; value: string }> | null;
  description_html?: string | null;
  description_text?: string | null;
  updated_at?: string | null;
};
type RawCatalog = {
  categories: Array<{ id: number; name: string; slug: string; parent_id: number | null; level?: number }>;
  brands: Array<{ id: number; name: string; product_count?: number }>;
  products: RawProduct[];
};

const raw = catalogJson as unknown as RawCatalog;

/* -------------------------------------------------------------- utilities */

/**
 * Persian slugs in the export contain spaces and non-URL characters. The export
 * already ships a usable slug per product; this only normalises brands and
 * categories, which have none.
 */
function slugify(input: string): string {
  return input
    .trim()
    .replace(/\s*\|\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .toLowerCase();
}

/**
 * The export's stock vocabulary is already the API's, with one gap: it never
 * emits `unlimited`. Anything unrecognised falls back to `call` rather than to
 * a guess about availability — telling a shopper to ring the shop is safe;
 * telling them something is in stock when it is not is not.
 */
function stockTypeOf(p: RawProduct): "unlimited" | "limited" | "out_of_stock" | "call" {
  const s = p.stock?.state;
  if (s === "limited" || s === "out_of_stock" || s === "call" || s === "unlimited") return s;
  return "call";
}

function priceOf(p: RawProduct): number {
  const direct = p.price ?? 0;
  if (direct > 0) return direct;
  // Some rows carry the price only on the default variant.
  const v = p.variants?.find((x) => x.is_default) ?? p.variants?.[0];
  return v?.price ?? 0;
}

function compareAtOf(p: RawProduct): number | null {
  const c = p.compare_at_price ?? null;
  const price = priceOf(p);
  // A compare-at that is not actually higher is not a discount; drop it rather
  // than render a struck price identical to the real one.
  return c != null && c > price ? c : null;
}

/* ------------------------------------------------------------- serializer */

export type CatalogProduct = ReturnType<typeof serializeProduct>;

/**
 * Locally mirrored photography, keyed by product id — see
 * `scripts/mirror-catalog-images.py`.
 *
 * The export points at the live shop, which measured 5.8-7.5s per image from
 * here. next/image gives an upstream fetch seven seconds, so the optimizer
 * returned 500 roughly as often as it succeeded, and even a success meant a
 * six-second wait for a product photo. The mirror is served from `public/`
 * instead; the remote URL stays as the fallback for anything not yet pulled.
 */
const mirror = mirroredImages as Record<string, string>;

function serializeProduct(p: RawProduct, includeVariants: boolean) {
  const local = mirror[String(p.id)] ?? null;

  const images = (p.images ?? []).map((img, i) => ({
    id: img.id ?? i,
    // Only the primary image is mirrored; the gallery keeps its origin URLs.
    url: local && (img.is_default ?? i === 0) ? local : img.url,
    altText: img.alt ?? p.name,
    isDefault: img.is_default ?? i === 0,
    order: img.order ?? i,
  }));
  if (images.length === 0 && (local || p.primary_image)) {
    images.push({
      id: 0,
      url: local ?? p.primary_image!,
      altText: p.name,
      isDefault: true,
      order: 0,
    });
  }
  // The mirrored file is the one the card renders, so make sure it is first.
  if (local && images.length > 0 && images[0].url !== local) {
    const i = images.findIndex((img) => img.url === local);
    if (i > 0) images.unshift(...images.splice(i, 1));
  }

  const price = priceOf(p);
  const variants = includeVariants
    ? (p.variants ?? []).map((v) => ({
        id: v.id,
        color: v.options?.["رنگ"] ?? null,
        /*
         * The export has no «حافظه» key on any of its 311 variants — the option
         * vocabulary is `رنگ` for 293 of them and `دامنه`/`سرور`/`نوع` for the 18
         * records under «اپل آیدی». So a capacity chosen from a name that does not
         * exist is why FR-033's storage selector never appeared, while product 347
         * had 18 real options and no way to pick any of them. `options` below is
         * the honest generalisation: whatever keys a product actually uses.
         */
        storage: v.options?.["حافظه"] ?? null,
        options: Object.entries(v.options ?? {}).map(([label, value]) => ({ label, value })),
        guarantee: null,
        price: v.price ?? price,
        // Same rule as `compareAtOf` above, applied per variant: 40 of the 311
        // variants carry a compare-at equal to or below their own price, and a
        // strike that is not a saving is a false discount (FR-004).
        compareAtPrice:
          v.compare_at_price != null && v.compare_at_price > (v.price ?? price) ? v.compare_at_price : null,
        stock: v.stock ?? 0,
        stockType: stockTypeOf(p),
        barcode: v.barcode ?? null,
        productIdentifier: v.sku ?? null,
        isDefault: v.is_default ?? false,
        imageUrl: v.image_url ?? null,
        // The export has no B2B tiers, so every quote is the plain unit price.
        quoted: {
          quantity: 1,
          paymentTerm: "CASH",
          role: "RETAIL",
          unitPrice: v.price ?? price,
          matchedTier: null,
        },
      }))
    : [];

  return {
    id: p.id,
    name: p.name,
    englishName: p.english_name ?? null,
    slug: p.slug,
    description: p.description_html ?? null,
    descriptionText: p.description_text ?? null,
    kind: p.kind ?? null,
    specialOffer: Boolean(p.special_offer),
    specialOfferEnd: p.special_offer_end ?? null,
    available: p.stock?.purchasable ?? false,
    stockType: stockTypeOf(p),
    brand: p.brand ? { id: p.brand.id, name: p.brand.name, slug: slugify(p.brand.name) } : null,
    mainCategory: p.category
      ? { id: p.category.id, name: p.category.name, slug: slugify(p.category.name) }
      : null,
    otherCategories: (p.other_categories ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: slugify(c.name),
    })),
    tags: p.tags ?? [],
    images,
    specs: p.specs ?? [],
    basePrice: price,
    compareAtPrice: compareAtOf(p),
    displayPrice: price,
    variants,
  };
}

/* ----------------------------------------------------------------- queries */

export type CatalogQuery = {
  q?: string;
  brandId?: number;
  categoryId?: number;
  /**
   * Everything filed under this category **or any category below it**, by
   * `parent_id`. `categoryId` above is exact, and exact is what the shop's own
   * filter has always meant, so it stays. This exists because the export files
   * phones under brand-shaped children of «موبایل و تبلت» — thirty under
   * «شیائومی | XIAOMI», forty-five under «آیفون استوک» — and none under the
   * parent itself, which is why three of the eight sidebar doors led to an empty
   * listing (FR-028's "28 empty doors"). A destination should show what is under
   * it; a filter should mean exactly what it says.
   */
  categorySubtreeId?: number;
  stockType?: string;
  /**
   * FR-022's missing question: "what can I actually buy today". `stockType`
   * describes the shelf («موجود محدود» is a shelf state, and 16 records in it are
   * not sellable at all); this reads the merchant's `purchasable` flag.
   */
  purchasableOnly?: boolean;
  specialOffer?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "special";
  includeVariants?: boolean;
  page: number;
  pageSize: number;
};

export function queryProducts(input: CatalogQuery) {
  let items = raw.products;

  // Availability is deliberately NOT a default filter. 162 of the 189 products
  // in the export are out of stock, so filtering on it would leave a storefront
  // showing twenty-seven items. The live shop lists them all and lets the stock
  // badge say what is what; this matches that.
  if (input.q) {
    // Folded on both sides — see lib/persian.ts. The stored form of a name is
    // Persian typed on a Persian keyboard; the typed query arrives with ZWNJ
    // missing, digits in either shape, and ي/ك instead of ی/ک often enough that
    // a plain substring match was quietly returning nothing.
    items = items.filter((p) =>
      [p.name, p.english_name, p.slug].some((f) => f && persianIncludes(f, input.q!)),
    );
  }
  if (input.brandId != null) items = items.filter((p) => p.brand?.id === input.brandId);
  if (input.purchasableOnly) items = items.filter((p) => p.stock?.purchasable === true);
  if (input.categorySubtreeId != null) {
    const ids = descendantCategoryIds(input.categorySubtreeId);
    items = items.filter(
      (p) =>
        (p.category?.id != null && ids.has(p.category.id)) ||
        (p.other_categories ?? []).some((c) => ids.has(c.id)),
    );
  }
  if (input.categoryId != null) {
    items = items.filter(
      (p) =>
        p.category?.id === input.categoryId ||
        (p.other_categories ?? []).some((c) => c.id === input.categoryId),
    );
  }
  if (input.stockType) items = items.filter((p) => stockTypeOf(p) === input.stockType);
  if (input.specialOffer != null) items = items.filter((p) => Boolean(p.special_offer) === input.specialOffer);
  /*
   * A price bound applies to priced records only. `priceOf()` returns 0 for the
   * five call-for-price rows, so the old pair of filters made those five vanish
   * under any minimum and appear as the cheapest goods under any maximum — both
   * wrong, one of them reading as «free phones». Excluding them is the stated
   * semantic; see `contracts/shop-url.md` rule 4.
   */
  if (input.minPrice != null || input.maxPrice != null) {
    items = items.filter((p) => priceOf(p) > 0);
    if (input.minPrice != null) items = items.filter((p) => priceOf(p) >= input.minPrice!);
    if (input.maxPrice != null) items = items.filter((p) => priceOf(p) <= input.maxPrice!);
  }

  const sorted = [...items];
  if (input.sort === "newest") {
    /*
     * FR-024 asked for a newest ordering and none existed: `newest` fell through
     * to the default block and returned the same list as no sort at all, while the
     * select still offered it and the homepage labelled a section «تازه‌ها».
     * `updated_at` is the only recency signal the export carries.
     */
    sorted.sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""));
  } else if (input.sort === "special") {
    // Offers first, then recency within them — see the same gap above.
    sorted.sort((a, b) => {
      const offer = Number(Boolean(b.special_offer)) - Number(Boolean(a.special_offer));
      if (offer !== 0) return offer;
      return (b.updated_at ?? "").localeCompare(a.updated_at ?? "");
    });
  }
  else if (input.sort === "price-asc" || input.sort === "price-desc") {
    // A price of 0 means "ring the shop", not "free". Sorting it as the cheapest
    // put five call-for-price rows at the head of the cheapest-first list, which
    // reads as a catalogue of free phones. They sort to the end of either
    // direction instead.
    const dir = input.sort === "price-asc" ? 1 : -1;
    sorted.sort((a, b) => {
      const pa = priceOf(a);
      const pb = priceOf(b);
      if (pa <= 0 && pb <= 0) return 0;
      if (pa <= 0) return 1;
      if (pb <= 0) return -1;
      return (pa - pb) * dir;
    });
  }
  else {
    // Default: buyable first, then offers, then most recently updated.
    //
    // The old Prisma order led with offers and recency alone. Against this
    // export that produced a shop front where all six featured cards read
    // «ناموجود» — accurate, since 162 of the 189 products are out of stock, and
    // terrible merchandising. Nothing is hidden; the unavailable items simply
    // sort after the ones a shopper can actually buy.
    const buyable = (x: RawProduct) => (x.stock?.purchasable ? 1 : 0);
    sorted.sort((a, b) => {
      const stock = buyable(b) - buyable(a);
      if (stock !== 0) return stock;
      const offer = Number(Boolean(b.special_offer)) - Number(Boolean(a.special_offer));
      if (offer !== 0) return offer;
      return (b.updated_at ?? "").localeCompare(a.updated_at ?? "");
    });
  }

  const total = sorted.length;
  const start = (input.page - 1) * input.pageSize;
  const page = sorted.slice(start, start + input.pageSize);

  return {
    data: page.map((p) => serializeProduct(p, input.includeVariants ?? true)),
    total,
  };
}

/**
 * The export's own provenance — `generated_at` in `data/hami-products.json`.
 *
 * FR-055 requires the currency of a displayed price or stock figure to be
 * discoverable: this snapshot is dated 2026-09-09 and the owner has confirmed the
 * availability figures in it are stale, so a shopper must not be left to assume a
 * number of unstated age is current. The seam is the only place that knows the
 * date, so the date leaves the file only through here.
 */
export function catalogGeneratedAt(): string | null {
  const meta = (catalogJson as { meta?: { generated_at?: unknown } }).meta;
  const value = meta?.generated_at;
  return typeof value === "string" ? value : null;
}

export function findProductBySlug(slug: string) {
  const decoded = decodeURIComponent(slug);
  const p =
    raw.products.find((x) => x.slug === decoded) ??
    raw.products.find((x) => x.slug === slug) ??
    // Slugs travel through URLs and sometimes come back with the Persian
    // characters percent-encoded differently; fall back to a loose match.
    raw.products.find((x) => slugify(x.slug) === slugify(decoded));
  return p ? serializeProduct(p, true) : null;
}

/**
 * How many products carry each `kind`, counted from the export on every call.
 *
 * This exists so `lib/category-departments.ts` can decide whether a panel's route
 * is the whole department without storing a snapshot of what the department
 * contained on 2026-09-09. FR-053 forbids embedding "the current counts, ratios,
 * or thresholds of this snapshot" in a display rule, and a literal count is exactly
 * that — it silently becomes wrong for the next export rather than loudly.
 */
export function countProductsByKind(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of raw.products) {
    const kind = p.kind ?? "(none)";
    counts[kind] = (counts[kind] ?? 0) + 1;
  }
  return counts;
}

/**
 * Products genuinely related to one record, with the reason each was picked.
 *
 * FR-035 forbids "an arbitrary sample of the catalog presented as a recommendation",
 * so the predicate is explicit and narrow: **same brand**, then **same main or
 * secondary category** to fill out, never a recency or popularity feed dressed up as
 * taste. There is no co-purchase, view or rating data anywhere in the export, which
 * is why nothing here may say «پرطرفدارترین» or «پیشنهاد ما».
 *
 * Ordering inside each tier is not random either: obtainable first, then offers, then
 * recency — the same rule the default listing uses, so a related rail can never show
 * more of the shop than the shop itself would.
 */
export function relatedProducts(productId: number, limit = 8): Array<{ product: CatalogProduct; reason: "same-brand" | "same-category" }> {
  const source = raw.products.find((p) => p.id === productId);
  if (!source) return [];

  const sameBrand = raw.products.filter(
    (p) => p.id !== productId && source.brand?.id != null && p.brand?.id === source.brand.id,
  );
  const sourceCategories = new Set<number>(
    [source.category?.id, ...(source.other_categories ?? []).map((c) => c.id)].filter((x): x is number => x != null),
  );
  const sameCategory = raw.products.filter(
    (p) =>
      p.id !== productId &&
      !sameBrand.includes(p) &&
      [p.category?.id, ...(p.other_categories ?? []).map((c) => c.id)].some((id) => id != null && sourceCategories.has(id)),
  );

  const rank = (a: (typeof raw.products)[number], b: (typeof raw.products)[number]) => {
    const buyable = Number(Boolean(b.stock?.purchasable)) - Number(Boolean(a.stock?.purchasable));
    if (buyable !== 0) return buyable;
    const offer = Number(Boolean(b.special_offer)) - Number(Boolean(a.special_offer));
    if (offer !== 0) return offer;
    return (b.updated_at ?? "").localeCompare(a.updated_at ?? "");
  };

  return [
    ...[...sameBrand].sort(rank).map((p) => ({ product: serializeProduct(p, false), reason: "same-brand" as const })),
    ...[...sameCategory].sort(rank).map((p) => ({ product: serializeProduct(p, false), reason: "same-category" as const })),
  ].slice(0, limit);
}

export function listBrands() {
  return raw.brands
    .filter((b) => (b.product_count ?? 0) > 0)
    .map((b) => ({ id: b.id, name: b.name, slug: slugify(b.name), productCount: b.product_count ?? 0 }));
}

/** Every category id at or below `id`, following `parent_id` (not `level`, which the export mislabels). */
export function descendantCategoryIds(id: number): Set<number> {
  const children = new Map<number, number[]>();
  for (const c of raw.categories) {
    if (c.parent_id == null) continue;
    const list = children.get(c.parent_id) ?? [];
    list.push(c.id);
    children.set(c.parent_id, list);
  }
  const seen = new Set<number>([id]);
  const queue = [id];
  while (queue.length) {
    for (const child of children.get(queue.shift()!) ?? []) {
      if (!seen.has(child)) {
        seen.add(child);
        queue.push(child);
      }
    }
  }
  return seen;
}

/**
 * Products reachable per category, counting its subtree — the number a doorway
 * must show, since a shopper pressing «موبایل و تبلت» expects what is under it.
 */
export function categorySubtreeCounts(): Map<number, number> {
  const out = new Map<number, number>();
  for (const c of raw.categories) {
    const ids = descendantCategoryIds(c.id);
    out.set(
      c.id,
      raw.products.filter(
        (p) => (p.category?.id != null && ids.has(p.category.id)) || (p.other_categories ?? []).some((x) => ids.has(x.id)),
      ).length,
    );
  }
  return out;
}

export function listCategories() {
  return raw.categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parent_id,
    level: c.level ?? 0,
  }));
}
