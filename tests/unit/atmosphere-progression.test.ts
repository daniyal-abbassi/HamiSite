import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FALLBACK_TONE,
  HOMEPAGE_SECTIONS,
  LEGIBILITY_BAND,
  PROGRESSION,
  SCENE_TEXT_COLOURS,
  contrastOn,
  luminanceOf,
  reducedMotionTone,
  stageBoundaries,
  toneAt,
} from "@/lib/atmosphere/progression";

/**
 * The two requirements in this feature that cannot be checked by looking at a screen, and are the two
 * most likely to fail quietly:
 *
 *  - **FR-015 / SC-004** — "no meaningful text falls below its legibility threshold at any intermediate
 *    point — zero failing measurements, not an average." A progression can pass at every stage and fail
 *    between two of them, and only while the page is moving.
 *  - **FR-007** — the tone must be correct at any entry position, including 0 and 1 exactly.
 *
 * Both are properties of a pure function, so they are testable here rather than only in a browser.
 * Every assertion is value-agnostic on purpose: T010 is allowed to change the colours, the stage count
 * and the anchors, and this file must still be the thing that stops it breaking.
 */

const STEPS = 500;
const sweep = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS);

describe("homepage section anchors", () => {
  it("matches the eleven sections actually rendered, from the T001 baseline record", () => {
    const record = JSON.parse(
      readFileSync(join(process.cwd(), "specs/002-scroll-atmosphere/baseline/ground-record.json"), "utf8"),
    );
    expect(HOMEPAGE_SECTIONS).toEqual(record["360px"].sectionOrder);
    expect(HOMEPAGE_SECTIONS).toHaveLength(11);
  });
});

describe("atmosphere progression shape", () => {
  it("has more than one stage — FR-001 makes a single stage invalid by definition", () => {
    expect(PROGRESSION.length).toBeGreaterThan(1);
  });

  it("anchors every stage to a section that exists, with no section used twice", () => {
    const anchors = PROGRESSION.map((stage) => stage.anchor);
    for (const anchor of anchors) expect(HOMEPAGE_SECTIONS).toContain(anchor);
    expect(new Set(anchors).size).toBe(anchors.length);
  });

  it("runs from the first section to the last, in document order", () => {
    expect(PROGRESSION[0].anchor).toBe(HOMEPAGE_SECTIONS[0]);
    expect(PROGRESSION.at(-1)!.anchor).toBe(HOMEPAGE_SECTIONS.at(-1));
    const positions = PROGRESSION.map((s) => HOMEPAGE_SECTIONS.indexOf(s.anchor));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("declares boundaries that ascend and stay inside the document", () => {
    const bounds = stageBoundaries();
    expect(bounds).toHaveLength(PROGRESSION.length);
    expect(bounds[0]).toBe(0);
    expect(bounds.at(-1)!).toBeLessThanOrEqual(1);
    for (let i = 1; i < bounds.length; i += 1) expect(bounds[i]!).toBeGreaterThan(bounds[i - 1]!);
  });
});

describe("tone at position — FR-007, contract P5", () => {
  it("returns the first stage tone at the top of the page and the last at the bottom", () => {
    expect(toneAt(0).toLowerCase()).toBe(PROGRESSION[0]!.color.toLowerCase());
    expect(toneAt(1).toLowerCase()).toBe(PROGRESSION.at(-1)!.color.toLowerCase());
  });

  it("clamps rather than throwing when asked for a position outside the document", () => {
    expect(toneAt(-0.4).toLowerCase()).toBe(PROGRESSION[0]!.color.toLowerCase());
    expect(toneAt(1.7).toLowerCase()).toBe(PROGRESSION.at(-1)!.color.toLowerCase());
    expect(toneAt(Number.NaN).toLowerCase()).toBe(PROGRESSION[0]!.color.toLowerCase());
  });

  it("is stable — the same position never yields a different tone", () => {
    for (const p of [0, 0.13, 0.5, 0.777, 1]) expect(toneAt(p)).toBe(toneAt(p));
  });
});

describe("legibility band — FR-015, SC-004, contracts L1 and L5", () => {
  it("keeps every interpolated tone inside the declared band, not only the stage endpoints", () => {
    for (const p of sweep) {
      const l = luminanceOf(toneAt(p));
      expect(l, `tone at ${p.toFixed(3)} has luminance ${l.toFixed(4)}, outside the band`).toBeGreaterThanOrEqual(
        LEGIBILITY_BAND.min,
      );
      expect(l).toBeLessThanOrEqual(LEGIBILITY_BAND.max);
    }
  });

  it("holds every meaningful text colour at or above 4.5:1 at every step of every transition", () => {
    for (const p of sweep) {
      const tone = toneAt(p);
      for (const [name, colour] of Object.entries(SCENE_TEXT_COLOURS)) {
        const ratio = contrastOn(colour, tone);
        expect(ratio, `${name} on ${tone} at ${p.toFixed(3)} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("moves in one declared direction, so the progression reads as composed rather than alternating", () => {
    const lights = sweep.map((p) => luminanceOf(toneAt(p)));
    const rising = lights.filter((l, i) => i > 0 && l > lights[i - 1]! + 1e-6).length;
    const falling = lights.filter((l, i) => i > 0 && l < lights[i - 1]! - 1e-6).length;
    // One direction with at most a 2% exception; the current page fails this, alternating side to side.
    expect(Math.min(rising, falling)).toBeLessThanOrEqual(Math.round(STEPS * 0.02));
  });
});

describe("reduced motion and fallback — FR-020, FR-021, FR-024", () => {
  it("yields one settled stage tone per region, never an interpolated in-between", () => {
    const settled = new Set(PROGRESSION.map((stage) => stage.color.toLowerCase()));
    for (const p of sweep) expect(settled.has(reducedMotionTone(p).toLowerCase())).toBe(true);
  });

  it("covers every stage, so the reduced-motion page is not a shorter progression", () => {
    const visited = new Set(sweep.map((p) => reducedMotionTone(p).toLowerCase()));
    expect(visited).toEqual(new Set(PROGRESSION.map((s) => s.color.toLowerCase())));
  });

  it("falls back to a deliberate tone that is itself inside the band", () => {
    const l = luminanceOf(FALLBACK_TONE);
    expect(l).toBeGreaterThanOrEqual(LEGIBILITY_BAND.min);
    expect(l).toBeLessThanOrEqual(LEGIBILITY_BAND.max);
    expect(PROGRESSION.map((s) => s.color.toLowerCase())).toContain(FALLBACK_TONE.toLowerCase());
  });
});
