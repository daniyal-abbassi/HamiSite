# Tasks: Next.js Multi Design System (پشتیبانی از چند دیزاین سیستم)

**Feature**: `specs/028-nextjs-multi-design-system`  
**Status**: Ready for Implementation  

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Registry definitions, design tokens, and shared TypeScript types

- [x] T001 Define central Design System registry, keys (`default`, `comfort`, `glass`), classes (`style-nova`, `style-vega`, `style-glass`), and cookie helpers in `lib/design-system.ts`
- [x] T002 [P] Define Tailwind design system token variants and scoped theme rules in `app/globals.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core synchronization hooks and pre-paint bootstrap components

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Implement blocking inline bootstrap script component in `components/common/DesignSystemBootstrap.tsx` for zero-FOUC pre-paint execution
- [x] T004 [P] Implement client-side `useDesignSystem` hook for reading, persisting, and switching active design systems in `hooks/useDesignSystem.ts`
- [x] T005 [P] Write unit tests for registry mapping, cookie parsing, and fallback safety in `tests/unit/multi-design-system.test.ts`

**Checkpoint**: Foundation ready - design system registry, bootstrap script, and switching hooks available.

---

## Phase 3: User Story 1 - Style Isolation & Token Scoping (Priority: P1) 🎯 MVP

**Goal**: Clean isolation of multiple Design Systems through scoped root classes without style collision or variable leaks.

**Independent Test**: Load storefront pages, verify that exactly one `style-*` class exists on `body`, and inspect CSS variables confirming they derive strictly from the active theme scope.

### Implementation for User Story 1

- [x] T006 [P] [US1] Inject `DesignSystemBootstrap` into root layout `app/layout.tsx` and ensure server-rendered `body` applies active `style-*` class
- [x] T007 [P] [US1] Apply `style-*` class compatibility and verify background layers across route layouts in `app/(main)/layout.tsx`, `app/(admin)/layout.tsx`, and `app/(tma)/layout.tsx`
- [x] T008 [US1] Implement interactive `DesignSystemPicker` component in `components/common/DesignSystemPicker.tsx` allowing one-click theme switching
- [x] T009 [P] [US1] Add unit tests verifying single-class isolation and class cleanup rules in `tests/unit/multi-design-system.test.ts`

**Checkpoint**: At this point, User Story 1 is functional: design systems are cleanly isolated with zero class collisions.

---

## Phase 4: User Story 2 - SSR Persistence & FOUC Prevention (Priority: P1)

**Goal**: Instantaneous painting with the correct design system on hard refresh with zero FOUC and zero hydration mismatches.

**Independent Test**: Set a custom theme cookie/localStorage, perform hard reload, and verify that the initial HTML from the server contains the exact style class and renders without visual flash.

### Implementation for User Story 2

- [x] T010 [US2] Update `app/layout.tsx` Server Component to read `design-system-preview` cookie asynchronously and apply it to `<body>` on SSR
- [x] T011 [P] [US2] Update `DesignSystemBootstrap.tsx` with error-guarded pre-paint script that mirrors `localStorage` to cookies and updates `body.classList`
- [x] T012 [P] [US2] Write unit tests verifying SSR cookie parsing and localStorage fallback synchronization in `tests/unit/multi-design-system.test.ts`

**Checkpoint**: At this point, User Stories 1 and 2 operate seamlessly: SSR and client pre-paint eliminate FOUC completely.

---

## Phase 5: User Story 3 - Orthogonal Light/Dark Mode Coexistence (Priority: P2)

**Goal**: Color brightness mode (`light`/`dark`) lives on `<html>`, while Design System (`style-*`) lives on `<body>`, operating orthogonally without conflict.

**Independent Test**: Select each design system, toggle light/dark modes, and confirm that `style-*` remains unaffected on `<body>` while `dark`/`light` toggles on `<html>`.

### Implementation for User Story 3

- [x] T013 [US3] Ensure header theme toggle and dev tools respect orthogonal separation between `<html>` and `<body>` in `components/layout/Header.tsx`
- [x] T014 [P] [US3] Add mode preservation logic in `hooks/useDesignSystem.ts` when switching to/from dark-default design systems
- [x] T015 [P] [US3] Write unit tests verifying orthogonal light/dark coexistence and class preservation in `tests/unit/multi-design-system.test.ts`

**Checkpoint**: Design systems and light/dark modes operate independently without overwriting each other.

---

## Phase 6: User Story 4 - Isolated Component Previews & Iframe Synchronization (Priority: P2)

**Goal**: Embedded iframes render previews with their own isolated design systems and match the parent picker.

**Independent Test**: Load `/preview?style=comfort&embed=1` inside an iframe; verify that the preview document renders without site chrome and updates when parent style changes.

### Implementation for User Story 4

- [x] T016 [US4] Create dedicated preview page `app/(main)/preview/page.tsx` accepting `?style=...` and `?embed=1` query parameters
- [x] T017 [P] [US4] Implement `ComponentPreviewIframe` in `components/preview/ComponentPreviewIframe.tsx` with `key={activeStyle}` remounting
- [x] T018 [P] [US4] Write unit tests verifying preview URL parameter parsing and embed mode styling in `tests/unit/multi-design-system.test.ts`

**Checkpoint**: Component previews render in isolated iframes with full theme parity.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: System verification, regression check, and quality gates

- [x] T019 [P] Run full unit test suite with `npm run test:unit` and verify all tests pass
- [x] T020 Run strict TypeScript check with `npm run typecheck`
- [x] T021 Execute quickstart verification scenarios documented in `specs/028-nextjs-multi-design-system/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion - **BLOCKS all user stories**.
- **User Stories (Phase 3+)**: All depend on Phase 2 completion.
  - Phase 3 (US1 - Style Isolation & Registry): Starts immediately after Phase 2.
  - Phase 4 (US2 - SSR Persistence & FOUC): Depends on Phase 2 & Phase 3.
  - Phase 5 (US3 - Orthogonal Light/Dark): Can run alongside Phase 4.
  - Phase 6 (US4 - Component Preview & Iframe): Depends on Phase 3.
- **Polish (Phase 7)**: Depends on all user stories being complete.

### Parallel Opportunities

- Within Phase 1: `T002` can run in parallel with `T001`.
- Within Phase 2: `T003`, `T004`, and `T005` can run in parallel.
- Within Phase 3: `T006`, `T007`, and `T009` can run in parallel.
- Within Phase 4: `T011` and `T012` can run in parallel.
- Within Phase 5: `T014` and `T015` can run in parallel.
- Within Phase 6: `T017` and `T018` can run in parallel.

