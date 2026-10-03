/* The travelling marker's arithmetic, with no DOM and no GSAP in it.
 *
 * Everything here is pure on purpose: a number goes in, a number comes out, and
 * the browser is never asked. That is the only part of this feature a node-env
 * test suite can prove (there is no DOM in tests/unit — see
 * vitest.frontend.config.ts), so the geometry lives here and the painting lives
 * in LiquidSelection.tsx.
 *
 * Derived from PillTabs.tsx in liquid-taffy (MIT) — see UPSTREAM.md. The
 * measurements that feed these functions are the same ones upstream takes
 * (`offsetLeft`, `offsetWidth`), and the same physical convention: a slot is
 * addressed by its distance from the physical LEFT of the row, and moved to with
 * a physical `x`. Nothing in this file knows or cares which way the text reads;
 * under RTL the row's first item simply happens to have the largest x, and every
 * direction below is derived from measured x rather than from source order,
 * which is what makes the same arithmetic correct in both. */

import { DEGREES, TOLERANCE_PX } from "./motion";

/** The resting place of one marker: the group's padding box is the origin. */
export type Slot = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** What the painting layer should do about a re-measured slot. */
export type TripKind =
  /** Set the marker where it belongs and do not animate. First paint, reduced motion. */
  | "park"
  /** Do nothing at all — we are already home. */
  | "stay"
  /** The normal trip: travel, stretch, lean, ring back. */
  | "travel"
  /** The destination is on another line: go vertically, then horizontally, no lean. */
  | "corner"
  /** Too far to be worth a trip: arrive. */
  | "arrive";

export type TripPlan = {
  kind: TripKind;
  /** Degrees of skew to lean into the travel. 0 for anything that does not stretch. */
  lean: number;
  /** Signed physical distance travelled, for anything that wants to scale to it. */
  distance: number;
};

/** Anything smaller than this is the same slot wearing rounding error. */
export const SAME_SLOT_PX = TOLERANCE_PX;

/** A vertical difference bigger than this is a different LINE, not a nudge.
 *  Rows of chips and thumbnails wrap; a text baseline can move a pixel. */
export const LINE_PX = 4;

/** Beyond this distance the marker arrives instead of travelling (FR-046).
 *
 * The number is a measurement, not a taste — and an earlier draft of this comment
 * derived it wrong, so the arithmetic is written out here to stop anyone
 * re-deriving it from the class list again.
 *
 * Measured on the rendered page at 360 x 640 (`specs/012-liquid-dock-navigation/
 * verification/render-gate.mjs`, gate JSON `slots`): the bar's row is 334px wide,
 * its five equal slots 66.8px each, and the longest trip the bar can ever be
 * asked for — «خانه» to «حساب», four slots — is 267.2px of x.
 *
 * Not 320px, which is what reading `px-2` off MobileDock.tsx suggests: the nav's
 * horizontal padding is deliberately overridden to raw `env(safe-area-inset-*)`
 * at app/globals.css:912 («this bar has no horizontal padding by design, and in
 * portrait the insets are 0»), so the row is the nav's 336px minus its 2px border.
 *
 * 320 therefore clears the whole primary navigation by 53px, and a jump like
 * pagination page 1 to page 20 — 20 numbers in one row, past 700px on a laptop —
 * falls over the ceiling and arrives instead of crawling. */
export const MAX_TRAVEL_PX = 320;

/**
 * The item's own box, converted into the marker's coordinate system.
 *
 * Two corrections that upstream never needed and we do:
 *
 * 1. `offsetLeft`/`offsetTop` are measured from the frame's BORDER box, while an
 *    absolutely positioned marker at `left: 0; top: 0` sits at its PADDING box. A
 *    row with a border — and our bar has one — is therefore off by exactly its
 *    border width, which `clientLeft`/`clientTop` report. Subtracting them is the
 *    difference between the marker resting under the label and resting 1px away
 *    from it.
 * 2. A slot that fills an equal-width row edge to edge makes a marker that fills
 *    it, and a marker that fills a 64 x 47 slot is a block, not a pill. `inset`
 *    shrinks the resting box symmetrically; the stretch then has somewhere to go
 *    inside the slot instead of only outside it.
 */
