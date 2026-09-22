"use client";

/**
 * Desktop scroll easing — feature 002, Resolved Question 1 = C.
 *
 * The owner's ask, in their words: "by calmer scroll, i mean the movement should be smooth, up and down
 * scrolling should be smooth and heavy — not the background." That is scroll *physics*, and the answer
 * chosen (C) eases the desktop wheel and trackpad while leaving touch native.
 *
 * **Touch stays native by default, and that is a property of the library rather than a guard in this
 * file.** `node_modules/gsap/ScrollSmoother.js:121` computes the smoothing duration as
 * `isTouch === 1 ? parseFloat(smoothTouch) || 0 : parseFloat(smooth) || 0.8` — an unset `smoothTouch`
 * parses to `0`, so on a touch device the lerp is zero and the browser's own momentum scroll is
 * untouched. That matters because a phone already runs OS-level momentum tuned per device, and a JS
 * lerp layered over it usually reads as slushy and late rather than expensive. C is therefore the
 * option that buys the desktop quality without spending the mobile one, which is also what the
 * standing mobile-first instruction requires.
 *
 * ## The constraint that shapes the whole layout
 *
 * ScrollSmoother animates by writing a `transform` to `#smooth-content`. A transformed ancestor becomes
 * the containing block for `position: fixed` descendants, so **every fixed element inside the content
 * would start scrolling with the page instead of staying put.** This is the same mechanism that made
 * feature 002's ground layer need mounting outside `<main>` (research D3) and the reason `.tray-field`
 * documents `background-attachment: fixed` not working inside a `Reveal` wrapper.
 *
 * So the fixed layers — the page ground, the star field, the blur, the header island and the mobile
 * dock — are siblings of `#smooth-wrapper`, not children of it. Only document flow goes inside. This
 * is not a stylistic preference: if anything fixed is moved into the wrapped subtree it will silently
 * begin scrolling, and it will look fine on a static screenshot, which is how this class of bug ships.
 *
 * ## What this does to the rest of the spec
 *
 * It replaces the "scrolling stays completely native" clause that Resolved Q1 = A wrote into FR-010 and
 * FR-011. Easing the scroll means a key press no longer moves the document instantly on desktop — the
 * lerp is input-agnostic. That is the requested behaviour, and the requirements were amended to match
 * rather than left contradicting the build.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

/**
 * Lerp time in seconds. 1.5 is deliberately weighty — the brief is "smooth and heavy", and the common
 * failure is to set this so low the effect is inaudible, or so high the page feels like it is dragging
 * through wet sand and a shopper overshoots the row they were aiming at. Review on a real trackpad,
 * not on a screenshot.
 */
const SMOOTH_SECONDS = 1.5;

let registration: Promise<typeof import("gsap").default> | null = null;
/**
 * The plugins are imported dynamically rather than at module scope. This component is mounted inside a
 * client boundary that every visitor loads, and ScrollSmoother should not be parsed on a phone where
 * `shouldEase()` will refuse it anyway.
 */
function ensureRegistered(): Promise<typeof import("gsap").default> {
  if (!registration) {
    registration = (async () => {
      const { default: gsap } = await import("gsap");
      await import("gsap/ScrollTrigger");
      await import("gsap/ScrollSmoother");
      // ScrollSmoother is a ScrollTrigger plugin; registering it alone leaves the scroller unmeasured.
      gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
      return gsap;
    })();
  }
  return registration;
}

/**
 * Desktop-only, and deliberately not a `min-width` test. A touchscreen laptop is wide and would be
 * caught by a viewport query while wanting native touch scrolling; `pointer: fine` and the absence of
 * `any-pointer: coarse` ask the question actually being posed — is this a precision-pointer device?
 *
 * `prefers-reduced-motion` opts out entirely: an eased scroll *is* motion the shopper did not initiate,
 * and the page stays fully usable natively, so nothing is withheld by standing down.
 */
function shouldEase(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  const mq = (q: string) => window.matchMedia(q).matches;
  if (mq("(prefers-reduced-motion: reduce)")) return false;
  if (mq("(any-pointer: coarse)")) return false;
  return mq("(pointer: fine)");
}

export function ScrollSmooth({ children }: { children: ReactNode }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shouldEase() || !wrapper.current || !content.current) return;
    let cancelled = false;
    let instance: { kill: () => void; refresh: (soft?: boolean, force?: boolean) => void } | null = null;

    void ensureRegistered().then(() => {
      if (cancelled || !wrapper.current || !content.current) return;
      instance = ScrollSmoother.create({
        wrapper: wrapper.current,
        content: content.current,
        smooth: SMOOTH_SECONDS,
        // Left unset on purpose: the default is what keeps touch native (see the file header).
        effects: false,
        normalizeScroll: false,
        ignoreMobileResize: true,
      });
      // Layout that depends on measured positions — the categories arc and the ground's stage
      // boundaries — has to be re-taken once the smoother owns the scroll position.
      requestAnimationFrame(() => instance?.refresh(true));
    });

    return () => {
      cancelled = true;
      instance?.kill();
    };
  }, []);

  return (
    <div id="smooth-wrapper" ref={wrapper}>
      <div id="smooth-content" ref={content}>
        {children}
      </div>
    </div>
  );
}
