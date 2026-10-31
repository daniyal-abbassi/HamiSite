/**
 * Feature 010's guard tests — the masonry gallery.
 *
 * The rule this file enforces is that the chapter's shape is **stated**, not incidental. FR-013 says tile
 * heights are a deliberate rhythm and FR-013a says no department may rely on being the largest; both are
 * only falsifiable if the pattern exists as data a test can read. So the rhythm table and the arrival
 * constants are asserted here in the node harness, and everything that needs a pixel is left to the
 * contract clauses in `contracts/category-masonry.md` and the captures under `verification/`.
 *
 * Tests run in the **node environment with no DOM** (`vitest.frontend.config.ts`). Source-text assertions
 * are used where a claim is about what a file contains; browser measurement is used where a claim is about
 * what a shopper sees. They are never substituted for each other.
 *
 * Run with `npm run test:unit` — never bare `npm test` or bare `npx vitest run`, whose config loads
 * `tests/setup.ts`, whose `resetDb()` deletes nineteen tables from the real dev database.
 */

import { describe, expect, it } from "vitest";
import {
  COLUMNS,
  COLUMN_VW,
  GAP,
  MAX_CONCURRENT_BLUR,
  RESOLVE_DURATION,
  RHYTHM,
  RISE_DURATION,
  ROW_UNIT,
  SPAN,
  STAGGER,
  TIERS,
  TRIGGER_ROOT_MARGIN,
  TRIGGER_THRESHOLD,
  TIER_BREAKPOINTS,
  type Tier,
  type TierBreakpoint,
  columnWidthPx,
  imageSizesAttribute,
  tileHeightPx,
} from "@/lib/category-masonry";
import { DEPARTMENT_TOTAL, categoryDepartments } from "@/lib/category-departments";
import type { DepartmentKind } from "@/lib/category-departments";

/**
 * The table from `data-model.md`, transcribed rather than derived — that is the point. A change here and a
 * change there must fail this test, which is what makes the next edit a change to a stated pattern instead of
 * an accident of layout (FR-013).
 */
const DOCUMENTED_RHYTHM: Record<DepartmentKind, Record<(typeof TIER_BREAKPOINTS)[number], (typeof TIERS)[number]>> = {
  phone: { base: "M", md: "S", xl: "L" },
  audio: { base: "M", md: "S", xl: "L" },
  charger: { base: "L", md: "M", xl: "S" },
  smartwatch: { base: "S", md: "M", xl: "L" },
  powerbank: { base: "L", md: "M", xl: "S" },
  computer_accessory: { base: "L", md: "S", xl: "M" },
  sim_card: { base: "S", md: "L", xl: "M" },
  car_charger: { base: "S", md: "L", xl: "M" },
  service: { base: "M", md: "L", xl: "S" },
};

/**
 * CSS Grid's sparse row-major auto-placement, in nine lines.
 *
 * A cursor walks columns first and drops each item into the earliest row where the span it needs is entirely
 * free, never moving backwards. That is why this layout has no holes and no script, and it is also why the
 * *order* of tiers decides how even the columns end: greedy placement cannot be reasoned about by eye, and a
 * pattern that satisfies every stated rule can still leave one column hundreds of pixels short. The browser
 * agrees with this function — `verification/q1-heights.md` records both numbers side by side.
 */
function columnBottomRows(spans: number[], columns: number): number[] {
  const occupied = Array.from({ length: columns }, () => new Set<number>());
  let row = 1;
  let col = 0;
  for (const span of spans) {
    for (;;) {
      if (col >= columns) {
        col = 0;
        row += 1;
      }
      const free = ![...Array(span)].some((_, k) => occupied[col].has(row + k));
      if (free) {
        for (let k = 0; k < span; k += 1) occupied[col].add(row + k);
        col += 1;
        break;
      }
      col += 1;
    }
  }
  return occupied.map((s) => (s.size ? Math.max(...s) : 0));
}

function simulatedColumnHeights(bp: TierBreakpoint, tiers: Tier[]): number[] {
  const gap = GAP[bp];
  return columnBottomRows(
    tiers.map((t) => SPAN[bp][t]),
    COLUMNS[bp],
  ).map((bottom) => bottom * ROW_UNIT + (bottom - 1) * gap);
}

