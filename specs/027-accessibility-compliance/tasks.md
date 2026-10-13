# Tasks: WCAG 2.2 Accessibility Compliance (دسترس‌پذیری و استاندارد WCAG)

**Feature**: `specs/027-accessibility-compliance`  
**Status**: Completed  

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Global focus styling tokens, reduced-motion rules, and shared accessibility types

- [x] T001 Configure global `:focus-visible` ring indicators, scroll clearance margins, and `prefers-reduced-motion` utility rules in `app/globals.css`
- [x] T002 [P] Define TypeScript types for accessible component props and audit entities in `types/accessibility.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core accessibility hooks and components required across all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Implement reusable `useFocusTrap` hook with initial focus transfer, Escape listener, focus trapping, and trigger return in `hooks/useFocusTrap.ts`
- [x] T004 [P] Implement accessible high-contrast `SkipLink` component targeting `#main` in `components/common/SkipLink.tsx`
- [x] T005 [P] Write unit tests for `useFocusTrap` hook and focus trapping logic in `tests/unit/useFocusTrap.test.ts`

**Checkpoint**: Foundation ready - skip link and focus trap infrastructure available for integration.

---

## Phase 3: User Story 1 - Keyboard Navigation, Focus Visibility & Skip Links (Priority: P1) 🎯 MVP

**Goal**: Full keyboard navigation across storefront and admin views with visible skip links, natural RTL tab order, and prominent `:focus-visible` outlines.

**Independent Test**: Load storefront and admin views, press `Tab` to confirm the «پرش به محتوای اصلی» skip link appears and transfers focus to `#main`, and navigate through links/buttons confirming high-contrast focus rings on every element.

### Implementation for User Story 1

- [x] T006 [P] [US1] Inject `SkipLink` into root storefront layout `app/layout.tsx` and ensure main content landmark container has `id="main"` with `tabIndex={-1}`
- [x] T007 [P] [US1] Inject `SkipLink` and `#main` landmark container into TMA layout `app/(tma)/layout.tsx`
- [x] T008 [US1] Update storefront header navigation in `components/layout/Header.tsx` to ensure tab order follows natural RTL order and interactive elements have visible `:focus-visible` rings
- [x] T009 [P] [US1] Write unit tests verifying skip link presence and landmark attributes in `tests/unit/accessibility-compliance.test.ts`

**Checkpoint**: At this point, User Story 1 is functional: keyboard users can bypass repetitive navigation and clearly track focus across all pages.

---

## Phase 4: User Story 2 - Accessible Dialogs, Drawers & Focus Trapping (Priority: P1)

**Goal**: All modal overlays and slide-overs trap keyboard focus, dismiss on `Escape`, announce titles to screen readers, and restore focus to triggers on close.

**Independent Test**: Open the Partner Application modal in `/admin/partners` or bundle editor. Press `Tab` to verify focus remains strictly trapped inside, press `Escape` to close, and verify focus returns to the button that opened it.

### Implementation for User Story 2

- [x] T010 [US2] Integrate `useFocusTrap`, `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` into `components/admin/partners/PartnerApplicationModal.tsx`
- [x] T011 [P] [US2] Integrate `useFocusTrap` and Escape key dismissal into bundle editor modal in `components/admin/bundles/BundleFormModal.tsx`
- [x] T012 [P] [US2] Integrate accessible dialog semantics and focus restoration into mobile drawer navigation in `components/admin/AdminSidebar.tsx`
- [x] T013 [P] [US2] Write unit tests for modal focus trapping, Escape key closing, and focus restoration in `tests/unit/dialog-accessibility.test.ts`

**Checkpoint**: At this point, User Stories 1 and 2 work together: all interactive dialogs and navigation drawers are fully keyboard and screen reader accessible.

---

## Phase 5: User Story 3 - Screen Reader Semantics, Labels & Persian Form Validation (Priority: P2)

**Goal**: Every icon-only button has an unambiguous Persian accessible name, images have descriptive alt texts, and form validation errors announce via live regions.

**Independent Test**: Inspect the accessibility tree for storefront header buttons (search, cart, menu), verify Persian `aria-label` values are spoken, and submit invalid form inputs verifying `aria-invalid="true"` and live `role="alert"` announcements.

### Implementation for User Story 3

