# Tasks: Web Interface Guidelines Compliance & Audit

**Feature**: `specs/029-web-interface-guidelines`  
**Status**: Ready for Implementation  

---

## Phase 1: Setup (Shared Infrastructure & Test Scaffold)

**Purpose**: Establish audit definitions, testing helpers, and shared guideline rules

- [x] T001 [P] Create guideline rule validator contracts and types in `types/web-interface-guidelines.ts`
- [x] T002 [P] Create initial automated test scaffold in `tests/unit/web-interface-guidelines.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core global CSS and HTML root requirements for Web Interface Guidelines

**⚠️ CRITICAL**: Must complete before user story remediation

- [x] T003 Verify and enhance global focus-visible and touch-action rules in `app/globals.css`
- [x] T004 [P] Ensure root html/body viewport-fit and color-scheme dark mode parity in `app/layout.tsx`

**Checkpoint**: Core CSS variables and global interaction rules conform to guidelines.

---

## Phase 3: User Story 1 - Form Interactivity, Labeling & Non-Blocking Inputs (Priority: P1) 🎯 MVP

**Goal**: Guarantee that all form inputs have accessible labels, never intercept paste events, focus invalid fields on submit, and provide disabled/loading states.

**Independent Test**: Focus inputs in `/partners`, `/login`, and `/checkout`; verify clicking labels focuses inputs, paste functions freely, and submit buttons disable with loading indicators.

### Implementation for User Story 1

- [x] T005 [P] [US1] Audit and verify form input labeling and autocomplete attributes in `components/partners/PartnerApplicationModal.tsx`
- [x] T006 [P] [US1] Ensure submit button loading states and disabled prevention during async requests in `components/admin/bundles/BundleFormModal.tsx`
- [x] T007 [P] [US1] Add unit tests verifying unblocked paste handlers and label associations in `tests/unit/web-interface-guidelines.test.ts`

**Checkpoint**: Form interactions and inputs are fully unblocked, accessible, and resilient.

---

## Phase 4: User Story 2 - Keyboard Traversal & Focus States (Priority: P1)

**Goal**: Every interactive button, link, and modal control displays a visible focus indicator without hidden outlines or sticky chrome occlusion.

**Independent Test**: Navigate with keyboard `Tab`; verify visible `:focus-visible` styling on all controls and confirm `scroll-margin-top/bottom` prevents overlap under header/dock.

### Implementation for User Story 2

- [x] T008 [P] [US2] Remediate bare `outline-none` in `components/ui/badge.tsx` with high-contrast `:focus-visible` styling
- [x] T009 [P] [US2] Verify sticky header and mobile dock scroll margins in `app/globals.css` and `components/layout/Header.tsx`
- [x] T010 [P] [US2] Add unit tests verifying focus-visible presence and lack of bare `outline-none` in `tests/unit/web-interface-guidelines.test.ts`

**Checkpoint**: Keyboard focus visibility is verified across all UI components.

---

## Phase 5: User Story 3 - Media Dimensions & CLS Elimination (Priority: P1)

**Goal**: Ensure all images specify explicit dimensions or aspect ratios, use lazy loading below the fold, and hide decorative icons.

**Independent Test**: Inspect image tags and icons in storefront layouts; verify zero layout shift on cold load and `aria-hidden="true"` on decorative icons.

### Implementation for User Story 3

- [x] T011 [P] [US3] Verify explicit aspect ratios and image dimensions on catalog cards in `components/products/`
- [x] T012 [P] [US3] Ensure all decorative SVG/Lucide icons have `aria-hidden="true"` across `components/layout/`
- [x] T013 [P] [US3] Add unit tests verifying media dimensions and icon hiding in `tests/unit/web-interface-guidelines.test.ts`

**Checkpoint**: Media assets render with zero CLS and complete assistive technology compliance.

---

## Phase 6: User Story 4 - Motion Resilience & Compositor Transitions (Priority: P2)

**Goal**: Replace unbounded `transition-all` declarations on layout properties and enforce `prefers-reduced-motion` compliance.

**Independent Test**: Emulate `prefers-reduced-motion: reduce`; verify all animations and transitions degrade to instant or opacity-only changes.

### Implementation for User Story 4

- [x] T014 [P] [US4] Replace unbounded `transition-all` with targeted transitions (`transition-colors`, `transition-transform`) across key components
- [x] T015 [P] [US4] Audit and verify reduced motion overrides in `app/globals.css`
- [x] T016 [P] [US4] Add unit tests verifying motion resilience and transition properties in `tests/unit/web-interface-guidelines.test.ts`

**Checkpoint**: Motion is compositor-friendly and vestibular-safe.

---

## Phase 7: Polish & Quality Gates

**Purpose**: System verification and final validation

- [x] T017 [P] Run full unit test suite with `npm run test:unit`
- [x] T018 Run strict TypeScript check with `npm run typecheck`
- [x] T019 Update `specs/029-web-interface-guidelines/tasks.md` with completion status

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 - blocks user stories.
- **User Stories (Phases 3-6)**: Can proceed sequentially or in parallel once Phase 2 completes.
- **Polish (Phase 7)**: Depends on all user stories being completed.

