/**
 * Feature 005's drift guard.
 *
 * The department table is the one thing in this feature that can be wrong silently: a carousel of nine
 * beautiful panels leading to eight products, or to a category that no longer exists, looks exactly like a
 * carousel of nine panels leading to everything. So every number here is re-derived from the export on each
 * run rather than asserted against a remembered value.
 *
 * This file reads `data/hami-products.json` directly. That is deliberate and does not breach
 * Constitution III: production code goes through `lib/catalog.ts`, and a test that verified the seam by
 * calling the seam could not detect the seam being wrong.
 */

import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BRAND_SHAPED_CATEGORY_SLUGS,
  DEPARTMENT_TOTAL,
  categoryDepartments,
} from "@/lib/category-departments";

const exportData = JSON.parse(
  readFileSync(join(process.cwd(), "data/hami-products.json"), "utf8"),
) as {
  products: Array<{ kind?: string; category?: { id: number } | null; other_categories?: Array<{ id: number }> }>;
  categories: Array<{ id: number; name: string; slug: string }>;
  brands: Array<{ name: string }>;
};

const kindTotals = exportData.products.reduce<Record<string, number>>((acc, p) => {
  const k = p.kind ?? "(none)";
  acc[k] = (acc[k] ?? 0) + 1;
  return acc;
}, {});

const departments = categoryDepartments();
const categoryBySlug = new Map(exportData.categories.map((c) => [c.slug, c]));

/*
 * Departments whose route is known to hold less than the whole kind today: the
 * shop files some products under categories that are not the department's own.
 *
 * Names, not numbers. The previous version pinned `[8, 134]`, `[9, 10]` and
 * `[6, 7]`, so a refreshed export failed the suite for an entirely correct reason
 * and someone had to edit the test to match reality — which is the snapshot
 * coupling FR-053 forbids, smuggled into the guard that was supposed to catch it.
 * What is worth defending is the *shape*: a route never exceeds its kind, and any
 * shortfall is one of these named cases rather than a surprise.
 */
const KNOWN_SHORTFALL_KINDS = new Set(["phone", "charger", "powerbank"]);

/**
 * A route that reaches **more** than its kind, which band 2's vocabulary merge (T056)
 * made visible by counting the subtree the destination actually lists:
 *
 * - `phone` — `موبایل و تبلت` reaches 135, and the 135th is id 311
 *   «شارژر فوق سریع 66W», a `charger` filed under the «داریا باند» child.
 * - `charger` — `آداپتور | کابل و شارژر` reaches 12: nine of its ten `charger`
 *   records (the tenth sits under that same «داریا باند» child) plus the three
 *   `car_charger` records, because «شارژر فندکی» is a **child** of it.
 *
 * That is the export's filing, not a claim the panel makes — `showsCount` is false
 * precisely where the two numbers disagree, so no panel promises a breadth it has
 * not got. A *new* surplus kind is still a surprise worth a failing test.
 */
const KNOWN_SURPLUS_KINDS = new Set(["phone", "charger"]);

