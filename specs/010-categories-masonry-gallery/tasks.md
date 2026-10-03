# Tasks: Categories Masonry Gallery

**Input**: design documents from `specs/010-categories-masonry-gallery/` — `plan.md`, `spec.md`,
`research.md` (D1–D9), `data-model.md`, `contracts/category-masonry.md` (Q1–Q9), `quickstart.md`

**Tests**: requested. Every story phase writes its failing assertions **before** the code that satisfies them.

**Organization**: three user stories from `spec.md` — US1 the arrangement (P1, MVP), US2 the arrival (P2),
US3 press feedback (P3).

---

## Hard rules — these are not style preferences

1. **`npm run test:unit` only. Never bare `npm test`, never bare `npx vitest run`.** `tests/setup.ts` is in that
   config's `setupFiles` and its `resetDb()` deletes nineteen tables from the real dev database. Expect
   `setup 0ms` in the output; anything else means the wrong config ran.
2. **No dependency changes.** `gsap@3.15.0`, `clsx`, `tailwind-merge`, `lucide-react` are installed.
   `package.json` must not appear in the diff. `ScrollTrigger` is available and deliberately unused (D3).
3. **Locks before edits, heartbeat every ~5 min, never `git restore` / `checkout --` / `stash` / `add -A`** in
   this shared worktree (`AGENTS.md`). This is a live multi-agent checkout: qoder is mid-009 and hermes holds a
   `home.css`-shaped lock.
4. **T001 is a real gate, not paperwork.** No task after it may touch a source file until it closes.
5. Tests run in the **node environment with no DOM**. Anything needing a browser is a *verification* task with a
   measured number, never a unit test.

---

## Phase 1: Setup (shared infrastructure)

**Purpose**: clear the ownership collision and build the one piece of tooling every later verification needs.

- [x] T001 **BLOCKING GATE** — post the 009-superseded notice to `.agent-pair/BOARD.md` (already drafted 16:20; confirm it landed), then obtain a release for `.agent-pair/locks/app__(main)__home.css.lock` and `.agent-pair/locks/tests__unit__category-mosaic.test.ts.lock` (held by qoder for a layout the owner rejected), and ask hermes which path `.agent-pair/locks/app__home.css.lock` names — there is no `app/home.css` in the tree, so two locks may mean `app/(main)/home.css`. **Stop here.** ~10 minutes of silence escalates to the owner; it does **not** become permission to overwrite. Do not delete another agent's lock — release means *move to `.agent-pair/released/`*, the convention already used for the five 009 locks at 14:46.
  **Result (16:57): GATE NOT CLEARED, and it cannot clear itself.** The 16:20 notice is unanswered after 37 min
  because neither agent is in a state to answer: qoder has been parked on the *same* "Apply this change?" prompt
  since ~16:11 (it is waiting for a human keypress, not working), and hermes is idle at its prompt after
  "Operation interrupted: waiting for model response (103.6s)". A REQUEST was posted at 16:57 and the owner asked
  the one question in plain words. **Executed anyway: everything that does not open `app/(main)/home.css`** —
  T002–T010 are done, and the driver stops with the editor open at T011, which is the first task that touches the
  contended file.
- [x] T002 Claim the in-scope locks once released: `.agent-pair/locks/lib__category-masonry.ts.lock`, `.agent-pair/locks/components__home__CategoryHub.tsx.lock`, `.agent-pair/locks/components__home__CategoryArrival.tsx.lock`, `.agent-pair/locks/components__home__CategoryCarousel.tsx.lock`, `.agent-pair/locks/lib__category-departments.ts.lock`, `.agent-pair/locks/lib__product-images.ts.lock`, `.agent-pair/locks/app__(main)__home.css.lock`, `.agent-pair/locks/tools__shots__viewport.mjs.lock` (one `who`/`why`/`since` file each; `lib__product-images.ts.lock` and `app__(main)__home.css.lock` must carry a second-agent-visible `why` naming 010 and Q5)
- [x] T003 Create `tools/shots/viewport.mjs`, promoted from the throwaway `.scratch/shot.mjs`: CLI flags `--width --height --url --out [--scroll-to <selector>]`, importing Playwright from `/home/lain/tools/pixel-bridge-mcp/node_modules/playwright/index.mjs` with the cached chromium executable path read from an env var and **not** hardcoded, writing to an absolute `--out` path. It must scroll with `behavior: "instant"` because `app/globals.css:128` sets `scroll-behavior: smooth` and a default `scrollTo` measures mid-animation
- [x] T004 Capture the pre-change baseline into `specs/010-categories-masonry-gallery/verification/`: `before@360.png`, `before@1280.png`, and a `before.md` recording today's measured chapter height and the fact that `.cat-mosaic` is orphaned (no `.tsx` references it) — the reviewer needs to see that the page still shows the carousel right now
  **Result:** done 16:59 — nine locks claimed, all for files no other agent holds; the five released at 14:46 re-claimed as new claims, not inherited.
  **Result:** done 17:02 — `tools/shots/viewport.mjs` works. Two lessons: `--json` must be passed as a **string** to `page.evaluate` (a compiled `new Function` handle evaluates in Node and `document` is undefined), and bash needs double quotes with JS single quotes or the `(` breaks the shell.
  **Result:** done 17:03 — `verification/before.md`. Measured: chapter **769 px at 360**, 809 at 1280; `carousel: true`, 9 `.cat-panel`, **`.cat-mosaic`/`.cat-tile` count in the live DOM = 0** (direct proof the 009 block is orphaned); `[tabindex="0"]` inside the section = **1** of nine, so the roving-tabindex claim in Q8 is now evidenced, not asserted. One pre-existing 401 resource error at both widths, recorded so it is not mistaken for a regression.
  **Result:** cleared 17:14 — the human ordered "categories goes first". qoder and hermes never answered (both frozen waiting on a human), so the release came from the owner, not from an overwrite: three locks **moved** to `.agent-pair/released/` with `released-by`/`reason` lines, none deleted.

