# Fit decision — 008 brands stacking-card deck

**Owner: opencode. Phase 1 only (T001–T003).** This file is the mechanism, the budget, and the
pre-implementation baseline. Per the `tasks.md` ownership split, qoder writes deviations to
`notes/deck-build-log.md` instead — so this file is edited by Phase 1 and read by everyone after it.
Its job is to make drift visible: if a later pass changes a number here, the change shows up as a diff
against the plan rather than as a surprise in a screenshot.

---

## T001 — The mechanism and the fit budget

**The mechanism is `position: sticky` in normal flow, and there is no pin.** Each of the six cards is a
normal-flow block carrying `position: sticky` and an `inset-block-start` offset; the deck is what the
browser produces on its own when six sticky blocks of finite height follow each other — the first stops,
the second climbs over it, and so on. There is no scroll listener, no animation library and no
JavaScript at all in the stacking path, and specifically **no pin and no `ScrollTrigger`** (research.md
D1). The fit budget is arithmetic, settled before any styling, at the smallest case the spec names:
**640 px viewport height − 88 px mobile-dock clearance (<768px, from feature 007) − 80 px of stack edge
(five edges × 16 px, D3) = 472 px available for the last card, from which a card height of 460 px is
chosen, leaving 12 px of slack** (research.md D2). Six cards in flow ≈ 2,760 px, plus the section heading
and its padding ≈ 290 px, gives a chapter of ≈ 3,050 px ≈ 4.8 screen-heights at 640 px — inside FR-008's
6.5 ceiling. "Close enough" is not an allowed outcome of the fit gate: the deck either measures at or
under 460 px, or FR-014's static stack ships instead, which is a completion and not a defect.

**Read this before changing a number.** Feature 007 budgeted a pinned stage at `100svh`, measured 54.6 px
of real travel against an assumed 1,600 px, and shipped without its pin. The subtraction above is
written down first precisely so that cannot happen twice. The gate is one browser measurement of a real
card at 360 × 640, and it lives in `verification/measure-deck.mjs`.

---

## T002 — The safe test path, verified

`tests/setup.ts` registers `resetDb()` in a `beforeEach`, and it deletes every row of **nineteen** tables
through `lib/prisma`. It is registered under `setupFiles`, which applies to *every* test file, and there
is no `.env.test` in this checkout — so `DATABASE_URL` resolves from `.env` to the development database.
A bare `npx vitest run tests/unit/anything.test.ts` therefore truncated the development database before a
single assertion. `vitest.frontend.config.ts` is the same suite with no `setupFiles`, and `tests/setup.ts`
now refuses outright to reset a database whose name is not test-like.

Recorded run, 2026-09-26:

```
$ npm run test:unit

 Test Files  22 passed (22)
      Tests  281 passed (281)
   Duration  20.45s (transform 2.92s, setup 0ms, import 9.25s, tests 2.41s, environment 7ms)
```

**`setup 0ms` is the whole point of that line.** It is the evidence that `tests/setup.ts` never loaded:
a setup file that resets a database cannot take zero milliseconds. Database counters taken immediately
before and after the run were identical (`1300/1300` cumulative inserts/deletes, `0` live rows, 46
tables), so the run provably touched nothing.

Note the suite is **281/281 green**, including the 24 `brand-deck.test.ts` tests — the model layer
(`lib/brand-deck.ts`) exists as of Phase 2. The driver recorded 281/281 as the first fully green run
when feature 010 retargeted `categoryImageFor`; this run matches that number independently, from a
different command, with `setup 0ms`.

---

## T003 — Baseline, measured on the un-decked page

`verification/measure-deck.mjs` at an exact 360 × 640 against `http://localhost:3000` (tmux `hh-dev`).
**The script needed no fix** — it ran clean first time, reported the pre-implementation state, and exited
0. Its `--self-test` also passes 5/5, so the verdict logic that would later turn this gate red is itself
checked.

```
008 fit gate — http://localhost:3000 at 360 × 640  (card budget 460px, ceiling 6.5 screens)
hydration: react fiber on body yes · in #brands yes · below-fold wrappers 17/17 hidden by Reveal (post-mount state)
cards: 6 via "li" · position relative · sticky no · chapter 1124px at y=4544 · dock top 566px · doc 12044px

NO DECK PRESENT — the cards are not `position: sticky`, so there is no deck to measure.
  6 cards sit in a plain list (115, 115, 115, 101, 101, 101px). D1's mechanism is not on the page.
  C1, C2, FR-008, C8 and C9 are NOT EXERCISED — that is an incomplete measurement, not a pass.
  Control numbers a future run compares against:
    chapter height 1124px = 1.76 screens at 640px
    card heights 115, 115, 115, 101, 101, 101px against a 460px deck budget
    dock clearance 74px (D2 budgets 88)
  Run this again after the deck is implemented; the same command then gates the ship.

BASELINE — no deck present. Nothing was measured and nothing is claimed; the fit gate is still OPEN.
```