describe("010 rhythm table — Q2, the pattern is stated and not an accident", () => {
  it("declares every department the model can produce, and nothing else", () => {
    expect(Object.keys(RHYTHM).sort()).toEqual(
      categoryDepartments().map((d) => d.kind).sort(),
    );
    expect(Object.keys(RHYTHM)).toHaveLength(DEPARTMENT_TOTAL);
  });

  it("declares all three breakpoints for every department", () => {
    for (const [kind, byBreakpoint] of Object.entries(RHYTHM)) {
      expect(Object.keys(byBreakpoint).sort(), kind).toEqual([...TIER_BREAKPOINTS].sort());
      for (const bp of TIER_BREAKPOINTS) {
        expect(TIERS, `${kind}.${bp}`).toContain(byBreakpoint[bp]);
      }
    }
  });

  it("equals the table written in data-model.md", () => {
    expect(RHYTHM).toEqual(DOCUMENTED_RHYTHM);
  });

  it("is keyed by kind, so a department leaving cannot re-shuffle the others", () => {
    // The rejected alternative derived the tier from render position. `categoryDepartments()` skips a panel
    // when a slug stops resolving, so a positional tier would silently rewrite every remaining tile's height.
    // A table keyed by kind is the only shape that survives a departure, and this asserts the shape.
    expect(Array.isArray(RHYTHM)).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(RHYTHM, "service")).toBe(true);
    // Position is not a function of the tier and vice versa: three different kinds share `base: "L"` while
    // sitting at three different indices.
    const lAtBase = Object.entries(RHYTHM).filter(([, v]) => v.base === "L").map(([k]) => k);
    expect(lAtBase.sort()).toEqual(["charger", "computer_accessory", "powerbank"]);
  });

  it("holds three tiles of each tier at every breakpoint", () => {
    for (const bp of TIER_BREAKPOINTS) {
      const counts = TIERS.map((t) => Object.values(RHYTHM).filter((v) => v[bp] === t).length);
      expect(counts, bp).toEqual([3, 3, 3]);
    }
  });

  it("is a Latin square: every department holds each tier exactly once across the three widths", () => {
    for (const [kind, byBreakpoint] of Object.entries(RHYTHM)) {
      const held = TIER_BREAKPOINTS.map((bp) => byBreakpoint[bp]).sort().join("");
      expect(held, kind).toBe([...TIERS].sort().join(""));
    }
  });

  it("never leaves the one-product department permanently the largest tile", () => {
    // 009's variant B died here: خدمات آنلاین held one product and came out the biggest tile on the page.
    expect(RHYTHM.service.base).toBe("M");
    expect(RHYTHM.service.md).toBe("L");
    expect(RHYTHM.service.xl).toBe("S");
  });

  it("packs evenly at every width, because greedy placement cannot be eyeballed", () => {
    // The ragged-bottom edge case in spec.md, made numeric. Nine tiles do not divide into three or four
    // columns, so the tier *order* decides how far apart the column bottoms land — and the cyclic rotation the
    // plan first drafted, which satisfies every rule above, measured 1.59x at 1280 on the live page.
    // Q1's browser check uses the same 1.25 ceiling; this is the guard that catches it without one.
    for (const bp of TIER_BREAKPOINTS) {
      const heights = simulatedColumnHeights(
        bp,
        categoryDepartments().map((d) => d.rhythm[bp]),
      );
      const ratio = Math.max(...heights) / Math.min(...heights);
      expect(ratio, `${bp} columns: ${heights.join(" / ")}`).toBeLessThanOrEqual(1.25);
    }
  });
});

const COLUMN_WIDTH_PX = { base: 154, md: 225, xl: 281 };

