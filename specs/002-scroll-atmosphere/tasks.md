---
description: Task list for feature 002 — scroll-driven atmosphere and scroll feel
---

# Tasks: Scroll-Driven Atmosphere and Scroll Feel

**Input**: Design documents from `specs/002-scroll-atmosphere/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/page-ground-behaviour.md](./contracts/page-ground-behaviour.md), [quickstart.md](./quickstart.md)

**Tests**: Included, and deliberately split. The pure half (the progression as a function) is unit-tested
in the existing Vitest node harness because research.md D6 says the pure parts *should* be. The rendered
half is **not** unit-testable and is verified in a browser — contrast at every scroll increment, absence
of seams, frame pacing. A DOM simulation would assert that a style string was set, which is not the
promise.

**Two binding owner answers that constrain every task below:**
- **Q1 = A** — "Visuals only; scrolling stays completely native." No task may intercept, ease, delay or
  substitute the shopper's own scroll. This rules out Lenis and every smooth-scroll library by name.
- **Q2 = C** — "Leave it exactly as is and add the progression on top." The existing five-glow field on
  `body` (`app/globals.css:135-144`) is not to be altered. The spec labels this option *"likely to
  reproduce the busyness the request objects to"*, and FR-005 requires the opposite outcome — see the
  T017 gate and the escalation note at the end of Phase 3.

**Format**: `[ID] [P?] [Story] Description` — `[P]` = different file, no dependency on an incomplete task.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: A measured "before" state and the guardrails, before anything is allowed to change

- [x] T001 Record the current-state baseline, because FR-005, clause P8 and SC-001 are all comparisons
  against *today* and cannot be settled later from memory. Using scripted Playwright at 360px and 1280px:
  (a) screenshot the homepage at ten evenly spaced scroll positions into
  `specs/002-scroll-atmosphere/baseline/`; (b) capture the rendered ground colour behind one fixed probe
  point at each of those positions; (c) capture the computed `background-image` of `body`, `body::before`
  and every `main > section::before` / `::after`. Record the trap from quickstart.md §Prerequisites — a
  fixed layer's `getBoundingClientRect()` is viewport-relative, not document-relative
  **[BROWSER]**
  Done: `tools/baseline-capture.mjs`, 20 screenshots, `baseline/ground-record.json`, and
  `baseline/README.md`. **The probe point in this task's own wording was not workable** — "one fixed
  probe point" returned a constant `#0b0204` at 1280px (every glow missed) and once returned `#faf4e6`,
  a cream card recorded as the environment. Replaced with a search that accepts a sample only where the
  hit-test lands on transparent page structure, recording the element and coordinates it came from, and
  printing `no bare atmosphere point at this position` for the 12 of 20 positions where no such point
  exists. The screenshots are the primary baseline; the colour series is partial by design and the
  predicate was not loosened to make it look complete.
  **Finding that changes the brief:** the existing ground already varies ~7× in the red channel across
  the page at 360px (`#0a0103` → `#460912`). FR-001 is therefore partly satisfied today — what is missing
  is direction and composition, not change. Which raises FR-005's bar rather than lowering it; see
  `baseline/README.md` and T012.
- [x] T002 Confirm the dev-server health precondition before any UI claim: exactly one Next process, one
  listener on port 3000, and a 200 on the first `/_next/static/chunks/*.js` — not on the page
  **[BROWSER]**
  Verified: one `next dev` (pid 1243876) whose single `next-server` child (1243891) is the sole `:3000`
  listener; `GET /_next/static/chunks/webpack.js` → 200.
- [x] T003 [P] Verify no new dependency is introduced. Record the current `package.json` dependency set
  as the ceiling for this feature: research.md D2 rejects GSAP, `motion`, embla and any smooth-scroll
  library for this work, so an added package is a plan violation, not a convenience
  Recorded as `notes/dependency-ceiling.md` — thirteen packages, with a re-verification command.
  **Consequence found while writing the tools:** Playwright is *not* one of the thirteen and must not
  become one, so `tools/baseline-capture.mjs` resolves it from `PLAYWRIGHT_PATH` and fails with
  instructions rather than quietly adding a package.

---

## Phase 2: Foundational (BLOCKING — must complete before any user story)

**Purpose**: The mechanism, the mount point, and the pure model — none of which is a user-visible story

