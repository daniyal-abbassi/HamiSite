# Quickstart: Verifying the Brands Rows

Validation guide. Run this after implementation; every step maps to a clause in
[contracts/brand-row-behaviour.md](./contracts/brand-row-behaviour.md).

## Prerequisites

- Node via nvm (repo builds on Node 22), `npm ci`
- A running dev server and the `browser-use` MCP for page inspection
- No database required for this section — brand and product truth comes from `data/hami-products.json`
  through `lib/catalog.ts` (Principle III)

```bash
npm run dev            # never while another Next server holds :3000
npm run typecheck
npm run build          # DESTRUCTIVE to a running dev server — restart dev afterwards
```

**The stale-build trap, because it will bite here.** `npm run build` rewrites `.next` under the running dev
server, which then serves HTML referencing chunk files that no longer exist: the page looks fine, every
button is dead, and `curl` still returns 200. After any build, restart the dev server and confirm:

```bash
pgrep -af "next-server|next dev|next start"     # expect exactly one
ss -ltnp | grep :3000                            # confirm who owns the port
CHUNK=$(curl -s localhost:3000/ | grep -oP '/_next/static/chunks/[^"]+\.js' | head -1)
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000$CHUNK"   # must be 200
```

A 200 on the chunk, not on the page, is what proves the section is actually interactive.

## 1 — Unit-testable core (no browser)

```bash
npm test
```

Expected: the brand/category slug-resolution function passes for all six brands and all six category
destinations, and returns the explicit `unknown-brand` outcome for a slug that matches nothing. **A mistyped
slug must never produce the unfiltered catalogue** — that is C13, and it is the regression this feature exists
to fix.

## 2 — Destination truth

For each of the six rows, navigate to its href and assert the result set is filtered, not merely non-empty.

| Brand | Expect |
|---|---|
| APPLE | 49 products, all اپل |
| SAMSUNG | 42, all سامسونگ |
| XIAOMI | 30, all شیائومی |
| TCH | 23, all تی سی اچ |
| NOKIA | 3, all نوکیا |
| REALME | 1 — verify a one-result listing is not mistaken for a failure state |

Then the negative case: request a brand that does not exist and confirm the page says so instead of listing
189 products. **C12, C13.**

Repeat for the six corrected category hrefs — **C14**.

## 3 — Rows, RTL, and Persian correctness

At 360px, with `browser-use` snapshot plus `evaluate_script`:

- Six stacked full-width rows, all distinguishable without tapping — **C1**
- Ordinals render as Persian digits and ascend in RTL order — **C3**
- Computed `letter-spacing` is zero on every Persian label. **Note the assertion, because the obvious one is
  wrong:** Chrome reports `letter-spacing: 0` back as `"normal"`, not `"0px"`, so
  `getComputedStyle(el).letterSpacing === "0"` fails on a correct build. Use
  `ls === "normal" || parseFloat(ls) === 0` — **C21**
- No physical-direction leakage: check that no row style resolves to a left/right assumption that breaks the
  mirror — **001/FR-010**

## 4 — Press semantics

Drive it with `click`, then re-snapshot:

1. Press a row → navigates on the **first** press — **C6**
2. Press the expand control → that row emphasised, others unchanged — **C7, C10**
3. Press another row's control → first releases, second emphasises; assert no frame where both hold emphasis —
   **C8**
4. Press the same control → releases — **C9**
5. Press outside, and scroll the section away → releases — **C9**
6. Record the bounding box of the row *below* the one being expanded, before and after. A shift that moves a
   target out from under the pointer fails — **C11**

## 5 — Equal finish for the three story-less brands

Expand REALME and NOKIA, then APPLE. Compare computed styles on label and mark: no reduced opacity, no
disabled attribute, no pending notice. The only permitted difference is the absence of a story line — **C5**,
and the clause FR-004 exists to protect.

## 6 — Motion budget and reduced motion

- With nothing emphasised, and again with the section scrolled out of view, confirm no animation is running.
  `document.getAnimations().filter(a => a.playState === "running")` scoped to the section must be empty —
  **C15, C16**
- Re-run the whole flow with emulation set to `prefers-reduced-motion: reduce`. Brands, labels, marks,
  stories and destinations must be identical; emphasis becomes a state change, not travel — **C17**

## 7 — Keyboard and screen reader

- Tab the section: every row and every expand control reachable, focus visible at each stop, order matching
  visual RTL order, activation navigating — **C18**
- Screen reader pass: rows announce as destinations and the emphasis state is conveyed without a misused
  control role — **C19**
- Verify touch targets and that nothing sits under the fixed header — **C20**

## 8 — Coherence with feature 005

Only meaningful once 005 exists: assert the five shared behaviours (C22–C26), in particular that the
categories carousel also navigates on first press. **C24 is the clause 005 has to satisfy in return**, and it
is the one most likely to be missed because its spec was written first.

## 9 — Responsiveness

Scroll the section on a mid-range phone profile with several rows expanded in sequence. The page must stay
responsive and no transition may stutter — **C16, FR-022**.

## Passing definition

The feature is done when sections 1, 2, 4, 5, 6 and 7 pass clean, and 3, 8 and 9 pass with no visual
regression. **Section 2 is a hard gate**: eleven silently-broken links are the defect this work exists to
remove, and a brands section that ships them has made the homepage less trustworthy, not more.
