import { describe, expect, it } from "vitest";

import {
  LINE_PX,
  MAX_TRAVEL_PX,
  SAME_SLOT_PX,
  directionOfTravel,
  leanDegrees,
  parkStyle,
  planTrip,
  slotGeometry,
  type Slot,
} from "@/components/liquid/selection-geometry";

/* The provable half of the travelling marker.
 *
 * tests/unit has no DOM (vitest.frontend.config.ts pins `environment: "node"`),
 * so nothing here pretends to be a browser: these are the arithmetic decisions the
 * component asks about, called with numbers instead of elements. What the browser
 * does with those answers is verified on a rendered RTL page, and that evidence is
 * in .agent-pair/inbox/qoder/012-PORT-result.md.
 *
 * The geometry below is the bottom bar's real one, measured on a rendered page at
 * 360 x 640 (specs/012-liquid-dock-navigation/verification/render-gate.mjs): a
 * 334px row of five equal 66.8px slots, items 48px tall. The row reads
 * right-to-left, so DOM index 0 («خانه», home) sits at the PHYSICAL RIGHT at x
 * 267.2 and index 4 («حساب», account) at the physical left at x 0. Every direction
 * in these tests comes from measured x, exactly as it does in the component — that
 * is the point: there is no RTL branch to get wrong, because nothing here looks at
 * source order. */

const at = (x: number, over: Partial<Slot> = {}): Slot => ({
  x,
  y: 0,
  width: 66.8,
  height: 48,
  ...over,
});

const SLOT = 334 / 5;
const HOME = at(4 * SLOT);
const SHOP = at(3 * SLOT);
const ACCOUNT = at(0);
const px = (value: number) => Math.round(value * 10) / 10;

const run = (from: Slot, to: Slot, over: { maxTravelPx?: number } = {}) =>
  planTrip({ placed: true, visible: true, reducedMotion: false, from, to, ...over });

describe("slotGeometry", () => {
  it("converts an item's box into the marker's own coordinate system", () => {
    expect(slotGeometry({ offsetLeft: 64, offsetTop: 0, offsetWidth: 64, offsetHeight: 47 })).toEqual({
      x: 64,
      y: 0,
      width: 64,
      height: 47,
    });
  });

  it("subtracts the frame's border, because offsetLeft counts it and left:0 does not", () => {
    // The bar's row carries a 1px champagne border. offsetLeft/offsetTop are
    // measured from the frame's BORDER box while a marker at left:0/top:0 sits at
    // its PADDING box, so without this correction the marker rests a pixel away
    // from the label it belongs to — invisible alone, and it compounds with the
    // inset. Upstream's row had neither border nor padding, which is why it never
    // needed this.
    const geometry = slotGeometry(
      { offsetLeft: 64, offsetTop: 6, offsetWidth: 64, offsetHeight: 47 },
      { clientLeft: 1, clientTop: 1 },
    );

    expect(geometry).toEqual({ x: 63, y: 5, width: 62, height: 45 });
  });

  it("shrinks the resting box by the inset on every side", () => {
    // FR-065: a 64 x 47 slot filled edge to edge is a block, not a body.
    const geometry = slotGeometry(
      { offsetLeft: 64, offsetTop: 0, offsetWidth: 64, offsetHeight: 47 },
      { clientLeft: 0, clientTop: 0 },
      4,
    );

    expect(geometry).toEqual({ x: 68, y: 4, width: 56, height: 39 });
  });

  it("refuses a negative marker: an over-inset slot collapses to zero, not below", () => {
    const geometry = slotGeometry(
      { offsetLeft: 0, offsetTop: 0, offsetWidth: 6, offsetHeight: 6 },
      { clientLeft: 0, clientTop: 0 },
      10,
    );

    expect(geometry.width).toBe(0);
    expect(geometry.height).toBe(0);
    expect(Number.isFinite(geometry.x)).toBe(true);
  });

  it("addresses an RTL row in physical pixels, so the first item is the largest x", () => {
    const xs = [0, 1, 2, 3, 4].map((index) =>
      slotGeometry({
        offsetLeft: (4 - index) * SLOT,
        offsetTop: 0,
        offsetWidth: SLOT,
        offsetHeight: 48,
      }).x,
    );

    expect(xs.map(px)).toEqual([267.2, 200.4, 133.6, 66.8, 0]);
    expect(xs[0]).toBeCloseTo(HOME.x);
    expect(xs[4]).toBe(ACCOUNT.x);
    expect(px(HOME.x - ACCOUNT.x)).toBe(267.2);
  });
});