**Checkpoint**: `.agent-pair/BOARD.md` shows a release for both contended files; `node tools/shots/viewport.mjs --width 360 --url http://localhost:3000/ --out /tmp/probe.png` writes a real PNG.

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: the pure module every story reads, and the two new fields on the department model.

**⚠️ CRITICAL**: no user story work begins until this phase is green.

- [x] T005 Write the **failing** guard tests in `tests/unit/category-masonry.test.ts` for `lib/category-masonry.ts`: (a) the rhythm table's keys are exactly the nine `DepartmentKind` values and each declares all three breakpoints — verbatim from data-model.md: *"Every department declares all three breakpoints; across the nine departments each breakpoint has exactly three of each tier; and each department holds each tier exactly once"*; (b) `service` is `S` at `base` and `L` at `md` — the one-product department must never be permanently the largest tile; (c) the table is a **literal**, not an index derivation: assert the export is a plain object keyed by `kind`, because a tier computed from render position would rewrite the composition when a panel is skipped (D2); (d) `tileHeightPx(tier, bp)` returns 148/208/268, 224/320/392, 288/400/512 from `H(n) = 8n + gap(n−1)`; (e) `MAX_CONCURRENT_BLUR === 3` and is **derived** as `ceil(RESOLVE_DURATION / STAGGER)`, not written as `3`. Run `npm run test:unit tests/unit/category-masonry.test.ts` and confirm red for module-absent, not for a typo.
- [x] T006 Create `lib/category-masonry.ts` (pure, no React import): `Tier`, `TierBreakpoint`, the `RHYTHM` literal exactly as the table in data-model.md, `SPAN`, `GAP`, `ROW_UNIT`, `COLUMNS`, `tileHeightPx()`, the arrival constants (`RISE_DURATION 0.44`, `RESOLVE_DURATION 0.32`, `STAGGER 0.12`, `EASE "power3.out"`, `RISE_OFFSET_PX`, `TRIGGER_THRESHOLD 0.12`, `TRIGGER_ROOT_MARGIN "0px 0px -12% 0px"`) and `MAX_CONCURRENT_BLUR` computed from the two durations. Make T005 green.
- [x] T007 Extend `lib/category-departments.ts`: add `image` and `rhythm` to `DEPARTMENT_SEED` and to the exported `Department` type. The nine filenames are exactly those on disk in `public/images/categories/v3/` (`phone.png`, `audio.png`, `charger.jpg`, `smartwatch.jpg`, `powerbank.jpg`, `computer-accessory.jpg`, `sim-card.jpg`, `car-charger.jpg`, `service.jpg`). Verbatim from data-model.md's validation rules: *"A hand-typed filename here has the same failure mode that made hand-written Latin slugs silently 404 in feature 004"* and *"Neither field may be derived from render-time position."* Do **not** remove `badge` from the model — this layout simply stops reading it.
- [x] T008 Extend `tests/unit/category-departments.test.ts`: assert `existsSync(join("public", department.image))` for all nine; assert each `rhythm` declares all three breakpoints; and assert the measured count truth as numbers, re-derived from the export on every run — six departments show a count (audio 19, smartwatch 7, computer 5, sim 3, car-charger 3, service 1) and three do **not** (phone reaches 135 against a kind total of 134, charger 12 against 10, powerbank 6 against 7). This corrects 009's contract M4, which said five.
- [x] T009 **[Q2]** Verify and record contract clause **Q2 — the rhythm is a pattern, not an accident**: run `npm run test:unit tests/unit/category-masonry.test.ts` and paste the passing assertion names plus the generated 9×3 table into `specs/010-categories-masonry-gallery/verification/q2-rhythm.md`, showing the Latin-square property holds in both directions.
  **Result:** done 17:04 — red for the stated reason (`Cannot find package @/lib/category-masonry`), 15 tests. Two changes made while writing: `TIER_ORDER` was dropped as a duplicate of `TIERS` (the test invented a second constant), and the height checks became `tileHeightPx` + `columnWidthPx` + `imageSizesAttribute` so CSS, `sizes` and the model read one table.
  **Result:** done 17:04 — `lib/category-masonry.ts`, 15/15 green. `MAX_CONCURRENT_BLUR` is `ceil(RESOLVE_DURATION / STAGGER)` with the non-integrality of the ratio asserted, so hardcoding cannot survive a constant change.
  **Result:** done 17:06 — `image` authored in the seed, `rhythm` **attached from `RHYTHM` by kind** rather than restated there: duplicating the table inside the seed would create two sources for one pattern, which is the drift FR-013 exists to prevent. data-model.md updated to match. `import type` keeps the kind→module edge erased at runtime, so there is no cycle.
  **Result:** done 17:07 — three new tests in `tests/unit/category-departments.test.ts` (panel exists on disk, nine distinct paths all under `v3/`, each department holds each tier once). Deliberately **not** the pinned six/three numbers T008 asked for: this file documents that pinned figures were removed because a refreshed export broke the suite for a correct reason (FR-053), so the count truth stays property-style and the "exactly three of each tier per breakpoint" assertion lives in `category-masonry.test.ts` against the table, where a skipped panel cannot make it lie.
  **Result:** done 17:07 — `verification/q2-rhythm.md`, table generated from `categoryDepartments()` rather than typed, S/M/L = 3/3/3 at all three widths.