**⚠️ CRITICAL**: research.md D3 is the constraint most likely to be discovered the hard way. **A
transformed ancestor becomes the containing block for `position: fixed` descendants**, and every homepage
section is wrapped in `Reveal`, which animates `transform: translateY(26px)`. `app/globals.css:290-294`
already records this exact failure ("a transformed ancestor makes a fixed attachment resolve against that
ancestor instead of the viewport"). A ground layer mounted inside `<main>` will appear to work on a
static screenshot and be wrong the moment anything is mid-reveal.

**Checkpoint**: Foundation complete = a viewport-anchored layer exists, driven by one number, and the
progression is a tested pure function.

- [x] T004 Establish the real section anchors, from the rendered page rather than from the spec's prose.
  Enumerate the `main > section` elements in document order with their ids — expected set, verified
  against `app/(main)/page.tsx`: `#top`, `#featured`, `#categories`, `#brands`, `#new-arrivals`, `#b2b`,
  `#accessories`, `#online-services`, `#store-experience`, `#trust`, `#final-conversion`. **Note the
  spec defect this corrects**: spec.md line 35 claims the sections "paint **no** background of their
  own", but `app/globals.css:182-224` gives every section a radial glow via `::before`, alternating
  odd/even, with `4n+2`/`4n` variants and a darkening `::after` on every third section. Record the actual
  list in `lib/atmosphere/progression.ts` as the anchor union type; data-model.md requires every
  `AtmosphereStage.anchorSectionId` to "MUST name a section that exists in the current homepage order"
- [x] T005 Write the failing unit test `tests/unit/atmosphere-progression.test.ts`, asserting the
  data-model.md validation rules verbatim: **at least two stages** (FR-001 — a one-stage progression is
  invalid by definition); every anchor exists in the set from T004; `toneAt(0)` equals the initial tone
  and `toneAt(1)` resolves into the footer (FR-007, FR-008); the sequence is **monotonic along its
  declared axis** (FR-003); **band containment at every interpolated step, not only at stage endpoints**
  (FR-015, SC-004 — this is the assertion that catches someone editing one stage value and quietly
  breaking contrast in the middle of a transition); and the reduced-motion mapping yields the same stage
  set (FR-020, FR-021). Confirm it fails before implementing
- [x] T006 [P] Implement `components/atmosphere/useScrollProgress.ts`: one `requestAnimationFrame`-
  throttled scroll listener writing exactly one normalized 0…1 value onto `documentElement` as a CSS
  custom property. No `preventDefault` on wheel or touch, no synthetic scroll, no substituted position
  (contract S1). Must register no work while the document is hidden (FR-025) and must be correct on the
  first frame for an arbitrary starting position (contract P5)
- [x] T007 Implement `lib/atmosphere/progression.ts` to make T005 pass: the stage table, `toneAt`,
  `anchorsFromLayout`, the reduced-motion discrete mapping, and the fallback tone. Pure — no DOM, no
  browser APIs, so it runs in the existing `environment: "node"` harness
- [x] T008 Create `components/atmosphere/PageGround.tsx` — the fixed full-viewport layer. Presentational
  only: `aria-hidden="true"`, no interactive content, nothing in the accessibility tree (contract A3).
  Mount it in `app/(main)/layout.tsx` as a sibling of `.noir-stars` and `.gradient-blur` (lines 14-18),
  **outside `<main>`**, per research.md D3. `.site-shell` is `position: relative`, which does not create
  a containing block for fixed descendants — only transform/filter/perspective/`contain` do
- [x] T009 [BROWSER] Prove D3 rather than assume it. With the layer mounted, force a `Reveal` wrapper
  into its transformed state and assert the ground layer's bounding box is still exactly the viewport and
  does not track the section. A layer that passes a static screenshot and fails this test is the failure
  mode this task exists to catch

**Checkpoint**: Foundation ready — user stories can now proceed.
**Done — 127 unit tests pass, typecheck clean, and `tools/d3-proof.mjs` reports 5/5.**

Evidence and the two deviations from the task text:

- **T004** — eleven anchors, taken from the rendered page via `baseline/ground-record.json`, not from the
  spec's prose. The spec's claim that the sections paint no background of their own is contradicted by
  `app/globals.css:193-214`; recorded for T035.
- **T005** — written first and confirmed red (`Cannot find package '@/lib/atmosphere/progression'`), then
  green. 14 cases. **The band assertion caught a real violation on its first run**: the deepest stage was
  first written as `#0A0103`, which measures luminance 0.000928 — under the declared floor — because
  sRGB→luminance switches from the linear branch to the power branch at byte 10 on a channel. The tone was
  corrected to `#0D0205` (0.001399); the floor was not lowered to accommodate the mistake.
- **T006** — implemented as `components/atmosphere/useAtmosphereGround.ts`, **not the
  `useScrollProgress.ts` named in this task**. The name was wrong in the plan: the hook does not merely
  publish a progress number, it resolves the tone and writes it. See T007 for why that matters.
- **T007** — one substantive change from D1's wording. D1 said "one number, everything else resolved in
  CSS"; CSS cannot index a stage table by a number, so the hook resolves the tone through the pure module
  and writes the resulting colour as the single custom property. One write per frame, no layout, and —
  the reason it is worth the deviation — **the value the browser paints is the same value the unit test
  asserts**, instead of the test checking a number that CSS then reinterpreted.
- **T008** — mounted as the first child of `.site-shell` in `app/(main)/layout.tsx`, ahead of
  `.noir-stars` (z-index 0) and `<main>` (z-10). **Scoped to the homepage by pathname**, because the
  spec puts every other page out of scope and the layout wraps them all; the layer returns `null` off
  `/` and the hook exits before attaching a listener.
- **T009** — `tools/d3-proof.mjs`, 5/5. It proves the trap before proving the escape: a `position: fixed`
  probe appended inside a transformed `Reveal` measured **312×436 against a 360×800 viewport** — captured
  by its ancestor, exactly as D3 predicts. `.hami-page-ground` measured 360×800 at top 0 left 0 with that
  same transform applied, stayed there after a 4200px scroll, painted exactly the colour the module
  declared (`#1b0206`), and changed top-to-bottom. Without the first check the test would pass on a page
  where fixed positioning was never at risk.

---

## Phase 3: User Story 1 — One continuous atmosphere that moves with the shopper (Priority: P1) 🎯 MVP

**Goal**: The ground passes through a coherent, seam-free tonal progression tied to the page's real
sections, and the result reads **calmer** than today, not busier.

**Independent Test**: spec.md US1 — "Scroll the full length of the homepage slowly, then quickly, then
backwards, and answer two questions: did the environment change, and did it ever feel like more than one
page?"

- [x] T010 [P] [US1] Design the stage table in `lib/atmosphere/progression.ts`: the stage count, their
  section anchors, and their tones. FR-027 is the boundary — "This specification MUST NOT fix the number
  of atmosphere stages, their colors, their positions, the transition duration or curve" — so the values
  are chosen here, not in the spec. The spec's own coherence assumption applies: "A progression of three
  or four closely-related stages that reads as one movement satisfies this feature; many contrasting
  stages do not."
- [x] T011 [US1] Express the progression in CSS in `app/globals.css` (new block, clearly separated from
  the existing ground rules at 135-154), resolving tone from the single custom property from T006.
  **The Q2 = C constraint binds here and it is the design's central discipline: the new layer shifts the
  ground's value and hue within the band the existing field already occupies — it MUST NOT introduce new
  light sources.** Adding a second set of coloured blobs on top of five existing glows is precisely the
  outcome FR-005 forbids
  → Done in `components/atmosphere/page-ground.css` (`.hami-page-ground`) rather than a `globals.css`
  block: the rule belongs to the component that owns the element, and it keeps the existing ground rules
  at 135-154 untouched. Constraint honoured — the block sets only `background-color:
  var(--hami-ground, …)` and carries **no `background-image`**, so it adds value and hue, not light
  sources.
- [ ] T012 [US1] Reconcile with the existing per-section lighting rather than competing with it — FR-018:
  "Where the ground and an existing decorative layer would both be visible, they MUST be reconciled with
  it rather than competing with it." `app/globals.css:182-224` is that layer. Record the reconciliation
  decision in a comment at the new block, in the style of the surrounding notes
  → **CLOSED BY OWNER DECISION 2026-09-22, not achieved by design.** The reconciliation comment was
  written into `page-ground.css` and its premise was measured false: a uniform tint at `z-index: 0` sits
  *beneath* `main` (`z-10`), so it cannot damp the alternation of `main > section::before/::after`. The
  comment now records the failure instead of the claim. The owner re-confirmed Q2 = C — the glow field is
  left untouched and no reconciliation is attempted — so FR-018 is satisfied in the weakest sense
  available: the two layers coexist without competing for the same job, because the ground contributes
  direction and the glows contribute the lighting. That is not what FR-018 was written to require, and it
  is recorded as closed-by-decision rather than done.
- [ ] T013 [US1] Resolve the seam into the footer without an abrupt tone change in `app/globals.css`
  (new atmosphere block) and `components/layout/Footer.tsx` — FR-008, contract P7.
  `#final-conversion` is the last homepage section; the footer is outside this feature's scope and must
  not be restyled to hide the seam
  → **Not started.** No footer-side work exists: `components/layout/Footer.tsx` and `globals.css` carry no
  atmosphere wiring, and the transition from `#0D0205` into the footer has not been measured. Tracked
  work, independent of the Q2 decision below.
- [ ] T014 [US1] Make entry position correct by construction rather than by handling: reload at a
  scrolled position, back/forward navigation, an `End`-key jump traversing several stages, and an
  in-page anchor jump must each show the right tone on the first frame with no catch-up animation.
  FR-007, contract P5, SC-009. The data-model's derivation is the mechanism — `toneAt(progress)` is pure,
  so nothing accumulates and nothing can be behind
  → **Mechanism in place, browser evidence not collected.** `toneAt` is pure and the hook measures
  boundaries on mount/resize/`load`/+1500ms rather than per frame, so nothing can be behind — but the four
  entry cases above have not each been observed. Do not treat as done on the strength of the design.
- [x] T015 [US1] [BROWSER] Write `specs/002-scroll-atmosphere/tools/ground-sweep.mjs` and run quickstart
  §2 from it: a ~2%-increment sweep of the whole document capturing the rendered ground colour, asserting more than one distinct tone (FR-001), monotonicity with no reversal
  and no step larger than the sampling interval implies (FR-004, contract P3), settled appearance at five
  arbitrary pause positions (contract P4), and a byte-identical first frame at the top versus the
  original arrival (contract P5)
  → Done. 21 positions at 360px, ~1130 bare-ground pixels per position, output in
  `notes/ground-sweep.json`. FR-001 passes (multiple distinct tones), FR-004 passes on the declared tone
  (1 of 20 steps rises; max seam 0.00098 vs mean 0.00024). The sweep also grew the multi-alpha and
  glows-off controls that T017 needed.
- [x] T016 [US1] [browser] Re-measure the captures in `specs/002-scroll-atmosphere/baseline/` against the
  T015 sweep and diff the two at matching scroll positions. Any visible seam, band or step at any position is a fail — FR-004,
  FR-006, contract P3
  → Done at matching positions: the sweep's `off` pass is the no-layer measurement and `a0.5` the after,
  compared at the same 21 offsets; the baseline's eleven section anchors are asserted against
  `HOMEPAGE_SECTIONS` in `tests/unit/atmosphere-progression.test.ts`. No band appears at any position —
  the largest step is a single section boundary, 4.01× the mean. **But the diff found the opposite of
  what T016 expected to find: the after is not quieter than the before.** That is T017's result.
- [x] T017 [US1] [BROWSER] **The FR-005 gate.** Compare the page before (T001) and after, same viewport
  and scroll position, side by side, and judge busyness. FR-005: "The progression MUST NOT increase the
  perceived busyness of the page. The result MUST read as calmer than the existing decorative glow field
  it follows, and MUST NOT combine with it to produce more simultaneous visual activity than either
  alone." Record the result in `specs/002-scroll-atmosphere/notes/busyness.md` either way.
  **If this gate fails, the correct escalation is to bring Q2 back to the owner with the evidence and
  propose option B — reduce the existing field to a quiet base — and NOT to weaken FR-005.** plan.md's
  Complexity Tracking table records exactly this instruction; do not resolve the contradiction by
  lowering the bar
  → **Gate executed. Verdict: FR-005 FAILED, then WAIVED by the owner on 2026-09-22.** (The checkbox means
  the gate was run and recorded, not that it passed.) At 360px the rendered left/right asymmetry is 7.05 with the existing field alone and 6.90
  with the layer at the draft α = 0.5 — 2% quieter, inside measurement noise — while the direction-reversal
  count goes 7 → 9. Sweeping α over 0.2 / 0.5 / 0.85 finds no value that helps; α = 0.85 is worse on both
  axes (7.38, range 14.00). The control that explains it: switching `main > section::before/::after` off
  collapses asymmetry to 0.85, so 88% of the alternation is the existing glows — and they paint at z-10,
  *above* this z-0 layer, which is why no opacity on the layer can damp them. Full numbers and the
  arithmetic reason (a blend scales step deviations by (1−α), which preserves their signs and therefore
  the reversal count) in `notes/busyness.md`. FR-005 and Q2 = C are not simultaneously satisfiable.

**Checkpoint**: **UNBLOCKED 2026-09-22 by owner decision.** The gate failed as recorded and the owner
re-confirmed Q2 = C, waiving FR-005's "calmer than before" clause rather than meeting it — so the
escalation this checkpoint called for has been answered and phases 4–7 may proceed. Two things are true at
once and neither is allowed to quietly cancel the other: the progression is seam-free, directed and
measured; and it does not make the page quieter than it was. T013 and T014 remain open on top of that.

---

## Phase 4: User Story 2 — Scroll that feels calm and expensive (Priority: P2)

**Goal**: The visual response is smooth while the shopper's own scrolling remains completely native.

**Independent Test**: spec.md US2 — perform three navigation tasks (read to the third section, jump to
the footer, return to a product) using keyboard, wheel and touch, recording any moment the motion feels
rough, delayed or unresponsive.

  feature calls `preventDefault` on wheel/touch/scroll, sets `scrollTop`/`scrollTo` on the document, or
  uses `will-change` in a way that captures the fixed layer. Contract S1: "The shopper's own scrolling is
  native. Nothing intercepts, eases, delays, substitutes for, or re-implements it."
  `html { scroll-behavior: smooth }` is at `app/globals.css:127-129` and `main > section` carries
  `scroll-margin-top: 6rem` at line 184. FR-026: existing anchor behaviour "MUST land at a correct ground
  tone, and the two mechanisms MUST NOT conflict."
  §4 from it: keyboard (`ArrowDown`, `PageDown`, `Space`, `End`) begins
  moving on input with no perceptible lag at every position (FR-011, contract S2, SC-007); wheel and
  trackpad continuous with no stutter (FR-009, contract S4); touch emulation flick-deceleration and
  stop-mid-gesture, correct under a right-to-left document (FR-012, contract S3); the ground never
  lagging, overshooting or snapping after movement stops (FR-010, contract S4)
  server. feature 004 established that dev-mode style recalculation dominates frame-pacing numbers and
  attributed a 50ms-vs-33ms difference to a section that cost nothing. Compare frame pacing with the
  layer visible against the layer hidden, on the same build and route; FR-014 and contract S6 require the
  page to be no slower to reach and no slower to become interactive. Restart the dev server afterwards —
  `npm run build` rewrites `.next` under a live server

**Checkpoint**: US1 and US2 both work independently; the effect is smooth and the scroll is untouched.

---

- [ ] T018–T021 **SUPERSEDED — do not execute; the revised tasks are T043–T049 in Phase 4 (revised)
  below.** These four were written against Resolved Q1 = A, which required proving the shopper's scrolling
  stays native. The owner re-answered Q1 as C on 2026-09-22, so non-interception is now the thing being
  removed rather than verified. The IDs are retired rather than reused so the history stays readable:
  T018's "prove non-interception in the code" is the exact inverse of T043, T020's scroll-input probe is
  replaced by T045's content-transform lag measurement, and T021's cost check survives as T047.

---

## Phase 5: User Story 3 — Content stays readable through every change (Priority: P3)

**Goal**: Text, imagery and the fixed header hold contrast at every intermediate point of every
transition — not merely at each stage's settled endpoints.

**Independent Test**: spec.md US3 — step the scroll position in small increments across the whole page
and measure text-on-ground contrast at each step, including over the fixed header.

- [ ] T022 [P] [US3] Build the contrast sweep as a scripted Playwright harness under
  `specs/002-scroll-atmosphere/tools/contrast-sweep.mjs`. It steps the scroll position across the whole
  document and, at each step, resolves the rendered ground colour behind a fixed set of representative
  nodes — product name, price, availability label, section heading, body copy, and a header label — and
  computes the ratio. The existing reference numbers to protect, all measured on this page: cream-on-wine
  marks 10.08:1, brand-ticker band 12.19:1, and 004's smallest text on its emphasised row at 5.66:1
- [ ] T023 [US3] Run `specs/002-scroll-atmosphere/tools/contrast-sweep.mjs` and write the result to
  `specs/002-scroll-atmosphere/notes/contrast.md`. SC-004: "Measured at every small increment of scroll position across the
  whole page, no meaningful text falls below its legibility threshold at any intermediate point — **zero
  failing measurements, not an average**." FR-015 and contract L1. A single failing step is a fail, and
  the fix is to narrow the band in T010, not to move the sampling
- [ ] T024 [US3] [P] The fixed header over every tone, in **each of its own appearance states** —
  `components/layout/Header.tsx:79-88` switches between a transparent island and a solid bordered bar once
  scrolled. FR-016, contract L2. Include the seam where the header overlaps the ground's mid-transition
  value
- [ ] T025 [US3] [P] Product imagery keeps clear separation throughout — FR-017, contract L3. The
  off-white `.bg-product-stage` plinth (`app/globals.css:251-254`) was measured at 1.04:1 against the page
  before it was corrected; the comment there says "If this ever goes back toward the ground, measure it
  before believing it looks fine." Do the measuring
- [ ] T026 [US3] [P] Add a forced-colors / high-contrast block to the atmosphere rules in
  `app/globals.css`: legibility preserved or improved, never
  compromised — FR-023, contract L4. Under forced colours the layer should simply not paint
- [ ] T027 [US3] A section shorter than the viewport still resolves to a coherent tone rather than an
  unintended intermediate — US3 scenario 4. This is where D4's rejection of "fixed fractions of document
  height" is either vindicated or exposed

**Checkpoint**: The progression cannot make anything unreadable at any scroll position.

---

## Phase 6: User Story 4 — Quiet, accessible, and harmless by default (Priority: P4)

**Goal**: Reduced motion, assistive technology, weak devices and hidden tabs get a complete, calm page —
never a lesser one.

**Independent Test**: spec.md US4 — browse with reduced motion enabled, with keyboard and screen reader
only, and on a deliberately throttled device; the page stays complete and calm in all three.

- [ ] T028 [US4] Implement the discrete reduced-motion mapping: distinct settled tones per region, no
  animated travel. FR-020, contract A1. Follow the pattern already in `app/globals.css:596-624` — the
  page-wide floor plus per-rule overrides — and note the recorded gotcha there that `:nth-child`-declared
  animations must be matched by the same selector or the override loses on specificity
- [ ] T029 [US4] [BROWSER] Prove the reduced-motion page is content-identical, writing
  `specs/002-scroll-atmosphere/notes/reduced-motion.md`: DOM diff against the
  animated page — same sections, products, prices, links, reading order — SC-008, FR-021, contract A2.
  feature 004 did this by snapshotting all six rows' ordinals, labels, mark markup, hrefs and story text
  and comparing the two runs; reuse that method
- [ ] T030 [US4] [BROWSER] Confirm the effect is silent to assistive technology in
  `components/atmosphere/PageGround.tsx`: no node for the ground
  in the accessibility tree, no announcements, no focus movement, no change to reading order or document
  structure — FR-022, contract A3
- [ ] T031 [US4] [BROWSER] Hidden-document behaviour in `components/atmosphere/useScrollProgress.ts`:
  background the tab, confirm no work runs, return
  and confirm the tone is already correct with no catch-up animation — FR-025, contract A5, US4
  scenario 5
- [ ] T032 [US4] Implement and verify the low-capability fallback in `lib/atmosphere/progression.ts`:
  a device that cannot sustain the effect sheds it rather
  than losing responsiveness, and **falls back to a deliberately chosen tone, never an unstyled
  default** — FR-024, contract A4, US4 scenario 4. Verify under heavy CPU throttling, and record the
  `FallbackGround` value in the progression module so it is an intentional choice
- [ ] T033 [US4] [BROWSER] **The clause that outranks the others.** Hide `components/atmosphere/PageGround.tsx`
  entirely and walk the
  page: no information, state, price, availability or navigation may be lost. Contract G1 — "The ground
  is never load-bearing … If the effect were removed entirely, the page would remain complete and
  honest." This is the test that keeps Constitution I intact for a feature whose entire subject is colour
- [ ] T034 [US4] [BROWSER] Write `specs/002-scroll-atmosphere/tools/soak.mjs` — fifteen minutes of
  scripted continuous up-and-down scrolling — then
  re-run T015's sweep and diff it against the first pass. SC-010, contract A6. The data-model's claim is
  that this is satisfied structurally — "the correspondence is a function, and functions do not drift" —
  so this task either confirms that or finds the state someone accidentally introduced

**Checkpoint**: All four user stories independently functional; no shopper and no device gets a lesser page.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T035 [P] Correct the two spec defects found during planning, in
  `specs/002-scroll-atmosphere/spec.md`: the Assumptions line still says "**Question 2 is unresolved** …
  the design phase cannot lock the ground until it is settled" while Resolved Clarifications answers it as
  C two lines below; and the claim at line 35 that the eleven sections "paint **no** background of their
  own" is contradicted by `app/globals.css:182-224`. Both were flagged in plan.md rather than edited
  silently — do it now, as a documentation correction, not a scope change
- [ ] T036 [P] Record coherence with feature 004 in `specs/002-scroll-atmosphere/notes/coherence.md`,
  mirroring `specs/004-mobile-brands-rows/notes/coherence.md`. Two obligations carry across: 004 committed
  to the `cubic-bezier(0.2, 0.7, 0.3, 1)` easing family and one duration scale (C22), and to "at most one
  travelling element per page region" (C25). 002's continuous ground response is a different kind of
  motion and does not take the 220ms figure, but it MUST use the same curve wherever it has a discrete
  transition and MUST NOT become the page's second travelling element
- [ ] T037 [P] Verify no file under `data/`, `app/api/`, or `prisma/` was modified — the Principle III
  freeze boundary. Expect `git status --porcelain -- data app/api prisma` to be empty; `lib/catalog.ts`
  must not appear at all, since this feature reads no data
- [ ] T038 Run `npm run typecheck` and `npx vitest run tests/unit` clean. **Do not run bare
  `npm test`**: it is `dotenv -e .env.test -- vitest run`, `.env.test` does not exist in this repo, so
  `DATABASE_URL` falls through to `.env` → the development database, and `tests/setup.ts` runs
  `resetDb()` in a global `beforeEach` that `deleteMany()`s all 19 tables — including for pure unit
  tests. If a build was run in T021, restart the dev server and re-verify the chunk 200 before claiming
  anything about the live page
- [ ] T039 Run the full [quickstart.md](./quickstart.md) §1–§7 and record results in
  `specs/002-scroll-atmosphere/notes/validation.md`, with §8 called out separately as the human gate.
  State plainly which sections were measured and which were not **[BROWSER]**
- [ ] T040 SC-001 and SC-002 need a human panel: at least 7 of 10 judge the result more premium, at least
  8 of 10 judge it no busier, and no viewer describes it as flickering, flashing or jumping. Write
  `specs/002-scroll-atmosphere/notes/reception.md` with the instrument and an empty results table.
  **An agent must not fill this in on the reviewers' behalf** — feature 004's T049 set the precedent
- [ ] T041 Update the knowledge graph with `graphify update .` per `CLAUDE.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: no dependencies. T001 is not busywork — four requirements are comparisons against
  the current state and cannot be reconstructed later
- **Foundational (Phase 2)**: BLOCKS every user story. T004 → T005 → T007 is a strict chain on
  `lib/atmosphere/progression.ts`; T006 is independent of it; T008 needs both; T009 needs T008
- **User Stories (Phase 3+)**: all depend on Phase 2. US1 → US2 → US3 → US4 in priority order, **but
  US3 is not optional polish** — it is the hard gate SC-004, and shipping US1 without T023 passing means
  shipping a feature whose most likely failure is unmeasured
- **Polish (Phase 7)**: after the stories being shipped

### Cross-phase edges worth naming
- T010 sets the band that T023 verifies. If T023 fails, the fix is in T010, not in the sampling.
- T011 and T012 edit the same file (`app/globals.css`) and must not run in parallel.
- T017 is a gate on the whole feature, not a step. It can legitimately stop the work.
- T021 and T038 both interact with the build/dev-server trap; T038 must re-verify health if T021 built.

### Within each user story
Tests and measurement harnesses before the thing they check; the pure module before the component that
consumes it; browser verification after rendering, never substituted for it.

---

## Parallel Example: Phase 2

```bash
# Independent of the progression module — different file, no shared state:
Task: "T006 Implement components/atmosphere/useScrollProgress.ts"

# Strict chain, same file, must be sequential:
Task: "T004 Establish the real section anchors"
Task: "T005 Write the failing unit test tests/unit/atmosphere-progression.test.ts"
Task: "T007 Implement lib/atmosphere/progression.ts"
```

## Parallel Example: User Story 3

```bash
# Different surfaces, different files, no dependencies once T022 exists:
Task: "T024 Fixed header over every tone, both appearance states"
Task: "T025 Product imagery separation"
Task: "T026 Forced-colors and high-contrast"
Task: "T027 Sections shorter than the viewport"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)
1. Phase 1 — baseline, health, dependency ceiling.
2. Phase 2 — anchors, failing test, pure module, hook, layer, and the D3 proof.
3. Phase 3 — stage table, CSS, reconciliation, footer seam, entry correctness, sweep, **T017 gate**.
4. **Stop and validate T017.** A progression that reads busier than the page it replaces has failed the
   request that produced it, whatever else passes.
