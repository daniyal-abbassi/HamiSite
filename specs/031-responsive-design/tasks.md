# Tasks: Responsive Design Audit & Mobile Standards

**Feature**: `specs/031-responsive-design`  
**Status**: Ready for Implementation  

---

## Phase 1: Setup (Shared Infrastructure & Types)

**Purpose**: Responsive definitions, breakpoint tokens, and test scaffold

- [x] T001 [P] Create breakpoint definitions and responsive contracts in `types/responsive-design.ts`
- [x] T002 [P] Create automated responsive layout test scaffold in `tests/unit/responsive-design.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Global CSS rules, viewport configurations, and safe area insets

**⚠️ CRITICAL**: Must complete before user story remediation

- [x] T003 Verify `viewportFit: "cover"` and responsive meta rules in `app/layout.tsx`
- [x] T004 [P] Verify `overflow-x: hidden` and safe-area utilities in `app/globals.css`

**Checkpoint**: Foundation ready - global layout constraints configured.

---

## Phase 3: User Story 1 - Zero Horizontal Overflow on Narrow Screens (Priority: P1) 🎯 MVP

**Goal**: Guarantee zero horizontal scrolling and prevent flex container blowouts on 320px–390px screens.

**Independent Test**: Load storefront pages at 320px and 360px viewports; verify `scrollWidth <= clientWidth` and confirm no horizontal scrollbar exists.

### Implementation for User Story 1

- [x] T005 [P] [US1] Verify flex item truncation and `min-w-0` safety across storefront navigation and product cards
- [x] T006 [P] [US1] Ensure responsive container padding (`px-4 sm:px-6 lg:px-8`) across layouts
- [x] T007 [P] [US1] Add unit tests verifying zero overflow rules and flex truncation in `tests/unit/responsive-design.test.ts`

**Checkpoint**: Zero horizontal overflow is achieved across compact screens.

---

## Phase 4: User Story 2 - Mobile Touch Targets & Hit Area Resilience (Priority: P1)

**Goal**: Every interactive mobile button, tab, and modal trigger meets the 44×44px touch target standard.

**Independent Test**: Measure touch targets of mobile dock items, cart triggers, and dialog close icons; confirm hit areas measure $\ge 44\times 44\text{px}$.

### Implementation for User Story 2

- [x] T008 [P] [US2] Verify `min-h-[44px]` touch target compliance on `components/layout/MobileDock.tsx`
- [x] T009 [P] [US2] Verify `size-11` (44px) tap size on `components/layout/CartButton.tsx` and modal close triggers
- [x] T010 [P] [US2] Add unit tests verifying minimum touch target dimensions in `tests/unit/responsive-design.test.ts`

**Checkpoint**: Touch target compliance meets WCAG 2.5.5 / 2.5.8 standards.

---

## Phase 5: User Story 3 - CSS Logical Properties & RTL Fluidity (Priority: P2)

**Goal**: Enforce CSS logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) for seamless RTL reflow.

**Independent Test**: Audit UI components; verify that directional spacing classes adhere strictly to logical inline naming.

### Implementation for User Story 3

- [x] T011 [P] [US3] Verify logical margins and paddings across navigation and shared card components
- [x] T012 [P] [US3] Verify logical positioning (`start-*`, `end-*`) for badges and floating elements
- [x] T013 [P] [US3] Add unit tests asserting logical properties in `tests/unit/responsive-design.test.ts`

**Checkpoint**: Layouts reflow natively and predictably in RTL mode.

---

## Phase 6: Polish & Quality Gates

**Purpose**: System verification and final validation

- [x] T014 [P] Run full unit test suite with `npm run test:unit`
- [x] T015 Run strict TypeScript check with `npm run typecheck`
- [x] T016 Update `specs/031-responsive-design/tasks.md` with completion status

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 - blocks user stories.
- **User Stories (Phases 3-5)**: Can proceed sequentially or in parallel once Phase 2 completes.
- **Polish (Phase 6)**: Depends on all user stories being completed.

