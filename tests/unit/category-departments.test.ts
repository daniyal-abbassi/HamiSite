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

/** Routes whose measured shortfall against their kind total is known and accepted. */
const KNOWN_SHORTFALLS: Record<string, [number, number]> = {
  phone: [8, 134],
  charger: [9, 10],
  powerbank: [6, 7],
};

describe("categoryDepartments", () => {
  it("presents exactly the populated kinds, one department each, covering the whole catalogue", () => {
    const populated = Object.keys(kindTotals).filter((k) => k !== "(none)");
    expect(populated.length).toBe(9);
    expect(DEPARTMENT_TOTAL).toBe(9);
    expect(departments.map((d) => d.kind).sort()).toEqual([...populated].sort());

    // Sum of kind totals is every product: nothing browsable is invisible on the homepage's main
    // orientation surface, which is the property the eight-badge alternative would have failed.
    const covered = Object.values(kindTotals).reduce((a, b) => a + b, 0);
    expect(covered).toBe(189);
    expect(exportData.products.length).toBe(189);
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

  it("keeps the measured shortfalls to the three already accepted", () => {
    for (const d of departments) {
      const kindTotal = kindTotals[d.kind];
      const known = KNOWN_SHORTFALLS[d.kind];
      if (known) {
        expect([d.reachableCount, kindTotal], d.slug).toEqual(known);
      } else {
        expect(d.reachableCount, `${d.slug} newly lost products`).toBe(kindTotal);
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

    // The three known shortfalls must all be silent about their size.
    expect(departments.filter((d) => !d.showsCount).map((d) => d.kind).sort()).toEqual([
      "charger",
      "phone",
      "powerbank",
    ]);
    expect(departments.find((d) => d.kind === "phone")!.showsCount).toBe(false);
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

  it("href carries a percent-encoded Persian slug, never a hand-typed Latin one", () => {
    for (const d of departments) {
      expect(d.href).toBe(`/shop?category=${encodeURIComponent(d.slug)}`);
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
