/* The numbers the travelling marker moves by, and the one question it asks the
 * machine: may I move at all?
 *
 * Vendored from liquid-taffy (MIT) — `src/components/liquid/motion.ts` plus the
 * tween literals that were written inline in PillTabs.tsx. See UPSTREAM.md.
 * Everything here is a plain value: no DOM, no GSAP, no React, so
 * selection-geometry.ts and the unit tests can both read it. The only function
 * that touches a browser is prefersReducedMotion(), and it does that only when
 * called.
 *
 * The motion library is already a dependency of this storefront (package.json:
 * gsap ^3.15.0), so the port adds none (FR-035). */

/** Rounding noise on a measurement, in CSS pixels. */
export const TOLERANCE_PX = 0.5;

/**
 * The trip, in seconds, as one timeline with three overlapping acts — the
 * literals are upstream's, kept because the whole request was "its real motion,
 * not a paraphrase" (spec Assumptions).
 *
 * glide   x/y/width/height from slot to slot. Width rides alongside x, which is
 *         what makes the body arrive already becoming the next label's size.
 * squash  the stretch, held for the first stretch of the flight.
 * ring    everything back to rest on one elastic, so the landing overshoots once
 *         and settles rather than stopping.
 */
export const TRIP = {
  glide: 0.26,
  glideEase: "power3.inOut",
  squash: 0.11,
  squashEase: "power2.out",
  ring: 0.5,
  ringAt: 0.12,
  ringEase: "elastic.out(1, 0.32)",
} as const;

/** The gelatinous form, mid-flight. Long, low, leaning into the direction of travel. */
export const DEFORM = {
  scaleX: 1.25,
  scaleY: 0.78,
  /** Degrees; the sign comes from leanDegrees() in selection-geometry.ts. */
  skew: 8,
} as const;

/** Alias so the lean reads as what it is at the call site. */
export const DEGREES = DEFORM.skew;

/**
 * A held press (FR-012): the body squashes down and spreads, anchored on its own
 * base, as if the finger were actually standing on it. Released, it rings back.
 *
 * This is where the port deliberately goes further than upstream, which only
 * scaled the pressed label (`transform: scale(0.95)` on the tab) and never
 * deformed the pill. FR-012 asks the marker itself to deform, and the marker —
 * not the label — is what carries the meaning here.
 */
export const PRESS = {
  scaleX: 1.06,
  scaleY: 0.86,
  duration: 0.12,
  ease: "power2.out",
  /** Spread sideways from where it stands, don't shrink away from the finger. */
  origin: "50% 100%",
  release: 0.42,
  releaseEase: "elastic.out(1, 0.45)",
} as const;

/** The colour-only easing the CSS module rides on — the project's signature
 *  curve (tailwind.config.ts: transitionTimingFunction.DEFAULT). */
export const EASE_OUT_STRONG = "cubic-bezier(0.2, 0.7, 0.3, 1)";

/**
 * The one motion question every component here asks: may I move at all?
 *
 * Upstream's implementation, byte for byte in behaviour. Guarded because this
 * file is imported by a node-env test suite where `window` does not exist — the
 * answer there is "no", which is the safe direction to be wrong.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
