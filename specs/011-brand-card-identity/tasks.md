# Tasks: Brand Card Identity

**Input**: design documents from `specs/011-brand-card-identity/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md` D1–D7, `data-model.md`,
`contracts/brand-identity.md` R1–R8, `quickstart.md`, and the evidence base
`research/brand-identity-sources.md` — **that file is the source of truth for every colour claim and every line.
Read it before writing any of them.**

**Tests**: included, and written first. This feature is unusually testable for a visual change: the palette is
arithmetic and the claims are sourced data, so **garishness, contrast and falsehood are all assertable without a
browser**. Only recognition (R1) and the family feel (R2's human half) need people.

> ## Standing constraints for every task here
> - **`npm run test:unit` only. Never bare `npm test`, never bare `npx vitest run`** — that config loads
>   `tests/setup.ts`, whose `resetDb()` deletes nineteen tables from the real `hami_site_api` database. Expect
>   `setup 0ms` in the output.
> - **Do not edit `specs/008-brands-stacking-cards/verification/measure-deck.mjs`.** It is 008's referee and it
>   passes. If a clause fails after the treatment lands, the *treatment* changes. It was fixed once this cycle for
>   a real bug, with a self-test added; a second edit made by the person being graded is a different thing.
> - **Edit only inside 008's existing `.brand-deck` block** in `app/(main)/home.css`. Do not touch the
>   `/* ==== 010 categories masonry ==== */` region — a source-text test reads exactly that block.
> - **No new dependency.** `oklch()` is native CSS. **No generated maker imagery, no maker logo** (FR-016).
> - Claim a lock in `.agent-pair/locks/` before editing any file; `app/(main)/home.css` and
>   `components/home/BrandRows.tsx` are currently held by qoder from 008 — same lane, so re-state the `why` as 011
>   rather than releasing and re-claiming.
> - Never `git add -A`, `git restore`, `git checkout --`, `git stash`. Stage explicit paths.
> - The dev server is tmux **`hh-dev`** on `:3000`. **Any `npm run build` breaks it** — a build rewrites `.next`
>   under the live server and silently kills hydration. Restart `hh-dev` after every build.
> - One Chromium at a time on this 7.6 GB box; close it when a measurement finishes.

---

> **Status: PARKED by the owner on 2026-09-27, then partially overtaken.**
>
> 0 of 34 boxes are marked, but that is not the true state. The worker reported T001–T013 complete
> at 20:40 on 2026-09-26, and this is independently consistent with the tree: `lib/brand-identity.ts`
> exists (266 lines) and `tests/unit/brand-identity.test.ts` passes 32/32. Nothing was ever written
> back, for the same reason as 007 — the work ran through dispatch, not `/speckit-implement`.
>
> It then went **two ways at once.** The owner parked the feature to regenerate the brand artwork,
> and a separate qoder side session claims `BrandRows.tsx`, `lib/brand-identity.ts` and
> `app/(main)/home.css` under an order that **overwrote the no-AI-imagery rule** and approved six
> generated card artworks. Those three locks are live; do not edit those files without reading
> `.agent-pair/locks/` first.
>
> **FR-006 in `spec.md` is now stale against the code**: it requires a description line on every
> card, and the rendered cards carry none. Amend the spec or the cards, not both by accident.

## Phase 1: Setup (baseline and locks)

**Purpose**: pin the state this feature must not break, before touching anything.

- [ ] T001 Re-state the two existing locks for 011 in `.agent-pair/locks/app__(main)__home.css.lock` and `.agent-pair/locks/components__home__BrandRows.tsx.lock` (overwrite the `why` line with `011 brand card identity — deck card grounds and lines`), and claim `.agent-pair/locks/lib__brand-identity.ts.lock`, `.agent-pair/locks/tests__unit__brand-identity.test.ts.lock`, `.agent-pair/locks/specs__011-brand-card-identity__verification.lock`
- [ ] T002 Capture the referee's baseline: run `node specs/008-brands-stacking-cards/verification/measure-deck.mjs`, paste its full clause-by-clause output into `specs/011-brand-card-identity/verification/baseline-008-gate.md`, and record the chapter length in screens. Every later R7 check compares against this file, not against memory.
- [ ] T003 [P] Capture the visual baseline: `node tools/shots/viewport.mjs --width 360 --height 640 --scroll-to "#brands" --out specs/011-brand-card-identity/verification/before-deck@360.png`, then read `research/brand-identity-sources.md` end to end and write, at the top of `specs/011-brand-card-identity/notes/evidence-map.md`, one line per maker naming which of its claims are `primary`, `observed`, `aggregator` or `none` — this is the checklist every later colour and copy decision is read against

**Checkpoint**: the gate passes today, its output is on disk, and the evidence limits are written down before
anyone chooses a colour.

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: the pure module and the arithmetic that makes the palette checkable. No story can start without it.

- [ ] T004 Write the **failing** test file `tests/unit/brand-identity.test.ts`. It must import from `@/lib/brand-identity` (which does not exist yet) and assert, from data alone: (a) exactly six records, keyed by the same six names `brandWall` uses; (b) verbatim from data-model.md — *"Six records, six lines, six sources. Zero blanks, zero unsourced lines"* — so every `line`, `lineSource.url` and `lineSource.checkedAt` is non-empty; (c) verbatim — *"`hueFamily: "none"` requires `placement: "house"` — an unsourced maker cannot carry a hue, and must not quietly receive one because the row was left blank"*; (d) verbatim — *"Every `C` at or below the ceiling; every `L` inside the band"* with the envelope read from the module, band `L` 0.17–0.26 and ceiling `C` ≤ 0.055; (e) the two blues are within 25° of hue of each other and differ by `placement`, not by value; (f) the two hueless records are measurably different from each other. Run `npm run test:unit tests/unit/brand-identity.test.ts` and confirm it is red because the module is missing, not because of a typo.
- [ ] T005 In the same file `tests/unit/brand-identity.test.ts`, add the contrast maths and make it a real check rather than a comment: implement OKLCH → Oklab (polar to Cartesian) → LMS → **linear** sRGB → gamma-encoded sRGB → WCAG relative luminance → contrast ratio, as a local helper. Then assert verbatim from data-model.md — *"Every computed text-on-ground contrast ≥ 4.5 : 1"* — for the cream `#f0ece9` and champagne `#e5d3b3` tokens against **all six derived card grounds**. Sanity-pin the helper first with two known pairs (black-on-white must return 21.0, and `#f0ece9` on the current deck ground `#1e0a10` must land within 0.5 of its measured value) so a broken matrix cannot quietly make everything pass.
- [ ] T006 Create `lib/brand-identity.ts` — the pure module. Export `IDENTITY_ENVELOPE` (`L` band, ground `C` ceiling, accent `C` ceiling), the `BrandIdentity` type exactly as `data-model.md` defines it, the six records, and `cardGroundOkLCH(name)` / `cardAccentOkLCH(name)` returning the strings CSS consumes. Hue families and placements are fixed by data-model.md and are **not** up for reinterpretation: APPLE `monochrome`/neutral-accent, SAMSUNG `blue`/`accent` over near-neutral, XIAOMI `orange`/`ground`, NOKIA `blue`/`ground`, REALME `yellow`/`ground`, TCH `none`/`house`. Every `hueSource.kind` must say what the evidence actually is — only Xiaomi's orange is `observed` on the maker's own markup; Samsung, realme, Nokia and TCL are `aggregator` or `none`. Make T004 and T005 green.
- [ ] T007 In `lib/brand-identity.ts`, add the two blocklists as data, not prose: `UNVERIFIED_SLOGANS` containing Apple's "Think different" and Nokia's "Connecting People" (and their Persian renderings), and `FORBIDDEN_FRAMINGS` keyed by maker, exactly as `data-model.md` tabulates them — Nokia as handset manufacturer, realme as independent, TCH as a phone maker by heritage, Samsung as "world's biggest phone company". Add the assertion to `tests/unit/brand-identity.test.ts`: no blocked string appears in any rendered field of any record, matched case- and script-insensitively. Record in the module comment *why* the two safe slogans (realme "Make it real", TCL "The Creative Life") are stored in `makerSlogan` and **never rendered** — research D6.

**Checkpoint**: the palette is arithmetic, the contrast is computed, and the lies are enumerated. All green before
any CSS exists.

---

## Phase 3: User Story 1 — Telling the brand from the card alone (Priority: P1) 🎯 MVP

**Goal**: six card grounds that a person can name, inside the envelope, with nothing invented.

**Independent test**: hide the names and wordmarks, show the six grounds to someone who has never seen the site,
count correct identifications. Bar: four of six.

### Tests for User Story 1

- [ ] T008 [US1] Add the **failing** guards to `tests/unit/brand-identity.test.ts`: each of the four hue-bearing makers sits in its documented family (assert by hue range — blue ≈ 250–290, orange ≈ 40–80, yellow ≈ 85–110), and no record's `hueSource.kind` is `primary` unless a primary source URL is present. Assert verbatim from contract R3: *"no rendered string, `title`, `aria-label` or comment on the page asserts an official colour"*, by scanning the six records' text fields and `components/home/BrandRows.tsx` for the phrase patterns "official", "registered", "brand colour" next to a maker name.

### Implementation for User Story 1

- [ ] T009 [US1] In `components/home/BrandRows.tsx`, emit each card's derived custom properties from `lib/brand-identity.ts` — `--card-ground`, `--card-accent`, `--card-rule` — set on the card element, and pass the maker's `placement` through as a `data-hue-placement` attribute. The component must contain **no colour literal**; if a hex appears here, the envelope has been bypassed.
- [ ] T010 [US1] In `app/(main)/home.css`, **inside 008's `.brand-deck` block only**, consume the custom properties: the card ground becomes a two-stop gradient derived from `--card-ground` at the same lightness the deck uses today (`#1e0a10 → #120104` is the current pair — keep the range, shift the hue), and `--card-accent` paints the ordinal, the rule and the mark plate. `placement: "accent"` cards keep a near-neutral ground with a blue accent; `placement: "house"` (TCH) keeps the existing ground untouched. Do not add a maker's name to any selector — R8 requires the stylesheet to be maker-agnostic.
- [ ] T011 [US1] Confirm the two hueless cards are distinguishable and the two blue cards are not identical: screenshot all six grounds at 360 into `specs/011-brand-card-identity/verification/palette@360.png` with `tools/shots/viewport.mjs`, and record in `verification/r2-r4-grounds.md` the computed ground for each maker plus the measured ΔL and Δhue between Apple's neutral and TCH's house burgundy, and between Samsung's and Nokia's cards.

### Verification for User Story 1

- [ ] T012 [US1] **[R3]** Verify no invented or borrowed colour: for each of the six, confirm the hue family traces to a source recorded in `lib/brand-identity.ts` with a check date, and confirm the four forbidden claims appear nowhere — `#1428A0` as Samsung's, `#005AFF` as Nokia's, any hex as realme's or TCL's, and the words "official"/"registered" beside any maker's colour. Record in `verification/r3-no-invented-colour.md`.
- [ ] T013 [US1] **[R4]** Verify the hueless pair: confirm Apple renders achromatic (`C = 0`, monochrome register) and TCH renders the house ground with no maker hue, and that a person can tell them apart without the name. Record the answer in `verification/r4-hueless.md`.
- [ ] T014 [US1] **[R8]** Verify the system extends: add a seventh throwaway record in a test fixture (not in the shipped table) with a hue family, a source and a line, and confirm the suite's envelope assertions still hold and `grep -nE "APPLE|SAMSUNG|XIAOMI|NOKIA|REALME|TCH" "app/(main)/home.css"` returns **nothing** — the stylesheet must not name makers.
- [ ] T015 [US1] **[R1]** Build `specs/011-brand-card-identity/verification/recognition-test.mjs`: render the six card grounds at 360 with `.brand-deck__label`, `.brand-deck__mark` and all text hidden, into one labelled A–F image, and print the mapping separately. Run it on a person who has not seen the site and record the count and the per-brand list in `verification/r1-recognition.md`. **Bar: four of six**, with the two blue makers and the two hueless ones allowed to be confused. **If it misses**: take exactly one step — raise the chroma ceiling by a stated amount, re-screenshot, re-run, and write down what the step cost. Do not change two things at once and do not settle it by looking; this clause is a count precisely because the owner's ask and Jev's judgement conflict (research D5).

**Checkpoint**: the deck is recognisable by colour, nothing about a maker's colour was invented, and the number is
on record.

---

## Phase 4: User Story 2 — Every brand says something (Priority: P2)

**Goal**: six sourced one-line characterisations, replacing three invented ones and filling three blanks.

**Independent test**: count cards with a line (must be six), then trace each line to a recorded source, then read
all six against those sources.

### Tests for User Story 2

- [ ] T016 [US2] Add the **failing** guards to `tests/unit/brand-identity.test.ts`: all six `line` fields non-empty and Persian; all six carry `lineSource.url` + `checkedAt`; the `UNVERIFIED_SLOGANS` and `FORBIDDEN_FRAMINGS` lists from T007 are asserted against the **rendered** strings, not just the data; and the three invented lines currently in `brandStories` in `lib/content/home.ts` («مینیمال، دقیق، بی‌حاشیه.», «قدرتی که با جزئیات دیده می‌شود.», «فناوری پویا، با انتخابی روشن.») are asserted **absent**, so the old copy cannot be reintroduced by a revert.

### Implementation for User Story 2

- [ ] T017 [US2] Write the six Persian lines into `lib/brand-identity.ts`, one per maker, each resting only on facts present in `research/brand-identity-sources.md`, using the drafts in `data-model.md` as the starting point and the *"Restatable in Persian honestly"* lines as the ceiling of what may be claimed. Keep them to one line at 360 px. The Nokia line must carry the 1865 pulp-mill fact — it is the one that makes the FR-020 prohibition unnecessary by stating something truer.
- [ ] T018 [US2] Replace `brandStories` / `brandStoriesByName` in `lib/content/home.ts` with the sourced table: delete the three invented entries and re-point `BrandRows.tsx` and any other consumer at `lib/brand-identity.ts`. Grep every consumer first (`grep -rn "brandStories" app/ components/ lib/ tests/`) so no import is left dangling, and confirm nothing else on the site still renders the old invented copy.
- [ ] T019 [US2] In `components/home/BrandRows.tsx` and the `.brand-deck` block of `app/(main)/home.css`, render the line on every card in the same position and style for all six, and confirm the protected pair still wins: verbatim from FR-019 — *"The description line MUST NOT be allowed to push the maker's name or mark out of view at any width."*

### Verification for User Story 2

- [ ] T020 [US2] **[R5]** Verify the six lines are true, in two passes. **Machine pass**: `npm run test:unit tests/unit/brand-identity.test.ts` proves presence, sources, dates and the absence of every blocked string. **Human pass**: open `lib/brand-identity.ts` and `research/brand-identity-sources.md` side by side and, for each of the six, write one line in `verification/r5-truth-read.md` confirming the Persian says *what the source says and no more* — a test can prove a phrase is absent, only reading proves an allowed phrase is not overstated. Include the four things that must appear nowhere: Apple's "Think different", Nokia's "Connecting People", Nokia as handset manufacturer, realme as independent.

**Checkpoint**: six cards, six true lines, six sources, zero invented copy.

---

## Phase 5: User Story 3 — Still one shop, still expensive (Priority: P3)

**Goal**: the treated deck reads as one Hami Hamrah page and keeps its premium register.

**Independent test**: show it to someone who has not seen the site and ask whose page this is and whether the six
belong together.

### Tests for User Story 3

- [ ] T021 [US3] Add the **failing** guards to `tests/unit/brand-identity.test.ts`: the six derived grounds are one family — assert the spread of `L` across all six is ≤ 0.09 and that no ground exceeds the `C` ceiling; and assert 008's mechanism is still declared in the stylesheet — `position: sticky`, `inset-block-start: calc(var(--stack-i` and no `position: absolute` on `.brand-deck__item` (contract R7's static half).

