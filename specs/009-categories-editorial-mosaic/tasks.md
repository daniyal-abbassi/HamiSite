# Tasks: Categories Editorial Mosaic

**Input**: Design documents from `specs/009-categories-editorial-mosaic/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/category-mosaic.md`, `quickstart.md`

**Tests**: Included. The honesty rules in `data-model.md` are pure data and are asserted in a node-environment
test; the geometry rules are asserted in a browser.

> ## 🔒 THE STRUCTURE OF THIS LIST IS THE LOCK GATE
>
> Five of the files this feature must change are locked by **`qoder-ide`** (verified live, not assumed):
> `CategoryHub.tsx`, `CategoryCarousel.tsx`, `category-carousel.css`, `lib/category-departments.ts`,
> `tests/unit/category-departments.test.ts`. A REQUEST was posted on `.agent-pair/BOARD.md`; no answer.
> `app/(main)/home.css` is locked by **qoder (worker)**, which is inside this effort.
>
> Therefore **Phases 1 and 2 are the only work that can be done today.** Phase 3 onward is gated on T009.
> Editing a locked file is not a shortcut available to any agent, however inactive the holder looks — Jev scored
> that option 0.00 (`notes/jev-advisory.md` §2) and AGENTS.md rule 2 forbids it. **If the locks never clear, this
> feature ends at T009 with the old carousel still mounted and a complete, reviewed stylesheet waiting.** That is
> an acceptable outcome; a half-swapped homepage is not.

> ## Standing constraints for every task here
> - **Never** `npm test` or bare `npx vitest run` — `tests/setup.ts` is in `setupFiles` and its `resetDb()`
>   deletes nineteen tables from the real `hami_site_api` database. Use **`npm run test:unit`**.
> - Dev server is in tmux session **`hh-dev`** on `:3000`. Do not restart or kill it; read with
>   `tmux capture-pane -p -S -40 -t hh-dev`.
> - **One Chromium at a time** (7.6 GB box). Close it when a measurement ends.
> - Claim a lock in `.agent-pair/locks/` before editing (AGENTS.md rule 1); never `git add -A`, `git restore`,
>   `git checkout --`, `git stash`.
> - No new dependency. `embla-carousel-react` **stays** in `package.json` — `components/home/NewArrivals.tsx`
>   still imports it.

---

