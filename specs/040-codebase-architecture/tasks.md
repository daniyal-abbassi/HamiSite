# Tasks: Codebase Architecture Diagnostic & Deepening (040-codebase-architecture)

**Input**: Feature specification from `specs/040-codebase-architecture/spec.md` and design artifacts from `specs/040-codebase-architecture/plan.md`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and diagnostic tool scaffolding

- [X] T001 Create architecture tools directory structure in `tools/architecture/` and `tools/architecture/templates/`
- [X] T002 [P] Implement git commit churn analyzer in `tools/architecture/git-hotspots.mjs` to identify frequently modified files from `git log`
- [X] T003 [P] Implement self-contained HTML report template with Tailwind CDN and Mermaid CDN in `tools/architecture/templates/report.html.mjs`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core validation and architectural analysis utilities that MUST be complete before candidate detection

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Implement report schema validator in `tools/architecture/validate-report.mjs` asserting conformance with `specs/040-codebase-architecture/contracts/report-schema.json`
- [X] T005 [P] Implement architectural heuristics (deletion test, seam adapter counter, interface surface analyzer) in `tools/architecture/metrics.mjs`
- [X] T006 Initialize domain vocabulary baseline in `GLOSSARY.md` (defining `Module`, `Interface`, `Depth`, `Seam`, `Adapter`, `Leverage`, `Locality`)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Architectural Scan & Visual Deepening Report (Priority: P1) 🎯 MVP

**Goal**: Inspect recent codebase hotspots, identify shallow modules and leaking seams, and produce a self-contained visual HTML report in the OS temp directory with side-by-side Before/After diagrams.

**Independent Test**: Running `node tools/architecture/scan.mjs` generates a valid HTML file at `<tmpdir>/architecture-review-<timestamp>.html` containing at least 3 distinct deepening candidates with Before/After Mermaid diagrams, without modifying the git working directory.

- [X] T007 [US1] Implement main scanner CLI in `tools/architecture/scan.mjs` integrating hotspot detection and candidate analysis
- [X] T008 [P] [US1] Implement candidate analyzer for catalog query & discount projections in `lib/catalog-db.ts` and `lib/home-rails-db.ts`
- [X] T009 [P] [US1] Implement candidate analyzer for session/cart provider boundary & state leakage in `components/providers/AuthProvider.tsx` and `CartProvider.tsx`
- [X] T010 [P] [US1] Implement candidate analyzer for catalog filter controls & search in `components/shop/FilterSidebar.tsx` and `ShopResults.tsx`
- [X] T011 [US1] Implement HTML report generation in `tools/architecture/scan.mjs` outputting to `$TMPDIR/architecture-review-<timestamp>.html` with visual legend and top recommendation card
- [X] T012 [US1] Execute diagnostic scan, validate report against `specs/040-codebase-architecture/contracts/report-schema.json`, and verify offline visual rendering in browser

**Checkpoint**: At this point, User Story 1 is complete and delivers an independent, high-value visual architectural diagnostic report.

---

## Phase 4: User Story 2 — Architectural Grilling & Domain Alignment (Priority: P2)

**Goal**: Provide an interactive grilling decision tree for candidate deepening opportunities, evaluating constraints and seams, syncing domain concepts in `GLOSSARY.md`, and recording decisions in `docs/adr/`.

**Independent Test**: Running `node tools/architecture/grill.mjs --candidate <id>` presents interactive evaluation prompts, updates `GLOSSARY.md` upon approval, or writes an ADR draft in `docs/adr/` upon rejection.

- [X] T013 [US2] Implement interactive grilling CLI in `tools/architecture/grill.mjs` evaluating the deletion test and verifying adapter justification
- [X] T014 [P] [US2] Implement automated `GLOSSARY.md` term updater in `tools/architecture/grill.mjs` for approved domain concepts
- [X] T015 [P] [US2] Implement ADR draft generator in `tools/architecture/grill.mjs` saving permanent architectural decisions to `docs/adr/`
- [X] T016 [US2] Execute grilling evaluation on top recommended candidate and record decisions

**Checkpoint**: At this point, User Stories 1 and 2 work together to review and ratify architectural changes before any code is modified.

---

## Phase 5: User Story 3 — Targeted Deepening Execution & Quality Verification (Priority: P3)

**Goal**: Safely execute approved deepening refactorings, transforming shallow pass-through modules into deep modules with simple interfaces and robust test surfaces, maintaining 100% test passing and visual fidelity.

**Independent Test**: Applying approved deepening refactorings reduces caller interface surface area while passing `npm run typecheck`, `npm run test:unit` (608/608 tests), and real browser checks.

- [X] T017 [US3] Implement approved deepening refactoring on selected module (consolidating shallow helpers into deep module with simple interface)
- [X] T018 [US3] Simplify caller call sites, removing redundant multi-step orchestration and verifying high locality
- [X] T019 [US3] Run automated quality gates (`npm run typecheck`, `npm run test:unit`, `git diff --check`) verifying zero regressions in business logic

**Checkpoint**: All three user stories are complete, proven, and verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation guides, and repository handoff

- [X] T020 [P] Document architectural review summary and deepening outcomes in `specs/040-codebase-architecture/evidence/review-summary.md`
- [X] T021 Run end-to-end quickstart validation scenarios from `specs/040-codebase-architecture/quickstart.md`
- [X] T022 Reconcile tasks.md, update Beads issue tracking, and prepare clean handoff summary

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Setup (Phase 1) -> Foundational (Phase 2)
                         │
                         ▼
        User Story 1 (Phase 3: Scan & HTML Report) [MVP]
                         │
                         ▼
        User Story 2 (Phase 4: Grilling & Domain Sync)
                         │
                         ▼
        User Story 3 (Phase 5: Deepening & Quality Gates)
                         │
                         ▼
        Polish & Handoff (Phase 6)
```

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational utilities (T004-T006). Can be deployed and verified as standalone MVP without modifying application code.
- **User Story 2 (P2)**: Depends on US1 candidate output. Operates as an interactive governance layer.
- **User Story 3 (P3)**: Depends on US2 grilling approval. Modifies targeted source code and validates against quality gates.

### Parallel Opportunities

- In Phase 1: T002 (git analyzer) and T003 (HTML template) can be created in parallel.
- In Phase 2: T004 (schema validator) and T005 (metrics) can be developed in parallel.
- In Phase 3: Candidate analyzers T008, T009, and T010 target different subsystems and can be developed in parallel.
- In Phase 4: T014 (`GLOSSARY.md` updater) and T015 (ADR generator) can be developed in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Setup (Phase 1) and Foundational (Phase 2).
2. Complete User Story 1 (Phase 3).
3. **STOP and VALIDATE**: Run `node tools/architecture/scan.mjs` and open the generated HTML report. Confirm that Before/After diagrams and candidate cards render cleanly.
4. User/owner inspects the candidates visually before proceeding to code changes.

### Incremental Delivery
1. Step 1: Deliver visual diagnostic report (US1).
2. Step 2: Conduct grilling loop and ratify domain terms / ADRs (US2).
3. Step 3: Implement approved deepening with zero regression (US3).
4. Step 4: Final quality gates and handoff (Polish).

