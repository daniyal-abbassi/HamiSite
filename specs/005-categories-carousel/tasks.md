# Tasks: Categories Carousel Presentation

**Input**: Design documents from `/specs/005-categories-carousel/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: The quickstart defines browser-verified gates that cannot be satisfied by unit tests, because this
project has no DOM harness (`research.md` D8). Pure derivation is unit-tested; behaviour is verified in a
real browser at 360px and 1280px and recorded under `notes/`.

**Structure**: Four user stories. Phase 2 is a real gate, not a formality — the department table is the thing
every story renders, and a wrong table makes every later check pass on false content.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3, US4)
- Exact file paths included

## Path Conventions

Single Next.js app. `components/`, `lib/`, `app/` at repository root; this feature touches no `src/` tree and
no `data/`, `app/api/` or `prisma/` file.

---

## Phase 1: Setup (Baseline and Preconditions)

**⚠️ CRITICAL: No UI claim in this feature is valid without T001 and T002.** The categories surface is being
replaced, so "it looks better" is unverifiable without a before image, and this repository has a recorded
history of pages that returned HTTP 200 while serving no client chunks.

- [x] T001 Capture the categories section **as it is today** to
  `specs/005-categories-carousel/baseline/`: `categories-360.png` and `categories-1280.png`, each scrolled to
  put `#categories` fully in frame, plus `section-record.json` holding the document height, the section's
  `getBoundingClientRect()`, the number of `cat-cell` links and each link's `href`. Six tiles today
  (`lib/content/home.ts:57` `categoryMosaic`); nine panels after. **BROWSER**
  - Note: measure position against the element's own `getBoundingClientRect()`. `rect.top + window.scrollY`
    is not a stable document coordinate on this page — feature 002's scroll handling makes it so, and feature
    004's T030 recorded the resulting false alarm.
- [x] T002 Confirm the dev-server health precondition before any UI claim: exactly one Next process, one
  listener on port 3000, and a 200 on the first `/_next/static/chunks/*.js` — not on the page. **BROWSER**
- [x] T003 [P] Record the current `package.json` dependency set in
  `specs/005-categories-carousel/notes/dependency-baseline.md` and state the plan's actual position on it:
  `embla-carousel-react@8.6.0`, `gsap@3.15.0` and `motion@13.2.0` are **already installed**, so `research.md`
  D2's choice to build on Embla adds nothing. Per the owner's ruling of 2026-09-22 quality outranks dependency
  cost, so a later addition is a decision to record, not a rule to violate.

**checkpoint**: T001's two PNGs and one JSON exist and are committed. T002 has passed.

---

## Phase 2: Foundational — the department table (BLOCKING for all stories)

**Purpose**: The nine departments, derived from the export, with every route proven to reach real products.

**CRITICAL**: Every user story renders this table. A panel that leads to zero products fails FR-002 and SC-002
and no amount of correct arc behaviour notices, because the arc looks fine either way. This is also the phase
where the taxonomy finding from `research.md` D1 is either honoured or quietly lost.

