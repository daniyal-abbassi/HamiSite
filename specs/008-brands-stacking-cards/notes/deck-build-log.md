# 008 deck build log — worker qoder, task 008-mosaic→deck (2026-09-26 ~19:30)

T009–T013 as built, and every deviation from the task list's letter, named rather than absorbed.

## What exists now

- `components/home/BrandRows.tsx` — rewritten: six cards from `buildBrandCards(partnerMarks,
  brandPurchasableCounts())`, normal-flow `<li data-deck-card>` with `--stack-i` inline, one
  `Link.brand-deck__card` per card, D4 composition order (mark dir="ltr", name, optional story,
  optional count), no client state, no JS in the stacking path. The old emphasis/chevron interaction
  is gone with the rows: the card *is* the destination (C3), so the second control had nothing left
  to reveal.
- `app/(main)/home.css`, block `008 brands deck` after the old `.brand-rows` rules, outside the 010
  marker region: `position: sticky`, `inset-block-start: calc(var(--stack-i) * 16px)`,
  `z-index: calc(var(--stack-i) + 1)` under `isolation: isolate` on the list, `min-block-size: 180px`
  (= `MIN_CARD_HEIGHT`), `max-block-size: 460px` (T008 budget), reduced-motion and print collapse to
  the static stack per D7 (`position: static`, travel room withdrawn).

## Deviations

1. **`#brands { overflow: visible }` added in home.css.** The section still carries
   `overflow-hidden` (BrandShowcase.tsx:20) from decorations T070/T071 deleted; an overflow-hidden
   ancestor is the classic silent death of sticky. The override sits in a file this task owns
   because BrandShowcase.tsx is not owned by it. The correct end-state is deleting the class at the
   source — one word — owned by whoever takes BrandShowcase next.
2. **`counts` prop kept but ignored.** `BrandShowcase` passes catalogue *totals*; C5/FR-011 admit
   only *purchasable* figures, which `BrandRows` now computes via `brandPurchasableCounts()` — the
   same query `app/(main)/brands/[slug]/page.tsx` runs, per lib/brand-counts.ts's own comment, so
   card and destination cannot drift. The prop is typed as before so the un-owned caller still
   typechecks. One-line fix when BrandShowcase is next open: drop the prop from both sides.
3. **Stacking context is on the list, not the section (T013 says "section element").**
   `isolation: isolate` on `.brand-deck` is strictly tighter than on `#brands`: cards order among
   themselves, `.wrap`'s existing cap plus z ≤ 7 keep them far under the dock (z-40) and header
   (z-50), and the section element is not this task's file to touch. C6's actual claim is verified
   by the harness, not re-raised.
4. **`.brand-deck` carries `padding-block-end: 240px`.** The first 360×640 walk held 5 of 6 tops —
   the last card (TCH) never arrived because the chapter ended under it. Sticky travel is bounded
   by the deck's own box, so this is deck geometry, not a spacer: FR-008 went 2.69 → 3.06 screens
   against the 6.5 ceiling, and C1 went FAIL → PASS (6/6, source order, all edges visible stacked).
   Reduced-motion/print withdraw it — with nothing sticking, there is nothing to arrive at.
5. **`{card.mark as ReactNode}`.** `BrandCard.mark` is `unknown` by design in the model (it passes
   nodes through without knowing React); the component is the one place that knows. The cast is at
   the boundary, not in the model.