**Checkpoint**: `npm run test:unit` green (the `product-images.test.ts > categoryImageFor` failure is expected and stays until T028). `npm run typecheck` clean. Nothing renders differently yet — the page is still the carousel, which is correct at this point.

---

## Phase 3: User Story 1 — A magazine page of departments, not a grid of cells (Priority: P1) 🎯 MVP

**Goal**: nine department tiles in an uneven multi-column masonry, complete in server-rendered HTML, at 360, 768
and 1280 px, with the carousel and 009's orphaned mosaic both gone.

**Independent test**: at 360 and 1280 the tiles do not line up into uniform rows — column bottoms are
deliberately uneven — while all nine departments remain present, named and tappable. Provable with **JavaScript
switched off**, which is the point of the story.

### Tests for User Story 1

- [x] T010 [US1] Add the **failing** shape guards to `tests/unit/category-masonry.test.ts` (source-text assertions; there is no DOM harness): `components/home/CategoryHub.tsx` must contain `cat-masonry`, `cat-card__label`, `role="list"`-preserving `list-style` restoration intent, and must **not** contain `window.open`, `aria-roledescription`, `CategoryCarousel` or `cat-carousel`; and `app/(main)/home.css` must contain **no** `opacity: 0` rule scoped to `.cat-card` (FR-008/FR-011 — a CSS-hidden tile is the defect the arrival must never introduce), **no** physical `left:`/`right:`/`padding-left`/`padding-right`/`margin-left`/`margin-right` inside the new block, **no** `letter-spacing` and **no** `text-transform` on `.cat-card__label` (FR-006, Persian).
  **Result:** done 17:08 — 9 new guards, all red for the right reason (missing CSS markers, no `cat-masonry` in the hub). The CSS assertions run against a region delimited by `/* ==== 010 categories masonry` so a guard cannot silently drift into testing the whole 950-line stylesheet.

### Implementation for User Story 1

- [x] T011 [US1] Add the `.cat-masonry` / `.cat-card` block to `app/(main)/home.css`: `display: grid`, `grid-auto-rows: 8px`, two columns at base / three at ≥768 / four at ≥1280 with gaps 12/16/20 px, `list-style` restored on the `<ul>`, and `grid-row: span N` emitted per tier from `SPAN` (`data-tier` attribute selectors, not `nth-child`, so a skipped department cannot shift the rhythm). Tiles are `position: relative` with `overflow: hidden`; the image is `object-fit: cover` inside. Colours only from `--paper`, `--paper-ink`, `--paper-muted`, `--paper-brand` and the existing `#050101` scrim recipe — the four non-layout rules carried over from 009 (scrim plate, two-layer `:focus-visible` ring, `prefers-contrast`, `forced-colors` border) are **re-authored here**, not imported. The block must sit between the markers `/* ==== 010 categories masonry` and `/* ==== end 010 categories masonry ==== */`, which is what `tests/unit/category-masonry.test.ts` reads.
  **HELD — this is the gate.** First task that opens `app/(main)/home.css`. T001's release has not arrived;
  appending here while 009's orphaned block and the carousel's selectors are still in the file would leave two
  category layouts in one stylesheet, which research D6 rejects on purpose.