### Implementation for User Story 3

- [ ] T022 [US3] In `app/(main)/home.css`, tune the six grounds **within the envelope only** until the six read as one family at 360: hue and nothing else. If a card looks brighter than its neighbours, the bug is in the custom property, not in the palette — fix the derivation in `lib/brand-identity.ts`, never a per-maker override in CSS.
- [ ] T023 [US3] Confirm the accent-only makers still read as belonging: Samsung's card is a near-neutral ground with a blue accent, which is the odd one out by construction (D3). Verify it does not look like an unfinished card, and if it does, strengthen the accent's presence (rule, ordinal, mark plate) rather than tinting the ground — tinting the ground would collapse the Samsung/Nokia distinction the placement exists to carry.

### Verification for User Story 3

- [ ] T024 [US3] **[R6]** Verify contrast six ways: the computed ratios from T005 are recorded per card in `verification/r6-contrast.md`, then re-measured in the browser at 360 and at 1280 on all six cards using `getComputedStyle` on the rendered ground and text, because the arithmetic assumes no overlay the stylesheet might add. Both sets of numbers go in the file side by side; any disagreement is a bug in one of them, not a rounding note.
- [ ] T025 [US3] **[R2]** Verify the family and the shop's dominance: show `verification/palette@360.png` to someone who has not seen the site and record two verbatim answers in `verification/r2-family.md` — whose page is this (must be Hami Hamrah), and do these six belong together (must be yes). Record the *answers*, not an interpretation of them.
- [ ] T026 [US3] **[R7]** Verify the deck did not move: re-run `node specs/008-brands-stacking-cards/verification/measure-deck.mjs` and compare clause by clause against `verification/baseline-008-gate.md` from T002 — C1 six tops in source order, C2 zero clipped of 25 evaluated, FR-008 chapter screens, D2 height vs budget, C8 reduced-motion static stack, C9 three arrivals. Paste both outputs into `verification/r7-deck-unchanged.md`. **Editing the instrument is prohibited**; if a clause fails, change the treatment and re-run.