6. **Old `.brand-rows` CSS left in place.** Nothing references those classes any more; deleting
   them is polish-phase work (same spirit as 009's T027/T028), not this task's.

## Measured (measure-deck.mjs, 360×640, dev server :3000, second run)

- C1 six tops: **PASS** — 6 distinct, in source order 0–5; all six visible stacked (min 6).
- C2 no clipped mark or label: **FAIL — 6 bad samples of 31, all of them `card#-1`** — the walk
  starts at the section's top, and for the first ~220px of scroll no card is within the 40px rest
  band yet (the SectionHead is inside `#brands`, above the deck). Not one bad frame is an actual
  clipped label: every sample with a resting card is `ok`. As instrumented, C2 requires a resting
  card at the very first sample, which no deck preceded by a heading inside the same section can
  satisfy. `measure-deck.mjs` is locked by hermes; this is a harness-vs-structure call for hermes
  or the Boss, not something this worker may silently edit. Options: count `top === -1` as
  vacuous in C2 (the clause says "the topmost card's…", and there is no topmost card there), or
  move the SectionHead outside `#brands`, or start the walk at the first resting scrollY.
- FR-008: **PASS** — chapter 1959px = 3.06 screens (ceiling 6.5).
- D2 budget: **PASS** — tallest card 180px vs 460px budget.
- C8 reduced motion: **PASS** — six cards, sticky 0, no extra scroll length.
- C9 three arrivals: **PASS** — reload mid-chapter, back/forward, End-key all land correctly.
- Scroll drift: 0 of 31. Harness exit remains 1 **solely because of the six `card#-1` approach
  frames** above.
- `npm run test:unit`: 22 files, **281/281 green, setup 0ms**. `npm run typecheck`: exit 0.

## Run 3 (after T025/T026, with hermes's clipFlags fix) — verdict table, 360×640

- C1 six tops: **PASS** — 6 distinct in source order 0–5; all six edges visible once stacked.
- C2: **PASS** — 0 bad of 25 evaluated (6 approach samples excluded by the fixed instrument, see clipFlags).
- FR-008: **PASS** — chapter 1959px = 3.06 screens (ceiling 6.5; predicted ≈ 4.8).
- D2: **PASS** — tallest card 180px vs the 460px budget.
- C8: **PASS** — reduced motion: six cards, `sticky 0`, 2.69 screens (no extra length).
- C9: **PASS** — reload mid-chapter / back-forward / End all land in the state for their position.
- Overall: **PASS — the deck fits at 360 × 640.** Harness exit 0.
- Reverse un-stack (T018): resting index [5,4,4,3,3,2,2,2,1,1,0,0,-1,-1,-1] walking up — monotone.
- Tab order (T028): six `.brand-deck` links, DOM order اپل→سامسونگ→شیائومی→نوکیا→ریلمی→TCH.
- T037 done: superseded-pointer block added at the top of `specs/004-mobile-brands-rows/spec.md`.
- Still open after this pass: **T035** (`npm run build` kills the driver's dev server — needs an
  owned window), **T036** quickstart manual legs and **T038** owner's phone — human steps.

## Quickstart §3 verdict table (T036 record, run 3 verbatim)

    C1  six cards hold the top:      PASS — 6 distinct card(s) held it, in source order 0,1,2,3,4,5
        in source order:              PASS
        all six stay visible stacked: PASS — min 6 card(s) showing any pixel once fully stacked
    C2  no clipped mark or label:    PASS — 0 bad sample(s) of 25 evaluated (6 approach samples excluded — clipFlags)
    FR-008 chapter length:           PASS — 1959px = 3.06 screens (ceiling 6.5)
    D2  card height vs budget:       PASS — tallest 180px vs 460px
    C8  static stack (reduced motion): PASS — six cards, sticky 0, no extra scroll length
    C9  three arrivals:              PASS — reload mid-chapter / back-forward / End each landed in position's state
    PASS — the deck fits at 360 × 640. Harness exit 0.

## SC-007 — owner verdict, T038 (verbatim, on their phone at 192.168.100.19:3000)

> "perfect, such a clean design, NICE JOB"

## Final state

All 38 tasks closed: T001–T003 verified as opencode's (fit-decision.md, locked, not edited),
T004–T008 theirs before this work, T009–T034+T037 built/verified by qoder (worker), T035 build clean
with hh-dev surviving, T036 machine legs recorded above, T038 answered by the owner. Deviations #1–#6
stand as recorded. Nothing re-tuned after the gate passed.