**These are the control numbers.** Every later run compares against them:

| Quantity | Baseline | Note |
|---|---|---|
| Cards found | 6, via selector `li` | `li.brand-rows__item`; the harness prints which selector it used, so a silent fallback cannot look like a measurement |
| Card `position` | `relative` | **`sticky` is `no`** — D1's mechanism is absent, which is the expected pre-implementation state |
| Card heights | 115, 115, 115, 101, 101, 101 px | a plain list, not 460 px cards |
| Chapter height | 1124 px = 1.76 screens | 3,050 px / 4.8 screens is what the deck is budgeted for, so the deck will roughly triple this |
| Chapter offset | y = 4544 px | |
| Dock top / clearance | 566 px / **74 px** | D2 budgets 88 px — see the drift note below |
| Document height | 12044 px | |
| Hydration | fiber on body yes, in `#brands` yes, 17/17 Reveal wrappers hidden post-mount | the "200 is not a working page" trap is checked, not assumed |
| Fit gate | **OPEN** | not a pass — nothing was measured |

**No frame-rate or smoothness claim is made anywhere in this file** (research.md D9). Everything above is
geometry — rects against the viewport, at an exact viewport size, in a settled layout — which is what this
machine can answer honestly.

### Drift found at the baseline: the dock is 14 px shorter than D2 budgets

D2 budgets 88 px of dock clearance. Measured at 360 × 640, the dock's top edge sits at y = 566 px, so the
real clearance is **640 − 566 = 74 px** — 14 px *less* than budgeted. The dock is present, not missing:
`MobileDock` is `md:hidden`, so at 360 px it is rendered, and it is found by its `bottom-3` fixed geometry
rather than by a class-name guess.

**This errs in the safe direction.** The budget over-reserves, so the real arithmetic is
640 − 74 − 80 = **486 px available**, and a 460 px card would have **26 px of slack rather than 12 px**.
Nothing about the 460 px choice is threatened by this, and no change to D2 is warranted on the strength of
one un-decked run. It is recorded because T001's purpose is drift visibility: a later agent who measures
slack must not assume the 12 px in D2 is the real figure, and if the deck's arrival changes the dock's
height, this row is the one to re-measure. Both numbers are kept deliberately — **88 px is the budget, 74 px
is what renders.**

---

## What the harness does not cover, so nobody assumes it does

`quickstart.md` asks for more than geometry can decide. The split, checked against the script's own source
rather than its header comment:

**Machine-decided by `measure-deck.mjs`:** C1 (six distinct cards hold the top position in order), C2 (no
topmost card's label rect escapes the viewport), FR-008 (chapter ≤ 6.5 screen-heights), the D2 fit budget
(the real card against 460 px), C8's reduced-motion half, and three of C9's four arrival states — reload
mid-chapter, back/forward into the chapter, and End past the chapter.

**Not covered, and the gaps are real:**

1. **C9's fourth case — "scroll backwards through the deck twice → cards un-stack in reverse."** The script
   runs three arrivals and says so in its own output (`C9 three arrivals`). The backwards walk is not
   measured. A sticky deck's reverse behaviour is exactly the kind of thing that looks right in a forward
   walk and wrong in reverse, so this is the gap most worth a human with the browser.
2. **C8's print half.** `quickstart.md` §6 has two halves. The script emulates
   `prefers-reduced-motion: reduce` and reloads; it never emulates `media: "print"`, so **print preview is
   not covered at all**. The script's header comment claims it automates "§6 (C8)", which overstates it —
   it automates the reduced-motion half only.
3. **C4, C5, C3 — human, by design.** The three storyless brands showing no empty band, every visible number
   matching that brand's own listing, the brands with nothing purchasable showing no number at all, and the
   press behaviour of the top card versus a recessed card's 16 px edge. None of these are decidable from
   rects, and the script correctly does not claim them.
4. **A stale fact in `quickstart.md` §5**, which says "the **two** brands with nothing purchasable show no
   number at all". Against `data/hami-products.json` today it is **three** — APPLE, SAMSUNG and REALME have
   zero purchasable products (0, 0 and 0 against 49, 42 and 1 total). This is the same stale "two" that
   research.md D5 and contract C5 carry. It is a spec-text fix, not a harness fix, and it is not mine to
   make — flagged for whoever owns those documents.

---

## Reproducing all of it

```bash
npm run test:unit                       # 281/281, must report setup 0ms
node specs/008-brands-stacking-cards/verification/measure-deck.mjs --self-test   # 5/5, no browser
VIEWPORT_W=360 VIEWPORT_H=640 node specs/008-brands-stacking-cards/verification/measure-deck.mjs
```

Never `npm test`, and never a bare `npx vitest run`. Use `npm run test:unit`. The default config's
`setupFiles` runs `resetDb()` and deletes nineteen tables from the real `hami_site_api` database.
