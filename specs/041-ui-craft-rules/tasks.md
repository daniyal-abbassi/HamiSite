# Tasks: UI Craft Rules & Quality Enhancement (041-ui-craft-rules)

**Input**: Feature specification from `specs/041-ui-craft-rules/spec.md` and design artifacts from `specs/041-ui-craft-rules/plan.md`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and craft auditing scaffolding

- [X] T001 Create craft tools directory structure in `tools/craft/`
- [X] T002 [P] Register `ui-craft-rules` agent constraint block and 35-item Done Checklist in `AGENTS.md` and `CLAUDE.md`
- [X] T003 [P] Add craft audit rule definitions and regex patterns in `tools/craft/rules.mjs`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core scanning utilities and CSS tokens that MUST be complete before component hardening

**⚠️ CRITICAL**: No user story component modifications can begin until this phase is complete

- [X] T004 Implement JSON schema validator in `tools/craft/validate-audit.mjs` asserting conformance with `specs/041-ui-craft-rules/contracts/craft-rules-schema.json`
- [X] T005 [P] Implement core file scanning and token analysis engine in `tools/craft/scanner.mjs`
- [X] T006 [P] Verify touch target helpers (`extend-touch-target`, 44px min-h/min-w) and reduced motion utilities in `app/globals.css`

**Checkpoint**: Foundation ready — user story hardening can now begin

---

## Phase 3: User Story 1 — Storefront UI Craft, Touch Targets & Layout Stability (Priority: P1) 🎯 MVP

**Goal**: Audit and harden primary storefront components against arbitrary styling, ensure minimum 44×44px touch targets on all interactive elements, and eliminate layout shift with explicit `aspect-ratio` reservations.

**Independent Test**: Running `node tools/craft/audit.mjs --scope components/layout` and `components/shop` confirms >= 44×44px touch targets on all interactive buttons, zero missing image aspect ratios, and zero horizontal overflow at 360px viewport.

- [X] T007 [US1] Audit and harden touch targets on Header navigation, cart button, and mobile menu triggers in `components/layout/Header.tsx` and `components/layout/CartButton.tsx` (>= 44×44px hit area)
- [X] T008 [P] [US1] Audit and harden touch targets and aspect ratios on Product Cards in `components/shop/ProductCard.tsx` (`aspect-square`, 44px action buttons)
- [X] T009 [P] [US1] Audit and harden touch targets and filter chips in `components/shop/FilterSidebar.tsx` and `components/shop/ShopResultControls.tsx` (eliminate arbitrary pixel values, ensure 44px min tap area)
- [X] T010 [P] [US1] Audit and enforce `aspect-ratio` space reservation on Homepage featured rails and hero media in `components/home/FeaturedProducts.tsx` and `app/(main)/page.tsx`
- [X] T011 [US1] Verify mobile responsive behavior at 360px, 375px, 390px (zero horizontal overflow, zero layout shift)

**Checkpoint**: At this point, User Story 1 is complete and delivers an independent, high-value visual quality increment on touch and layout stability.

---

## Phase 4: User Story 2 — Typography Scale, Semantic Color & Layout-Matched Skeletons (Priority: P2)

**Goal**: Align typography to a disciplined ~6-step scale with role-based Persian line heights, replace hardcoded colors with semantic theme tokens, balance icon strokes, and implement layout-matched skeleton loaders.

**Independent Test**: Inspecting product detail, listing views, and loading states confirms strict ~6-step type scale, Persian body line heights at 1.7–1.9, semantic token usage, and layout-matched skeleton rendering during async loading.

