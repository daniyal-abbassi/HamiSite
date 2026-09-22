# T045 — Scroll easing: measured, and where the first measurement was wrong

**Run**: 2026-09-22, headless Chromium via Playwright. Resolved Question 1 = C.

## The signal, and a trap

ScrollSmoother keeps the **native scrollbar at the target** and renders the content at a lerped position
behind it. So `window.scrollY` arrives instantly and tells you nothing about whether easing is happening.

A first probe measured exactly that and reported **`eased: false`** on a build that was demonstrably
easing. The lag between `scrollY` and `#smooth-content`'s `translateY` is the only honest signal, and it
is what is measured below.

## Desktop: eased

One `wheel(0, 1200)` at 1280×900, sampled every 90ms.

| t (ms) | `scrollY` | content `translateY` | lag (px) |
|---|---|---|---|
| 0 | 0 | 0 | 0 |
| 90 | 1200 | 350 | **850** |
| 180 | 1200 | 350 | 850 |
| 270 | 1200 | 954 | 246 |
| 360 | 1200 | 1134 | 66 |
| 450 | 1200 | 1170 | 30 |
| 630 | 1200 | 1193 | 7 |
| 810 | 1200 | 1199 | 1 |
| 1080 | 1200 | 1200 | 0 |

Peak 850px of lag, settling to zero over roughly a second. That is the "smooth and heavy" the brief
names — a single notch moves the document a long way and the page follows it down rather than snapping.

## Touch: native, because the library defaults that way

iPhone 13 emulation. `matchMedia("(pointer: coarse)")` true, so `shouldEase()` refuses and the smoother
is **never constructed**: `#smooth-content` computes `transform: none` and `scrollTo(0, 2000)` lands at
2000 within one sample.

This is not a guard this feature wrote. `ScrollSmoother.js:121` computes the smoothing duration as
`isTouch === 1 ? parseFloat(smoothTouch) || 0 : parseFloat(smooth) || 0.8` — an unset `smoothTouch`
parses to `0`. **`smoothTouch` is therefore deliberately absent from the options object**, and adding it
is the way to break FR-011a without noticing.

## Reduced motion: identical to touch

`reducedMotion: "reduce"` context. Smoother not created, `transform: none`, jump to 2500 instant. The
page is fully usable and nothing is withheld — an eased scroll is motion the shopper did not initiate, so
standing down is the correct response rather than a degraded one.

## Fixed layers still anchored — the constraint that shaped the layout

With content at `scrollY: 4000`:

| Layer | viewport top |
|---|---|
| `.hami-page-ground` | 0 |
| `.gradient-blur` | 0 |

Both hold, because `app/(main)/layout.tsx` makes every fixed element a **sibling** of `#smooth-wrapper`.
A transformed ancestor becomes the containing block for `position: fixed` descendants, so anything left
inside `#smooth-content` would travel with the page — and would look correct in a static screenshot,
which is how this class of bug ships. Same mechanism as research D3 and the `.tray-field` note about
`background-attachment: fixed` inside a `Reveal` wrapper.

`--hami-ground` still tracks position through the smoother: `#180205` at 4000 → `#0e0205` at 11000.

## Two things this does not settle

1. **Cost.** Measured in dev mode, not on a production build under CPU throttle. A permanently-running
   rAF lerp over a 19,134px document is precisely the change that must be re-measured, and 004 recorded
   33.3ms median frames on this page. That is **T047**, still open.
2. **FR-005.** Unchanged and still failing as measured in `notes/busyness.md`. Easing the scroll says
   nothing about the background glow field, which is what that gate was about. The Q2 = B/A/C decision
   remains the owner's and remains the only thing between this feature and completion.

## Reproducing

```bash
PLAYWRIGHT_PATH=/home/lain/tools/pixel-bridge-mcp/node_modules/playwright node /tmp/eased.mjs
```

The probe is ephemeral. If this feature is to be re-verified it belongs at
`specs/002-scroll-atmosphere/tools/scroll-easing.mjs`, and it must keep sampling the **content
transform**, not `scrollY` — that is the mistake recorded at the top of this file.
