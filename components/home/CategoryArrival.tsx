"use client";

/**
 * The categories arrival — feature 010, US2.
 *
 * This is the feature's only client boundary, and it renders nothing of its own: the grid arrives as `children`
 * from `CategoryHub`, already laid out by CSS. That split is the whole design. The stylesheet owns where every
 * tile sits, so this file is allowed to be decorative — and being decorative means it is allowed to fail.
 *
 * Two rules make the failure harmless:
 *
 * 1. **`gsap.from()`, never `to()`.** A `from` tween writes its start values into the elements when it is
 *    created, and it is created only inside the observer callback. So the hidden state exists in script memory
 *    and nowhere else — not in the HTML, not in the stylesheet. A shopper whose script never arrives, is blocked,
 *    or errors out mid-chunk sees exactly what CSS drew: nine composed tiles. A `to()` tween starting from
 *    `opacity: 0` in CSS would leave them staring at an empty box, which is the defect FR-011 exists to stop,
 *    and `verification/q6-arrival.md` proves the difference by blocking this chunk.
 * 2. **`clearProps` on completion.** When the arrival ends the tiles carry no inline styles at all, so the
 *    settled DOM is the server's markup and nothing lingers to fight the hover transition later.
 *
 * There is deliberately no scroll listener here. The trigger is an `IntersectionObserver`, which cannot convert
 * a shopper's vertical scroll into something else — the property 005's contract G1 was written to forbid, on a
 * page long enough that it is the single most damaging thing a section can do.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import {
  BLUR_PX,
  EASE,
  RESOLVE_DURATION,
  RISE_DURATION,
  RISE_OFFSET_PX,
  STAGGER,
  TRIGGER_ROOT_MARGIN,
  TRIGGER_THRESHOLD,
} from "@/lib/category-masonry";

/**
 * Module scope, not component state: a remount resets state and the arrival would replay. FR-009 says once per
 * visit, so this flag lives here rather than in component state.
 */
let hasPlayed = false;

export function CategoryArrival({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasPlayed) return;
    const node = ref.current;
    if (!node) return;
    // Checked before anything is armed: under reduced motion there is no tween to create, no observer to
    // run, and nothing to clean up. The CSS never hid a tile, so "do nothing" is the finished state.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    let observer: IntersectionObserver | null = null;

    const play = () => {
      if (observer) observer.disconnect();
      observer = null;
      hasPlayed = true;

      const tiles = node.querySelectorAll<HTMLElement>(".cat-masonry__item");
      const art = node.querySelectorAll<HTMLElement>(".cat-card__art");
      if (!tiles.length) return;

      // The rise is compositor-only, so all nine at once cost nothing. The blur is the expensive half and its
      // concurrency is bounded by the two durations below — see research D4 and contract Q7.
      gsap.from(tiles, {
        opacity: 0,
        y: RISE_OFFSET_PX,
        duration: RISE_DURATION,
        stagger: STAGGER,
        ease: EASE,
        clearProps: "opacity,transform",
      });
      // The image layer only. A blurred Persian word is a word the shopper cannot read during the arrival, and
      // FR-005 outranks the effect.
      //
      // `immediateRender: false` is what makes Q7's bound real. A `from()` tween writes its start value to every
      // target the moment it is created, so without this the browser was measured holding `blur(6px)` on all
      // nine image layers at once — nine layers to composite, whatever the stagger says about which one is
      // *changing*. Deferring the write means a tile carries a filter only during its own 0.32s turn, which is
      // at most three at a time. There is no visible snap from sharp to soft, because the rise tween has that
      // tile at opacity 0 when the blur lands.
      gsap.from(art, {
        filter: `blur(${BLUR_PX}px)`,
        duration: RESOLVE_DURATION,
        stagger: STAGGER,
        ease: EASE,
        immediateRender: false,
        clearProps: "filter",
      });
    };

    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) play();
      },
      { threshold: TRIGGER_THRESHOLD, rootMargin: TRIGGER_ROOT_MARGIN },
    );
    observer.observe(node);

    return () => observer?.disconnect();
  }, []);

  return <div ref={ref}>{children}</div>;
}
