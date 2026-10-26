# Quickstart: Mobile-First First-Screen Redesign — Validation Guide

**Feature**: 044-mobile-first-redesign · **Date**: 2026-10-25

Proves the feature end-to-end per the constitution's Definition of Done. Implementation details live in `tasks.md` / `plan.md`.

## Prerequisites

- Node.js ≥ 20, dependencies installed, `.env` with a reachable PostgreSQL (`/api/health` reports `database: connected`).
- Brand assets present: `public/brand/hami-mark-alpha.png`, `public/brand/hami-wordmark-fa.png`, `public/store/shop-ai-relight.png`, `public/images/hero/home-silk-mobile.png`, `public/images/hero/home-silk-wide.png`.
- Owner mockup for side-by-side judging: `specs/044-mobile-first-redesign/mockups/mobile-home-design.png`.

## Build gates

```bash
npm run typecheck   # must exit 0
npm run build       # must complete clean — WARNING: destructive to a running dev server (CLAUDE.md); restart the dev server afterwards
npm run dev         # serve on :3000
curl -s localhost:3000/api/health   # database: connected
```

## Browser validation (real browser, not curl)

1. **First screen vs mockup (P1)** — viewport 390×844, load `/`:
   - Solid oxblood header with the white mark + wordmark lockup and four white actions (search, categories, account, bag), no horizontal scrolling.
   - Telegram channel strip directly under the header.
   - Hero: real store photograph left (rounded, bleeding to the left edge), «۲۰ سال اعتماد» pill, two-tone headline with gold accent, both CTAs and the 2×2 trust-facts grid fully visible without scrolling.
   - Silk-wave background visible at the first screen's top corners and bottom edge; content legible over it.
   - Compare side-by-side with the mockup: composition, palette, hierarchy (SC-003).
2. **Interactivity (P1, SC-006)** — tap the category action: the glass menu opens over the content with the category rows; closes by outside tap and Escape. Tap «مشاهده محصولات» → `/shop`; «شروع همکاری» → `/partners`. Keyboard: Tab reaches header actions and CTAs with a visible focus ring.
3. **Load stability (P2, SC-002)** — throttle the network and reload: the photograph's frame is reserved; CTAs and headline do not move when the image arrives.
4. **Narrow/wide phones (SC-004)** — 360×740 and 430×932: no horizontal scroll, no clipped labels, grid stays 2×2.
5. **Desktop regression (story 4, SC-005)** — 1280×800: header, hero artwork, and all sections render as before; the closing CTA band carries the wide silk banner; no content or function lost.
6. **Reduced motion** — emulate `prefers-reduced-motion: reduce`: the channel strip stops animating and its full message stays readable.

## Expected outcomes

- All build gates exit 0.
- Steps 1–6 pass without console errors; the page hydrates (controls respond — a 200 HTML response alone is not proof).
- Screenshots from steps 1 and 5 are retained as the acceptance evidence.