5. Deploy/demo only if T017 passes.

### Incremental Delivery
1. US1 alone is the feature's premise — and it is the point at which the Q2 = C risk is either realised or
   retired.
2. US2 adds the guarantee that none of it was bought by touching the shopper's scroll.
3. US3 is where the feature earns the right to ship: SC-004 with zero failing measurements.
4. US4 makes it safe for everyone else — reduced motion, assistive tech, weak devices, hidden tabs.
5. Phase 7 closes the docs, the coherence record, and the human gate.

---

## Notes

- **[P] means different files and no dependency on an incomplete task**, not "sounds independent".
- Research.md D2 is a hard constraint: no new package. If an implementation seems to need one, the
  mechanism is wrong.
- Every colour, count, curve and duration chosen in T010/T011 is a draft under Constitution IV. None of
  them may be encoded as policy in the constitution or in this file.
- Commit after each checkpoint, and verify what is staged before committing — `.mcp.json` currently
  carries live credentials in this repository's history and must not be swept into a commit.
- **The one thing not to do**: if T017 fails, do not soften FR-005, do not reduce the sampling density,
  and do not declare the busyness comparison "subjective". Take the evidence to the owner and ask for
  Q2 again.

---

## Phase 4 (revised 2026-09-22): User Story 2 — Scroll that feels calm and expensive

