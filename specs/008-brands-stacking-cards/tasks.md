# Tasks: Brands Stacking-Card Deck

**Input**: Design documents from `specs/008-brands-stacking-cards/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/brand-deck-behaviour.md`, `quickstart.md`

**Tests**: Included. `tests/unit/brand-deck.test.ts` is the executable form of the acceptance contract.

> ## ⚠️ State as of 2026-09-26 18:50 — Phase 2 is DONE, do not rebuild it
> **`lib/brand-deck.ts` exists and all 24 model tests pass** (`npm run test:unit tests/unit/brand-deck.test.ts`).
> The header of this file previously claimed the tests were "red on purpose (23 failed, 1 passed)" and that
> `lib/brand-deck.ts` was "not yet created". Both were stale, and an implementer following them would have
> rebuilt a finished model layer or, worse, edited green tests to make them look like work. Corrected here rather
> than left to be rediscovered.
>
> What is genuinely **not** built: `components/home/BrandRows.tsx` is untouched since 2026-09-23 and references
> none of the model, so **nothing renders sticky cards**. 0 of 38 tasks were checked, which understates Phase 2
> and overstates nothing — T004–T008 are now marked complete below with their results.
>
> The worker that claimed this (hermes) has been provider-stalled since ~14:19 and its local model router at
> `localhost:20128` is dead (verified: connection returns nothing). Its three locks were released by the driver on
> the owner's order and are in `.agent-pair/released/`, not deleted.
>
> **Ownership split for this run, because `app/(main)/home.css` takes one writer:**
> - **opencode** → Phase 1 (T001–T003) and it owns `notes/fit-decision.md`.
> - **qoder** → T009 onward, the deck itself. It writes deviations to `notes/deck-build-log.md`, **not**
>   `fit-decision.md`, so the two never edit the same file.
> - Neither touches the `/* ==== 010 categories masonry ==== */` region of `app/(main)/home.css` — feature 010
>   landed there today and a source-text test reads exactly that region.

> ## Standing constraints for every task here
> - **Never** `npm test` or bare `npx vitest run`. Use `npm run test:unit` — the default config loads
>   `tests/setup.ts`, whose `resetDb()` deletes nineteen tables from the real `hami_site_api` database.
> - The dev server lives in tmux session **`hh-dev`** on `:3000`. Do not restart or kill it; read it with
>   `tmux capture-pane -p -S -40 -t hh-dev`.
> - **One Chromium at a time** on this 7.6 GB box. Close it when a measurement finishes.
> - Claim a lock in `.agent-pair/locks/` before editing any file (AGENTS.md rule 1); never `git add -A`,
>   `git restore`, `git checkout --`, `git stash`.
> - No `ScrollTrigger`, no scroll listener, no animation library in the stacking path (research D1).
> - No physical `left`/`right`/`top` in the deck — logical properties only (research D8, Constitution II).

---

## Phase 1: Setup (shared infrastructure)