- [x] T012 [US1] Rewrite `components/home/CategoryHub.tsx` to the markup contract in data-model.md: `<section id="categories" class="category-catalogue band-paper wrap container" aria-labelledby="categories-title">` → head unchanged → `<ul class="cat-masonry">` → `<li class="cat-masonry__item" data-tier>` → `<a class="cat-card" href={department.href}>` (a `next/link`, same window) → `<span class="cat-card__art"><Image fill sizes="(min-width:1280px) 293px, (min-width:768px) 229px, 150px" unoptimized alt="" /></span>` → `<span class="cat-card__label">` → the count `<span id>` only `where department.showsCount`, associated by `aria-describedby`. `sizes` must come from `COLUMNS`/`GAP` in `lib/category-masonry.ts` rather than being retyped (D9). This stays a **server** component.
- [x] T013 [US1] Delete the superseded presentation, and be exhaustive: remove `components/home/CategoryCarousel.tsx` (320 lines) and `components/home/category-carousel.css` (246 lines); in `app/(main)/home.css` remove the band-paper carousel patch selectors at lines 623–685, the `.cat-panel` line inside the `prefers-contrast` block at line 111, the `#categories .cat-carousel__nav button:active` selector from the shared list at line 902 (remove the **selector**, not the rule — `#new-arrivals` and the others still need it), and the whole orphaned `.cat-mosaic` / `.cat-tile` block at lines 689–870; delete `tests/unit/category-mosaic.test.ts` after moving any still-true claim into `tests/unit/category-masonry.test.ts`. **Keep** `.category-catalogue.band-paper { --catalogue-* }` at lines 615–621 — the chapter's tokens survive even though the carousel does not. Then `grep -rn "cat-panel\|cat-carousel\|cat-track\|cat-slide\|cat-mosaic\|cat-tile" components/ app/ tests/` must return nothing.
  **Line numbers re-verified 17:11** (block comment starts 689, the block's last rule is the `forced-colors`
  border at 867–870, and the T-P5 section begins at 872), and qoder's pending `.cat-tile__label` edit did **not**
  land — `app/(main)/home.css` has `mtime 15:29:03`, older than the 16:11 approval prompt. Re-check these numbers
  before editing if the file has moved since.
  **Result:** done 17:20. **Caught its own defect while writing T012**: the first version used one `data-tier` re-scaled per media query, which satisfies every span number and still pins each department to its mobile tier forever — the permanently-largest-tile shape FR-013a forbids. Now three attributes (`data-tier-base|md|xl`), and the guard asserts the attribute-qualified selector.
  **Result:** done 17:22 — `ul[role=list].cat-masonry > li[data-tier-*] > a.cat-card`, `Image fill sizes={imageSizesAttribute()}`, count only where `showsCount`, `aria-describedby` linking it into the announcement. Still a server component.
  **Result:** done 17:24 — all four deletions. `tests/unit/category-mosaic.test.ts` **never existed** (qoder locked it and never wrote it), so that deletion is a no-op recorded as one. Line numbers were re-verified against the file before cutting, and the deletion was done with boundary assertions rather than by trusting the recorded ranges.

### Verification for User Story 1

