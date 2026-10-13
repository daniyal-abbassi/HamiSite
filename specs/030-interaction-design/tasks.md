# Tasks: Interaction Design Standards & Polish

**Feature**: `specs/030-interaction-design`  
**Status**: Ready for Implementation  

---

## Phase 1: Setup (Shared Infrastructure & Types)

**Purpose**: Interaction token definitions, shared types, and test scaffold

- [x] T001 [P] Create interaction design configuration and state types in `types/interaction-design.ts`
- [x] T002 [P] Create automated interaction test scaffold in `tests/unit/interaction-design.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core interaction tokens, timing variables, and natural easings

**⚠️ CRITICAL**: Must complete before user story remediation

- [x] T003 Define standard timing tokens (`--duration-instant`, `--duration-normal`) and cubic-bezier easings in `app/globals.css`
- [x] T004 [P] Verify touch-action and active highlight suppression across mobile touch layers in `app/globals.css`

**Checkpoint**: Foundation ready - interaction tokens and timing available for components.

---

## Phase 3: User Story 1 - Tactile Microinteractions & State Lifecycles (Priority: P1) 🎯 MVP

**Goal**: Guarantee instant tactile physical feedback ($\le 100\text{ms}$ active scale), complete 6-state coverage, and keyboard trigger parity.

**Independent Test**: Click/tap buttons and interactive chips; verify `active:scale-[0.98]` physical compression occurs within $\le 100\text{ms}$ without layout displacement.

### Implementation for User Story 1

- [x] T005 [P] [US1] Apply unified tactile active depression (`active:scale-[0.98]`) and transitions to `components/common/DesignSystemPicker.tsx`
- [x] T006 [P] [US1] Ensure complete interactive state coverage (`default`, `hover`, `active`, `focus-visible`, `disabled`) on CTA and shop buttons
- [x] T007 [P] [US1] Add unit tests verifying active state scaling and duration boundaries in `tests/unit/interaction-design.test.ts`

**Checkpoint**: Tactile microinteractions and physical press feedback are active.

---

## Phase 4: User Story 2 - Fluid Transitions & Modal Motion Choreography (Priority: P2)

**Goal**: Surface transitions follow natural easing curves (200–300ms) and animate only compositor properties (`transform` and `opacity`).

**Independent Test**: Open and close modal dialogs; confirm animation durations do not exceed 300ms and animate exclusively compositor properties.

### Implementation for User Story 2

- [x] T008 [P] [US2] Verify and align modal entrance/exit transitions in `components/admin/partners/PartnerApplicationModal.tsx` to 250ms ease-out
- [x] T009 [P] [US2] Ensure modal bundle form transitions in `components/admin/bundles/BundleFormModal.tsx` follow standard duration bounds
- [x] T010 [P] [US2] Add unit tests verifying transition duration limits and compositor properties in `tests/unit/interaction-design.test.ts`

**Checkpoint**: Transitions are fluid, compositor-friendly, and maintain 60fps.

---

## Phase 5: User Story 3 - Async Operation Feedback & Optimistic UI Updates (Priority: P2)

**Goal**: Immediate visual loading indicators for async actions (within 100ms) and responsive cart additions.

**Independent Test**: Trigger form submissions and cart updates; confirm spinner/disabled state renders within 100ms to block duplicate submissions.

### Implementation for User Story 3

- [x] T011 [P] [US3] Verify CartButton badge update feedback and non-blocking state in `components/layout/CartButton.tsx`
- [x] T012 [P] [US3] Ensure partner submission and bundle forms disable buttons with spinners during async calls
- [x] T013 [P] [US3] Add unit tests verifying async loading disabled states in `tests/unit/interaction-design.test.ts`

**Checkpoint**: Async feedback is instantaneous and protects against duplicate clicks.

---

## Phase 6: Polish & Quality Gates

**Purpose**: System verification and final validation

- [x] T014 [P] Run full unit test suite with `npm run test:unit`
- [x] T015 Run strict TypeScript check with `npm run typecheck`
- [x] T016 Update `specs/030-interaction-design/tasks.md` with completion status

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 - blocks user stories.
- **User Stories (Phases 3-5)**: Can proceed sequentially or in parallel once Phase 2 completes.
- **Polish (Phase 6)**: Depends on all user stories being completed.