describe("010 span arithmetic — Q1, the authored heights are the documented ones", () => {
  it("sizes every tier from the row grid, H(n) = ROW_UNIT·n + GAP·(n−1)", () => {
    // From research D2. These are the numbers Q1 measures against in a real browser.
    expect(tileHeightPx("S", "base")).toBe(148);
    expect(tileHeightPx("M", "base")).toBe(208);
    expect(tileHeightPx("L", "base")).toBe(268);
    expect(tileHeightPx("S", "md")).toBe(224);
    expect(tileHeightPx("M", "md")).toBe(320);
    expect(tileHeightPx("L", "md")).toBe(392);
    expect(tileHeightPx("S", "xl")).toBe(288);
    expect(tileHeightPx("M", "xl")).toBe(400);
    expect(tileHeightPx("L", "xl")).toBe(512);
  });

  it("keeps three distinct heights at every width, so the chapter cannot collapse into equal cells", () => {
    for (const bp of TIER_BREAKPOINTS) {
      const heights = TIERS.map((t) => tileHeightPx(t, bp));
      expect(new Set(heights).size, bp).toBe(3);
      // The stagger has to read: the tallest tile is meaningfully taller than the shortest.
      expect(Math.max(...heights) / Math.min(...heights), bp).toBeGreaterThanOrEqual(1.7);
      expect(Math.max(...heights) / Math.min(...heights), bp).toBeLessThanOrEqual(1.9);
    }
  });

  it("uses the column counts and gutters the layout declares", () => {
    expect(COLUMNS).toEqual({ base: 2, md: 3, xl: 4 });
    expect(GAP).toEqual({ base: 12, md: 16, xl: 20 });
    expect(ROW_UNIT).toBe(8);
    // The order is the `data-tier` vocabulary the CSS reads from; a silent rename would mislabel every tile.
    expect(TIERS).toEqual(["S", "M", "L"]);
  });

  it("fits inside the container at 360 with the padding the CSS actually applies", () => {
    // `tailwind.config.ts` says container padding is 1.5rem, and `app/globals.css:224-226` overrides it with a
    // fluid `padding-inline` — so 360 has 320 px of content and 154 px columns, NOT the 312/150 the config
    // implies. These widths are transcribed from the browser measurement in verification/q1-heights.md, which is
    // what makes this assertion independent of the module's own constant rather than a restatement of it.
    expect(COLUMN_WIDTH_PX).toEqual({ base: 154, md: 225, xl: 281 });
    expect(columnWidthPx("base")).toBe(COLUMN_WIDTH_PX.base);
    expect(columnWidthPx("md")).toBe(COLUMN_WIDTH_PX.md);
    expect(columnWidthPx("xl")).toBe(COLUMN_WIDTH_PX.xl);
    expect(tileHeightPx("S", "base")).toBeLessThanOrEqual(180);
  });

  it("derives the next/image sizes from the same column arithmetic the grid uses", () => {
    // In vw, because the container's padding is fluid — a fixed px hint would be wrong at every width except the
    // one it was measured at.
    expect(COLUMN_VW.base).toBe(43);
    expect(imageSizesAttribute()).toBe("(min-width: 1280px) 22vw, (min-width: 768px) 29vw, 43vw");
  });
});

describe("010 arrival constants — Q6/Q7, the motion is bounded by arithmetic", () => {
  it("blurs at most three tiles at once, derived rather than declared", () => {
    // The supplied reference animates blur on every item simultaneously. The bound here is a consequence of two
    // durations, so changing either one moves it — which is what makes it a guarantee instead of an intention.
    expect(RESOLVE_DURATION).toBe(0.32);
    expect(STAGGER).toBe(0.12);
    // Non-integral on purpose: if the ratio were whole, a hardcoded value could satisfy the identity by luck.
    expect(Number.isInteger(RESOLVE_DURATION / STAGGER)).toBe(false);
    expect(MAX_CONCURRENT_BLUR).toBe(Math.ceil(RESOLVE_DURATION / STAGGER));
    expect(MAX_CONCURRENT_BLUR).toBeLessThanOrEqual(3);
  });

  it("keeps the rise and the resolve inside one gesture", () => {
    // Both groups share STAGGER, so a tile's blur must clear before the wave has moved far beyond it — the
    // reference's "cinematic" reading comes from the two overlapping, not from either being long.
    expect(RISE_DURATION).toBe(0.44);
    expect(RESOLVE_DURATION).toBeLessThan(RISE_DURATION);
  });

  it("is triggered by view, not by load", () => {
    // FR-023, the owner's answer on 2026-09-26: a shopper who scrolls fast still meets the arrival.
    expect(TRIGGER_THRESHOLD).toBeCloseTo(0.12);
    expect(TRIGGER_ROOT_MARGIN).toBe("0px 0px -12% 0px");
  });
});

/*
 * ---------------------------------------------------------------------------
 * US1 — the markup and the stylesheet own the arrangement.
 *
 * These read source text, which is honest only because the claim is about what a file contains. Everything that
 * needs a pixel belongs to a contract clause measured in a browser (Q1, Q3's second half, Q8) and is NOT
 * asserted here.
 *
 * The CSS assertions run against the region between two marker comments, so the guard cannot silently start
 * testing the whole 950-line stylesheet, and so a later edit that moves the block cannot silently escape it.
 * ---------------------------------------------------------------------------
 */
