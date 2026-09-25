import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FALLBACK_TONE,
  HOMEPAGE_SECTIONS,
  LEGIBILITY_BAND,
  PROGRESSION,
  SCENE_TEXT_COLOURS,
  INTERIOR_GROUNDS,
  SUBTREE_ANCHORS,
  contrastOn,
  interiorGround,
  luminanceOf,
  reducedMotionTone,
  stageBoundaries,
  UNANCHORED_SECTIONS,
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
  /**
   * The rendered section list comes from `manifest-after.json` — captured from the live DOM by
   * `verification/capture-baseline.mjs` — and NOT from `baseline/ground-record.json`.
   *
   * The old version compared `HOMEPAGE_SECTIONS` to that frozen T001 record, which meant the person
   * changing the page could make the guard pass by editing the record. That is not hypothetical: it is what
   * happened on 2026-09-24 when the accessories chapter was removed. A guard whose input you can rewrite to
   * match your change is decoration (see `notes/parallel-agent-plan.md` §5.1).
   *
   * **Why `SUBTREE_ANCHORS` is subtracted from both sides.** The manifest is built from
   * `document.querySelectorAll("section")`, so an anchor that lives on a `div` inside a section — which is
   * what feature 007's `band-settled` is, because the assembly band is one section carrying three
   * statements and cannot also be a second landmark — can never appear in the captured list. Counting it as
   * an accounted section makes the size assertion red by one; comparing the order against the full anchor
   * list makes the order assertion red by the same one (8 rendered against 9 declared). Both sides have to
   * drop it, and the set it drops is declared in the source rather than inferred from the manifest, so
   * adding an in-section anchor is still a deliberate edit to `progression.ts`.
   */
  it("covers every section the browser actually rendered, each one anchored or explicitly exempt", () => {
    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), "specs/001-premium-rtl-storefront/baseline/manifest-after.json"), "utf8"),
    ) as { surfaces: { home: { "360px": { sections: string[] } } } };
    const rendered = manifest.surfaces.home["360px"].sections;
    const outsideSubtree = (id: string) => !(SUBTREE_ANCHORS as readonly string[]).includes(id);
    const accountedFor = new Set<string>(
      [...HOMEPAGE_SECTIONS, ...UNANCHORED_SECTIONS].filter(outsideSubtree),
    );

    expect(rendered.length).toBe(accountedFor.size);
    for (const id of rendered) expect(accountedFor.has(id), `${id} renders but is neither anchored nor exempt`).toBe(true);
    // Anchors must appear in the same relative order as the DOM, or the ground moves backwards.
    const order = rendered.filter((id) => (HOMEPAGE_SECTIONS as readonly string[]).includes(id));
    expect(order).toEqual([...HOMEPAGE_SECTIONS].filter(outsideSubtree));
  });

  it("declares subtree anchors as anchors, and never as rendered sections", () => {
    for (const id of SUBTREE_ANCHORS) {
      expect(HOMEPAGE_SECTIONS, `${id} must be an anchor to be exempt from the section count`).toContain(id);
      expect(UNANCHORED_SECTIONS).not.toContain(id);
    }
    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), "specs/001-premium-rtl-storefront/baseline/manifest-after.json"), "utf8"),
    ) as { surfaces: { home: { "360px": { sections: string[] } } } };
    for (const id of manifest.surfaces.home["360px"].sections) expect(SUBTREE_ANCHORS).not.toContain(id);
  });

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

  /**
   * FR-003's "one coherent progression", stated as the property that actually makes a ground read as
   * composed — and it is not the property this file used to assert.
   *
   * The previous version counted whether luminance rose or fell and required one direction to dominate.
   * The shipped palette satisfied it, and the owner's verdict on the result was "the same colour all
   * along". Both are correct: a monotone descent with nothing else in it is *invisible* monotonicity —
   * the four legs measured ΔE 9.8 / 4.6 / 2.6, i.e. the last two thirds of a 16,384px page moved by less
   * than the ~10 at which a change registers. The assertion was proving the wrong thing, so the wrong
   * thing is what it was guarding.
   *
   * What a tour has to satisfy instead, and what the 002 Amendment Record #4 now says:
   *
   *  - **every leg perceptible** — adjacent stages at least ΔE 9 apart;
   *  - **no leg retraced** — a stage must not sit near the one two places along, which is the
   *    light-left / light-right alternation FR-003 exists to forbid, in three stops instead of two;
   *  - **it closes** — the final stage is the darkest on the page, so the movement has an end rather
   *    than a stop.
   *
   * CIE76 rather than CIEDE2000: the deltas being separated are 9-to-26, far above the point where the
   * two formulas disagree, and CIE76 is nine lines of maths against a dependency nobody asked for.
   */
  describe("perceptual travel — FR-003 as amended", () => {
    const toLab = (hex: string): readonly [number, number, number] => {
      const v = hex.replace("#", "");
      const lin = (i: number) => {
        const c = Number.parseInt(v.slice(i, i + 2), 16) / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      const [x, y, z] = [
        0.4124 * lin(0) + 0.3576 * lin(2) + 0.1805 * lin(4),
        0.2126 * lin(0) + 0.7152 * lin(2) + 0.0722 * lin(4),
        0.0193 * lin(0) + 0.1192 * lin(2) + 0.9505 * lin(4),
      ].map((n, i) => n / [0.95047, 1, 1.08883][i]!);
      const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
      const [fx, fy, fz] = [x, y, z].map(f);
      return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
    };
    const deltaE = (a: string, b: string) => {
      const p = toLab(a);
      const q = toLab(b);
      return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    };
    const stages = PROGRESSION.map((s) => s.color);

    it("has a perceptible leg between every pair of adjacent stages", () => {
      stages.slice(1).forEach((colour, i) => {
        const leg = deltaE(stages[i]!, colour);
        expect(leg, `${stages[i]} → ${colour} travels only ΔE ${leg.toFixed(1)}; below ~9 nobody sees it`).toBeGreaterThanOrEqual(
          9,
        );
      });
    });

    it("never retraces itself two stops on, which is what alternation looks like", () => {
      stages.slice(0, -2).forEach((colour, i) => {
        const apart = deltaE(colour, stages[i + 2]!);
        expect(apart, `${colour} is only ΔE ${apart.toFixed(1)} from ${stages[i + 2]} — the tour doubles back`).toBeGreaterThanOrEqual(
          6,
        );
      });
    });

    it("closes on the darkest tone on the page", () => {
      const last = luminanceOf(stages.at(-1)!);
      for (const colour of stages.slice(0, -1)) expect(last).toBeLessThan(luminanceOf(colour));
    });

    it("keeps the dimmest meaningful text above 5:1 at every interpolated point, not only at AA", () => {
      for (const p of sweep) {
        const tone = toneAt(p);
        for (const [name, colour] of Object.entries(SCENE_TEXT_COLOURS)) {
          const ratio = contrastOn(colour, tone);
          expect(ratio, `${name} on ${tone} at ${p.toFixed(3)} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(5);
        }
      }
    });

    it("travels far enough in total that the shopper cannot mistake it for a static canvas", () => {
      // The measurement that condemned the previous palette: sum of legs 17.0 against a straight-line
      // distance of 16.9 — a slide, not a tour. A tour's legs have to add up to more than its endpoints
      // differ by, or there is only one direction in it and depth was the only axis available.
      const legs = stages.slice(1).reduce((sum, colour, i) => sum + deltaE(stages[i]!, colour), 0);
      const endpoints = deltaE(stages[0]!, stages.at(-1)!);
      expect(legs).toBeGreaterThan(endpoints * 2.5);
      expect(legs).toBeGreaterThanOrEqual(60);
    });
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

describe("interior page grounds — owner decision 5", () => {
  const tones = Object.entries(INTERIOR_GROUNDS);

  it("has a tone for every shopper route family, and none of them is the homepage", () => {
    expect(tones.length).toBeGreaterThanOrEqual(8);
    expect(tones.map(([path]) => path)).not.toContain("/");
  });

  it("keeps every settled tone inside the legibility band", () => {
    for (const [path, colour] of tones) {
      const l = luminanceOf(colour);
      expect(l, `${path} → ${colour} luminance ${l.toFixed(4)}`).toBeGreaterThanOrEqual(LEGIBILITY_BAND.min);
      expect(l, `${path} → ${colour} luminance ${l.toFixed(4)}`).toBeLessThanOrEqual(LEGIBILITY_BAND.max);
    }
  });

  /**
   * The control run for this whole file: a tone that leaves the band, or a text colour that was never in
   * `SCENE_TEXT_COLOURS`, is exactly how `#E4573F` on white ended up at 3.66:1 on a surface nobody had
   * measured against. So assert against every declared text colour, not a representative sample.
   */
  it("holds every meaningful text colour at or above 5:1 on each settled tone", () => {
    for (const [path, ground] of tones) {
      for (const [name, colour] of Object.entries(SCENE_TEXT_COLOURS)) {
        const ratio = contrastOn(colour, ground);
        expect(ratio, `${name} on ${path} (${ground}) is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it("resolves a route to its family by longest prefix", () => {
    expect(interiorGround("/shop")).toBe(INTERIOR_GROUNDS["/shop"]);
    expect(interiorGround("/shop/گوشی-موبایل-شیائومی")).toBe(INTERIOR_GROUNDS["/shop"]);
    expect(interiorGround("/partners/thanks")).toBe(INTERIOR_GROUNDS["/partners"]);
    expect(interiorGround("/orders/1234")).toBe(INTERIOR_GROUNDS["/orders"]);
  });

  it("gives the homepage, the operations surface and unknown routes no settled tone", () => {
    // `/` is the tour's own case, and `/admin` is not a shopper page: owner decision 5 was about shoppers.
    expect(interiorGround("/")).toBeNull();
    expect(interiorGround("/admin")).toBeNull();
    expect(interiorGround("/admin/orders")).toBeNull();
    expect(interiorGround("/no-such-page")).toBeNull();
  });
});