**Checkpoint**: all three stories independently satisfied — recognisable, truthful, and still one expensive page.

---

## Phase 6: Polish & cross-cutting concerns

- [ ] T027 [P] Grep the `.brand-deck` block for physical properties: `grep -nE "(^|[;{[:space:]])(left|right|padding-left|padding-right|margin-left|margin-right|top|bottom)[[:space:]]*:"` over the block must return nothing new — 008's D8 logical-properties rule still applies to anything added here
- [ ] T028 [P] Confirm no new asset entered the tree: `git status --short public/` shows nothing added under `public/brand/` or `public/images/`, and no generated maker imagery exists anywhere in the diff (FR-016)
- [ ] T029 [P] Confirm the wordmark isolation survived: the Latin mark still renders inside `dir="ltr"` in the RTL line, exactly as 008 left it, at 360 and at 1280
- [ ] T030 Run `npm run typecheck` and `npm run test:unit` — both clean, and the suite count has grown only by `brand-identity.test.ts`
- [ ] T031 Run `npm run build`, then **restart the dev server** (`hh-dev` in tmux; `npm run dev -- -H 0.0.0.0 -p 3000`) and re-verify hydration in a browser — `reactKeys > 0` on a card and zero console errors beyond the pre-existing 401. A build silently breaks the running dev server; this is documented in `CLAUDE.md` and has cost this project time twice.
- [ ] T032 Walk `specs/011-brand-card-identity/quickstart.md` end to end and paste its §3 recognition result and §5 gate comparison into `verification/README.md`, one row per clause R1–R8 with its number
- [ ] T033 Record the two deferred items honestly in `verification/README.md`: Apple's logo usage terms were never read (the page 404'd) so nothing may be asserted about them, and a primary guideline document for Samsung, realme, Nokia or TCL would upgrade evidence but would not change the rule that the value stays ours
- [ ] T034 Show the treated deck on the owner's phone at the fresh LAN address (`ip -br addr`; if the phone cannot connect it is the Windscribe DROP ahead of ufw, and the two `hh-lan-dev-3000` iptables rules need re-applying) and record their verdict verbatim as SC-008

