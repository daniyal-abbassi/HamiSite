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

import { categorySubtreeCounts, countProductsByKind, listCategories } from "@/lib/catalog-db";
import { RHYTHM, type Tier, type TierBreakpoint } from "@/lib/category-masonry";

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
 * No counts live in this table. The size of a department is measured from the
 * export at request time by `countProductsByKind()`, because a hand-typed number
 * here is a snapshot of 2026-09-09 wearing a display rule — see `kindTotal` on
 * `Department` and FR-053.
 *
 * `label` is the name a shopper recognises, which is deliberately not always the stored category name:
 * the export writes `تجهیزات کامپیوتر و لبتاب`, misspelling لپ‌تاپ, and FR-006 forbids propagating an
 * internal label. `slug` is the stored one and must be read from the export, never retyped elsewhere.
 *
 * `showsCount` is still computed from `reachableCount === kindTotal`, and the test still
 * re-derives both from the export, so a panel cannot promise 134 phones and deliver 8 —
 * it just no longer needs anyone to remember to update a number.
 */
/*
 * `image` is authored here for the same reason `slug` is: a hand-typed filename has the same failure mode that
 * made hand-written Latin slugs silently 404 in feature 004, so `tests/unit/category-departments.test.ts` asserts
 * every path resolves on disk rather than trusting this table. All nine panels are 3:4 and live in
 * `public/images/categories/v3/`.
 *
 * `rhythm` is deliberately NOT restated in this table. `RHYTHM` in `lib/category-masonry.ts` is already keyed by
 * `kind`, and a second copy here would be a second source for one pattern — the drift FR-013 exists to prevent.
 * It is attached by kind below, so the department carries it without the seed duplicating it.
 */