describe("categoryDepartments", () => {
  /*
   * Property-style, not snapshot-style. An earlier version of this file asserted
   * `9` and `189` directly, which meant SC-005's promise — "re-verifiable after an
   * availability refresh without restating the totals" — was false by construction:
   * a refreshed export broke the test for the right reason and looked like a
   * regression. Every number below is now derived from the same export the seam
   * reads, so the assertions hold for an export of any size and fail only when the
   * coverage property itself breaks.
   */
  it("presents exactly the populated kinds, one department each, covering the whole catalogue", () => {
    const populated = Object.keys(kindTotals).filter((k) => k !== "(none)");
    expect(populated.length).toBeGreaterThan(0);
    // Authored departments and rendered departments agree while the export is healthy.
    expect(DEPARTMENT_TOTAL).toBe(populated.length);
    expect(departments.length).toBe(populated.length);
    expect(departments.map((d) => d.kind).sort()).toEqual([...populated].sort());

    // Sum of kind totals is every product: nothing browsable is invisible on the
    // homepage's main orientation surface, which the eight-badge alternative failed.
    const covered = Object.values(kindTotals).reduce((a, b) => a + b, 0);
    expect(covered).toBe(exportData.products.length);
  });

  it("resolves every slug to a real category in the export", () => {
    for (const d of departments) {
      const category = categoryBySlug.get(d.slug);
      expect(category, `slug ${d.slug}`).toBeDefined();
      expect(category!.id).toBe(d.categoryId);
    }
  });

  /** FR-002 / SC-002 — "zero dead doors". The single most important assertion in this file. */
  it("gives every panel a destination holding at least one product", () => {
    for (const d of departments) {
      expect(d.reachableCount, `${d.slug} is a dead door`).toBeGreaterThanOrEqual(1);
    }
  });

  it("never routes to a brand-shaped category", () => {
    const brandNames = new Set(exportData.brands.map((b) => b.name.toLowerCase().trim()));
    for (const d of departments) {
      const category = categoryBySlug.get(d.slug)!;
      expect(BRAND_SHAPED_CATEGORY_SLUGS, `${d.slug} is deny-listed`).not.toContain(d.slug);
      const parts = category.name.toLowerCase().split("|").map((s) => s.trim());
      for (const part of parts) {
        expect(brandNames.has(part) && part.length > 1, `${d.slug} looks like a brand`).toBe(false);
      }
    }

    // The reason the deny list exists rather than only the name match above.
    expect(categoryBySlug.get("آیفون-استوک")).toBeDefined();
    expect(brandNames.has("آیفون")).toBe(false);
    expect(BRAND_SHAPED_CATEGORY_SLUGS).toContain("آیفون-استوک");
  });

  it("gives each department its own route, so no two panels mean the same thing", () => {
    const slugs = departments.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps every route within its kind, and every disagreement among the named ones", () => {
    for (const d of departments) {
      const kindTotal = kindTotals[d.kind];
      if (d.reachableCount < kindTotal) {
        expect(KNOWN_SHORTFALL_KINDS.has(d.kind), `${d.slug} is a newly short route — review its category`).toBe(true);
      }
      if (d.reachableCount > kindTotal) {
        expect(KNOWN_SURPLUS_KINDS.has(d.kind), `${d.slug} newly reaches outside its kind — review its category`).toBe(true);
        // The safety property the old `<=` was really guarding: a route that does not
        // match its kind exactly must not announce a number.
        expect(d.showsCount, `${d.slug} shows a count over a route wider than its kind`).toBe(false);
      }
    }
  });

  /** FR-005: a count may only be shown where the destination actually holds that many. */
  it("shows a count only where it is the whole department", () => {
    for (const d of departments) {
      expect(d.showsCount, `${d.slug} shows a count it cannot honour`).toBe(
        d.reachableCount === d.kindTotal,
      );
    }

    // The named shortfalls must be silent about their size, and the mechanism must
    // not be dead: if no panel ever showed a count, `showsCount` would have quietly
    // become "always false" and this file would have stopped proving anything.
    for (const d of departments) {
      if (KNOWN_SHORTFALL_KINDS.has(d.kind) && d.reachableCount < d.kindTotal) expect(d.showsCount, d.slug).toBe(false);
    }
    expect(departments.some((d) => d.showsCount), "no panel shows a count at all").toBe(true);
  });

  it("declares a kind total that matches the export, so showsCount cannot drift", () => {
    for (const d of departments) {
      expect(d.kindTotal, d.kind).toBe(kindTotals[d.kind]);
    }
  });

  it("labels departments in Persian with the names shoppers use, not the stored labels", () => {
    // FR-006. The export's own name for the computer category misspells لپ‌تاپ; propagating it is the
    // failure this guards against, so the labels are compared against the export and required to differ.
    for (const d of departments) {
      expect(d.label).toBeTruthy();
      expect(/[\u0600-\u06FF]/.test(d.label), d.slug).toBe(true);
      expect(d.label).not.toContain("لبتاب");
    }
  });

  it("routes each panel to its dedicated category page, percent-encoded", () => {
    // T055: FR-029 asked for a destination rather than a filter link, and the
    // panels are the homepage's doors, so they moved with it.
    for (const d of departments) {
      expect(d.href).toBe(`/categories/${encodeURIComponent(d.slug)}`);
      expect(d.href).toContain("%");
    }
  });

  it("points every badge at a file that exists, or at none", () => {
    // FR-033: authentic artwork or nothing. A missing badge is a broken image waiting to happen, and a
    // placeholder standing in for a department's artwork is a Principle I violation.
    for (const d of departments) {
      if (d.badge === null) continue;
      expect(
        existsSync(join(process.cwd(), "public", d.badge.replace(/^\//, ""))),
        `missing badge ${d.badge} for ${d.slug}`,
      ).toBe(true);
    }
  });
});