---

## Dependencies & execution order

```
T001 (locks) ─▶ T002 (gate baseline) ─▶ T003 (evidence map)
                                              │
                    Phase 2 ──────────────────┤
                    T004 red tests ─▶ T005 contrast maths ─▶ T006 module ─▶ T007 blocklists
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        ▼                                     ▼                                     ▼
  Phase 3 US1 (P1) 🎯                   Phase 4 US2 (P2)                      Phase 5 US3 (P3)
  T008 ─▶ T009 ─▶ T010 ─▶ T011          T016 ─▶ T017 ─▶ T018 ─▶ T019          T021 ─▶ T022 ─▶ T023
  ─▶ T012 [R3] T013 [R4] T014 [R8]      ─▶ T020 [R5]                           ─▶ T024 [R6] T025 [R2] T026 [R7]
  ─▶ T015 [R1] ← the count decides
                                              Phase 6: T027–T034
```

- **T002 before anything**: without the recorded 008 baseline, R7 has nothing to compare against and "nothing
  regressed" becomes a feeling.
- **Phase 2 blocks all three stories.** US1 needs the derivation, US2 needs the records, US3 needs the envelope.
- **US1 and US3 both edit `app/(main)/home.css`** (T010, T022) and **US1 and US2 both edit `BrandRows.tsx`**
  (T009, T019) — so the three stories are **serial in the files even though they are independent in meaning**.
  Do not run them in parallel.
