import { listBrands, listCategories, queryProducts } from "@/lib/catalog";
import { SHOP_PAGE_SIZE } from "@/lib/content/shop";
import { flattenTree, resolveFilter } from "@/lib/shop-filters";
import type { ShopBrand, ShopCategory, ShopMeta, ShopProduct } from "@/components/shop/types";

/**
 * The shop listing, resolved on the server from the catalog seam.
 *
 * Constitution III says browsing MUST NOT require an API round-trip, and until
 * this module existed it did: the page prerendered `Suspense fallback={null}` and
 * `ShopClient` fetched `/api/products`, `/api/categories` and `/api/brands` in the
 * browser, so the served document held zero products. That is also the boundary
 * where the price defect hid — the fetch was typed by an `apiGet<ProductDetail>`
 * cast onto a shape the seam had already changed (`research.md` D1/D2).
 *
 * Nothing here changes what the URL means. Every rule in
 * `contracts/shop-url.md` still holds — the keys, their AND semantics, the
 * unresolvable-slug refusal, page-reset behaviour. What moved is *who reads them*:
 * a server component now, instead of an effect after hydration.
 */

export type ShopView = {
  categories: ShopCategory[];
  brands: ShopBrand[];
  products: ShopProduct[];
  meta: ShopMeta;
  /** A slug in the URL that matches no record — rendered as an honest empty state. */
  unknownFilter: string | null;
  activeSort: string;
  tileSlugs: string[];
};

/** Next 15 hands `searchParams` to a page as a Promise of this record. */
type SearchParamsRecord = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined): string | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

const asInt = (value: string | null, min: number, max: number) => {
  if (value == null || value.trim() === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, Math.round(n)));
};

/** Roots first, so the tiles and the sidebar's category block keep today's order. */
function toCategoryTree(): ShopCategory[] {
  return listCategories().map((c) => ({ id: c.id, name: c.name, slug: c.slug, parentId: c.parentId }));
}

export function buildShopView(params: SearchParamsRecord): ShopView {
  const categories = toCategoryTree();
  const brands = listBrands().map((b) => ({ id: b.id, name: b.name, slug: b.slug }));

  const categorySlug = one(params.category);
  const brandSlug = one(params.brand);

  /*
   * An unrecognised slug must never degrade into "no filter". 004's destination
   * resolution fix established this, and `contracts/shop-url.md` rule 3 keeps it
   * binding: the refusal is computed here now, on the server, exactly where the
   * client used to compute it.
   */
  const categoryOutcome = resolveFilter(flattenTree(categories), categorySlug);
  const brandOutcome = resolveFilter(brands, brandSlug);
  const unknownFilter =
    categoryOutcome.status === "unknown" ? categoryOutcome.requested
    : brandOutcome.status === "unknown" ? brandOutcome.requested
    : null;

  if (unknownFilter !== null) {
    return {
      categories,
      brands,
      products: [],
      meta: { page: 1, pageSize: SHOP_PAGE_SIZE, total: 0, hasNextPage: false },
      unknownFilter,
      activeSort: one(params.sort) ?? "",
      tileSlugs: [],
    };
  }

  const page = asInt(one(params.page), 1, 10_000) ?? 1;
  const special = one(params.special);
  const sort = one(params.sort);

  const result = queryProducts({
    q: one(params.q) ?? undefined,
    categoryId: categoryOutcome.status === "resolved" ? categoryOutcome.item.id : undefined,
    brandId: brandOutcome.status === "resolved" ? brandOutcome.item.id : undefined,
    minPrice: asInt(one(params.min), 0, Number.MAX_SAFE_INTEGER) ?? undefined,
    maxPrice: asInt(one(params.max), 0, Number.MAX_SAFE_INTEGER) ?? undefined,
    stockType: one(params.stock) ?? undefined,
    specialOffer: special === "1" ? true : special === "0" ? false : undefined,
    sort: (sort as "newest" | "price-asc" | "price-desc" | "special") ?? undefined,
    // The listing renders name, price, image and stock; variants are the PDP's business.
    includeVariants: false,
    page,
    pageSize: SHOP_PAGE_SIZE,
  });

  return {
    categories,
    brands,
    products: result.data as ShopProduct[],
    meta: {
      page,
      pageSize: SHOP_PAGE_SIZE,
      total: result.total,
      hasNextPage: page * SHOP_PAGE_SIZE < result.total,
    },
    unknownFilter: null,
    activeSort: sort ?? "",
    tileSlugs: [],
  };
}
