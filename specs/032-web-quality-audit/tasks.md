# Tasks: Web Quality Audit

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/audit-report.md](contracts/audit-report.md), and [quickstart.md](quickstart.md).

**Organization**: Remaining work is grouped by user story in priority order. Beads is the durable issue tracker; this Spec Kit checklist describes the feature implementation sequence.

**Existing baseline**: The upstream two-file skill is installed locally, the first public audit is in [audit.md](audit.md), and the discounted-link name and smooth-scroll fixes are already present in `components/home/DiscountedProducts.tsx` and `app/layout.tsx`. Their initial verification is recorded in the audit. The mobile performance investigation remains open as Beads issue `HamiSite-basic-structure-abi`. The skill path is ignored by Git, so a fresh checkout needs the reinstall procedure in T001. Do not repeat completed changes merely to check a box.

**Tests**: The specification requests independent browser and report checks, but does not request new automated test code. Existing project quality gates and focused repeat measurements appear below.

## Format: `[ID] [P?] [Story] Description`

- **[P]** means the work touches a different file and has no dependency on another incomplete task in its phase. The checkout's one-agent rule still applies.
- **[US1]**, **[US2]**, and **[US3]** map to the stories in [spec.md](spec.md).
- Paths are relative to the repository root. Existing screenshots and owner edits must be preserved.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Make the locally installed audit method recoverable in a clean checkout.

- [X] T001 Add a pinned two-file reinstall procedure for revision `afa8da942115f2961fdbfa80807ea0b232ff6c00` to `specs/032-web-quality-audit/quickstart.md`; name `.agents/skills/web-quality-audit/SKILL.md` and `.agents/skills/web-quality-audit/scripts/analyze.sh`, explain that `.agents/skills/` is Git ignored, and verify the procedure against the installed files without rewriting them.

**Checkpoint**: A contributor can obtain the exact guidance and analyzer even after a clean checkout.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish comparable conditions and a complete evidence format before additional findings or fixes.

- [X] T002 Record the audit date, reviewer, exact development and production build states, browser/tool versions, route slugs, access state, viewport widths, and available throttling/cache conditions in `specs/032-web-quality-audit/audit.md`; mark any condition that cannot be recovered from the initial run as unknown rather than inventing it.
- [X] T003 Align the evidence and finding sections of `specs/032-web-quality-audit/audit.md` with `specs/032-web-quality-audit/contracts/audit-report.md`: every finding needs target, category, `critical`/`high`/`medium`/`low` severity, confidence, evidence type and reference, visitor impact, next action, and `open`/`corrected`/`unverified`/`deferred` status; corrected findings need comparable repeat-check details.

**Checkpoint**: New observations can be added without mixing lab, browser, field, direct-request, and source-hypothesis evidence.

---

## Phase 3: User Story 1 — Understand current site quality (Priority: P1) 🎯 MVP

**Goal**: Give the owner reproducible evidence for public browsing, with performance uncertainty and access limits explicit.

**Independent Test**: Another contributor can find at least three public targets, their mobile and desktop conditions, all five quality categories, and the evidence needed to reproduce every reported runtime issue in `specs/032-web-quality-audit/audit.md`.

### Implementation for User Story 1

- [X] T004 [US1] Revisit `/`, `/shop`, and the recorded available `/shop/[slug]` at about 390px and 1280px; exercise navigation and one product interaction, inspect keyboard names and states, images, page title/description/canonical, Persian `lang`/`dir`, and document overflow, then record route-specific results and any inaccessible state in `specs/032-web-quality-audit/audit.md`.
- [X] T005 [US1] Run at least three equivalent homepage mobile performance navigations on a stable production build, record the Node/Lighthouse versions and CPU, viewport, throttling and cache conditions, then add LCP, relevant interaction or blocking measure, CLS, median, range, and the slow-host warning to `specs/032-web-quality-audit/audit.md`; keep the results labeled lab evidence and link Beads issue `HamiSite-basic-structure-abi`.
- [X] T006 [US1] Check whether production CrUX, first-party real-user monitoring, and Search Console data are actually accessible; record each available field signal with its population and period, or the specific access limitation and verification path, in `specs/032-web-quality-audit/audit.md`.
- [X] T007 [US1] Complete the category review in `specs/032-web-quality-audit/audit.md`: performance, accessibility, SEO, best practices, and agentic browsing semantics; distinguish browser observations, direct crawler requests, lab failures, and source hypotheses, including the streamed metadata and `robots.txt` diagnostics.

**Checkpoint**: SC-001 and SC-002 can be checked from the report without interpreting a single local score as field performance.

---

## Phase 4: User Story 2 — Resolve important verified issues (Priority: P2)

**Goal**: Confirm the existing bounded corrections and act on any newly verified critical or high issue.

**Independent Test**: Each corrected finding in `specs/032-web-quality-audit/audit.md` has a comparable after-observation; any unresolved high issue has a blocker and Beads follow-up, and no confirmed critical issue remains on audited public journeys.

### Implementation for User Story 2