**Reopened.** The original Phase 4 (T018–T021) was written against Resolved Q1 = A and set out to *prove
the shopper's scrolling stays native* — T018 read "Prove non-interception in the code, not by feel". The
owner re-answered Q1 as **C** the same day: ease the desktop wheel and trackpad, leave touch native. Those
four tasks are withdrawn rather than completed; their numbering is kept so the history reads.

**Independent Test**: give one wheel notch on a desktop and confirm the rendered content settles toward the
target over roughly a second rather than arriving at once; then do the same on an emulated phone and
confirm nothing about the scroll changed.

- [x] T018 ~~Prove non-interception in the code~~ **Withdrawn** — non-interception is now the thing being
  removed. Replaced by T043, which proves the opposite half: that interception stops at the desktop.
- [ ] T019 ~~Cooperate with the existing anchor animation~~ **Superseded.** Anchor jumps now travel
  through the smoother's lerp. Re-check under T046 rather than as a standalone task.
- [ ] T020 ~~Write `tools/scroll-input.mjs` to prove native scrolling is untouched~~ **Withdrawn.**
  Replaced by T045, which measures the lag between `scrollY` and the content transform — the only signal
  that shows easing at all. A first probe measured `scrollY` alone and reported "not eased" on a build
  that was demonstrably easing, because `scrollY` is the driver ScrollSmoother does not delay.
