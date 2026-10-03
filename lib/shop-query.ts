import { categorySubtreeCounts, listBrands, listCategories, queryProducts } from "@/lib/catalog";
import { categoryDepartments } from "@/lib/category-departments";
import { resolveSortKey, SHOP_PAGE_SIZE, stockLabels } from "@/lib/content/shop";
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

export type CategoryFacet = { slug: string; label: string; count: number; showsCount: boolean };

export type ShopView = {
  categories: ShopCategory[];
  /**
   * The department list the category facet shows, from `lib/category-departments.ts` —
   * the same nine kinds the homepage carousel and the shop's tile row use (T056). The
   * facet used to be the export's top-level categories, which offered «موبایل» (8) beside
   * «موبایل و تبلت» (135) as two departments and «ارسال رایگان ویژه» — a promotion — as a
   * category. `categories` stays, because a deep link can still name any node in the tree.
   */
  categoryFacets: CategoryFacet[];
  brands: ShopBrand[];
  products: ShopProduct[];
  meta: ShopMeta;
  /** A slug in the URL that matches no record — rendered as an honest empty state. */
  unknownFilter: string | null;
  activeSort: string;
  /**
   * The filters currently applied, already labelled. FR-026 requires them visible
   * and removable *outside* the filter panel, and on a phone the panel is a closed
   * sheet — so the labels have to be resolved where the slugs are, on the server,
   * rather than looked up again by a client that has neither list to hand.
   */
  activeFilters: ActiveFilter[];
};

export type ActiveFilter = {
  /** The query-string key to delete to lift this filter. */
  key: string;
  label: string;
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
function toCategoryTree(): Omit<ShopCategory, "productCount">[] {
  return listCategories().map((c) => ({ id: c.id, name: c.name, slug: c.slug, parentId: c.parentId }));
}

/** Category products including everything filed below them, by category id. */
export function subtreeCounts() {
  return categorySubtreeCounts();
}

export function buildShopView(params: SearchParamsRecord): ShopView {
  const counts = categorySubtreeCounts();
  const categories: ShopCategory[] = toCategoryTree().map((c) => ({ ...c, productCount: counts.get(c.id) ?? 0 }));
  const brands = listBrands().map((b) => ({ id: b.id, name: b.name, slug: b.slug, productCount: b.productCount }));
  const categoryFacets: CategoryFacet[] = categoryDepartments().map((d) => ({
    slug: d.slug,
    label: d.label,
    count: d.reachableCount,
    showsCount: d.showsCount,
  }));

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
      categoryFacets,
      brands,
      products: [],
      meta: { page: 1, pageSize: SHOP_PAGE_SIZE, total: 0, hasNextPage: false },
      unknownFilter,
      activeSort: one(params.sort) ?? "",
      activeFilters: [{ key: categoryOutcome.status === "unknown" ? "category" : "brand", label: unknownFilter }],
    };
  }

  const page = asInt(one(params.page), 1, 10_000) ?? 1;
  const special = one(params.special);
  const sort = one(params.sort);

  const result = queryProducts({
    q: one(params.q) ?? undefined,
    /*
     * Subtree, not exact, and that is a band-2 change of mind worth recording: the
     * facet list shows each root's **subtree** count next to its name, because that
     * is the number the dedicated page for the same category reports. An exact filter
     * beside a subtree number is a label of 135 that returns nothing — `موبایل و تبلت`
     * holds zero records directly. The control is single-select, so the double
     * counting that made an exact facet tempting cannot happen anyway.
     */
    categorySubtreeId: categoryOutcome.status === "resolved" ? categoryOutcome.item.id : undefined,
    brandId: brandOutcome.status === "resolved" ? brandOutcome.item.id : undefined,
    minPrice: asInt(one(params.min), 0, Number.MAX_SAFE_INTEGER) ?? undefined,
    maxPrice: asInt(one(params.max), 0, Number.MAX_SAFE_INTEGER) ?? undefined,
    // `purchasable` is obtainability (the merchant's flag); the rest are shelf states.
    purchasableOnly: one(params.stock) === "purchasable" ? true : undefined,
    stockType: one(params.stock) && one(params.stock) !== "purchasable" ? one(params.stock)! : undefined,
    specialOffer: special === "1" ? true : special === "0" ? false : undefined,
    sort: resolveSortKey(sort) || undefined,
    // The listing renders name, price, image and stock; variants are the PDP's business.
    includeVariants: false,
    page,
    pageSize: SHOP_PAGE_SIZE,
  });

  return {
    categories,
    categoryFacets,
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
    activeFilters: describeActiveFilters(params, categoryOutcome, brandOutcome),
  };
}

/**
 * Which filters are on, in words. Every key the URL can carry is handled here so a
 * shopper can see and lift whatever is narrowing the list — including the ones the
 * panel no longer has to be opened to reveal.
 */
function describeActiveFilters(
  params: SearchParamsRecord,
  categoryOutcome: ReturnType<typeof resolveFilter>,
  brandOutcome: ReturnType<typeof resolveFilter>,
): ActiveFilter[] {
  const out: ActiveFilter[] = [];
  if (brandOutcome.status === "resolved") out.push({ key: "brand", label: brandOutcome.item.name });
  if (categoryOutcome.status === "resolved") out.push({ key: "category", label: categoryOutcome.item.name });
  const q = one(params.q);
  if (q) out.push({ key: "q", label: `«${q}»` });
  const stock = one(params.stock);
  if (stock === "purchasable") out.push({ key: "stock", label: "قابل خرید" });
  else if (stock && stockLabels[stock]) out.push({ key: "stock", label: stockLabels[stock] });
  if (one(params.special) === "1") out.push({ key: "special", label: "پیشنهاد ویژه" });
  /*
   * One chip per bound, each lifting only its own. A single "۵۰ تا ۵۰۰" chip would
   * have to decide which key its ✕ clears, and either answer leaves the other bound
   * quietly applied — the failure mode FR-026 exists to prevent.
   */
  const amount = (value: string) => `${Number(value).toLocaleString("fa-IR")} تومان`;
  const min = one(params.min);
  const max = one(params.max);
  if (min) out.push({ key: "min", label: `از ${amount(min)}` });
  if (max) out.push({ key: "max", label: `تا ${amount(max)}` });
  return out.filter((f) => f.label);
}