- [X] T008 [US2] Repeat the homepage discounted-product link check against `components/home/DiscountedProducts.tsx` in the accessibility tree and Lighthouse `label-content-name-mismatch` audit; record the visible text, computed link names, result, and comparable conditions in `specs/032-web-quality-audit/audit.md`.
- [X] T009 [US2] Repeat the mobile route-transition and overflow check for `app/layout.tsx` at the audited widths; record whether the smooth-scroll warning recurs and whether Persian RTL navigation remains usable in `specs/032-web-quality-audit/audit.md`.
- [X] T010 [US2] Use the repeated performance results from T005 to trace the dominant server-response or main-thread cost, inspect `app/(main)/page.tsx` and `components/home/DiscountedProducts.tsx` against that trace, and record an evidence-based severity and bounded-fix decision in `specs/032-web-quality-audit/audit.md` and Beads issue `HamiSite-basic-structure-abi`; if another file is implicated, name its exact path in the Beads follow-up before editing.
- [X] T011 [US2] For each newly confirmed critical or high finding, either implement its safe correction in the exact affected file named by T010 and record an equivalent before/after browser check in `specs/032-web-quality-audit/audit.md`, or record the missing evidence/product decision and a Beads follow-up there; leave unverified findings unverified.

**Checkpoint**: SC-003 and SC-004 are satisfied for the public scope, with no issue closed solely by code inspection.

---

## Phase 5: User Story 3 — Repeat the audit (Priority: P3)

**Goal**: Let a later contributor repeat the method and produce a contract-compliant report for a changed public page.

**Independent Test**: Starting from `specs/032-web-quality-audit/quickstart.md`, a contributor can locate or reinstall the skill within five minutes and report a new page with scope, evidence, severity, correction or follow-up, and verification.

### Implementation for User Story 3

- [X] T012 [US3] Walk through `specs/032-web-quality-audit/quickstart.md` from a clean-checkout perspective, correct missing install or run steps, and state explicitly that `.agents/skills/web-quality-audit/scripts/analyze.sh` only scans `.html`/`.htm` source and cannot pass rendered Next.js pages.
- [X] T013 [US3] Produce one repeat-audit example for a newly changed public route in `specs/032-web-quality-audit/repeat-audit.md` using the fields and evidence labels from `specs/032-web-quality-audit/contracts/audit-report.md`; if no page changed, use `/shop` as the sample and label it a repeat baseline.
- [X] T014 [US3] Compare `specs/032-web-quality-audit/repeat-audit.md` with `specs/032-web-quality-audit/contracts/audit-report.md` and document any inaccessible journey, absent field data, human-only check, or source hypothesis without marking it passed.

**Checkpoint**: SC-005 is demonstrable from the written method and example.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Close the audit with repository gates and accurate issue state.

- [X] T015 Run `npm run typecheck`, `npm run test:unit`, and `npm run build` after stopping any server serving `.next`; restart the built app, verify `/` plus one referenced `/_next/static/chunks/*.js` load, and record results and any limitation in `specs/032-web-quality-audit/audit.md`.
- [X] T016 Check `specs/032-web-quality-audit/audit.md` and `specs/032-web-quality-audit/repeat-audit.md` against SC-001 through SC-005 and the report contract; ensure each unresolved high finding has a Beads ID, inspect `git status --short` without disturbing existing edits or screenshots, and record the final handoff state in `specs/032-web-quality-audit/audit.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

1. T001 establishes a recoverable skill installation.
2. T002–T003 establish audit conditions and report fields before new evidence is integrated.
3. US1 can then be completed and accepted as the MVP. T005 precedes the trace and decision in T010.
4. US2 checks existing corrections and any new verified issue. T011 follows T010 when performance or other high findings need action.
5. US3 can start after the foundation; its sample report does not depend on US2, but final handoff waits for all desired stories.
6. T015–T016 run after changes and repeat checks. Keep `HamiSite-basic-structure-abi` open until its measurement and decision criteria are met.

### User Story Dependencies

- **US1 (P1)**: Starts after T003; independently useful to the owner.
- **US2 (P2)**: Starts after T003; T010 consumes US1's repeated performance evidence, while T008–T009 can proceed earlier.
- **US3 (P3)**: Starts after T001–T003; independently proves the contributor workflow.

### Parallel Opportunities

No checklist item is marked `[P]`: report integration shares `audit.md`, and this repository directs one agent to own the checkout. Independent read-only collection for T004 and T006 can be interleaved before their sequential report edits.

## Parallel Example: User Story 1

Collect the public-route observations for T004 and field-data availability for T006 independently, then integrate them into `specs/032-web-quality-audit/audit.md` one task at a time. T005 uses a separate stable production measurement session.

## Parallel Example: User Story 2

The link-name and smooth-scroll observations in T008 and T009 are independent browser checks. Record each in `specs/032-web-quality-audit/audit.md` sequentially; T010 waits for T005.

## Parallel Example: User Story 3

T012 can be reviewed while the US1 browser evidence is gathered because it edits `specs/032-web-quality-audit/quickstart.md`. Complete T013 before the contract comparison in T014.

## Implementation Strategy

### MVP First

Complete T001–T007, then independently review the public audit against SC-001 and SC-002. This delivers the evidence-based owner view before making additional performance changes.

### Incremental Delivery

After the MVP, complete T008–T011 for verified corrections and their repeat checks. Complete T012–T014 for the reusable contributor method, then T015–T016 for quality gates and handoff. Preserve the existing truthful catalog data, Persian RTL experience, and owner working-tree edits throughout.