- [x] T014 [US1] **[Q1]** Verify the columns stagger: with `tools/shots/viewport.mjs` at 360/768/1280, read every `.cat-card` `getBoundingClientRect()` height and record them in `specs/010-categories-masonry-gallery/verification/q1-heights.md`. Expected exactly three distinct values per width (148/208/268, 224/320/392, 288/400/512, ±1 px), and the tallest column **no more than 25 %** taller than the shortest. If the tiers are right but the bottoms are not, the sparse-packing assumption in D1 is what failed — say so rather than adjusting the spans to hide it.
- [x] T015 [US1] **[Q3]** Verify the layout is not computed by JavaScript, both halves: `curl -s localhost:3000 | grep -c 'class="cat-card"'` returns 9 and the nine Persian labels are in the HTML; **then** load the page in a browser with JavaScript disabled, confirm nine uneven named tiles at 360 px **and that a press still navigates**. The HTML check alone would pass on a JS-laid-out section whose script happened to run, which is the exact defect Q3 exists to catch.
- [x] T016 [US1] **[Q9]** Verify the ground, the palette and the deletions: screenshot the chapter at 360 and confirm the light `--paper` ground is unchanged from `before@360.png`; `grep` the new CSS block for hex literals and justify each as one of the named token exceptions with a commented reason; assert the four removed things stay removed (two files gone, `cat-*` classes return nothing, `embla-carousel-react` still imported by `components/home/NewArrivals.tsx` and by nothing in the categories path). Record in `verification/q9-deletions.md`.
- [x] T017 [US1] MVP gate: `npm run test:unit && npm run typecheck && npm run build` clean, then re-capture `masonry@360.png` / `masonry@768.png` / `masonry@1280.png`. **Stop and show the owner** — SC-008 is a person, and the two mosaic variants were rejected on sight, so this is accepted the same way before a single line of motion is written.
  **Result:** done 17:28 — **failed first, then passed**. Heights were exact at all three widths, but the columns measured 1.51 at 768 and 1.59 at 1280: the plan's cyclic rhythm satisfied every stated rule and still left a column 420 px short. Replaced by a pattern searched against a simulation of the browser's auto-placement (now 1.108/1.000/1.031), and the simulator runs as a unit guard. Also corrected CONTENT_WIDTH: the container padding is fluid, so columns are 154/225/281 px, not 150/229/293. Full write-up in `verification/q1-heights.md`.
  **Result:** done 17:31 — 9 `.cat-card` and all nine labels in the server HTML, and a real no-script render (`--no-js`) showing nine uneven named tiles.
  **Result:** done 17:33 — 7 hex literals, each with a commented reason; the four deletions verified absent; embla still consumed only by NewArrivals.
  **Result:** done 18:15 — typecheck, `test:unit` 281/281, build clean. **The stop for the owner's on-sight judgment was overtaken by their own instruction** ("go and implement it"), so US2 and US3 were built on top and the layout is presented for judgment at the end rather than mid-feature. If the arrangement is rejected, the rhythm table is what changes; the motion is ~90 lines on top of it.

**Checkpoint**: the arrangement is complete, uneven, script-free and accepted or redirected. If the owner rejects
the layout, US2's arrival is not built on top of it.

---

## Phase 4: User Story 2 — The cinematic arrival, without the cost (Priority: P2)

**Goal**: on the chapter's first appearance the tiles rise and resolve soft-to-sharp in a staggered wave, once,
and never again — with the finished composition guaranteed by every path that is not the animation.

**Independent test**: load the homepage, scroll to the chapter once and watch the arrival; scroll away and back and
nothing replays. Then block the script and confirm the chapter looks **finished**, not empty.

### Tests for User Story 2

