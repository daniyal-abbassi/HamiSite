# FR-046 — the pagination decision, measured

**Surface**: `components/shop/ShopResults.tsx` (the page-number control) · **Question**: where a change
of selection can cross an arbitrarily large distance, what happens at long distances — and what justifies
it. **Date**: 2026-09-28.

## Status note, read first

This file was opened when the file was reassigned to another session mid-task (their backlog adds an
entrance motion to the same component). **The marker was already wired and verified here before the
handover** — `ShopResults.tsx` in the working tree carries the `LiquidSelection` wiring, and the evidence
below is that run's. What this report owns is the FR-046 *decision*: the measurement, and the
`maxTravelPx` recommendation for whoever touches the surface next. Nothing here edits the shared
component or its frozen constant.

## The measurements

**How many result pages does `/shop` really have?** Page size is `SHOP_PAGE_SIZE = 12`
(`lib/content/shop.ts:1`). Measured on the live page (the toolbar's own count, `p[aria-live]`):

| filter | products | pages |
|---|---|---|
| none (unfiltered) | 189 | **16** |
| largest brand — `?brand=اپل` | 49 | **5** |
| largest category — `?category=موبایل-و-تبلت` | 135 | **12** |

**Does the control ellipsise?** **No.** `pageWindow(page, totalPages)` returns a contiguous window of
at most 5 page buttons — `[max(1, page-2) … min(total, page+2)]` — with no ellipsis and no collapsed
middle. Measured directly: every filter above renders exactly `["۱","۲","۳","۴","۵"]` at page 1.

**What is the maximum distance the marker can ever be asked to travel?** The window holds 5 buttons, so
the longest single trip is first-to-last = 4 slots. The buttons are `size-11` (44 px) with `gap-1.5`
(6 px), except at 360 px where the flex nav shrinks them to 39 px to fit its 312 px container (measured;
the shrink is pre-existing, not introduced by the marker):

| viewport | button | pitch | first → last (4 slots) |
|---|---|---|---|
| 360 px | 39 px | 45 px | **180 px** |
| 1280 px | 44 px | 50 px | **200 px** |

After each click the window re-centres on the new page, so **no single trip can exceed 4 slots** — the
distance is bounded by the markup, not by the geometry. The "unbounded distance" the spec refused to
guess about is answered by a `pageWindow` size of 5.

## The decision

**Keep `MAX_TRAVEL_PX = 320`. No per-surface `maxTravelPx` override is needed on this surface.**

- The constant already clears the primary navigation's longest trip (267 px) with 53 px to spare, and
  the deck's fit budget depends on it staying put.
- On this surface the maximum possible trip is **200 px** (1280 px) — 120 px under the ceiling. The
  5-button window, not the constant, is what actually bounds travel here, so the ceiling is never
  engaged: every trip **travels**, none is suppressed to an arrival.
- Lowering it would be guessing; raising it would be pointless. The measurement says the existing
  constant is already correct.

**Verified end to end** (`verification/surf-b-interaction.json`, both viewports): a jump from page 1 to
page 16 through the window (۵ → ۷ → ۹ → ۱۱ → ۱۳ → ۱۵ → ۱۶) arrives with the marker resting on ۱۶, and
**every leg shows the mid-flight squash** (`peakW > restW × 1.05`) — i.e. every leg travelled rather
than being suppressed. One marker in the group; no per-item active background survives beside it
(`border-aqua`/`bg-aqua/15` on the current number is gone — the marker is the one indication);
`aria-current="page"` is byte-identical to the pre-wiring capture.

## Honesty notes

- The two chevrons («صفحه قبل» / «صفحه بعد») stay **outside** the marker's group: they move the page, they
  are not answers to "which page am I on", and a marker resting on a stepper would claim a destination
  that does not exist.
- At 360 px the nav's buttons are 39 px, not 44 px — the flex container shrinks them to fit. This is the
  pre-existing behaviour (measured before the wiring); the marker's row reproduces it exactly
  (`!flex-nowrap !min-w-0` on the group so the row cannot wrap and spill onto a second line).
- The verification machine is not an instrument: no frame-rate or smoothness claim is made anywhere in this
  report. The squash/travel evidence is the marker's measured width across in-page `requestAnimationFrame`
  samples, which is geometry, not a smoothness judgement.
