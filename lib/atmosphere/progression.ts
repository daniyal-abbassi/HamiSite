/**
 * The homepage atmosphere progression — the tonal ground as a pure function of scroll position.
 *
 * Two requirements make this a module rather than some CSS, and both are things a browser cannot
 * check cheaply:
 *
 *  - **FR-015 / SC-004** — "no meaningful text falls below its legibility threshold at any intermediate
 *    point — zero failing measurements, not an average." A progression can pass at every stage and fail
 *    between two of them, and only while the page is moving.
 *  - **FR-007** — the tone must be exactly right at any entry position, including the top and the
 *    bottom, after a reload, after back/forward, and after an end-key jump.
 *
 * Both are properties of a function, so they are asserted in
 * `tests/unit/atmosphere-progression.test.ts` over a 500-step sweep, and the browser only has to
 * confirm the function is wired to the pixels.
 *
 * **No DOM here.** Layout numbers come in as arguments; nothing reads `window`. That keeps this in the
 * existing node-environment test harness — research.md D6 refuses a DOM harness, and a module that
 * touches the document could not be tested at all.
 *
 * The direction is deliberate and it is the whole point of the feature: the page today alternates
 * light left, light right, light left (`app/globals.css:193-214`), which is why it reads busy. This
 * progression moves one way only — a steady descent from the warm opening at the hero into the deepest
 * oxblood at the closing call to action. FR-003 asks for "a single deliberate sequence with a clear
 * overall direction"; the monotonicity assertion in the test is what stops it decaying back into an
 * alternation.
 */

/** Verified against the rendered page in T001/T004 — see `baseline/ground-record.json`. */
export const HOMEPAGE_SECTIONS = [
  "top",
  "featured",
  "categories",
  "brands",
  "new-arrivals",
  "b2b",
  "accessories",
  "online-services",
  "store-experience",
  "trust",
  "final-conversion",
] as const;

export type SectionAnchor = (typeof HOMEPAGE_SECTIONS)[number];

export type AtmosphereStage = {
  readonly key: string;
  readonly anchor: SectionAnchor;
  /** `#rrggbb`. Compared and interpolated as text, so the exact case is not load-bearing. */
  readonly color: string;
};

/**
 * Four stages. The spec's own coherence assumption is that "three or four closely-related stages that
 * reads as one movement satisfies this feature; many contrasting stages do not" — so four, all inside
 * one hue family, moving only in depth.
 *
 * The opening tone is not invented: `#2A0409` sits inside the range the current hero gutter measures
 * (`#3d0912` → `#3f0912` in the baseline), so the top of the page is the page shopper already sees.
 *
 * The deepest is `#0D0205` rather than the darker `#0A0103` first tried, and the reason is worth keeping
 * because it is not obvious: sRGB→luminance switches from the linear branch to the power branch at
 * 0.04045, which is byte 10 on a channel. `#0A0103` sits below that knee and measures 0.000928 — under
 * the band floor — while `#0D0205`, three bytes brighter in red, measures 0.001399. The band assertion
 * in the unit test is what found it.
 */
export const PROGRESSION = [
  { key: "arrival", anchor: "top", color: "#2A0409" },
  { key: "goods", anchor: "categories", color: "#1C0206" },
  { key: "trade", anchor: "b2b", color: "#130104" },
  { key: "close", anchor: "final-conversion", color: "#0D0205" },
] as const satisfies readonly AtmosphereStage[];

/**
 * The band every tone — stage or interpolated — must stay inside.
 *
 * `max` is the binding edge: the ground is behind light text, so a lighter ground is the only way this
 * layer can make the page harder to read. 0.0200 relative luminance still leaves the dimmest declared
 * text above 5:1. `min` exists so the descent cannot collapse into flat black, which would erase the
 * glows this feature is layered over and read as an unstyled page rather than a deep one.
 */
export const LEGIBILITY_BAND = { min: 0.001, max: 0.02 } as const;