describe("directionOfTravel / leanDegrees", () => {
  it("reads direction off measured x, not source order", () => {
    expect(directionOfTravel(HOME.x, ACCOUNT.x)).toBe(-1); // RTL: «خانه» to «حساب»
    expect(directionOfTravel(ACCOUNT.x, HOME.x)).toBe(1); // the same two taps, LTR
    expect(directionOfTravel(64, 64.2)).toBe(0); // rounding, not a trip
  });

  it("leans into the travel: a body accelerating right bulges left", () => {
    expect(leanDegrees(1)).toBe(-8);
    expect(leanDegrees(-1)).toBe(8);
    expect(leanDegrees(0)).toBe(0);
  });

  it("is symmetric, which is why RTL needs no mirror branch", () => {
    expect(leanDegrees(directionOfTravel(HOME.x, ACCOUNT.x))).toBe(
      -leanDegrees(directionOfTravel(ACCOUNT.x, HOME.x)),
    );
  });
});

describe("planTrip", () => {
  it("parks instead of animating on the first placement", () => {
    expect(planTrip({ placed: false, visible: true, reducedMotion: false, from: null, to: ACCOUNT })).toEqual({
      kind: "park",
      lean: 0,
      distance: 0,
    });
  });

  it("parks under reduced motion, and still parks the marker in the right place", () => {
    // FR-021 / SC-004: the preference adapts the effect, it never cancels the
    // information. The plan must say "put it there", not "do nothing".
    const plan = planTrip({ placed: true, visible: true, reducedMotion: true, from: HOME, to: ACCOUNT });

    expect(plan.kind).toBe("park");
    expect(plan.lean).toBe(0);
  });

  it("parks rather than travelling from nowhere when the marker was absent", () => {
    // /cart and /checkout get no marker at all (FR-017); arriving at /shop must
    // not drag one out of whatever slot it last rested in.
    expect(planTrip({ placed: true, visible: false, reducedMotion: false, from: null, to: ACCOUNT }).kind).toBe(
      "park",
    );
  });

  it("stays put when a re-run lands on the same slot", () => {
    // FR-068: a parent re-render, a fresh array of the same ids, an auth state
    // that resolved late. Without this the marker bounces in place under the
    // pointer, which is the defect upstream documented and refused to lose.
    expect(run(HOME, at(HOME.x))).toEqual({ kind: "stay", lean: 0, distance: 0 });
  });

  it("treats sub-pixel drift as the same slot and anything past it as a trip", () => {
    expect(run(HOME, at(HOME.x - SAME_SLOT_PX / 2)).kind).toBe("stay");
    expect(run(HOME, at(HOME.x - SAME_SLOT_PX * 4)).kind).toBe("travel");
  });

  it("travels the full width of the bar at 360px instead of suppressing it", () => {
    // US2 AC-1: one continuous shape crossing four slots. This is the case the
    // MAX_TRAVEL_PX ceiling must never catch.
    const plan = run(HOME, ACCOUNT);

    expect(plan.kind).toBe("travel");
    expect(px(plan.distance)).toBe(-267.2);
    expect(Math.abs(plan.distance)).toBeCloseTo(4 * SLOT);
    expect(Math.abs(plan.distance)).toBeLessThan(MAX_TRAVEL_PX);
    // 267.2 of the 320 ceiling spent, 53 clear — the measured headroom the
    // constant is chosen against (see selection-geometry.ts).
    expect(MAX_TRAVEL_PX - Math.abs(plan.distance)).toBeGreaterThan(50);
  });

  it("leans the way the measured geometry says, in both directions", () => {
    expect(run(HOME, ACCOUNT).lean).toBe(8); // travelling left: the top edge drags right
    expect(run(ACCOUNT, HOME).lean).toBe(-8); // travelling right: it drags left
    expect(run(HOME, SHOP).lean).toBe(8); // one slot, same rule
  });

  it("turns the corner instead of stretching across a wrapped group", () => {
    // FR-045: variant chips and image views wrap. A line change is not a
    // horizontal statement, so no lean and no full-row stretch.
    const plan = run(HOME, at(128, { y: 52 }));

    expect(plan.kind).toBe("corner");
    expect(plan.lean).toBe(0);
  });

  it("reads a small vertical difference as the same line, not a corner", () => {
    // A font finally landing, or a baseline shift, must not be mistaken for a
    // second row of a wrapped group.
    expect(2).toBeLessThanOrEqual(LINE_PX);
    expect(run(HOME, at(ACCOUNT.x, { y: 2 })).kind).toBe("travel");
    expect(run(HOME, at(ACCOUNT.x, { y: LINE_PX + 1 })).kind).toBe("corner");
  });

  it("suppresses a trip past the ceiling rather than crawling it", () => {
    // FR-046: pagination page 1 to page 20 on a wide row. The ceiling is a
    // measurement (see selection-geometry.ts), and a surface may state its own.
    expect(run(HOME, at(HOME.x + MAX_TRAVEL_PX + 1)).kind).toBe("arrive");
    expect(run(HOME, at(HOME.x - MAX_TRAVEL_PX - 1)).kind).toBe("arrive");
    expect(run(HOME, at(HOME.x + MAX_TRAVEL_PX + 1), { maxTravelPx: 1000 }).kind).toBe("travel");
  });
});