> **SUPERSEDED — do not implement anything in this file.**
>
> The owner rejected both mosaic variants this feature specifies ("A hero" and "B equal") on
> 2026-09-26 and asked for a masonry gallery instead, which shipped as
> `specs/010-categories-masonry-gallery` (32/32 tasks closed, accepted on the owner's phone).
> Its layout CSS (`.cat-mosaic`), `CategoryCarousel.tsx` and `category-carousel.css` were
> **deleted by 010**.
>
> The 34 open boxes below are therefore void, not pending. They stay open deliberately: marking
> them `[x]` would claim work that was cancelled. 010's own data, panel and honesty requirements
> carried over from this spec unchanged.

## Phase 1: Setup (shared infrastructure) — no locks needed

- [ ] T001 Read `research.md` D1–D8 and record in `specs/009-categories-editorial-mosaic/notes/status.md` the two numbers that govern everything downstream: content width at 360 is **312 px** (`tailwind.config.ts:38`, `padding: "1.5rem"`), so paired tiles are **150 px** and the floor is **148 px** — not the impossible 164 px the design sheet carried.
- [ ] T002 [P] Capture the before-state: at 360 and 1280, screenshot the current categories chapter and record how many departments are reachable by scrolling versus by gesture. This is the baseline the owner's acceptance is measured against. Save under `specs/009-categories-editorial-mosaic/baseline/`.
- [ ] T003 [P] Confirm the safe test path: `npm run test:unit` runs and reports `setup 0ms`, proving no database was touched. Record the line in `notes/status.md`.

---

## Phase 2: Foundational — the unlocked work

**⚠️ CRITICAL**: Everything in this phase is possible today. Complete it fully before asking anyone to release a lock, so the escalation arrives with finished work attached rather than as a request on faith.

- [ ] T004 Audit the ~165 lines of `.cat-mosaic` CSS already in `app/(main)/home.css` against `contracts/category-mosaic.md` M1–M8 and record, line by line, what holds and what is missing. Research D8 verified the selectors, the 2/3/4 column steps, the spans, `:focus-visible`, `forced-colors`, `prefers-contrast` and `prefers-reduced-motion`, and the absence of physical `left`/`right` — **do not rewrite it to match a task list.**
- [ ] T005 In `app/(main)/home.css`, add whatever the audit found missing, in particular the scrim plate at 88 % `#050101` over the label (research D6) if it is not already present, and explicit `aspect-ratio` on the tile image so a late-loading panel cannot shift layout.
- [ ] T006 In `app/(main)/home.css`, confirm the smallest tile cannot fall below 148 px at 360 and that the hero spans both columns there. Quote from `spec.md` FR-005: *"the smallest tile MUST still be at least 148 px across at 360 px."*
- [ ] T007 Create `tests/unit/category-mosaic.test.ts` asserting everything provable without a DOM: the nine departments in catalogue-weight order; a tile shows a count **only** where `showsCount` is true — quote `data-model.md`: *"`count` is present only where the brand's destination lists at least one purchasable product"*; no tile references an image outside `public/images/categories/v3/`; and **every `image` path resolves on disk** (research D4 — this guard is what stops a wrong extension becoming a hole in the composition).
- [ ] T008 Run `npm run test:unit -- tests/unit/category-mosaic.test.ts`. It will fail on the missing `image` field — that is the correct red state, and it is the evidence the escalation in T010 carries.
- [x] T009 **🔒 LOCK GATE.** Re-check `.agent-pair/locks/` for the five `qoder-ide` paths. Cleared → continue to Phase 3. Still held → **stop implementation here**, do T010, and leave the homepage rendering the existing carousel.
  → **Evaluated 2026-09-26 13:3x: BLOCKED.** All five still held by `qoder-ide` (the plan said four; the live check found five, including `tests/unit/category-departments.test.ts`). Phase 3 onward not attempted.
- [x] T010 Escalate once, in writing, with the finished work attached: the reviewed stylesheet, the failing test naming exactly the fields it needs, and the two open owner decisions from `notes/jev-advisory.md` (the 1.5 MB PNGs, and whether the hero asymmetry stands). Post to `.agent-pair/BOARD.md` and to the human. Do not re-post repeatedly and do not work around the locks.
  → **Done.** Board message posted; evidence in `notes/gate-and-escalation.md`. The audit also established the decisive fact: **no `.tsx` references `.cat-mosaic` or `.cat-tile`**, so the homepage a shopper sees today is unchanged and Phase 3 is not merely queued — it is the only thing that makes the preceding work visible.

**Checkpoint**: A complete, audited, contract-checked stylesheet and a red test that names the missing data — with zero locked files touched.

---

## Phase 3: User Story 1 — Every department is on the table at once (Priority: P1) 🎯 MVP

**Goal**: Nine departments visible at 360 in plain vertical scroll, each one tap from its listing, each recognisable before its label is read.

**Independent Test**: At 360 px, scroll the chapter top to bottom: nine tiles seen, zero horizontal gestures, nine presses landing correctly.

**Blocked by T009.** Requires `lib/category-departments.ts` and `CategoryHub.tsx`.

### Implementation for User Story 1

- [ ] T011 [US1] In `lib/category-departments.ts`, add `image` to `DEPARTMENT_SEED` and to the `Department` type, with the **real extension per file** — seven `.jpg` (charger, smartwatch, powerbank, computer-accessory, sim-card, car-charger, service) and two `.png` (phone, audio). Authored beside `slug` and `badge`, exactly as they are, because the test in T007 guards it.
- [ ] T012 [US1] [P] In `components/home/CategoryHub.tsx`, replace the carousel with the markup contract from `.scratch/qoder-categories-design/accessibility.md` §1: `<ul class="cat-mosaic__grid">` → `<li>` → one `<a class="cat-tile">` per department, `aria-describedby` to the count, image `alt=""` with explicit `width`/`height`, `sizes`, and `loading="lazy"`.
- [ ] T013 [US1] In `components/home/CategoryHub.tsx`, keep the existing section head, kicker, `#categories-title` heading and «مشاهده همه محصولات» link unchanged — FR-004 preserves the light ground and the owner praised that heading's context, and nothing in the spec asks to restyle it.
- [ ] T014 [US1] Run `npm run test:unit -- tests/unit/category-mosaic.test.ts` and make T007 green without editing its assertions.
- [ ] T015 [US1] Measure at 360: all nine tiles present in vertical flow, **zero** horizontal overflow anywhere in the chapter, smallest tile ≥148 px. Record the numbers in `notes/status.md`. Quote `contracts/category-mosaic.md` M1: *"Every department the shop currently supports appears within the chapter's vertical scroll at 360 px."*
- [ ] T016 [US1] Press all nine tiles at 360 and confirm each lands on its own listing (M3, FR-003); record the nine routes in `specs/009-categories-editorial-mosaic/notes/status.md`.
- [ ] T017 [US1] Run the five-second recognition test with someone who has never seen the site; record how many of nine they name from the panels alone. **Pass at six or more** (M2, SC-002).

**Checkpoint**: US1 alone is the feature the owner asked for. Stop and show it on a phone before continuing.

---

## Phase 4: User Story 2 — What a tile claims, the shop can back (Priority: P2)

**Goal**: Counts only where honest, no tile dimmed or stubbed, missing data visibly missing.

**Independent Test**: Compare every number on a tile against its destination; inspect all nine resting states for anything that reads as unfinished.

- [ ] T018 [US2] In `components/home/CategoryHub.tsx`, render the count only when `showsCount` is true — five of nine today; phone, charger and powerbank show **no number**. Quote `spec.md` FR-009: *"A count shown on a tile MUST equal the count the destination listing displays, and MUST be omitted where the destination holds nothing purchasable."*
- [ ] T019 [US2] In `app/(main)/home.css`, prove FR-006 by inspection: all nine tiles identical in treatment — same label style, same scrim, same focus ring, same press feedback — with **area** the only variable. Remove any rule that makes a small tile look secondary. *(Not marked [P]: it edits `home.css`, which one agent owns at a time.)*
- [ ] T020 [US2] [P] In `tests/unit/category-departments.test.ts`, extend the existing derivation guard so the `image` field is checked against the export the same way `slug` and counts already are — the test must keep re-deriving from `data/hami-products.json` rather than trusting a fixture.
- [ ] T021 [US2] Verify contrast against the **composited** background (plate over panel), not the plate colour alone: ≥4.5 : 1 on every tile; the current set measures 16.8 : 1 minimum (M5, FR-008). Paste the nine computed ratios into `notes/status.md`.

**Checkpoint**: US1 and US2 both hold; no tile can overstate the shop or understate itself.

---

## Phase 5: User Story 3 — Composed on a big screen, calm on a small one (Priority: P3)

**Goal**: The block holds at 768 and 1280 with no orphan row, the light ground is untouched, and the chapter works with scripting off.

**Independent Test**: View at 360 / 768 / 1280; then reload with JavaScript disabled and confirm nine visible, tappable tiles.

- [ ] T022 [US3] In `app/(main)/home.css`, verify the 768 step: 3 columns, hero spanning 2, two mediums spanning 2. Quote `spec.md` FR-016: *"The layout MUST hold at 360, 768 and 1280 px, with no orphaned trailing row at the widest step."*
- [ ] T023 [US3] In `app/(main)/home.css`, verify the 1280 step fills 12 cells with no stranded tile — the arithmetic in research D2 (hero 2×2 + two mediums + five smalls) is what makes nine divide evenly; if a tenth department is ever added, re-run that arithmetic rather than patching a row.
- [ ] T024 [US3] [P] Confirm the chapter renders fully with scripting disabled — all nine tiles visible and tappable (FR-018, SC-007). This should be free; if it is not, something scripted has crept in and must be removed, not worked around.
- [ ] T025 [US3] [P] Verify keyboard and screen-reader behaviour per M6: nine tab stops in DOM order with a visible ring; the section announces as a list of nine; each tile as one link with its name and, where shown, its count. Record the announcement text in `notes/status.md`.
- [ ] T026 [US3] Verify the light ground is unchanged from the T002 baseline, side by side. This is the owner's own acceptance criterion (FR-004, SC-005) — *"the white background is so pretty, keep it"* — and a measurement cannot substitute for their eye.

**Checkpoint**: All three stories independently functional; the chapter is done.

---

## Phase 6: Polish & cross-cutting concerns

- [ ] T027 Delete `components/home/CategoryCarousel.tsx` and `components/home/category-carousel.css` (FR-014, M7). Quote `research.md` D7: *"an unreferenced component is how the next agent rediscovers the old design and assumes it was deliberate."*
- [ ] T028 In `app/(main)/home.css`, delete the band-paper mount patch that existed to serve the carousel, and confirm no orphan rule references a deleted selector.
- [ ] T029 [P] Confirm no `CategoryCarousel` / `category-carousel` import survives: `grep -rn "CategoryCarousel\|category-carousel" app/ components/ lib/` must be empty, and `grep -rn embla components/home/` must return only `NewArrivals.tsx`.
- [ ] T030 [P] Confirm the carousel's `aria-roledescription` values ("carousel", "slide") appear nowhere in the source or in a screen-reader announcement — a grid announcing itself as a carousel is a lie (M6, research D7).
- [ ] T031 [P] Confirm the ground anchor still reads: run `npm run test:unit -- tests/unit/atmosphere-progression.test.ts` and verify the existing sweep passes with the chapter at its new height (FR-020). A red here is a finding about the section list, not a test to edit.
- [ ] T032 Handle the two resilience cases from `spec.md`: block a panel image and confirm the tile keeps its name and stays a link with the absence visibly missing (FR-019); empty one department's category and confirm the tile disappears and the grid closes without a hole (FR-015).
- [ ] T033 Run `npm run typecheck` and `npm run build`.
- [ ] T034 Walk `specs/009-categories-editorial-mosaic/quickstart.md` §3–§10 end to end and paste the measured results into `notes/status.md`.
- [ ] T035 [P] Record the two deferred items where they cannot be lost: panel encoding conversion (two 1.2–1.5 MB PNGs) as a **pre-ship** task, and the owner's call on whether feature 005's carousel contracts are formally superseded (`plan.md` Complexity Tracking).
- [ ] T036 Show the chapter on the owner's phone at `http://192.168.100.19:3000` — confirm the address first, it changes on every reboot — and get the SC-005 answer to the only question that matters: is this the chapter they asked for, on the ground they told us to keep?

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (T001–T003)**: no dependencies.
- **Phase 2 (T004–T010)**: no lock needed. **T009 is a hard gate**, not a task to tick.
- **Phases 3–6**: every remaining task touches a locked file or a file whose meaning changes only once the locked
  ones do. **None may start before T009 clears.**
- Within Phase 3: T011 (data) → T012 (markup) → T014 (test green) → T015–T017 (measurement).

### Critical path

`T004 → T005 → T006 → T007 → T008 → T009 (gate) → T011 → T012 → T014 → T015`

### Parallel opportunities (real ones)

- T002 and T003 (read-only, different artefacts).
- T007 is a new file and can run beside either.
- T019 and T020 (different files — `home.css` and a test).
- T024 and T025 (different checks, both read-only).
- T029, T030, T031 are independent greps/tests.
- **Serial by necessity**: T004 → T005 → T006 → T019 all edit `app/(main)/home.css`, so none is marked `[P]`; and every browser measurement (one Chromium).

### Within each story

Data before markup, markup before test-green, test-green before measurement, measurement before sign-off.

---

## Parallel Example: Phase 2

```bash
# These two are genuinely parallel — different files, no shared state:
Task: "T007 create tests/unit/category-mosaic.test.ts"
Task: "T002 capture the 360/1280 before-state into specs/009-categories-editorial-mosaic/baseline/"

# T004 → T005 → T006 all touch app/(main)/home.css and are deliberately NOT marked [P]:
# one agent owns that file at a time, and the audit must precede the additions.
```

---

## Implementation Strategy

### MVP first

1. Phases 1–2 in full — **all of it possible today, none of it blocked.**
2. Hit T009. If the locks are clear, do Phase 3 and **stop**: a nine-visible mosaic at 360 is the feature.
3. If the locks are not clear, ship nothing and hand over the reviewed stylesheet plus the red test.

### Incremental delivery

1. Phase 2 → a verified stylesheet and a test that names the gap. Demo-able as "ready, awaiting ownership".
2. Phase 3 → the mosaic itself → **demo on the owner's phone (MVP)**.
3. Phase 4 → honesty guarantees → demo.
4. Phase 5 → composition and no-script resilience → demo.
5. Phase 6 → deletions, governance, acceptance.

### Notes on this list

- The gate is a task, not a footnote, because a footnote gets skipped by the agent under deadline.
- T008 failing is a **deliverable** of Phase 2: it is the evidence that makes the escalation concrete instead of rhetorical.
- Commit after each checkpoint, not after each task.
