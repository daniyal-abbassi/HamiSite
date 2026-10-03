"use client";

/**
 * Desktop scroll easing — feature 002, Resolved Question 1 = C.
 *
 * The owner's ask, in their words: "by calmer scroll, i mean the movement should be smooth, up and down
 * scrolling should be smooth and heavy — not the background." That is scroll *physics*, and the answer
 * chosen (C) eases the desktop wheel and trackpad while leaving touch native.
 *
 * ## Why Lenis and not ScrollSmoother
 *
 * The first build used `gsap/ScrollSmoother`. It was replaced on 2026-09-22 after the owner named a
 * reference site (nocturne-label.vercel.app) whose scroll they wanted; the reference runs Lenis at its
 * defaults, and the two mechanisms are not equivalent:
 *
 * - ScrollSmoother animates a **transform on `#smooth-content`** while the document itself jumps
 *   straight to the target. The visible page and the scrollbar are two different positions.
 * - Lenis animates the **real document scroll** (`setScroll` calls `window.scrollTo({behavior:"instant"})`
 *   once per frame at a lerped value, `node_modules/lenis/dist/lenis.mjs:532`). `window.scrollY`, the
 *   scrollbar, `getBoundingClientRect()`, IntersectionObserver and the browser's own anchor handling all
 *   report the position the shopper is actually looking at.
 *
 * The second consequence is the one that matters for this codebase: a transformed ancestor becomes the
 * containing block for `position: fixed` descendants, so ScrollSmoother forced the ground layer, star
 * field, blur, header and mobile dock out of the wrapped subtree, and required `#smooth-wrapper` to be
 * threaded through `app/(main)/layout.tsx`. Lenis creates no containing block, so **nothing in the
 * layout has to know it exists** — which is also why this component returns `null` and takes no children.
 *
 * ## What is deliberately left alone
 *
 * `syncTouch` is `false` by default (`lenis.mjs:434`), so touch input never reaches Lenis's animation:
 * a phone keeps its per-device OS momentum, and FR-011a holds because of the library's default rather
 * than a guard in this file. The gate below still refuses to construct an instance on a coarse-pointer
 * device, so a mobile visitor does not pay for the module at all.
 *
 * Keyboard is not eased either — Lenis binds no `keydown` handler, so PageDown and End move the document
 * instantly and `onNativeScroll` re-syncs the animation to where the shopper put them. WCAG-wise that is
 * an improvement over the previous mechanism, and it means the "no key press is instant" reading of
 * FR-010/FR-011 in the spec's first amendment was describing ScrollSmoother, not this build.
 *
 * Every other option is left at its default — `lerp 0.1`, `smoothWheel true`, `wheelMultiplier 1`,
 * `overscroll true`, `respectReducedMotion true`. Starting from the reference site's own tuning is the
 * point of copying the reference site; re-tune from measurement and feel, not from guesswork.
 *
 * **One default is deliberately turned off: `allowNestedScroll`.** With the library's default of `false`,
 * a vertical wheel gesture is captured wherever it lands, so scrolling the cart line-items list
 * (`components/cart/CartDrawer.tsx:96`), the shop filter sheet body
 * (`components/shop/FilterSheet.tsx:143`) or the saved-addresses list on checkout
 * (`components/checkout/CheckoutClient.tsx:444`) would move the page *behind* the open panel instead of
 * the panel. `allowNestedScroll: true` makes Lenis consult `hasNestedScroll()` before capturing
 * (`lenis.mjs:609`, helper at `lenis.mjs:858`): it stands down while the element under the cursor can
 * consume the delta, honours `overscroll-behavior: contain` at the boundary, and hands the gesture back
 * to the page once the inner box is spent. The reference site is a brochure with no scrollable overlays,
 * so copying it exactly here would import a bug rather than a look.
 */

import { useEffect } from "react";

type LenisModule = typeof import("lenis").default;

let loading: Promise<LenisModule> | null = null;

/**
 * Imported dynamically rather than at module scope: this mounts in the layout every visitor loads, and
 * the easing is refused outright on touch devices, so they should not have to parse it.
 */
function ensureLenis(): Promise<LenisModule> {
  if (!loading) {
    loading = import("lenis").then((m) => m.default);
  }
  return loading;
}

/**
 * Desktop-only, and deliberately not a `min-width` test. A touchscreen laptop is wide and would be
 * caught by a viewport query while wanting native touch scrolling; `pointer: fine` plus the absence of
 * `any-pointer: coarse` asks the question actually being posed — is this a precision-pointer device?
 *
 * `prefers-reduced-motion` opts out here as well as inside Lenis. An eased scroll is motion the shopper
 * did not ask for, and standing down costs nothing: the page still scrolls natively.
 */
function shouldEase(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  const mq = (q: string) => window.matchMedia(q).matches;
  if (mq("(prefers-reduced-motion: reduce)")) return false;
  if (mq("(any-pointer: coarse)")) return false;
  return mq("(pointer: fine)");
}

export function ScrollSmooth() {
  useEffect(() => {
    if (!shouldEase()) return;
    let cancelled = false;
    let frame = 0;
    let lenis: InstanceType<LenisModule> | null = null;

    void ensureLenis().then((Lenis) => {
      if (cancelled) return;
      // `autoRaf` is false by default, which is why the loop below is mandatory and not an optimisation.
      lenis = new Lenis({ allowNestedScroll: true });
      const raf = (time: number) => {
        lenis?.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, []);

  return null;
}