describe("parkStyle", () => {
  it("puts the server's first frame under the current item of an equal-width row", () => {
    expect(parkStyle({ equalWidth: true, index: 0, count: 5, rtl: false })).toEqual({ left: "0%", width: "20%" });
    expect(parkStyle({ equalWidth: true, index: 4, count: 5, rtl: false })).toEqual({ left: "80%", width: "20%" });
  });

  it("mirrors the index, never the coordinate system, under RTL", () => {
    // «خانه» is item 0 of the bar and sits at the physical RIGHT, so the physical
    // left of its slot is 80%. `left` stays a physical property: a row positioned
    // logically and measured physically is two coordinate systems, and under RTL
    // they disagree by the whole width of the row (FR-061).
    expect(parkStyle({ equalWidth: true, index: 0, count: 5, rtl: true })).toEqual({ left: "80%", width: "20%" });
    expect(parkStyle({ equalWidth: true, index: 4, count: 5, rtl: true })).toEqual({ left: "0%", width: "20%" });
  });

  it("gives an RTL row the same slot coverage an LTR row gets, reversed", () => {
    const rtl = [0, 1, 2, 3, 4].map((i) => parkStyle({ equalWidth: true, index: i, count: 5, rtl: true })!.left);
    const ltr = [0, 1, 2, 3, 4].map((i) => parkStyle({ equalWidth: true, index: i, count: 5, rtl: false })!.left);

    expect(rtl).toEqual(["80%", "60%", "40%", "20%", "0%"]);
    expect([...ltr].reverse()).toEqual(rtl);
  });

  it("claims nothing it cannot know: content width, no selection, empty row", () => {
    expect(parkStyle({ equalWidth: false, index: 2, count: 5, rtl: true })).toBeUndefined();
    expect(parkStyle({ equalWidth: true, index: -1, count: 5, rtl: true })).toBeUndefined();
    expect(parkStyle({ equalWidth: true, index: 0, count: 0, rtl: true })).toBeUndefined();
  });
});