- [X] T012 [US2] Audit and align storefront typography with the 6-step type scale and role-based Persian line heights (1.7–1.9 body, 1.2–1.4 headings, 0 letter-spacing) in `components/shop/ProductDetail.tsx` and `components/shop/ShopResults.tsx`
- [X] T013 [P] [US2] Audit and replace hardcoded hex colors with semantic tokens (`bg-background`, `text-foreground`, `border-border`, `bg-card`) across shop components
- [X] T014 [P] [US2] Audit and align Lucide icon stroke weights (1.5 for regular body text, 2 for bold headings) and verify RTL directional icon behavior
- [X] T015 [US2] Implement layout-matched skeleton loading states for product rails and grid views in `components/shop/ShopResults.tsx`

**Checkpoint**: At this point, User Stories 1 and 2 work together to deliver consistent luxury aesthetics and polished typography across all storefront views.

---

## Phase 5: User Story 3 — Automated UI Craft Auditing & Agent Quality Guardrails (Priority: P3)

**Goal**: Provide a fast, repeatable CLI scanner (`tools/craft/audit.mjs`) that automatically detects arbitrary Tailwind values, missing aspect ratios, and touch target risks, and enforce production isolation for debug UI.

**Independent Test**: Running `node tools/craft/audit.mjs` executes in < 5 seconds and returns a clean pass conforming to `contracts/craft-rules-schema.json`.

- [X] T016 [US3] Implement full diagnostic craft scanner in `tools/craft/audit.mjs` supporting `--scope`, `--json`, and `--fail-on-error`
- [X] T017 [P] [US3] Ensure development and debug panels (if any) are gated with `process.env.NODE_ENV !== "production"`
- [X] T018 [US3] Execute `tools/craft/audit.mjs` across `components/` and `app/`, verifying zero error-level craft violations

**Checkpoint**: All three user stories are complete, proven, and protected by automated guardrails.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation guides, and repository handoff

- [X] T019 [P] Document craft review summary and audit findings in `specs/041-ui-craft-rules/evidence/audit-summary.md`
- [X] T020 Run end-to-end quickstart validation scenarios from `specs/041-ui-craft-rules/quickstart.md`
- [X] T021 Run full quality gates (`npm run typecheck`, `npm run test:unit` 608/608 tests, `git diff --check`)
- [X] T022 Reconcile tasks.md, update Beads issue tracking, and prepare clean handoff summary

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Setup (Phase 1) -> Foundational (Phase 2)
                         │
                         ▼
        User Story 1 (Phase 3: Touch & Layout Stability) [MVP]
                         │
                         ▼
        User Story 2 (Phase 4: Typography, Colors & Skeletons)
                         │
                         ▼
        User Story 3 (Phase 5: Automated Scanner & Guardrails)
                         │
                         ▼
        Polish & Handoff (Phase 6)
```

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational utilities (T004-T006). Can be deployed and verified as standalone MVP without touching typography or scanner tooling.
- **User Story 2 (P2)**: Depends on US1 layout baseline. Refines typographic hierarchy, semantic colors, and loading states.
- **User Story 3 (P3)**: Depends on US1/US2 rules. Provides the automated scanner and CLI gating.

### Parallel Opportunities

- In Phase 1: T002 (agent instructions) and T003 (rules definitions) can be implemented in parallel.
- In Phase 2: T004 (schema validator) and T005 (scanner engine) can be implemented in parallel.
- In Phase 3: Component hardening tasks T008 (ProductCard), T009 (FilterSidebar), and T010 (FeaturedProducts) can be executed in parallel.
- In Phase 4: T013 (semantic colors) and T014 (icon weights) can be executed in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Setup (Phase 1) and Foundational (Phase 2).
2. Complete User Story 1 (Phase 3).
3. **STOP and VALIDATE**: Verify 44×44px touch targets on mobile viewports (360px–390px) and confirm zero layout shift.

### Incremental Delivery
1. Step 1: Deliver touch target and layout stability hardening (US1).
2. Step 2: Deliver typography scale, semantic colors, and layout-matched skeletons (US2).
3. Step 3: Implement automated audit tool (`tools/craft/audit.mjs`) (US3).
4. Step 4: Run quality gates and hand off cleanly (Polish).

