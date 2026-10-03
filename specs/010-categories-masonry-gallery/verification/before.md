# Before — the state 010 replaces

Captured 2026-09-26 17:02, dev server `localhost:3000`, chromium headless via `tools/shots/viewport.mjs`.
Nothing here is a claim about the new layout; it is the baseline a reviewer compares against.

## Measured

| | 360 px | 1280 px |
|---|---|---|
| `#categories` document top | **3,186 px** | **4,323 px** |
| `#categories` height | **769 px** | **809 px** |
| `.cat-panel` in DOM | 9 | 9 |
| `[tabindex="0"]` inside the section | — | **1** |
| `.cat-mosaic` / `.cat-tile` in DOM | **0** | **0** |
| `document.body.scrollHeight` | 11,279 px | 10,337 px |

## What the numbers say

- **The homepage still renders the carousel.** `carousel: true`, nine `.cat-panel` nodes. Feature 009 shipped 165
  lines of mosaic CSS into `app/(main)/home.css` and **nothing referenced them** — `orphanMosaicInDom: 0` is the
  direct proof, from the live DOM rather than from a grep. 010 T013 deletes that block.
- **One tab stop for nine departments.** `tabbable: 1` at 1280 px is the roving tabindex at
  `components/home/CategoryCarousel.tsx:267` (`tabIndex={isActive ? 0 : -1}`). A keyboard shopper reaches one
  panel per visit and must already know that `ArrowLeft`/`ArrowRight` move it. Q8's "ten stops" is an
  improvement, not a regression risk.
- **The chapter is ~770–810 px tall today.** The authored masonry is ~1,030 px at 360 (research D2, to be
  confirmed by T014). That is **+260 px**, roughly 0.4 of a phone viewport, and it is the whole cost of the change
  against FR-021 — nothing in `app/globals.css` or `home.css` anchors a ground stop to `#categories`, which T029
  re-checks rather than assumes.
- **A pre-existing 401 on one resource** appears in the console at both widths. It is not from this section (the
  categories chapter fetches nothing — Principle III) and it predates 010; recorded so that a later run showing
  the same error is not mistaken for a regression introduced here.

## Screenshots

- `before@360.png` — full page at 360 × 800, chapter visible mid-scroll
- `before@1280.png` — full page at 1280 × 900