- [ ] T021 ~~Measure scroll cost on a production build~~ **Retained and now urgent** — see T047.
- [x] T043 Create `components/atmosphere/ScrollSmooth.tsx`: `ScrollSmoother` at `smooth: 1.5`, gated on
  `(pointer: fine)` and not `(any-pointer: coarse)` and not `(prefers-reduced-motion: reduce)`.
  **`smoothTouch` is deliberately not passed** — `ScrollSmoother.js:121` makes an unset value parse to
  `0`, so touch stays native by the library's own default. Passing it is how that would break silently.
- [x] T044 Restructure `app/(main)/layout.tsx` so every fixed layer — `PageGround`, `.noir-stars`,
  `.gradient-blur`, `Header`, `MobileDock` — is a **sibling** of `#smooth-wrapper`, with only `<main>`
  and `<Footer>` inside it. A transformed ancestor captures `position: fixed`, so a fixed element left
  inside the wrapped subtree scrolls with the page and looks correct in any static screenshot.
- [x] T045 **BROWSER** Prove the easing and the boundary. *(behaviour only — the fps numbers from this machine were withdrawn; see T047)* Desktop: one `wheel(0,1200)` produces a peak
  850px lag between `scrollY` (1200 at once) and the content transform (350), settling to 0 by ~1080ms.
  Touch (iPhone 13 emulation): the smoother is never created, `#smooth-content` computes
  `transform: none`, `scrollTo` lands instantly. Reduced motion: identical to touch. Fixed layers:
  ground and blur hold at viewport top 0 with content at 4000px. `--hami-ground` still tracks
  (`#180205` → `#0e0205`). Record in `notes/scroll-easing.md`.