- **T015 (R1) is the only task that can send earlier work back.** It is deliberately last in US1 and it has a
  one-variable escalation rule, because the alternative is an argument about taste with a screenshot on each side.
- Tests are written and seen failing before the code in every story phase.

### Parallel opportunities

- T003 runs alongside T002 (different files, no dependency).
- T027, T028, T029 are independent read-only checks and can be batched.
- **Not parallel**: anything touching `app/(main)/home.css`, `components/home/BrandRows.tsx`, or
  `lib/brand-identity.ts` — one writer per file, and all three are hot.

## Implementation strategy

**MVP = Phases 1–2 + US1 through T015.** That is a shippable deck: six grounds a person can name, nothing
invented about any maker's colour, the hueless pair honest, and the recognition count on record. It is also the
point at which the owner's sentence is either met or measurably not met — which is why the escalation rule lives
there and not in polish.

**Then US2** (the six lines — the part Principle I actually cares about, and the part most likely to be quietly
skipped because a test can check sources but not overstating), **then US3** (family and contrast, which the
envelope has already done most of the work for).

**Do not** reorder to make US3 first. The harmony argument is settled by the envelope in Phase 2, and if it is
revisited before recognition is measured, the likely outcome is a safe accent-only deck that answers a question
the owner did not ask.

