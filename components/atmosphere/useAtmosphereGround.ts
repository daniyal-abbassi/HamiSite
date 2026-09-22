"use client";

import { useEffect, useRef } from "react";
import { HOMEPAGE_SECTIONS, PROGRESSION, reducedMotionTone, toneAt } from "@/lib/atmosphere/progression";

/** The one custom property this feature owns. Everything else is derived from it in CSS. */
export const GROUND_PROPERTY = "--hami-ground";

/**
 * Scroll progress → one colour, written once per animation frame.
 *
 * This is research.md D1 in code. The whole effect is a single custom-property write on
 * `documentElement`, which triggers a style recalculation on one element and a repaint of one fixed
 * layer. It cannot cause layout, and it cannot be felt as lag because it never blocks the scroll.
 *
 * Three things it deliberately does not do:
 *
 *  - **It never touches the scroll position.** No `preventDefault`, no `scrollTo`, no easing of the
 *    shopper's own input. Q1 = A: "Visuals only; scrolling stays completely native." Everything the
 *    browser does with a wheel, a flick or an arrow key is the browser's business.
 *  - **It does not measure layout per frame.** Section offsets are read on mount, on resize, on
 *    orientation change and once after load — never inside the frame loop. Eleven
 *    `getBoundingClientRect()` calls per frame is the classic way to turn a colour change into jank.
 *  - **It does not animate the colour.** The value updates every frame, so a CSS transition on top
 *    would make the ground *lag* the content — contract S4 forbids exactly that. Smoothness comes from
 *    update density, not from interpolation, and "no catch-up animation on return" (FR-025) stops being
 *    a case that needs handling.
 *
 * Reduced motion is the same loop with a different function: `reducedMotionTone` returns one settled
 * stage colour per region instead of an interpolated one, so the shopper gets distinct tones with no
 * travel — FR-020 — over an identical page, FR-021.
 */
export function useAtmosphereGround(enabled = true): void {
  const boundaries = useRef<readonly number[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;

    const measure = () => {
      const scrollable = root.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        boundaries.current = [];
        return;
      }
      // Document-space offsets, which for a normal in-flow section is the same on every read. The
      // up-to-26px displacement a mid-reveal `Reveal` wrapper carries is noise at this scale and is
      // re-read on resize, which is the only time boundaries genuinely move.
      boundaries.current = HOMEPAGE_SECTIONS.map((id) => {
        const el = document.getElementById(id);
        if (!el) return 0;
        return Math.min(1, Math.max(0, el.getBoundingClientRect().top + window.scrollY) / scrollable);
      });
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let frame = 0;
    const write = () => {
      frame = 0;
      const scrollable = root.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      const pick = reduced.matches ? reducedMotionTone : toneAt;
      root.style.setProperty(GROUND_PROPERTY, pick(progress, boundaries.current));
    };

    const schedule = () => {
      // Coalesce to one write per frame however many scroll events arrive.
      if (!frame) frame = requestAnimationFrame(write);
    };

    const onVisibility = () => {
      if (document.hidden) return;
      measure();
      write();
    };

    measure();
    write();

    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule, { passive: true });
    addEventListener("orientationchange", schedule, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", schedule);
    // Late content — images settling, fonts swapping — moves section tops.
    const settle = setTimeout(measure, 1500);
    addEventListener("load", measure, { once: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      clearTimeout(settle);
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
      removeEventListener("orientationchange", schedule);
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", schedule);
      removeEventListener("load", measure);
    };
  }, [enabled]);
}

/** How many stages the ground can be in — exported so the component and the notes agree. */
export const STAGE_COUNT = PROGRESSION.length;
