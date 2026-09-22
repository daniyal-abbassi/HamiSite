# Baseline — homepage ground before feature 002

Captured 2026-09-22 by [`../tools/baseline-capture.mjs`](../tools/baseline-capture.mjs) at
`HEAD` before any atmosphere work. Required by FR-005, contract clause P8 and SC-001, all of which are
comparisons against *today*.

```bash
PLAYWRIGHT_PATH=/path/to/node_modules/playwright node specs/002-scroll-atmosphere/tools/baseline-capture.mjs
```

## What is here

| Artifact | Contents |
|---|---|
| `360px/pos-*.png`, `1280px/pos-*.png` | 20 screenshots — 10 evenly spaced scroll positions × 2 widths. **This is the primary baseline** and what T016 diffs and T017 judges. |
| `ground-record.json` | Per position: the sampled gutter colour, the sampled element and its coordinates, plus the declared `background-color` / `background-image` of `body`, `body::before`, and every `main > section::before` / `::after`. Also the verified section order. |

## The colour series is partial, deliberately

Sampling "the ground" behind content is ambiguous on this page, and the first three attempts at this
harness each got it wrong in a different way: a viewport-edge probe at 1280px returned a constant
`#0b0204` (the bare body colour with every glow missed) and at one position returned `#faf4e6` — **a
cream card pixel recorded as if it were the environment**.

The tool now accepts a sample only where the hit-test lands on page structure — `main`, a `<section>`,
`.site-shell` — whose own background is transparent, so what is measured comes from the body glows and
the section `::before`/`::after` pseudos and nothing else. Each sample records the element and
coordinates it came from.

Where no such point exists at a position, the record says `no bare atmosphere point at this position`
rather than printing a number. That is **12 of 20 positions**; the usable 8 are listed below. Do not
treat the series as complete, and do not widen the predicate to make it look complete.

| Width | Progress | Sampled on | start / end gutter |
|---|---|---|---|
| 360 | 0.2222 | `section.wrap` | `#28070b` / `#150105` |
| 360 | 0.3333 | `section.wrap` | `#1a0206` / `#150105` |
| 360 | 0.4445 | `section.wrap` | `#460912` / `#1f0107` |
| 360 | 0.6667 | `section.wrap` | `#0a0103` / `#1d040a` |
| 1280 | 0.0 | `section.relative` | `#0b0204` / `#0b0103` |
| 1280 | 0.2222 | `main.flex-1` | `#0b0204` / `#faf4e6` ← light chapter, see note |
| 1280 | 0.4445 | `section.wrap` | `#0b0204` / `#110104` |
| 1280 | 0.7778 | `section.wrap` | `#0b0204` / `#2f060d` |

The `#faf4e6` at 1280/0.2222 passes the predicate — `main` is transparent and the cream comes from a
section pseudo, the light "paper" chapter — so it is atmosphere by the rule, but it is not comparable
with the dark samples around it. Read it as "the environment here is a light chapter", not as a point in
a series.

## The finding that changes the design brief

**At 360px the existing ground already varies by roughly 7× in red channel across the page** — from
`#0a0103` to `#460912` in the four usable samples, with the declared record showing five body radial
glows plus a per-section glow alternating side by side and a darkening band on every third section.

Two consequences, both for T010 and T017:

1. **FR-001 is already partly satisfied today** — a shopper scrolling top to bottom does pass through more
   than one tonal state. What is missing is *direction and composition*: the current variation is a
   by-product of where glows happen to sit, alternating left-right-left, not a progression with one
   deliberate movement. The feature's job is composition, not introduction of change.
2. **FR-005's "must read calmer" is a higher bar than it looks**, because there is already a lot of
   sectional movement to be calmer *than*. Adding a designed progression on top of an alternating
   left/right lighting scheme, per Q2 = C, risks summing two systems rather than replacing one. The
   likely-cited resolution — and it should be weighed at T012, not assumed now — is for the new layer to
   **subdue the alternation** as it establishes direction, i.e. do the reconciling in `app/globals.css`
   where the existing section lighting lives.

## Verified section order

Eleven `main > section` elements, matching T004's anchor set:

`#top`, `#featured`, `#categories`, `#brands`, `#new-arrivals`, `#b2b`, `#accessories`,
`#online-services`, `#store-experience`, `#trust`, `#final-conversion`

Document height: **16566px** at 360px, **12630px** at 1280px.