## Notes

- `[P]` appears only on read-only checks. Every write here lands in one of three hot files.
- **The most valuable thing in this feature is `research/brand-identity-sources.md`.** It says no to four plausible
  colours and two famous slogans, and it caught that Nokia does not make phones. If a later task finds itself
  wanting to state something not in that file, the file wins.
- Commit after each phase checkpoint, staging explicit paths, and re-read `git status --short` first — a dirty
  file you did not touch belongs to another agent.

---

## Phase 7: Convergence

**Appended 2026-09-29 by `/speckit-converge`, immediately after the `/speckit-clarify` session that
withdrew the description line.** The ruling is the owner's: *"the brand's card is self explanatory and does not
need a text."* FR-006, FR-004, FR-013, FR-015, FR-019, SC-001, SC-002, SC-003 and User Story 2 were amended in
`spec.md`; nothing below re-litigates that decision. What is below is the gap between the amended spec and the
code that shipped under the old one.

**The headline:** `tasks.md` read **0 of 34** when this pass started, yet T001–T013 landed and 32 unit tests
cover the deck. The boxes are wrong in the direction that makes finished work look unfinished, which is the
known toolchain failure — only `/speckit-implement` writes checkboxes and this feature was built by dispatched
workers. T041 is the reconciliation; the findings above it are real new work created by the reversal.