- [x] T014 [US3] Audit and add Persian `aria-label` tags and `aria-hidden="true"` on all icon-only buttons in `components/layout/Header.tsx` (search toggle, cart toggle, menu toggle)
- [x] T015 [P] [US3] Add Persian `aria-label` tags to icon buttons in admin views and tables in `components/admin/partners/PartnersAdminClient.tsx` and `components/admin/AdminSidebar.tsx`
- [x] T016 [P] [US3] Update partner application form in `components/partners/PartnerForm.tsx` to ensure all fields have explicit `<label htmlFor="...">`, `aria-invalid="true"`, and live region announcements (`role="alert"`, `aria-live="polite"`)
- [x] T017 [P] [US3] Ensure storefront product cards in `components/shop/ProductCard.tsx` (and catalog rails) provide descriptive Persian `alt` text on images and accessible action names
- [x] T018 [P] [US3] Write unit tests verifying icon button labels and form error ARIA relationships in `tests/unit/accessibility-compliance.test.ts`

**Checkpoint**: Core storefront and admin interfaces provide complete screen reader accessibility and form error descriptions.

---

## Phase 6: User Story 4 - Contrast, Touch Target Sizing & Reduced Motion Support (Priority: P2)

**Goal**: Text contrast meets WCAG AA ratios (>= 4.5:1), touch targets on mobile meet 44×44px, and animations gracefully deactivate when `prefers-reduced-motion` is active.

**Independent Test**: Measure touch target dimensions on mobile, inspect contrast ratios on muted text and status badges, and enable `prefers-reduced-motion: reduce` in DevTools to verify all animation loops deactivate.

### Implementation for User Story 4

- [x] T019 [US4] Audit and adjust color contrast ratios for muted secondary text and badges in `components/admin/partners/PartnerStatusBadge.tsx` and `app/globals.css`
- [x] T020 [P] [US4] Ensure mobile interactive controls meet minimum 44×44px touch targets in `components/layout/MobileDock.tsx` and mobile navigation headers
- [x] T021 [P] [US4] Implement reduced motion checks in motion hooks and GSAP timelines across animated hero/rail components so animations gracefully deactivate when `prefers-reduced-motion: reduce` is active
- [x] T022 [P] [US4] Write unit tests verifying reduced motion behavior and touch target sizing rules in `tests/unit/accessibility-compliance.test.ts`

**Checkpoint**: All 4 user stories are fully satisfied and compliant with WCAG 2.2 Level AA.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: System verification, quality gates, and end-to-end validation

- [x] T023 [P] Run full test suite with `npm run test:unit` and verify all tests pass
- [x] T024 Run strict TypeScript check with `npm run typecheck`
- [x] T025 Execute end-to-end quickstart validation scenarios documented in `specs/027-accessibility-compliance/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion - **BLOCKS all user stories**.
- **User Stories (Phase 3+)**: All depend on Phase 2 completion.
  - Phase 3 (US1 - Keyboard Navigation & Skip Links): Starts immediately after Phase 2.
  - Phase 4 (US2 - Accessible Dialogs & Trapping): Depends on Phase 2 & Phase 3.
  - Phase 5 (US3 - Screen Reader Labels & Form Errors): Can run alongside Phase 4.
  - Phase 6 (US4 - Contrast, Touch Targets & Motion): Can run alongside Phase 5.
- **Polish (Phase 7)**: Depends on all user stories being complete.

### Parallel Opportunities

- Within Phase 1: `T002` can run in parallel with `T001`.
- Within Phase 2: `T003`, `T004`, and `T005` can run in parallel.
- Within Phase 3: `T006`, `T007`, and `T009` can run in parallel after `T008`.
- Within Phase 4: `T011`, `T012`, and `T013` can run in parallel.
- Within Phase 5: `T015`, `T016`, `T017`, and `T018` can run in parallel.
- Within Phase 6: `T020`, `T021`, and `T022` can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 & Foundational)
1. Complete Phase 1 (Setup: global `:focus-visible` styles and types).
2. Complete Phase 2 (Foundational: `useFocusTrap` hook and `SkipLink` component).
3. Complete Phase 3 (US1: Root skip links and keyboard navigation across layouts).
4. **Validate MVP**: Tab through `/` and `/admin` using only keyboard.

### Incremental Delivery
1. Add Phase 4 (US2: Dialog focus traps in `PartnerApplicationModal` and drawers).
2. Add Phase 5 (US3: Persian `aria-label` tags, image alt text, and form error alerts).
3. Add Phase 6 (US4: Contrast, 44×44px touch targets, and `prefers-reduced-motion`).
4. Run Phase 7 (Quality gates: unit tests, typecheck, quickstart verification).
