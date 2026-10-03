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

import { readFileSync } from "node:fs";
import { join } from "node:path";
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
const CSS_START = "/* ==== 010 categories masonry";
const CSS_END = "/* ==== end 010 categories masonry ==== */";

/**
 * Tile widths measured off the live page at each breakpoint (`verification/q1-heights.md`). Kept as a separate
 * literal in the test rather than imported, so `columnWidthPx()` is checked against the browser instead of
 * against itself.
 */
const COLUMN_WIDTH_PX = { base: 154, md: 225, xl: 281 };

function masonryBlock(): string {
  const css = readFileSync(join(process.cwd(), "app/(main)/home.css"), "utf8");
  const start = css.indexOf(CSS_START);
  const end = css.indexOf(CSS_END);
  expect(start, `missing ${CSS_START} marker in app/(main)/home.css`).toBeGreaterThanOrEqual(0);
  expect(end, `missing ${CSS_END} marker in app/(main)/home.css`).toBeGreaterThan(start);
  // Comments are stripped before asserting. A guard that trips on the prose explaining the guard is not a
  // guard — the first draft of this file failed on the words "no `opacity: 0`" inside its own header.
  return css.slice(start, end).replace(/\/\*[\s\S]*?\*\//g, "");
}

function hubSource(): string {
  return readFileSync(join(process.cwd(), "components/home/CategoryHub.tsx"), "utf8");
}

describe("010 markup and stylesheet own the layout — Q3, Q4, FR-006, FR-008", () => {
  it("renders the masonry markup and no longer renders the carousel", () => {
    const src = hubSource();
    for (const needle of ["cat-masonry", "cat-card", "cat-card__label", "department.image", "department.href"]) {
      expect(src, `CategoryHub must reference ${needle}`).toContain(needle);
    }
    for (const gone of ["CategoryCarousel", "cat-carousel", "cat-panel", "cat-track"]) {
      expect(src, `the deleted presentation leaked back: ${gone}`).not.toContain(gone);
    }
  });

  it("navigates with a link, never with a script", () => {
    // The supplied reference calls window.open(); FR-007 forbids it.
    const src = hubSource();
    expect(src).not.toMatch(/window\.open|target\s*=\s*["']_blank/);
    expect(src).toContain("<Link");
  });

  it("does not claim a roledescription that would lie about the widget", () => {
    // FR-020: a grid is not a carousel, and announcing it as one is a lie to a screen reader.
    expect(hubSource()).not.toContain("aria-roledescription");
  });

  it("takes its `sizes` from the same arithmetic the grid uses", () => {
    expect(hubSource()).toContain("imageSizesAttribute");
  });

  it("puts the arrangement in the stylesheet, not in a script", () => {
    // The reference computes absolute top/left in JS for every item, which leaves an empty box until scripts run
    // (FR-008). The claim is about the *tiles*, so that is what is asserted — a label overlay sitting absolutely
    // inside a positioned tile is normal CSS and not this defect. Narrowing the mechanism, not the intent.
    const css = masonryBlock();
    expect(css).toContain(`grid-auto-rows: ${ROW_UNIT}px`);
    expect(css).toMatch(/grid-template-columns: repeat\(2,/);
    expect(css).toMatch(/repeat\(3,/);
    expect(css).toMatch(/repeat\(4,/);
    expect(css).not.toMatch(/\.cat-masonry__item\s*\{[^}]*position:\s*absolute/s);
    expect(css).not.toMatch(/\.cat-card\s*\{[^}]*position:\s*absolute/s);
  });

  it("spans the exact rows the rhythm table declares, under the right breakpoint attribute", () => {
    // If CSS and the module disagree, Q1's measurements are meaningless — the suite would be asserting one
    // geometry while the browser paints another.
    //
    // The attribute name is part of this assertion, and it earned its place: the first draft used one
    // `data-tier` re-scaled by each media query, which satisfies every span number and still pins each
    // department to its mobile tier forever. That is the permanently-largest-tile defect FR-013a exists to
    // prevent, and only a breakpoint-qualified selector can express a rotating rhythm.
    const css = masonryBlock();
    for (const bp of TIER_BREAKPOINTS) {
      for (const tier of TIERS) {
        const rule = new RegExp(`\\[data-tier-${bp}="${tier}"\\]\\s*\\{\\s*grid-row:\\s*span ${SPAN[bp][tier]};`);
        expect(rule.test(css), `${bp}.${tier} span rule missing or wrong`).toBe(true);
      }
    }
  });

  it("never hides a tile in CSS, so the finished composition is the no-script state", () => {
    // FR-011: the hidden starting state may exist only in script memory. A CSS `opacity: 0` here would mean a
    // stalled script leaves nine invisible departments.
    const css = masonryBlock();
    expect(css).not.toMatch(/opacity:\s*0(?![.\d])/);
    expect(css).not.toMatch(/visibility:\s*hidden/);
    expect(css).not.toMatch(/\bfilter:[^;]*blur/);
  });

  it("keeps the label legible without an interaction and without Latin typographic habits", () => {
    const css = masonryBlock();
    // Q4: no transient state may gate the department name.
    expect(css).not.toMatch(/:hover[^{]*\{[^}]*\bopacity:/s);
    // FR-006: Persian has no case, and tracking breaks letter joining. `letter-spacing: 0` is welcome as an
    // explicit reset against anything inherited; any other value is the defect.
    for (const match of css.matchAll(/letter-spacing:\s*([^;]+)/g)) {
      expect(match[1].trim(), "Persian labels take no tracking").toBe("0");
    }
    expect(css).not.toMatch(/text-transform/);
  });

  it("stays on logical axes, as the RTL principle requires", () => {
    const css = masonryBlock();
    expect(css).not.toMatch(/(^|[\s;{])left\s*:/m);
    expect(css).not.toMatch(/(^|[\s;{])right\s*:/m);
    expect(css).not.toMatch(/padding-left|padding-right|margin-left|margin-right/);
  });

  it("carries the accessibility and contrast guards that survived 009", () => {
    const css = masonryBlock();
    expect(css).toContain(":focus-visible");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("@media (forced-colors: active)");
  });

  it("leaves no trace of the superseded mosaic or the carousel", () => {
    const css = readFileSync(join(process.cwd(), "app/(main)/home.css"), "utf8");
    for (const gone of ["cat-mosaic", "cat-tile", "cat-panel", "cat-carousel", "cat-track", "cat-slide"]) {
      expect(css, `${gone} should have been deleted with the layout it served`).not.toContain(gone);
    }
  });
});

/*
 * US2 — the arrival. The claim is not "it animates", it is "the finished composition is reachable by every
 * path that is not the animation", and that is a claim about where the hidden state lives.
 */
function arrivalSource(): string {
  return readFileSync(join(process.cwd(), "components/home/CategoryArrival.tsx"), "utf8");
}

describe("010 the arrival is decorative and cannot strand a tile — Q6, Q7", () => {
  it("animates FROM the rendered state, never to a hidden one", () => {
    // gsap.to() from a CSS-hidden start is the defect FR-011 exists to prevent: a stalled or blocked script
    // leaves nine invisible departments. With from() the hidden state exists only in script memory.
    const src = arrivalSource();
    expect(src).toContain("gsap.from(");
    expect(src).not.toMatch(/gsap\.to\s*\(/);
    expect(src).toContain("clearProps");
  });

  it("plays once per visit, and survives a remount doing so", () => {
    // Component state is reset by a remount, so a flag inside the component would let the arrival replay.
    const src = arrivalSource();
    expect(src).toMatch(/^let hasPlayed/m);
    expect(src).toMatch(/if \(hasPlayed\) return/);
  });

  it("opts out entirely under reduced motion, before it observes anything", () => {
    const src = arrivalSource();
    expect(src).toContain("prefers-reduced-motion: reduce");
    // `new IntersectionObserver(`, not the bare word: the first version of this assertion compared positions of
    // "IntersectionObserver" and found the one in the file's own header comment, which is earlier than any code.
    expect(src.indexOf("prefers-reduced-motion: reduce")).toBeLessThan(src.indexOf("new IntersectionObserver("));
  });

  it("touches no scroll listener and no global node", () => {
    // 005's contract G1, restated for this section: consuming a wheel event over the chapter converts a
    // shopper's vertical scroll into something else, on a page long enough to make that the worst property a
    // section can have. The trigger is an observer, which cannot exhibit the bug.
    const src = arrivalSource();
    expect(src).not.toMatch(/addEventListener\s*\(\s*["']scroll/);
    expect(src).not.toMatch(/\bwindow\.(scrollY|addEventListener)/);
    expect(src).not.toMatch(/document\.addEventListener/);
    // D3: ScrollTrigger is installed and deliberately not used.
    expect(src).not.toContain("ScrollTrigger");
  });

  it("confines the blur to the image layer and bounds its concurrency", () => {
    // Q7. The bound is arithmetic on two durations, asserted through them rather than as a literal, so editing
    // either constant moves the number — which is what makes it a guarantee instead of an intention.
    expect(MAX_CONCURRENT_BLUR).toBe(Math.ceil(RESOLVE_DURATION / STAGGER));
    expect(MAX_CONCURRENT_BLUR).toBeLessThanOrEqual(3);
    const src = arrivalSource();
    expect(src).toContain("cat-card__art");
    expect(src).not.toMatch(/selector[^,)]*\.cat-card__label/);
  });

  it("is mounted around server-rendered children, not instead of them", () => {
    // The client boundary must receive the grid as children from the server component; if the markup moved into
    // the client component, Q3's no-script guarantee would quietly stop being true.
    const hub = hubSource();
    expect(hub).toContain("CategoryArrival");
    expect(hub).not.toMatch(/^"use client"/);
    expect(hub).toContain('className="cat-masonry"');
  });
});

/*
 * US3 — pressing a tile feels like pressing it. The point of these guards is that the response is one CSS
 * declaration shared by pointer and touch, and that no information sits behind either.
 */
describe("010 press and hover respond, and neither is a requirement — Q4, Q5", () => {
  it("answers the pointer and the finger with the same rule", () => {
    const css = masonryBlock();
    expect(css).toMatch(/\.cat-card:active[^{]*\{/);
    expect(css).toMatch(/@media \(hover: hover\) and \(pointer: fine\)/);
    // Without the pointer guard a phone keeps the hovered state stuck on after a tap.
    const guarded = css.slice(css.indexOf("@media (hover: hover) and (pointer: fine)"));
    expect(guarded).toMatch(/\.cat-card:hover[^{]*\{/);
  });

  it("scales the image inside the tile, not the grid item", () => {
    // A 3% scale on a row-spanned grid item changes its painted bounds against its neighbours; the image sits
    // inside `overflow: hidden` and scales freely. D8.
    const css = masonryBlock();
    expect(css).toMatch(/\.(cat-card__art img|cat-card__art\s+img)[^{]*\{[^}]*scale/);
    expect(css).not.toMatch(/\.cat-masonry__item[^{]*\{[^}]*scale/);
  });

  it("transitions named properties, never `all`", () => {
    // `transition: all` would also catch `filter`, which is the arrival's own property — the two would fight
    // over every frame the arrival hands back through clearProps.
    const css = masonryBlock();
    expect(css).not.toMatch(/transition:\s*all/);
    expect(css).toMatch(/transition:\s*transform/);
  });

  it("keeps the department name outside every interaction path", () => {
    // Q4 / FR-005. The supplied reference reveals the title on hover, which on the shop's primary audience —
    // a phone — means the nine department names are never shown at all.
    const css = masonryBlock();
    for (const state of ["hover", "focus", "focus-visible", "active"]) {
      const rules = [...css.matchAll(new RegExp(`:${state}[^{]*\\{([^}]*)\\}`, "g"))];
      for (const [, body] of rules) {
        expect(body, `:${state} must not gate a label`).not.toMatch(/opacity|visibility|display/);
      }
    }
    expect(css).not.toMatch(/\.cat-card__label[^{]*\{[^}]*opacity:\s*0/);
  });

  it("leaves nothing caught mid-arrival on paper", () => {
    // spec.md's print edge case. The hidden state normally lives only in script memory, but a print *during* the
    // arrival would otherwise catch tiles half-faded.
    expect(masonryBlock()).toMatch(/@media print\s*\{[^}]*\.cat-card/s);
  });
});