export function slotGeometry(
  item: { offsetLeft: number; offsetTop: number; offsetWidth: number; offsetHeight: number },
  frame: { clientLeft: number; clientTop: number } = { clientLeft: 0, clientTop: 0 },
  inset = 0,
): Slot {
  const shrink = Math.max(0, inset);

  return {
    x: item.offsetLeft - frame.clientLeft + shrink,
    y: item.offsetTop - frame.clientTop + shrink,
    // Never a negative width: a 24px slot asked for a 2px inset per side is a
    // 20px slot, and a marker that animates to -4px is an invisible one.
    width: Math.max(0, item.offsetWidth - frame.clientLeft - frame.clientLeft - shrink * 2),
    height: Math.max(0, item.offsetHeight - frame.clientTop - frame.clientTop - shrink * 2),
  };
}

/** -1 travelling left, 1 travelling right, 0 not moving. From measured x only. */
export function directionOfTravel(fromX: number, toX: number): -1 | 0 | 1 {
  if (Math.abs(toX - fromX) < SAME_SLOT_PX) {
    return 0;
  }

  return toX > fromX ? 1 : -1;
}

/**
 * Which way the body leans as it goes (upstream: `skewX: goingRight ? -8 : 8`).
 *
 * A body accelerating to the right bulges to the LEFT — the top edge drags
 * behind, which is a negative skewX. Keeping this as a function is what lets a
 * test assert the sign instead of trusting a reviewer's eye.
 */
export function leanDegrees(direction: -1 | 0 | 1): number {
  if (direction === 0) {
    return 0;
  }

  return direction === 1 ? -DEGREES : DEGREES;
}

/**
 * The one decision the painting layer asks about: what kind of move is this?
 *
 * Order matters, and each rung is a defect someone already paid for:
 * `park` before anything, so a first paint never animates; `stay` before any
 * distance is measured, so a parent re-render that lands on the same slot cannot
 * bounce the marker (FR-068); `corner` before `arrive`, because a wrapped group
 * is a shape problem, not a distance problem.
 */
export function planTrip(args: {
  placed: boolean;
  visible: boolean;
  reducedMotion: boolean;
  from: Slot | null;
  to: Slot;
  maxTravelPx?: number;
}): TripPlan {
  const { placed, visible, reducedMotion, from, to } = args;
  const maxTravel = args.maxTravelPx ?? MAX_TRAVEL_PX;

  if (!placed || !visible || from === null) {
    return { kind: "park", lean: 0, distance: 0 };
  }

  if (reducedMotion) {
    return { kind: "park", lean: 0, distance: 0 };
  }

  const dx = to.x - from.x;
  const dy = to.y - from.y;

  const same =
    Math.abs(dx) < SAME_SLOT_PX &&
    Math.abs(dy) < SAME_SLOT_PX &&
    Math.abs(to.width - from.width) < SAME_SLOT_PX &&
    Math.abs(to.height - from.height) < SAME_SLOT_PX;

  if (same) {
    return { kind: "stay", lean: 0, distance: 0 };
  }

  if (Math.abs(dy) > LINE_PX) {
    return { kind: "corner", lean: 0, distance: dx };
  }

  if (Math.abs(dx) > maxTravel) {
    return { kind: "arrive", lean: 0, distance: dx };
  }

  return { kind: "travel", lean: leanDegrees(directionOfTravel(from.x, to.x)), distance: dx };
}

/**
 * Where the marker sits in the HTML the server sends, before any script runs.
 *
 * Only possible for an equal-width row, where the slot positions are arithmetic
 * rather than measurement: N items make N slots of 100/N %, and the server knows
 * which index it marked. For a content-width row nobody knows the widths until
 * layout has run, so the answer is `undefined` and the marker simply has nothing
 * to be until the first layout effect (which runs before the browser paints).
 *
 * Percentages are only exact because `.equal` in the CSS forces `gap: 0` and
 * `padding: 0` on the row — that is the trade the mode makes, and it is the same
 * geometry the measured path would find.
 *
 * `rtl` mirrors the INDEX, not the row: `left` stays physical, because a marker
 * positioned from physical left and moved by a physical `x` is one coordinate
 * system, and half-logical is two (FR-061).
 */
export function parkStyle(args: {
  equalWidth: boolean;
  index: number;
  count: number;
  rtl: boolean;
}): { left: string; width: string } | undefined {
  const { equalWidth, index, count, rtl } = args;

  if (!equalWidth || index < 0 || count < 1) {
    return undefined;
  }

  const slotPct = 100 / count;
  const visual = rtl ? count - 1 - index : index;

  return {
    left: `${visual * slotPct}%`,
    width: `${slotPct}%`,
  };
}