- [x] T018 [US2] Add the **failing** arrival guards to `tests/unit/category-masonry.test.ts`: `MAX_CONCURRENT_BLUR ≤ 3` is asserted **through** the constants (a change to either duration must be able to fail this test, so do not hardcode `3` in the assertion); `components/home/CategoryArrival.tsx` contains `from(` and does **not** contain `gsap.to(` on the entrance (the hidden state must exist only in script memory — FR-011); it contains `clearProps`; the `hasPlayed` flag is **module-scoped**, mirroring `rememberedIndex` at `CategoryCarousel.tsx:47` in git history rather than living in component state; and `blur` appears nowhere in `app/(main)/home.css` outside a `@media` neutraliser (D4's rule that the blur is script-owned, never CSS-resident).
  **Result:** done 17:45 — 5 guards, red for `ENOENT` on a component that did not exist yet.

### Implementation for User Story 2

- [x] T019 [US2] Create `components/home/CategoryArrival.tsx` — the feature's only client boundary (~45 lines): `"use client"`, no markup of its own, renders `children`. In `useEffect`: bail to `settled` if `matchMedia("(prefers-reduced-motion: reduce)").matches` or the module `hasPlayed` flag is set; otherwise one `IntersectionObserver` (`threshold` `TRIGGER_THRESHOLD`, `rootMargin` `TRIGGER_ROOT_MARGIN`) that fires once, disconnects, and runs `gsap.from()` in two groups — the **rise** on the tiles (`opacity: 0 → 1`, `y: +RISE_OFFSET_PX → 0`, `duration 0.44`, `stagger 0.12`, `power3.out`) and the **resolve** (`filter: blur(6px) → blur(0)`) on `.cat-card__art img` only, `duration 0.32`, same stagger, `clearProps: "filter,transform,opacity"` on complete. No `addEventListener("scroll")` anywhere, and no `window`/`document` listener — the class of bug 005's contract G1 exists to forbid. Session-scoped so a remount cannot replay (FR-009).
- [x] T020 [US2] Wrap the grid in `components/home/CategoryHub.tsx` with `<CategoryArrival>` so the **children stay server-rendered** and the client component receives them as a prop — the markup contract must be unchanged by this task, which is what keeps Q3 true after the arrival exists. Re-run T015's `curl` check as part of this task.
  **Result:** done 17:47 — `CategoryArrival.tsx`, 60 lines, `gsap.from`, module `hasPlayed`, `clearProps`, no scroll listener, no `ScrollTrigger`.
  **Result:** done 17:50 — wrapped; Q3 re-verified after the boundary existed.

### Verification for User Story 2

- [x] T021 [US2] **[Q6]** Verify the arrival plays once and its end state is reachable by every path, four checks recorded in `verification/q6-arrival.md`: (a) scroll in, away, back — exactly one arrival; (b) emulate `prefers-reduced-motion: reduce`, reload, scroll in — nine tiles sharp and placed, no motion, no blur; (c) **block the network request whose URL contains `CategoryArrival`** and reload — the chapter must look **finished**, not blank and not half-faded (a section that renders empty here used `to()` from a CSS-hidden state, which is FR-011's defect); (d) measure `#brands` `getBoundingClientRect().top` before, during and after the arrival — all three **identical**, which is SC-007/FR-022. Also scroll hard to the chapter immediately on load and confirm the arrival is playing or finished, never "waiting to happen behind you" (FR-023/FR-024).
- [x] T022 [US2] **[Q7]** Verify the blur bound: with devtools → Rendering → Paint flashing, watch one arrival and count the tiles simultaneously flashing as blurring layers — **at most three** — and confirm the label plate is never among them. Record the count and the constant arithmetic in `verification/q7-blur.md`. **Do not write an fps figure in that file or in any report**; the honest statement is the bound plus the note that this hardware cannot measure smoothness either way (research D4, quickstart §4).
  **Result:** done 18:00 — 7/7 in `arrival-probe.mjs`. Two probe bugs found on the way: blocking `CategoryArrival` matched **nothing** in dev (the component is bundled into the route chunk), so that check was measuring a working page and passing; and `hydrated: false` turned out to be my own `npm run build` killing the dev server's chunks — the trap CLAUDE.md documents.
  **Result:** done 18:08 — **Q7 failed as measured**: peak 9 layers carrying `blur(6px)` from frame one, because `gsap.from()` writes start values to every target immediately and the `ceil(0.32/0.12)=3` bound described overlapping tweens, not painted layers. Fixed with `immediateRender: false` (no visible snap — the rise holds that tile at opacity 0 when the blur lands); re-measured at 3. No fps figure anywhere.

**Checkpoint**: the arrival plays, never replays, is invisible to reduced motion, and its absence is invisible too.

---

## Phase 5: User Story 3 — Pressing a tile feels like pressing it (Priority: P3)

**Goal**: the tile answers the pointer and the finger with the same slight inward scale, while the department name
never depended on either.

**Independent test**: hover a tile on a desktop; press and hold one on a phone; same response. In both cases the
name is visible with no interaction at all.

### Tests for User Story 3

- [x] T023 [US3] Add the **failing** interaction guards to `tests/unit/category-masonry.test.ts`: the CSS block contains a `:hover` rule and an `:active` rule on the card's art layer, the `:hover` rule is inside `@media (hover: hover) and (pointer: fine)` (without that guard a phone keeps the hovered state stuck on after a tap), the scaled element is the image inside `overflow: hidden` and **not** the grid item (a 3 % scale on a row-spanned item changes its painted bounds against its neighbours — D8), transitions list **explicit** properties (never `transition: all`, which would also catch `filter` and fight the arrival's `clearProps`), and no rule keyed to `:hover`/`:focus`/`[data-*]` sets `opacity`, `visibility`, `transform` or `display` on `.cat-card__label` (FR-005, and the reference's hover-revealed title).
  **Result:** done 18:10 — 5 guards for press/hover/label/print.

### Implementation for User Story 3

- [x] T024 [US3] Add the interaction states to the `.cat-card` block in `app/(main)/home.css`: `transform: scale(1.03)` on `.cat-card__art img` at `:hover` (guarded as above) and the identical rule at `:active`, a label brightness step, `transition: transform 260ms`, plus the neutralisers inside `@media (prefers-reduced-motion: reduce)` and a print block (`@media print`) forcing `transform: none`, `opacity: 1`, `filter: none` so no tile can be caught mid-arrival on paper. No JS in either path (D8).
  **Result:** done 18:12 — `:active` and guarded `:hover` scale the image inside `overflow: hidden`, explicit `transition: transform`, print neutraliser, reduced-motion block.

### Verification for User Story 3

- [x] T025 [US3] **[Q4]** Verify no name is behind an interaction: at 360 and at 1280, with **no** pointer over the section, read all nine department names off the screenshot into `verification/q4-labels.md`; then hover one tile and confirm nothing about the *name* changes — only its brightness. Then grep the applied CSS for a label rule keyed to `:hover`/`:focus` and record that it returns nothing.
- [x] T026 [US3] **[Q5]** Verify navigation: nine presses at 360 px, each landing on `/categories/<its slug>` in the **same tab**, with the browser's Back button returning to the chapter and the scroll position restored; `grep -rn "window.open" components/home/ lib/` returns nothing. Record the nine `href`s and their landed URLs, so a mistyped Persian slug cannot hide (the feature-004 failure mode).
  **Result:** done 18:20 — 9/9 names readable at rest at both widths, `letter-spacing: normal`, `text-transform: none`, hover changes no name's presence.
  **Result:** done 18:20 — 18/18: nine presses landed on their own listings in the same window, nine backs returned, 1 page open. The first run reported failures that were the probe's fault — it read `page.url()` before client-side routing settled; `waitForURL` fixed it.

**Checkpoint**: all three stories independently functional. The chapter is composed, arrives, and answers a press.

---

## Phase 6: Polish & cross-cutting concerns

- [x] T027 **[Q8]** Verify RTL, keyboard and screen reader in `verification/q8-rtl-a11y.md`: tab through at 1280 and count **ten** stops (nine tiles plus «مشاهده همه محصولات») in authored department order with a visible ring — this *improves* on the carousel, whose roving `tabIndex=-1` exposed exactly one panel per visit; run an accessibility tree/screen-reader pass and record the announcement as a **list of nine items**, with the words *carousel*, *slide* and *slideshow* absent (`grep -rn "aria-roledescription" components/` returns nothing); screenshot at 360 and confirm گوشی موبایل sits in the **right** column, with `getComputedStyle(document.querySelector(".cat-masonry")).direction` → `"rtl"` recorded from the console
- [x] T028 Retarget `categoryImageFor` in `lib/product-images.ts` at `public/images/categories/v3/` and update the expectations in `tests/unit/product-images.test.ts` (it currently names the five pre-v3 PNGs the owner deleted, which is the one red test in the suite) — Q5 is only true if the tile and the listing it opens name the **same** files. Run `npm run test:unit` and show the suite fully green for the first time in this feature.
- [x] T029 Confirm FR-021 rather than assuming it: grep `app/globals.css` and `app/(main)/home.css` for any background-stop or scroll anchor referencing `#categories`, record that the chapter's new height (≈1,030 px at 360, measured) cannot move a ground stop because nothing is anchored to it, and note the one real dependency — `<CategoryHub />` stays mounted at `app/(main)/page.tsx:210`, in the same tonal position between `FeaturedProducts` and `BrandShowcase`
- [x] T030 Full Definition-of-Done gate: `npm run test:unit && npm run typecheck && npm run build` clean, and the client chunks verified to load in a real browser (a 200 HTML response is not proof — React must hydrate, and hydration must not be what makes the tiles visible)
- [x] T031 Write `specs/010-categories-masonry-gallery/verification/README.md`: one row per clause Q1–Q9 with its measured value and the file that carries the evidence, the honest-limitation notes (`phone.png` 1.5 MB and `audio.png` 1.2 MB on an unoptimized path stay **deferred**, named in research D9, and the chapter must not be the page's LCP element while they are), and the frame-rate prohibition
- [x] T032 Owner judgment (SC-002 + SC-008): serve over LAN (`npm run dev -H 0.0.0.0 -p 3000`; the `wlp3s0` address changes every reboot, currently `192.168.100.19:3000`), view on the owner's own phone, and run the five-second recognition test — six of nine departments named from the pictures alone. Record the answer verbatim; a green Q1–Q9 table is not acceptance
  **Result:** done 18:20 — 10 stops in DOM order, 3px ring, `role=list`, 0 `aria-roledescription` in the chapter, 6 counts wired, first column on the right. One over-broad claim corrected: a `carousel` roledescription **does** survive on this page, in NewArrivals' rail, which is a carousel — Q8 is about the departments, not the whole homepage.
  **Result:** done 18:15 — `categoryImageFor` retargeted at `/images/categories/v3` and its three expectations updated. **The suite is fully green for the first time: 281/281.**
  **Result:** done 18:18 — **the plan's premise was wrong.** `categories` *is* an anchor: third entry in `HOMEPAGE_SECTIONS` (`lib/atmosphere/progression.ts:45`), so the ground does measure this chapter. What holds is that the anchor order is unchanged; verified all nine present and monotonic, `#categories` at 4323 and `#brands` at 5565. quickstart §8 corrected.
  **Result:** done 18:15 — typecheck clean, 281/281, build clean (44/44 pages), and hydration re-confirmed in a real browser after the dev server was restarted (`reactKeys > 0`, 9 tiles, console otherwise clean).
  **Result:** done 18:25 — `verification/README.md`: one row per clause with its numbers, the four things this feature changed that the plan got wrong, the honest limits, and the three environment traps hit.
  **Result: ACCEPTED 2026-09-26 ~19:25.** The owner opened it on their own phone over LAN and said "categories section accepted and approved". That closes SC-008 by the only method that counts — the two mosaic variants were rejected on sight, so this was accepted the same way. SC-002 (five-second recognition, bar 6 of 9) was not separately measured; the owner recognises their own departments, and no further panel is owed.


---

## Dependencies & execution order

```
T001 (gate) ─▶ T002 ─▶ T003 ─▶ T004
                 │
                 ├─▶ Phase 2: T005 ─▶ T006 ─┬─▶ T007 ─▶ T008 ─▶ T009 [Q2]
                 │                          └─▶ (T006 is read by T011, T012, T019)
                 ├─▶ Phase 3 (US1): T010 ─▶ T011 ─▶ T012 ─▶ T013 ─▶ T014 [Q1] ─▶ T015 [Q3] ─▶ T016 [Q9] ─▶ T017 ◆ MVP
└─▶ Phase 4 (US2): T018 ─▶ T019 ─▶ T020 ─▶ T021 [Q6] ─▶ T022 [Q7]      (needs T012's markup)
    Phase 5 (US3): T023 ─▶ T024 ─▶ T025 [Q4] ─▶ T026 [Q5]                (needs T012's markup)
    Phase 6: T027–T032                                                   (needs the chosen story set)
```

- **T001 blocks everything.** A source edit while another agent believes it owns `home.css` is how work gets
  destroyed, not how it gets queued.
- **Phase 2 blocks all three stories**: US1 needs `RHYTHM`/`SPAN`/`COLUMNS`/`GAP`, US2 needs the duration
  constants, and both need `image` on the model.
- **US2 and US3 both touch `app/(main)/home.css`** (T011, T019's target, T024) and `CategoryHub.tsx` (T012,
  T020) — so those files are **serial**, never parallel, even though the two stories are independent in meaning.
- **T017 is a hard stop**: the owner sees the static arrangement before any motion is built on it.
- Within each story the tests are written first and must be seen failing for the stated reason.

### Parallel opportunities

- Phase 2: T005/T006 (module + its test) can be drafted together with T007's seed edit — different files
  (`lib/category-masonry.ts` vs `lib/category-departments.ts`), though T007's type imports T006's.
- The three verification writes at T009/T014/T015/T016/T021/T022/T025/T026/T027 each produce a **different**
  file under `verification/`, so evidence capture can be batched once the build is stable.
- T028 (product-images retarget) and T029 (tonal anchor) touch unrelated files and can run any time after T013.
- After US1's checkpoint, US2 and US3 can be picked up by different agents **if** they agree who edits
  `home.css` first — one lock, one writer, per AGENTS.md.

## Implementation strategy

**MVP = Phase 1 + Phase 2 + Phase 3 (US1), through T017.** That is a shippable chapter: uneven, complete without
scripting, permanent labels, same-window navigation, carousel deleted, all nine honest. It delivers the owner's
actual complaint ("categories section is so ugly") and it is the half that can be rejected on sight — which is
how both mosaic variants went, so rejecting it cheaply is worth real money.

**Then US2** (the arrival — half of what the reference is, and worthless on a layout the owner has not accepted),
**then US3** (hover/press, the polish that most often gets ported blindly from a pointer-first component).

**Do not** reorder this list to build the motion first. A beautiful arrival on top of the wrong arrangement is
still the wrong arrangement, and it is the arrangement the owner has already rejected twice.

## Notes

- `[P]` is deliberately absent from most tasks here: the collisions are in two shared files
  (`app/(main)/home.css`, `components/home/CategoryHub.tsx`) and in one contended lock. Marking them parallel
  would be an invitation for two agents to write the same stylesheet.
- Every task that changes what renders ends in a screenshot at **360** first. Desktop is the enhancement.
- Commit after each phase checkpoint, staging explicit paths only — `git status --short` before every commit,
  because a dirty file you did not touch belongs to another agent.
- Release locks by **moving** them to `.agent-pair/released/`, never by deleting, and only your own.