- [x] T004 Create `lib/category-departments.ts`: the nine populated product **kinds** as departments, each
  carrying `{kind, label, slug, categoryId, href, badge, productCount, reachableCount}` per
  `data-model.md`. Routes are the measured ones from `research.md` D1's table — `phone`→`موبایل`,
  `audio`→`هدفون-ایرپاد-و-هندزفری`, `charger`→`آداپتور-کابل-و-شارژر`, `smartwatch`→`ساعت-و-مچ-بند-هوشمند`,
  `powerbank`→`پاور-بانک`, `computer_accessory`→`تجهیزات-کامپیوتر-و-لبتاب`, `sim_card`→`سیمکارت`,
  `car_charger`→`شارژر-فندکی`, `service`→`خدمات-آنلاین`. Read `lib/catalog.ts`; never modify it.
  - `label` is the shopper-facing Persian name, authored, **not** the stored category name verbatim —
    `تجهیزات کامپیوتر و لبتاب` is misspelled in the export and FR-006 forbids propagating it.
  - `productCount` MUST be `null` for `phone` and MUST equal `reachableCount` wherever it is shown
    (FR-005; `data-model.md`'s count-visibility rule). 134 phones exist and the route holds 8, of which one
    is purchasable; a panel may not imply the 134.
  - `href` is `/shop?category=<encodeURIComponent(slug)>`. Slugs are Persian; never hand-type one that is not
    read from the export.
- [x] T005 Create `tests/unit/category-departments.test.ts` — the drift guard, asserting all six validations
  in `data-model.md` verbatim: (1) nine departments, one per populated `kind`, `productCount` totals summing
  to 189; (2) every slug resolves to a real category; (3) every route reaches ≥1 product — "zero dead doors",
  FR-002/SC-002; (4) no route is brand-shaped, **with `آیفون-استوک` on an explicit deny list** because
  "آیفون" is not among the 39 brand names and name-matching alone admits it
  (`research.md` D1, "Badge detection caveat"); (5) no two departments share a slug (FR-003);
  (6) `reachableCount === productCount` except the three recorded shortfalls 8/134, 9/10, 6/7 — a new gap
  fails the test.
- [x] T006 [P] Produce the three missing authentic badges in `public/brand/categories/`:
  `computer-accessory.svg`, `sim-card.svg`, `car-charger.svg`, matching the visual language of the eight
  existing ones. FR-033 permits authentic artwork or **none** — a department with no badge and no artwork
  renders as a text panel (F2), and a stock or generated substitute is a Principle I violation.
  → **Done and rendered.** The three match the existing family (800×960, `rx=40`, the shared
  obsidian→oxblood gradient, champagne line work, oxblood accents) — verified by rendering all nine into
  `baseline/badges-contact.png`, not by reading the markup.
  **Finding that changes T011:** the six *existing* badges bake their own labels into the artwork — «موبایل /
  حامی همراه», «ایرپاد / حامی همراه», and a Latin kicker like `HAMI HAMRAH / MOBILE`. That is the same
  image-of-text mechanism FR-022 rejects in the reference, and it creates a second problem here: a panel
  that also renders a live label shows the department name **twice**, one copy of it unselectable and
  unannounced. The three new badges deliberately carry no text. T011 must treat the live label as the only
  readable name and the baked text in the six older badges as decoration to crop, dim or replace — decided
  before the panels are built, not discovered in the browser.
- [ ] T007 [P] Create `components/home/category-carousel.css` scaffold: the container's geometry custom
  properties (`--arc-bend`, `--arc-depth`, `--arc-falloff`), the panel state selectors, and the
  `@media (prefers-reduced-motion: reduce)` block. Logical properties only — no `left`/`right` (T4).
- [ ] T008 Re-point `app/(main)/page.tsx:178` so `#categories` renders the new surface, keeping the section
  id, the `aria-labelledby="categories-title"` heading and the existing `#categories` ambience overrides at
  `app/(main)/home.css:25-70`.

**checkpoint**: T005 green. Nine departments, nine reachable destinations, three new badges on disk.
Stop here if not — every later phase would be decorating an unverified surface.

---

## Phase 3: User Story 1 — Swipe through the departments and enter one (Priority: P1)

**Purpose**: A phone shopper swipes through nine departments, sees which one is active, taps it, and lands on
that department's products — while the page keeps scrolling normally underneath them.

**Independent Test**: spec.md US1 — reach a named department's products in two actions from the section, and
confirm the page still scrolls vertically while the pointer is over it. Testable with no bending effect and no
motion polish at all.

- [ ] T009 [US1] Create `components/home/CategoryCarousel.tsx` as the client island: Embla via
  `useEmblaCarousel({ axis: "x", align: "center", loop: true, containScroll: "trimSnaps", direction: "rtl" })`
  per `research.md` D2. **Write no pointer, touch or wheel listener.** The file must contain no
  `addEventListener` on `window` or `document` — that is the reference's disqualifying property and the
  reason G1 exists.
- [ ] T010 [US1] Implement the arc in `components/home/CategoryCarousel.tsx` +
  `components/home/category-carousel.css`: on Embla's `scroll` event compute each slide's signed
  `offset(i)` wrapped to the shortest arc through ±4 of 9, and write **one custom property per slide**.
  `rotateY`, `scale`, `dim` and `zIndex` derive from it in CSS. **No `translate` term** — Embla's track
  already moves the slides and a second offset double-applies the motion (`data-model.md`, PanelGeometry).
  Sign follows the inline axis, not physical left/right (FR-026).
- [ ] T011 [US1] In `components/home/CategoryCarousel.tsx`, render each panel as a real `<Link>` to its
  `href` with the live-text label and badge, and
  implement the press contract: pressing the active panel navigates, pressing any other brings it to centre
  and does not navigate (A2, FR-009, FR-010, and the interaction half of FR-038 shared with `004/C24`).
- [ ] T012 [US1] Cap inertia travel in `components/home/CategoryCarousel.tsx`: watch Embla's `select` event
  `skipped` count and re-`scrollTo` the bounded target so a hard flick advances a small fixed maximum
  (FR-014, SC-004). Embla's physics are velocity-driven and will otherwise skip three panels.
- [ ] T013 [US1] Persist the shopper's position across the rest of the page in
  `components/home/CategoryCarousel.tsx` — module-scoped, restored on re-init, **not** `localStorage`
  (FR-015, A7, `data-model.md`'s persistence rule).
- [ ] T014 [US1] **BROWSER** Run quickstart §2 at 360px: swipe to each of the nine, tap the centred panel,
  confirm arrival at that department's listing with products that belong to it, and tap a non-centred panel
  confirming it centred instead of navigating. Record all nine destinations in
  `specs/005-categories-carousel/notes/us1-destinations.md`. This is SC-001 and SC-002 and there is no
  cheaper way to satisfy either.
- [ ] T015 [US1] **BROWSER — THE GATE.** Run quickstart §3 on three input classes: emulated phone touch,
  laptop mouse wheel, laptop trackpad. Park the cursor over the section and scroll the page; start a vertical
  drag on a panel and turn it horizontal mid-drag. Then capture `window.scrollY` over a fixed 1.5s
  programmatic scroll with the section present and with it removed from the DOM, and compare the traces.
  Any capture of vertical scroll fails the feature outright, however good the arc looks (G1, FR-016, FR-018,
  I2, I4, SC-003). Record in `notes/scroll-capture.md`.

**checkpoint**: US1 is independently shippable — nine reachable departments, one active at a time, page scroll
untouched. T015 is a gate: if it fails, stop and escalate rather than continuing to build on a section that
harasses shoppers.

---

## Phase 4: User Story 2 — Persian labels that behave like real text (Priority: P2)

**Purpose**: Every department name is shaped Persian, right-to-left, selectable, announced, sharp, and never
clipped.

**Independent Test**: spec.md US2 — screen-reader traversal, select-and-copy a name, and compare rendering
against the same name as real text. Independent of the arc and the motion.

- [ ] T016 [P] [US2] Confirm in `components/home/CategoryCarousel.tsx` that every label is a text node — no
  image-of-text, no `background-image` label, no SVG `<text>` (FR-022, resolved Q2 = A, T1, SC-006). The
  reference's baked-bitmap mechanism is the direct cause of every Persian and assistive failure in that group
  and is not adopted in any form.
- [ ] T017 [US2] Make panel geometry in `components/home/category-carousel.css` and
  `components/home/CategoryCarousel.tsx` accommodate the longest label in the set without clipping or
  truncation
  at 360px and at 200% browser zoom — the layout yields to the word, never the reverse (FR-024, T3, US2/5).
  Measure against the actual longest `label` in `lib/category-departments.ts`, not an assumed one.
- [ ] T018 [US2] Render any count in Persian numerals via `toFaDigits`, and render **no** count for `phone`
  (FR-005, FR-025, C3). Assert in `tests/unit/category-departments.test.ts` that a shown count always equals
  `reachableCount`.
- [ ] T019 [US2] Audit `components/home/category-carousel.css` for physical properties and for
  `letter-spacing`: replace any `left`/`right`/`margin-left` with logical equivalents (T4), and keep
  `letter-spacing` at `0`/`normal` on Persian text per `001/FR-057` (T5). Note that
  `getComputedStyle().letterSpacing` returns the string `"normal"` for a zero value — assert against both, as
  feature 004's quickstart had to be corrected for.
- [ ] T020 [US2] **BROWSER** Run quickstart §4: select and copy a category name; traverse with a screen
  reader; inspect a label's node type; check the longest name at 360px and 200% zoom; compare sharpness on a
  high-density profile. Record in `notes/labels.md`.

**checkpoint**: US2 independently verifiable — labels are text, shaped, selectable, announced, unclipped.

---

## Phase 5: User Story 3 — The section must not interfere with the rest of the page (Priority: P3)

**Purpose**: The carousel behaves like part of a page: no cost when unseen, no entrance, no drag on the rest
of the homepage.

**Independent Test**: spec.md US3 — scroll past the section on a phone and a laptop, then measure page
responsiveness with the section running and with it removed.

- [ ] T021 [US3] Gate the carousel's life on an `IntersectionObserver` in
  `components/home/CategoryCarousel.tsx`: off-screen calls `emblaApi.destroy()`, which removes Embla's scroll
  watch, resize interpreter and snap loop in one call, and drops panels to `transition: none`; re-entry
  re-initialises at the stored index without animating (FR-019, P1, D5).
- [ ] T022 [US3] Remove any entrance animation from `components/home/category-carousel.css` and
  `components/home/CategoryCarousel.tsx` — none on first appearance and none on return (FR-019, P2, US3/3,
  US3/4, SC-008). Choosing "no entrance at all" over "no entrance when returning" deletes the bug class
  rather than guarding one condition of it.
- [ ] T023 [US3] Prove the per-frame budget in `components/home/CategoryCarousel.tsx`: the only writes during
  movement are custom properties on existing nodes; **zero React state updates per frame**. A `setState` of
  the arc is the specific way to fail FR-020 (P4, `data-model.md`'s `arcOffset` note).
- [ ] T024 [US3] Prove the loop is nine DOM nodes with no duplicated panels in
  `components/home/CategoryCarousel.tsx` — Embla's `loop` repositions rather than clones, and a duplicated
  list would make `Tab` visit every department twice (P3, FR-012, FR-027).
- [ ] T025 [US3] **BROWSER** Run quickstart §6 **on a production build** (`npm run build && npx next start`):
  record frames while scrolling a distant region with the section present versus removed, on a CPU-throttled
  profile. Dev-mode numbers are not comparable — feature 004 measured 50ms vs 33ms medians that vanished
  entirely in production. Restore the dev server afterwards. Record in `notes/cost.md` (FR-020, SC-009).

**checkpoint**: US3 independently verifiable — nothing runs unseen, nothing replays, the rest of the page is
unchanged.

---

## Phase 6: User Story 4 — Reach any department without swipe-only discovery (Priority: P4)

**Purpose**: Keyboard, screen reader, and mouse-without-drag each reach all nine departments with the same
destination set as the swipe route.

**Independent Test**: spec.md US4 — reach every department by keyboard alone, then screen reader, then mouse
with no dragging; compare against the swipe path and require the same destinations in no more steps.

- [ ] T026 [US4] Implement the listbox interaction in `components/home/CategoryCarousel.tsx`: one tab stop on
  the container, `ArrowLeft`/`ArrowRight` moving the active panel, `Enter`/`Space` activating its destination,
  `Home`/`End` jumping to first and last, driven through `emblaApi.scrollNext()/scrollPrev()/scrollTo()` —
  Embla ships no keyboard binding (FR-027, K1).
- [ ] T027 [US4] Map arrow keys to **reading** order, not screen direction: in RTL, forward is visually left
  (FR-028, K2, US4/2). A physical mapping is a failure here, not a preference.
- [ ] T028 [US4] Make focusing a panel also make it the active panel in
  `components/home/CategoryCarousel.tsx`, so keyboard position and visual position can never disagree
  (K3).
- [ ] T029 [US4] Add `aria-activedescendant` plus each panel's name, position and the total of nine in
  `components/home/CategoryCarousel.tsx` and `components/home/CategoryHub.tsx` (FR-007, FR-030, C4, K5,
  SC-012's assistive half).
- [ ] T030 [US4] Add prev/next controls to `components/home/CategoryHub.tsx` so a pointer user can advance
  without dragging (FR-029, K4, US4/3). Buttons, not wheel hijack — I4 and D2's wheel rule.
- [ ] T031 [US4] Measure every touch target in `components/home/category-carousel.css` at ≥44×44 CSS px and
  confirm none sits beneath the fixed header island at any scroll position on a 360×640 viewport (FR-032,
  K7, US4/5).
- [ ] T032 [US4] Implement reduced motion in `components/home/category-carousel.css`: arc geometry stays
  (it is layout), transitions and inertia go, movement resolves instantly, and the behaviour is **identical**
  to `004`'s brand rows (FR-031, K6, X5, SC-008's half).
- [ ] T033 [US4] **BROWSER** Run quickstart §5: keyboard-only traversal of all nine, `Enter` activation, then
  mouse-only advance with no drag. Confirm the same destination set as the swipe route in no more steps, and
  that both this route and the site's existing category navigation land on identical results
  (SC-005, US4/4, US4/7, C5). Record in `notes/access.md`.

**checkpoint**: US4 independently verifiable — no department is reachable only by gesture.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T034 [P] Add a `forced-colors: active` block to `components/home/category-carousel.css`: the arc
  survives and the active state is conveyed by something other than colour (F4).
- [ ] T035 [P] Prove the fallback in `components/home/CategoryHub.tsx` by reading the raw server HTML with
  scripts disabled: a complete list of all nine with working links, no arc, no motion, no observer (FR-021,
  F1). The fallback is the default, not a branch.
- [ ] T036 Verify no file under `data/`, `app/api/`, or `prisma/` was modified (`git diff --stat main...HEAD`)
  — Constitution III, and feature 002's plan records the same check for the same reason.
- [ ] T037 Record the FR-038 coherence obligation in
  `specs/005-categories-carousel/notes/coherence.md`: the five shared behaviours against `004`, with the
  duration/easing values quoted from `app/(main)/home.css`'s `.brand-rows` block, and the reciprocal note
  that `004/FR-032` binds this surface.
- [ ] T038 Screenshot both neighbouring surfaces together at 360px and 1280px into
  `specs/005-categories-carousel/baseline/` and check them against contracts X1–X6, on the homepage's
  **dark** ground only (FR-039, US3/6).
- [ ] T039 Run `npm run typecheck` and `npx vitest run tests/unit` clean. **Do not run bare `npm test`** —
  it is `dotenv -e .env.test -- vitest run`, `.env.test` does not exist, and `tests/setup.ts` truncates all
  19 tables of the development database. The owner accepted that hazard on 2026-09-22; it is still not a
  reason to invoke it.
- [ ] T040 Run the full `quickstart.md` §1–§8 and record the result per section in
  `specs/005-categories-carousel/notes/validation.md`, including which client chunks were confirmed loading.
- [ ] T041 SC-010, SC-011 and SC-012 need a human panel. **Do not self-certify.** Record them as unmeasured
  in `notes/validation.md`, noting that feature 004's equivalent gate (T049) was dropped on 2026-09-22
  because the panel could not be assembled, and that SC-011 additionally cannot be judged honestly while
  feature 002's ground is unbuilt past US1 and its Question 1 is reopened.
- [ ] T042 Update the knowledge graph with `graphify update .` per `CLAUDE.md`, and note in
  `specs/005-categories-carousel/notes/coherence.md` whether feature 004's `categoryLinks` in
  `lib/content/home.ts:57` is now superseded by `lib/category-departments.ts` or still serving the shop
  tiles — two sources of category routes on one page is a drift hazard.

---

## Dependencies

```
Phase 1 (T001-T003) ── baseline + preconditions
   └─> Phase 2 (T004-T008) ── BLOCKING: the table every story renders
         ├─> US1 T009 → T010 → T011 → T012 → T013 → T014 → T015 (gate)
         ├─> US2 T016-T020   (needs T011's markup; independent of US1's motion)
         ├─> US3 T021-T025   (needs T009/T010 to exist to measure)
         └─> US4 T026-T033   (needs T009's Embla api; T029 needs T011's panel ids)
                └─> Phase 7 (T034-T042) after US1 + at least one of US2-4
```

- **T015 gates the feature, not just US1.** If the section captures vertical scroll, stop: G1 outranks
  everything else in the contract, and every later phase would be polishing a section that damages the page.
- **T005 gates T004's acceptance**, not its writing — the table and its guard are one unit of work.
- **US2, US3 and US4 are independent of each other** once US1's markup exists; each is a complete increment.
- **T032 (reduced motion) should not be deferred past US4**: it is cheaper to build the arc with the reduced
  path in mind than to retrofit it, and `004` already fixed what the behaviour must be.

### Parallel: T003 ∥ T001/T002; T006 ∥ T007; T016 ∥ T017; T034 ∥ T035. Within a single file — T009-T013 all
touch `CategoryCarousel.tsx` and T010/T012/T023 all touch the frame path — serialise them.

## Implementation Order

1. **MVP = Phase 1 + Phase 2 + US1 (T001-T015).** Nine reachable departments on a bending arc that never
   touches page scroll. Deliverable and independently valuable; T015 is its acceptance gate.
2. **Then US2** (labels are already text if T011 was built right — this phase mostly *proves* it),
   **then US4** (keyboard and click controls), **then US3** (cost and off-screen).
3. **Phase 7** after US1 plus any one story.
4. **Stop conditions**: T005 red → do not render anything. T015 red → escalate; the fix is not a smaller arc,
   it is a different input model.

## Notes

- [P] tasks = different files, no dependency.
- Every story phase is independently testable; every task names its exact file.
- The reference's four disqualifying properties are addressed by construction, not by tuning: no selection
  mechanism (T011), document-level input capture (T009's "no listeners outside the element"), labels as
  bitmaps (T016), and always-on animation with a duplicated list (T021, T024).