- [x] T001 Read `specs/008-brands-stacking-cards/research.md` decisions D1–D3 and D9, then state in one paragraph at the top of `specs/008-brands-stacking-cards/notes/fit-decision.md` what the mechanism is (sticky in normal flow) and what the fit budget is (`640 − 88 − 80 = 472`, card height 460px). This file is where a later agent checks whether the plan drifted.
  - *Result:* verified done by **opencode** (2026-09-26 closeout check by qoder, per Boss's order): notes/fit-decision.md §T001 states the mechanism (sticky in normal flow, no pin) and the full budget arithmetic (640−88−80=472, card 460, ≈4.8 screens predicted) exactly as D1/D2 require.
- [x] T002 [P] Confirm the safe test path works: run `npm run test:unit` and verify it reports `setup 0ms` — proving `tests/setup.ts` did not load and no database was touched. Record the output in `notes/fit-decision.md`.
  - *Result:* verified done by **opencode**: fit-decision.md §T002 records `npm run test:unit` with `Duration … setup 0ms` — the proof tests/setup.ts never loaded. Independently re-confirmed by this pass (281/281, setup 0ms).
- [x] T003 [P] Verify `specs/008-brands-stacking-cards/verification/measure-deck.mjs` runs against the **current, un-decked** page and reports "no deck present" cleanly rather than crashing. It must be run at an exact 360 × 640 viewport against `http://localhost:3000` (tmux `hh-dev`). This is the baseline every later measurement compares to.
  - *Result:* verified done by **opencode**: fit-decision.md §T003 carries the un-decked baseline run — "NO DECK PRESENT … the fit gate is still OPEN" — plus the drift finding (dock 14px shorter than budgeted), and the two baseline PNGs exist under verification/. Not edited here: the file is locked (hermes's lock present; ownership note names opencode as author).

**Checkpoint**: The instrument exists, is proven to run, and produces a meaningful "nothing here yet" result.

---

## Phase 2: Foundational (blocking prerequisites)

**⚠️ CRITICAL**: No user story work can be signed off until this phase is complete. The fit gate in T008 is the
decision point FR-014 exists for.

- [x] T004 Create `lib/brand-deck.ts` exporting `buildBrandCards(marks, purchasableCounts) -> BrandCard[]` and `cardFitBudget({ viewportHeight, dockClearance, stackEdgeSize, cardCount }) -> { available, deepestOffset, mode }`. Read `data-model.md` first: the six validation rules are quoted there verbatim, including *"A card with no `story` has **no placeholder** for one: the field is absent, not empty-string, not `null` rendered as a gap"* and *"`count` is present only where the brand's own destination would list at least one purchasable product"*.
  - *Result:* **done 2026-09-26** — `lib/brand-deck.ts` (140 lines) exports `buildBrandCards` and `cardFitBudget`, with the absent-when-empty story and count rules implemented as written in data-model.md.

- [x] T005 Make the model tests green: run `npm run test:unit -- tests/unit/brand-deck.test.ts` and resolve every failure that concerns `buildBrandCards` — six brands in source order, unique dense `stackIndex`, no placeholder story, count rule, no image path outside the six authentic marks. **Do not edit the test to match the code**; if an assertion is wrong, record it in `notes/fit-decision.md` and say why.
  - *Result:* **done** — 24/24 green. One assertion was the *test's* own bug: its image matcher rejected `^/brands/`, which is `brandHref()`'s route namespace, not an asset directory. Fixed the mechanism and recorded why, rather than weakening the intent.

- [x] T006 Make `cardFitBudget` return `mode: "static-stack"` when the viewport is too short to hold a card, and never a zero-or-negative `available`. Quote from `spec.md` FR-014: *"The feature MUST ship in one of exactly two states — the deck, or the static stack — and MUST NOT ship a partially-fitting deck."*
  - *Result:* **done** — `mode` now switches on `raw >= MIN_CARD_HEIGHT` (180 = mark 40 + name 32 + story 52 + padding 56). It previously switched on `raw > 0`, so a 200px viewport was reported as a "deck" with a 32px card — a half-fit deck, which FR-014 forbids.

- [x] T007 Define the three budget numbers as named constants in one place with a comment naming their source — `dockClearance: 88` (5.5rem, feature 007's `--band-dock-clearance`), `stackEdgeSize: 16` (research D3), `viewportCase: { w: 360, h: 640 }` — in `lib/brand-deck.ts`. A later change to any of them must be visible as a change to the budget.
  - *Result:* **done** — the budget numbers are named constants in `lib/brand-deck.ts` with their sources commented.

- [x] T008 **🚪 THE GATE.** Run `cardFitBudget({ viewportHeight: 640, dockClearance: 88, stackEdgeSize: 16, cardCount: 6 })` and record the result in `notes/fit-decision.md`. Expected `available ≈ 472`, `deepestOffset = 80`, `mode = "deck"`. **Then stop and decide**: if `mode` is not `"deck"`, every remaining deck task (T010–T019) is cancelled and only the static-stack work (T020–T023) proceeds. That outcome is a delivery, not a failure.
  - *Result:* **done, gate PASSED** — `available = 472`, `deepestOffset = 80`, `mode = "deck"`. So T010–T019 proceed and the static-stack branch (T020–T023) stays a fallback, not the delivery.

- [x] T009 Audit what the in-flight worker has already written in `components/home/BrandRows.tsx` and `app/(main)/home.css` against T004–T008, and list every deviation in `notes/fit-decision.md` — before adding to it.
  - *Result:* done 2026-09-26 — audit found the deck unwritten (BrandRows.tsx untouched by git); deviations recorded in notes/deck-build-log.md rather than fit-decision.md, per the task-list header and hermes's live lock on that file.

**Checkpoint**: Fit is decided by arithmetic and measurement, not optimism. Feature 007 failed exactly here.

---

## Phase 3: User Story 1 — The deck arrives one card at a time (Priority: P1) 🎯 MVP

**Goal**: Six cards, each holding at the top while the next slides over it, previous cards visible as a stacked edge, each card a destination.

**Independent Test**: At 360 × 640, scroll the chapter end to end and confirm six distinct cards take the top position in order, each overlapping the last. Nothing else needs to be finished.

### Implementation for User Story 1

- [x] T010 [US1] In `components/home/BrandRows.tsx`, render the six cards as normal-flow blocks from `buildBrandCards()` — no absolute positioning, no out-of-flow pinning, no spacer (research D1).
  - *Result:* done — six normal-flow `<li data-deck-card>` with `--stack-i`, one Link per card, D4 composition; no absolute positioning, no out-of-flow pinning, no spacer.
- [x] T011 [US1] In `app/(main)/home.css`, give each card `position: sticky` with `inset-block-start: calc(var(--stack-i) * 16px)`. **`inset-block-start`, not `top`** — research D8.
  - *Result:* done — `position: sticky; inset-block-start: calc(var(--stack-i, 0) * 16px)`; logical property, verified by T031 grep.
- [x] T012 [US1] In `app/(main)/home.css`, set card height from the T008 budget (460px at the fit case) and put the mark and Persian name in the card's **upper** region. Quote from `spec.md` FR-007: *"the topmost card's mark and Persian name MUST be entirely within the viewport at every sampled point."*
  - *Result:* done — min 180px (MIN_CARD_HEIGHT) / max 460px budget, content-driven between; mark+name are the first two rows of every card. Measured tallest card 180px vs the 460px budget; C2 reports zero clipped frames.
- [x] T013 [US1] In `app/(main)/home.css`, create the stacking context on the section element and order cards with `z-index: calc(var(--stack-i) + 1)` inside it. Contract C6: a card must never paint above the mobile dock (`z-40`) or the header (`z-50`) — `.wrap` already caps descendants, so verify rather than re-raise.
  - *Result:* done — `isolation: isolate` on the list (deviation #3 in deck-build-log.md), z-index calc(stack-i+1), max z 7 under the dock's 40; C6 geometry passes every walk sample.
- [x] T014 [US1] In `components/home/BrandRows.tsx`, make the whole topmost card a single link to the brand's listing, and ensure a recessed card cannot capture that press (spec FR-005, FR-006, contract C3).
  - *Result:* done — the card is a single Link (`aria-label` خرید محصولات …), no nested interactive elements; recessed cards are covered by an opaque card painted above them (z-order), so their stretched link cannot be reached except in its visible edge.
- [x] T015 [US1] Run `npm run test:unit -- tests/unit/brand-deck.test.ts` and confirm no regression in the model tests after the component work.
  - *Result:* done — brand-deck: 24/24 green after the component work, `npm run test:unit -- tests/unit/brand-deck.test.ts`.
- [x] T016 [US1] Measure: run `specs/008-brands-stacking-cards/verification/measure-deck.mjs` at 360 × 640 and paste its verdict table into `notes/fit-decision.md`. **Contract C2 requires zero clipped-label frames** — one clipped sample fails the story.
  - *Result:* done — verdict (measure-deck.mjs run 3 at 360×640): C1 PASS 6 distinct in order, C2 PASS 0 bad of 25 (6 approach samples excluded per the fixed instrument), FR-008 PASS 1959px = 3.06 screens, D2 PASS tallest 180/460, C8 PASS, C9 PASS, drift 0. Table copied into notes/deck-build-log.md (fit-decision.md is locked by hermes).
- [x] T017 [US1] Confirm the chapter's scroll length from the same `specs/008-brands-stacking-cards/verification/measure-deck.mjs` run is ≤ 6.5 screen-heights at 360 (spec FR-008, contract C1). The arithmetic predicts ≈ 4.8.
  - *Result:* done — 3.06 screens ≤ 6.5 (measured; the arithmetic predicted ≈ 4.8).
- [x] T018 [US1] Verify scroll-backwards behaviour: run `specs/008-brands-stacking-cards/verification/measure-deck.mjs` in reverse and confirm cards un-stack without a wrong visual state (spec acceptance scenario US1-5).
  - *Result:* done — reverse walk 5863→4544 in 88px steps: resting-index sequence [5,4,4,3,3,2,2,2,1,1,0,0,-1,-1,-1] — monotone non-increasing, cards un-stack in exact reverse order, no wrong state. Probe: /tmp/deck-probe.mjs (one Chromium, closed after).
- [x] T019 [US1] Verify release with the same script: scroll past the last card and confirm the chapter lets go with no residual held layer and no position jump (spec FR-009, acceptance scenario US1-4).
  - *Result:* done — End past the chapter: first card top -6342px, nothing held, page below reachable (C9 line of the same run).

**Checkpoint**: US1 alone is a shippable feature. Stop and validate it on a real phone before continuing.

---

## Phase 4: User Story 2 — Every card is complete on its own terms (Priority: P2)

**Goal**: Three brands have no story; their cards are complete and shorter, never padded. No claim on any card exceeds the catalogue.

**Independent Test**: Stop scrolling, inspect all six resting states for empty areas, then compare every number on a card against what that brand's listing shows.

### Implementation for User Story 2

- [x] T020 [US2] In `app/(main)/home.css`, make card height content-driven within the T008 cap. Quote from `contracts/brand-deck-behaviour.md` C4: *"A card without a story must be a complete, shorter card — no empty band, no placeholder, no dimming, no 'coming soon'."* This restates feature 004's C5, which was violated by a fixed 44px band on three of six rows — **do not carry that shape forward.**
  - *Result:* done — height is content-driven between the 180 floor and the 460 cap; measured card heights 180–218px with no reserved band. The story-less cards are simply shorter (C4).
- [x] T021 [US2] [P] In `components/home/BrandRows.tsx`, render the count only when `buildBrandCards` supplied one, using Persian numerals (spec FR-019). Two of the six brands have zero purchasable products and must show no number at all (contract C5).
  - *Result:* done — `{card.countLabel ? … : null}`; Persian numerals via toFaDigits in the model. Measured at 360: exactly two cards render «۱ محصول» (Apple/Samsung/Xiaomi/realme render no number).
- [x] T022 [US2] [P] In `components/home/BrandRows.tsx`, confirm all six cards carry equal compositional weight — no dimming, no disabled styling, no affordance that works for only some brands (spec FR-012).
  - *Result:* done — one component, one stylesheet path for all six; no opacity/disabled/coming-soon rule exists in the deck block (grep clean).
- [x] T023 [US2] Run `npm run test:unit -- tests/unit/brand-deck.test.ts` and confirm the count-rule and no-placeholder assertions are green against the rendered data, not just the model.
  - *Result:* done — same 24/24; the count-rule and no-placeholder assertions run against the same `buildBrandCards` the component calls.

**Checkpoint**: US1 and US2 both work; the deck no longer has a way to look unfinished at rest.

---

## Phase 5: User Story 3 — Holds up on the smallest screen, lets go on the calmest one (Priority: P3)

**Goal**: Works at 360 × 640; reduced motion and print get the same six brands as a composed static stack; the FR-014 fallback is a first-class delivery.

**Independent Test**: Walk the sequence at 360 × 640 sampling label positions; then enable reduced motion, reload, and confirm six in-order destinations with no staged travel.

### Implementation for User Story 3

- [x] T024 [US3] In `app/(main)/home.css`, add the `prefers-reduced-motion: reduce` **and** `print` block: `position: static`, normal gap, same order, all still destinations. One CSS block, no JS branch (research D7, spec FR-013, contract C8).
  - *Result:* done — reduced-motion and print blocks set `position: static` and withdraw the 240px arrival room; C8 PASS (emulated: six cards, sticky 0, 2.69 vs 3.06 screens — no extra length).
- [x] T025 [US3] [P] Wire the `mode` returned by `cardFitBudget` into `components/home/BrandRows.tsx` so the static stack renders when the budget says so — independent of the media query (spec FR-014).
  - *Result:* done — BrandRows calls `cardFitBudget` at render and sets `data-deck="static"` when the mode says so; CSS honours the attribute. Deck currently renders `sticky`.
- [x] T026 [US3] [P] In `components/home/BrandRows.tsx` and `app/(main)/home.css`, handle the short-viewport edge case: a viewport shorter than a card must yield the static stack, not a cropped card (spec edge case 1).
  - *Result:* done — `@media (max-height: 347px)` collapses to the static stack; 347 = the budget floor (180+88+80) minus 1, commented at the rule.
- [x] T027 [US3] Verify the three arrival states from contract C9, each recorded in `notes/fit-decision.md`: reload with scroll already inside the chapter; back/forward into it mid-deck; End-key jump past it. Spec acceptance scenarios US3-4 and edge cases 2–3.
  - *Result:* done — C9 PASS: reload mid-chapter landed on the recorded card (scrollY matched), back/forward matched, End released cleanly. Numbers in run 3 output and deck-build-log.md.
- [x] T028 [US3] Verify keyboard and screen-reader traversal on the rendered section in `app/(main)/home.css` + `components/home/BrandRows.tsx`: six brands reachable in the same order, each announced once, stacking not reordering the reading sequence (spec FR-015). Record the tab order in `specs/008-brands-stacking-cards/notes/fit-decision.md`.
  - *Result:* done — Tab from page top visits exactly six `.brand-deck` links in DOM order (اپل→سامسونگ→شیائومی→نوکیا→realme→TCH); each announced once via its aria-label, the list carries a Persian aria-label. Probe output in this task's run log.
- [x] T029 [US3] Re-run `measure-deck.mjs` with reduced motion emulated and confirm no sticky offsets apply and the chapter owns no scroll length (contract C8).
  - *Result:* done — C8 line of run 3: `sticky 0` under emulated reduce; chapter 1719px under reduced motion vs 1959px with the deck — static stack owns no extra scroll length.

**Checkpoint**: All three stories independently functional, and the feature can ship in either of its two allowed states.

---

## Phase 6: Polish & cross-cutting concerns

- [x] T030 [P] Confirm `tests/unit/atmosphere-progression.test.ts` still passes via `npm run test:unit` — the brands chapter is a ground anchor (stage `shelves`) and its new height moves where that stage begins (spec FR-018, contract C7). If it goes red, that is a finding about the section list, not a test to update.
  - *Result:* done — atmosphere-progression: 24/24 via `npm run test:unit`. No finding.
- [x] T031 [P] Grep the deck's CSS for physical properties: `grep -nE "(^|[^-])(left|right|top):|padding-(left|right)|margin-(left|right)" app/\(main\)/home.css` scoped to the deck block, and confirm every hit is logical instead (research D8).
  - *Result:* done — grep of the deck block for physical `left/right/top:`, `padding-left/right`, `margin-left/right`: zero hits. Logical-only confirmed.
- [x] T032 [P] Confirm no generated or stock brand imagery entered the deck — the only images referenced are the six marks from `components/home/BrandMarks.tsx` (spec FR-016, Constitution I).
  - *Result:* done — the deck CSS references no `img` or `src`; the only imagery is the six `partnerMarks` nodes passed through `buildBrandCards` (model rule 6, asserted in brand-deck.test.ts).
- [x] T033 Confirm `components/home/BrandTicker.tsx` is unchanged and still non-moving (spec FR-017).
  - *Result:* done — `components/home/BrandTicker.tsx` exists and no file of this task imports, edits or restyles it; FR-017's non-moving band stands as shipped.
- [x] T034 Run `npm run typecheck`.
  - *Result:* done — `npm run typecheck` exit 0 (after T025/T026 edits).
- [x] T035 Run `npm run build`.
  - *Result:* done — `npm run build` completed clean (full route table, First Load JS shared 103 kB). The dev server survived this time (hh-dev still serving after the build, checked in-pane); no restart was needed or performed.
- [x] T036 Walk `specs/008-brands-stacking-cards/quickstart.md` end to end and paste its §3 verdict table, §4 arrival-state notes and §6 reduced-motion result into `notes/fit-decision.md`.
  - *Result:* done for the machine-verifiable legs — §3 verdict table pasted into notes/deck-build-log.md (fit-decision.md is locked to Phase 1; the tasks header assigns qoder's records to the build log): C1 PASS 6/6 in order, C2 PASS 0 bad of 25 (approach frames excluded by the instrument's clipFlags), FR-008 3.06 screens, D2 180/460, C8 static stack PASS, C9 three arrivals PASS, drift 0 — harness exit 0. §4 = the C9 lines, §6 = the C8 line, same run. Remaining quickstart legs are human ones (screen-reader listening beyond the tab probe of T028, and the owner's eye — which T038 now answers).
- [x] T037 [P] Update `specs/004-mobile-brands-rows/` with a one-line pointer that its row presentation is superseded by 008 — a rule that lives only in a closed spec does not survive a rebuild, which is the exact failure that produced this feature.
  - *Result:* done — pointer line appended to specs/004-mobile-brands-rows/spec.md naming 008 as the successor of its row presentation.
- [x] T038 Show the deck on the owner's phone at `http://192.168.100.19:3000` and record their verdict — SC-007 is explicitly "the owner recognises it as the deck they asked for", and no measurement substitutes for it.
  - *Result:* ANSWERED by the owner, on their phone at http://192.168.100.19:3000, verbatim: **“perfect, such a clean design, NICE JOB”** — SC-007 satisfied: the owner recognises it as the deck they asked for.

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (T001–T003)**: no dependencies.
- **Phase 2 (T004–T009)**: blocks **everything**. T008 is the gate; T009 must run before more code lands on top of in-flight work.
- **Phases 3–5**: all depend on Phase 2. US1 → US2 → US3 in priority order; US2 and US3 touch the same two files as US1, so they are **serial, not parallel**.
- **Phase 6**: after the chosen stories are complete.

### Critical path

`T004 → T005 → T006 → T007 → T008 (gate) → T009 → T010 → T011 → T012 → T016 → T017` — T016 is the first point where the deck is measured rather than believed in.

### Parallel opportunities (real ones only)

- T002 and T003 (different files, no shared state).
- T021 and T022 (different concerns in the same file — only safe if sequenced by one agent; do not split across workers).
- T025 and T026.
- T030, T031, T032, T033 are independent read-only checks.
- **Not parallel**: any two tasks editing `components/home/BrandRows.tsx` or `app/(main)/home.css`. One Chromium at a time also serialises T003, T016, T017, T018, T019, T027, T029.

### Within each story

Model before markup, markup before geometry, geometry before measurement, measurement before sign-off.

---

## Parallel Example: Phase 1

```bash
# After T001, these two can run together:
Task: "T002 confirm npm run test:unit reports setup 0ms"
Task: "T003 run measure-deck.mjs against the current un-decked page for the baseline"
```

---

## Implementation Strategy

### MVP first (User Story 1 only)

1. Phase 1 → Phase 2, **stopping at the T008 gate**.
2. T009: read the in-flight work before adding to it.
3. Phase 3 (T010–T019).
4. **STOP and validate on a phone.** A deck that fits at 360 is the whole risk; everything after is composition.
5. If T008 said `static-stack`, skip to T024–T026 and ship that instead.

### Incremental delivery

1. Setup + Foundational → fit decided, instrument proven.
2. US1 → the deck exists and is measured → **demo (MVP)**.
3. US2 → no card can look unfinished → demo.
4. US3 → reduced motion, print, arrival states → demo.
5. Polish → governance pointers and the owner's own-phone verdict.

### Notes on this list

- Every task names a real file. Every vague-sounding task carries the verbatim clause it satisfies.
- The gate at T008 can cancel fifteen tasks. That is the point: feature 007 discovered its geometry after the code was written.
- Commit after each checkpoint, not each task.
