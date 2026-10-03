/**
 * The masonry rhythm — feature 010.
 *
 * Everything in this file is **authored data**, not derived state, and that is the whole point. FR-013 requires
 * the height pattern be written down so the next change is a change to a stated pattern rather than an accident
 * of layout, and FR-013a requires that no department's size carry meaning. A test can only hold either promise
 * against a table it can read, which is why the rhythm lives here instead of inside a stylesheet or a component.
 *
 * The mechanism lives in CSS (research D1): `grid-auto-rows` plus a per-tier `grid-row: span N`, so the chapter
 * is fully composed before any script runs. This module is what CSS and the test suite agree on — a client
 * component's constants cannot be asserted from the node harness without importing React, so the numbers that
 * make the design provable live where a test can reach them. Same reason `lib/brand-deck.ts` exists.
 *
 * Nothing here imports React, and nothing here is allowed to depend on a render position.
 */

import type { DepartmentKind } from "@/lib/category-departments";

export const TIERS = ["S", "M", "L"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_BREAKPOINTS = ["base", "md", "xl"] as const;
export type TierBreakpoint = (typeof TIER_BREAKPOINTS)[number];

/** `grid-auto-rows`. Every tile height is a whole number of these plus the gutters it spans. */
export const ROW_UNIT = 8;

/** Media-query floor for each breakpoint. `base` is the mobile-first default and has no floor. */
export const MIN_WIDTH: Record<TierBreakpoint, number | null> = { base: null, md: 768, xl: 1280 };

export const COLUMNS: Record<TierBreakpoint, number> = { base: 2, md: 3, xl: 4 };

/** Column gutter, and simultaneously the row gap: one number per width keeps the span arithmetic honest. */
export const GAP: Record<TierBreakpoint, number> = { base: 12, md: 16, xl: 20 };

/**
 * Content width of the chapter at each breakpoint, **measured in a browser**, not derived from
 * `tailwind.config.ts`. The config says `container.padding: "1.5rem"`, but `app/globals.css:224-226` overrides
 * it with a fluid `padding-inline` — 20 px at 360, ~31 px at 768, 48 px at 1280 — so 360 has **320 px** of
 * content and two columns of **154 px**, not the 312/150 the Tailwind value implies.
 *
 * The correction matters for more than tidiness: 009's tile floor and this file's first draft were both derived
 * from the config value, and a `sizes` attribute built on it would under-request every panel. The numbers below
 * are the widths `verification/q1-heights.md` measures off the live page.
 */
export const CONTENT_WIDTH: Record<TierBreakpoint, number> = { base: 320, md: 707, xl: 1184 };

/**
 * Column width as a share of the viewport, for `sizes`. Expressed in vw rather than px because the container's
 * padding is fluid: a fixed `150px` hint would be wrong at every width except the one it was measured at.
 */
export const COLUMN_VW: Record<TierBreakpoint, number> = { base: 43, md: 29, xl: 22 };

/**
 * Row spans per tier per breakpoint. Chosen as ~0.73×, ~1.03× and ~1.30× the natural 3:4 height of a tile at
 * that width, then snapped to whole rows (research D2): M is uncropped, L crops mildly, S crops to roughly
 * square — and the panels are generated with a deliberately empty bottom third, which is the part S loses.
 */
export const SPAN: Record<TierBreakpoint, Record<Tier, number>> = {
  base: { S: 8, M: 11, L: 14 },
  md: { S: 10, M: 14, L: 17 },
  xl: { S: 11, M: 15, L: 19 },
};

/**
 * The composition, keyed by department and not by position (D2). `categoryDepartments()` skips a panel when a
 * slug stops resolving or a category empties, so a tier derived from render order would re-shuffle every
 * remaining tile the moment one department left.
 *
 * The pattern is a Latin square: every department holds each tier exactly once across the three widths, so no
 * department is permanently the tall tile and none is permanently the stub. The cyclic `[L, M, S]` rotation the
 * plan first drafted satisfies that too — and still failed the second rule below.
 *
 * **Nine tiles do not divide into three or four columns**, and CSS's sparse auto-placement is greedy, so a
 * pattern chosen only for elegance leaves one column hundreds of pixels short: the cyclic table measured a
 * **1.59×** tallest-to-shortest ratio at 1280, which is how masonry reads as unfinished rather than editorial.
 * This assignment is the one that packs within **1.11×** at every breakpoint, found by simulating the browser's
 * own placement algorithm; `tests/unit/category-masonry.test.ts` carries the simulator as a guard, and
 * `verification/q1-heights.md` confirms the simulation agrees with the rendered page.
 */
export const RHYTHM: Record<DepartmentKind, Record<TierBreakpoint, Tier>> = {
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

/** Painted height of a tier at a breakpoint, in px. Q1 measures the live page against this. */
export function tileHeightPx(tier: Tier, breakpoint: TierBreakpoint): number {
  const rows = SPAN[breakpoint][tier];
  return ROW_UNIT * rows + GAP[breakpoint] * (rows - 1);
}

/** Width of one column at a breakpoint, used by `sizes` so the attribute cannot drift from the layout. */
export function columnWidthPx(breakpoint: TierBreakpoint): number {
  const columns = COLUMNS[breakpoint];
  return Math.floor((CONTENT_WIDTH[breakpoint] - GAP[breakpoint] * (columns - 1)) / columns);
}

/** The `sizes` attribute for every panel, largest breakpoint first. */
export function imageSizesAttribute(): string {
  return (["xl", "md"] as const)
    .map((bp) => `(min-width: ${MIN_WIDTH[bp]}px) ${COLUMN_VW[bp]}vw`)
    .concat(`${COLUMN_VW.base}vw`)
    .join(", ");
}

/* -------------------------------------------------------------------------- */
/* The arrival. Decorative, one-time, and skippable — it is never load-bearing */
/* (FR-009, FR-010, FR-011). See research D3, D4 and D5 for why each value     */
/* is what it is.                                                              */
/* -------------------------------------------------------------------------- */

/** `opacity: 0 → 1` and `y → 0` on the tile. Compositor-only, so nine at once costs nothing. */
export const RISE_DURATION = 0.44;
export const RISE_OFFSET_PX = 18;
/** `blur → 0` on the image layer only, never the label (D4). */
export const RESOLVE_DURATION = 0.32;
export const BLUR_PX = 6;
/** Shared by both groups; the only reason the blur concurrency is bounded. */
export const STAGGER = 0.12;
export const EASE = "power3.out";

/**
 * How many tiles can be blurring at once. Derived, so editing either duration moves it — the reference animates
 * blur on every item simultaneously, and this project's hardware cannot tell us honestly whether that is smooth
 * (research D4). The bound is therefore arithmetic and asserted, not a number someone felt was reasonable.
 */
export const MAX_CONCURRENT_BLUR = Math.ceil(RESOLVE_DURATION / STAGGER);

/** FR-023: the chapter entering view triggers the arrival, not the page finishing load. */
export const TRIGGER_THRESHOLD = 0.12;
export const TRIGGER_ROOT_MARGIN = "0px 0px -12% 0px";