const DEPARTMENT_SEED: ReadonlyArray<{ kind: DepartmentKind;
  label: string;
  slug: string;
  badge: string | null;
  image: string;
}> = [
  {
    kind: "phone",
    label: "گوشی موبایل",
    // Band 2 merged the vocabularies (T056): the phone department is the root the
    // export actually files phones under, not the `موبایل` leaf beside it that holds 8.
    slug: "موبایل-و-تبلت",
    badge: "/brand/categories/mobile.svg",
    image: "/images/categories/v3/phone.png",
  },
  { kind: "audio", label: "هدفون و ایرپاد", slug: "هدفون-ایرپاد-و-هندزفری", badge: "/brand/categories/audio.svg", image: "/images/categories/v3/audio.png" },
  { kind: "charger", label: "شارژر و کابل", slug: "آداپتور-کابل-و-شارژر", badge: "/brand/categories/charger.svg", image: "/images/categories/v3/charger.jpg" },
  { kind: "smartwatch", label: "ساعت هوشمند", slug: "ساعت-و-مچ-بند-هوشمند", badge: "/brand/categories/smartwatch.svg", image: "/images/categories/v3/smartwatch.jpg" },
  { kind: "powerbank", label: "پاوربانک", slug: "پاور-بانک", badge: "/brand/categories/power-bank.svg", image: "/images/categories/v3/powerbank.jpg" },
  { kind: "computer_accessory", label: "لوازم کامپیوتر", slug: "تجهیزات-کامپیوتر-و-لبتاب", badge: "/brand/categories/computer-accessory.svg", image: "/images/categories/v3/computer-accessory.jpg" },
  { kind: "sim_card", label: "سیم‌کارت", slug: "سیمکارت", badge: "/brand/categories/sim-card.svg", image: "/images/categories/v3/sim-card.jpg" },
  { kind: "car_charger", label: "شارژر فندکی", slug: "شارژر-فندکی", badge: "/brand/categories/car-charger.svg", image: "/images/categories/v3/car-charger.jpg" },
  { kind: "service", label: "خدمات آنلاین", slug: "خدمات-آنلاین", badge: "/brand/categories/online-services.svg", image: "/images/categories/v3/service.jpg" },
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
   * The department's own picture, authored and guarded — `tests/unit/category-departments.test.ts` asserts the
   * path exists on disk. Feature 010's tiles render this, not `badge`: a tile has room for a picture and a name,
   * and the line icon is a third element a 148 px tile cannot carry.
   */
  image: string;
  /**
   * The masonry rhythm — the tier at each breakpoint, attached from `RHYTHM` by `kind`.
   *
   * It is *not* a statement of importance (FR-013): no department is tall because it sells more, and because the
   * table is a Latin square every department is the tall tile at exactly one width and the short tile at another
   * (FR-013a). Keyed by kind rather than derived from position, so a panel skipped below cannot re-shuffle the
   * composition of the ones that remain.
   */
  rhythm: Record<TierBreakpoint, Tier>;
  /**
   * What the destination actually holds. This is the only number the panel may display, and it displays it
   * only when it is the whole department — see `showsCount`.
   */
  reachableCount: number;
  /** Products of this kind in the export, counted at request time. Never authored here. */
  kindTotal: number;
  /**
   * False wherever the route is a subset of the kind. FR-005: a panel "MUST NOT imply breadth it does not
   * have", and it must not understate it with a confident small number either. The routes that are short
   * show no number at all — the phone department reaches one charger alongside its 134 phones, and
   * chargers and power banks are each one record short. Computed rather than declared so a fourth
   * shortfall cannot silently appear.
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

/**
 * How many departments this file authors — not how many render.
 *
 * A panel can be skipped at request time (a slug that stops resolving, a category
 * that empties), so anything a shopper *sees* must count
 * `categoryDepartments().length`, not this. It is exported only so the drift test
 * can assert the two agree while the export is healthy.
 */
export const DEPARTMENT_TOTAL = DEPARTMENT_SEED.length;

export async function categoryDepartments(): Promise<Department[]> {
  const [categories, kindTotals, subtreeCounts] = await Promise.all([listCategories(), countProductsByKind(), categorySubtreeCounts()]);

  /*
   * Every failure mode here drops one panel and logs, rather than throwing.
   *
   * This function runs on the homepage render path for every visitor. It used to
   * `throw` when a hand-listed slug stopped resolving or an emptied category was
   * reached — the right instinct from 004's destination-resolution fix, aimed at
   * the wrong blast radius: one category emptied by a data refresh took the whole
   * homepage down. A missing doorway is a defect to fix; a dead homepage is an
   * incident. "Zero dead doors" (FR-002, SC-014) is satisfied by nothing linking
   * to an empty route, not by the route's author crashing the page that contains it.
   */
  const departments: Department[] = [];
  for (const seed of DEPARTMENT_SEED) {
    const category = categories.find((c) => c.slug === seed.slug);
    if (!category) {
      console.warn(`categoryDepartments: slug "${seed.slug}" (kind "${seed.kind}") no longer resolves in the export — panel skipped`);
      continue;
    }

    /*
     * The subtree, not the exact category, because `/categories/<slug>` lists the
     * subtree — this number has to be the one the panel's own destination shows, or
     * the doorway understates itself, which is the `موبایل`-holds-8 defect T056
     * merged the vocabularies to remove.
     */
    const total = subtreeCounts.get(category.id) ?? 0;
    if (total < 1) {
      console.warn(`categoryDepartments: "${seed.slug}" resolves but holds no products — panel skipped (FR-002 forbids an empty doorway)`);
      continue;
    }

    const kindTotal = kindTotals[seed.kind] ?? 0;
    departments.push({
      kind: seed.kind,
      label: seed.label,
      slug: seed.slug,
      categoryId: category.id,
      href: `/categories/${encodeURIComponent(seed.slug)}`,
      badge: seed.badge,
      image: seed.image,
      rhythm: RHYTHM[seed.kind],
      reachableCount: total,
      kindTotal,
      // False wherever the route is a subset of the kind: a panel must neither
      // promise a breadth it lacks nor understate one it has with a small number.
      showsCount: kindTotal > 0 && total === kindTotal,
    });
  }

  return departments;
}
