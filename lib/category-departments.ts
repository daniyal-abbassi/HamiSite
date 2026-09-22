/**
 * The homepage's departments — feature 005's category set.
 *
 * Nine, one per populated product **kind**, each routed to the one real category whose products are
 * entirely of that kind.
 *
 * Why kinds and not the category tree: measured against the export, 11 of 32 categories hold no products
 * at all — including seven of the fourteen top-level ones (`موبایل-و-تبلت`, `لوازم-جانبی`, `گوشی-موبایل`,
 * `کالای-دیجیتال`), which are precisely the labels a shopper would expect to tap. The tree also fuses the
 * brand axis into the type axis, so `سامسونگ-samsung` and `هدفون` sit as siblings, and it carries
 * near-duplicate labels meaning the same thing. The kind axis is the only taxonomy in this data that is
 * simultaneously fully populated, brand-free and duplicate-free: nine values, all populated, covering all
 * 189 products. That is FR-001's resolved answer — eligibility defined by what actually has products — read
 * literally.
 *
 * Why the route is a category and not a kind: `?category=<slug>` is what the existing listing already
 * accepts (`components/shop/ShopClient.tsx:70`), so this surface adds no destination type. A `?kind=`
 * route would need a new filter on `CatalogQuery` plus an API passthrough, and it is the better answer —
 * it is the only thing that would let the phones panel reach 134 products instead of 8. It was left alone
 * because the owner accepted the 8-product phones route for feature 004's equivalent tile on 2026-09-22,
 * and reopening the catalog seam for a homepage tile is a bigger decision than this file should smuggle in.
 *
 * The routes below are hand-authored on purpose, in the same shape as `categoryLinks` in
 * `lib/content/home.ts`, and `tests/unit/category-departments.test.ts` re-derives every number from the
 * export on each run. A hand-written Latin slug here resolves to nothing and, until feature 004 fixed it,
 * did so silently — which is why the guard is the acceptance test rather than a comment.
 */

import { listCategories, queryProducts } from "@/lib/catalog";

export type DepartmentKind =
  | "phone"
  | "audio"
  | "charger"
  | "smartwatch"
  | "powerbank"
  | "computer_accessory"
  | "sim_card"
  | "car_charger"
  | "service";

/**
 * `label` is the name a shopper recognises, which is deliberately not always the stored category name:
 * the export writes `تجهیزات کامپیوتر و لبتاب`, misspelling لپ‌تاپ, and FR-006 forbids propagating an
 * internal label. `slug` is the stored one and must be read from the export, never retyped elsewhere.
 *
 * `kindTotal` is the number of products of this kind in the export. It is declared here and re-derived by
 * `tests/unit/category-departments.test.ts` on every run, so that `showsCount` can be *computed* from the
 * equality `reachableCount === kindTotal` instead of being asserted per row by whoever edits this file.
 * The alternative was a hand-maintained boolean, which is exactly how a panel ends up promising 134 phones
 * and delivering 8.
 */
const DEPARTMENT_SEED: ReadonlyArray<{
  kind: DepartmentKind;
  label: string;
  slug: string;
  badge: string | null;
  kindTotal: number;
}> = [
  { kind: "phone", label: "گوشی موبایل", slug: "موبایل", badge: "/brand/categories/mobile.svg", kindTotal: 134 },
  { kind: "audio", label: "هدفون و ایرپاد", slug: "هدفون-ایرپاد-و-هندزفری", badge: "/brand/categories/audio.svg", kindTotal: 19 },
  { kind: "charger", label: "شارژر و کابل", slug: "آداپتور-کابل-و-شارژر", badge: "/brand/categories/charger.svg", kindTotal: 10 },
  { kind: "smartwatch", label: "ساعت هوشمند", slug: "ساعت-و-مچ-بند-هوشمند", badge: "/brand/categories/smartwatch.svg", kindTotal: 7 },
  { kind: "powerbank", label: "پاوربانک", slug: "پاور-بانک", badge: "/brand/categories/power-bank.svg", kindTotal: 7 },
  { kind: "computer_accessory", label: "لوازم کامپیوتر", slug: "تجهیزات-کامپیوتر-و-لبتاب", badge: "/brand/categories/computer-accessory.svg", kindTotal: 5 },
  { kind: "sim_card", label: "سیم‌کارت", slug: "سیمکارت", badge: "/brand/categories/sim-card.svg", kindTotal: 3 },
  { kind: "car_charger", label: "شارژر فندکی", slug: "شارژر-فندکی", badge: "/brand/categories/car-charger.svg", kindTotal: 3 },
  { kind: "service", label: "خدمات آنلاین", slug: "خدمات-آنلاین", badge: "/brand/categories/online-services.svg", kindTotal: 1 },
];

export type Department = {
  kind: DepartmentKind;
  label: string;
  slug: string;
  /** Resolved through the seam, never authored. */
  categoryId: number;
  href: string;
  badge: string | null;
  /**
   * What the destination actually holds. This is the only number the panel may display, and it displays it
   * only when it is the whole department — see `showsCount`.
   */
  reachableCount: number;
  /** Products of this kind in the export. Re-derived by test; see `DEPARTMENT_SEED`. */
  kindTotal: number;
  /**
   * False wherever the route is a subset of the kind. FR-005: a panel "MUST NOT imply breadth it does not
   * have", and it must not understate it with a confident small number either. Three routes are short —
   * phones by 126, chargers and power banks by one each — so none of the three shows a count. Computed
   * rather than declared so a fourth shortfall cannot silently appear.
   */
  showsCount: boolean;
};

/**
 * Categories whose name is a brand rather than a department. `آیفون-استوک` holds 45 phones and is the
 * single best route for the `phone` kind on a pure product-count basis, which is exactly why it must be
 * excluded: FR-004 forbids brand panels, and a "phones" doorway landing on refurbished iPhones would be
 * both a category error and a misrepresentation.
 *
 * It is on this list explicitly because matching category names against `data.brands` names does not catch
 * it — "آیفون" is not one of the 39 brand names. The converse trap is `تجهیزات-کامپیوتر-و-لبتاب`, which
 * legitimately has one brand and is not a brand category, so "spans only one brand" is not a usable
 * discriminator either. Hence a named deny list, asserted by test.
 */
export const BRAND_SHAPED_CATEGORY_SLUGS: readonly string[] = ["آیفون-استوک"];

export function categoryDepartments(): Department[] {
  const categories = listCategories();

  return DEPARTMENT_SEED.map((seed) => {
    const category = categories.find((c) => c.slug === seed.slug);
    if (!category) {
      // Loud, never lenient: a mistyped slug used to render the entire unfiltered catalogue and look
      // healthy. Feature 004's destination-resolution fix is the precedent for throwing here instead.
      throw new Error(
        `categoryDepartments: slug "${seed.slug}" (kind "${seed.kind}") does not resolve to a category in the export`,
      );
    }

    const { total } = queryProducts({ categoryId: category.id, page: 1, pageSize: 1 });
    if (total < 1) {
      throw new Error(
        `categoryDepartments: "${seed.slug}" resolves but holds no products — FR-002 forbids an empty doorway`,
      );
    }

    return {
      kind: seed.kind,
      label: seed.label,
      slug: seed.slug,
      categoryId: category.id,
      href: `/shop?category=${encodeURIComponent(seed.slug)}`,
      badge: seed.badge,
      reachableCount: total,
      kindTotal: seed.kindTotal,
      showsCount: total === seed.kindTotal,
    };
  });
}

/** Total departments, for FR-007 / FR-030's "how many are there" obligation. */
export const DEPARTMENT_TOTAL = DEPARTMENT_SEED.length;