/**
 * Opaque stand-ins for the text actually rendered on the homepage, composited by hand against the
 * darkest plausible ground so the alpha is not doing the arithmetic for us.
 *
 * `foreground/50` and anything dimmer is deliberately absent: those are used on the light "paper"
 * chapter's own surfaces, not on the atmosphere ground, and pretending otherwise would let a real
 * failure hide behind an over-strict list.
 */
export const SCENE_TEXT_COLOURS = {
  heading: "#F0ECE9",
  body: "#E8E3E0",
  muted: "#B9B3B0",
  meta: "#9A938F",
  champagne: "#E5D3B3",
  champagneDeep: "#C5A880",
} as const;

/** The tone used when the effect cannot run — FR-024 forbids an unstyled default. */
export const FALLBACK_TONE = "#130104";

const clamp01 = (value: number) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);

const toRgb = (hex: string): readonly [number, number, number] => {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
};

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;

const channelLuminance = (byte: number) => {
  const c = byte / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export function luminanceOf(hex: string): number {
  const [r, g, b] = toRgb(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** WCAG 2.x contrast ratio between a text colour and the ground behind it. */
export function contrastOn(text: string, ground: string): number {
  const a = luminanceOf(text);
  const b = luminanceOf(ground);
  const [higher, lower] = a > b ? [a, b] : [b, a];
  return (higher + 0.05) / (lower + 0.05);
}

/**
 * Where each stage begins, as a fraction of scrollable height.
 *
 * With no layout given, stages are placed at their anchor section's position in the document order —
 * even enough to be honest, and stable under test. `useScrollProgress` passes real section offsets so
 * the boundaries land where the shopper actually sees the section, which is FR-002: the shift must read
 * as belonging to the page's structure, not as an independent animation.
 */
export function stageBoundaries(sectionOffsets?: readonly number[]): readonly number[] {
  return PROGRESSION.map((stage) => {
    const index = HOMEPAGE_SECTIONS.indexOf(stage.anchor);
    if (sectionOffsets && sectionOffsets.length === HOMEPAGE_SECTIONS.length) {
      return clamp01(sectionOffsets[index] ?? 0);
    }
    return clamp01(index / (HOMEPAGE_SECTIONS.length - 1));
  });
}

export function toneAt(progress: number, boundaries: readonly number[] = stageBoundaries()): string {
  const p = clamp01(progress);
  const bounds = boundaries.length === PROGRESSION.length ? boundaries : stageBoundaries();
  let segment = 0;
  for (let i = 1; i < bounds.length; i += 1) {
    if (p >= (bounds[i] ?? 1)) segment = i;
  }
  const from = PROGRESSION[segment]!;
  const to = PROGRESSION[Math.min(segment + 1, PROGRESSION.length - 1)]!;
  if (from === to) return from.color;

  const span = (bounds[segment + 1] ?? 1) - (bounds[segment] ?? 0);
  const local = span <= 0 ? 0 : clamp01((p - (bounds[segment] ?? 0)) / span);
  const [r1, g1, b1] = toRgb(from.color);
  const [r2, g2, b2] = toRgb(to.color);
  // Interpolated in linear-ish sRGB channel space rather than in HSL: the tones are close enough that
  // a straight channel blend cannot pass through a hue the shopper would read as different, and it
  // keeps `toneAt` free of a colour library.
  return toHex(r1 + (r2 - r1) * local, g1 + (g2 - g1) * local, b1 + (b2 - b1) * local);
}

/**
 * FR-020: the reduced-motion page gets distinct settled tones per region with no animated travel.
 * Same stages, same count — the shopper cannot tell they received a shorter progression (FR-021).
 */
export function reducedMotionTone(progress: number, boundaries: readonly number[] = stageBoundaries()): string {
  const p = clamp01(progress);
  const bounds = boundaries.length === PROGRESSION.length ? boundaries : stageBoundaries();
  let segment = 0;
  for (let i = 1; i < bounds.length; i += 1) {
    if (p >= (bounds[i] ?? 1)) segment = i;
  }
  return PROGRESSION[segment]!.color;
}