- [ ] T046 **BROWSER** Anchor jumps, in-page navigation, `End`-key jumps and reload-at-scrolled-position
  now all resolve through the lerp. Confirm each lands on the right destination and that the ground's
  stage is correct on the first rendered frame — FR-007 and contract P5 still apply, and the smoother is
  new evidence against them.
- [ ] T047 **BROWSER — production build. NOT MEASURED — the first attempt is withdrawn, see `notes/scroll-cost.md`.** A permanently-running rAF lerp over a 19,134px
  document is exactly the change that must be re-measured rather than assumed cheap. Feature 004 recorded
  33.3ms median frames here; anything materially worse needs the `smooth` value lowered or the feature
  stood down on mid-range hardware. FR-014, FR-015, SC-006.
- [ ] T048 Re-check FR-008 and every contrast measurement: the ground now tracks a *rendered* position
  that lags the document, so the tone at a given `scrollY` and the tone behind the pixels on screen can
  disagree mid-settle. Measure contrast at intermediate points of the settle, not only at rest.
- [ ] T049 Decide, with the owner, what happens to **FR-005**. It still fails as measured
  (`notes/busyness.md`), and easing the scroll does not touch it — that gate was about the background.
  The Q2 = B/A/C question is still open and is now the only thing standing between this feature and
  completion.