- [ ] T035 Remove the visible maker name and product count from the deck card — `components/home/BrandRows.tsx:84-87` renders `card.label` in `.brand-deck__label` and `card.countLabel` in `.brand-deck__count`, both of which FR-006 now forbids; a card that shows text is the defect as of 2026-09-29 (contradicts) per FR-006, US2/AC1 (**CRITICAL**)
- [ ] T036 Prove the maker's name survives the removal of its visible form: FR-004 requires an accessible name that is never rendered as text. Today the name reaches assistive technology through the card's `aria-label` (`BrandRows.tsx:108`, "خرید محصولات {label}") and the image is deliberately `alt=""` — so confirm the link's name still identifies the maker once `.brand-deck__label` is gone, and that the print path names the card too. If the card ever stops being a link, this becomes a real gap rather than a confirmation (missing) per FR-004, US2/AC3, US2/AC4 (**HIGH**)
- [x] ~~T037 Re-capture the six artworks without painted text and without the «دیدن محصولات» button.~~
  **WITHDRAWN — the premise was false and the task is mine, not the owner's.** I wrote it from the conversation
  record instead of opening the files. The six `public/images/brands/*C.webp` the code actually references are
  dated 2026-09-27 03:26 and are the regenerated set. Opened two of them: Apple is two iPhones and the Apple
  mark on black; Samsung is a phone, a stylus and the Samsung wordmark. **No caption, no «دیدن محصولات» button,
  nothing to recapture.** What the artwork does carry is the maker's own wordmark, which FR-016 explicitly
  permits. The only remaining work in this area is T035, the live text the page itself renders.
- [ ] T038 Add the assertion SC-002 now demands — zero of six cards render a text string **in the page's own
  markup** — to the deck's existing verification, and let it fail on the current build so the check is proven live
  rather than written after the fact. It must read the card's DOM, not its image: the approved artwork carries the
  maker's wordmark by design (FR-016), and an instrument that counts pixels would report five false failures.
  (partial) per SC-002 (**MEDIUM**)
- [ ] T039 Re-run the SC-001 recognition test under its amended condition, name hidden only rather than name and wordmark. The narrowing is recorded in the spec; the number has not been measured since (partial) per SC-001, US2 (**MEDIUM**)
- [ ] T040 Retire what the reversal makes dead, once T035 lands: `countLabel` construction in `lib/brand-deck.ts` and its `brandPurchasableCounts` feed into the deck only, so check whether the deck is its last consumer before deleting anything. `BrandMarks.tsx` is **not** orphaned — `BrandTicker.tsx` still uses it — so leave it alone (unrequested) per FR-006, blueprint honesty (**MEDIUM**)
- [ ] T041 Walk the 34 open boxes with the code open and close the ones that shipped — T001–T013 are in the tree with 32 passing tests — writing the artefact or file:line that proves each one. Do not close a box on the strength of this paragraph (partial) per the toolchain gap recorded in `tools/dispatch/worker-ctl` (**MEDIUM**)
- [ ] T042 FR-011's seventh-maker claim has never been exercised: add a seventh entry to the identity data in a scratch run and show the deck absorbs it without a redesign, or narrow FR-011 to what has been demonstrated (missing) per FR-011 (**LOW**)
