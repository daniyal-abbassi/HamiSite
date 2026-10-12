# Tasks: B2B Partner Bundles (سبد کالای اختصاصی همکاران)

**Feature**: `specs/025-b2b-partner-bundles`
**Status**: Ready for Implementation

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize type definitions and shared utilities for the feature

- [X] T001 Define TypeScript types and interfaces for partner bundles in `types/bundles.ts`
- [X] T002 [P] Create initial helper module skeleton for bundle queries and calculations in `lib/bundles.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database schema and data access layers that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Update `prisma/schema.prisma` with `PartnerBundle`, `PartnerBundleItem`, and relations on `CartItem` and `OrderItem`
- [X] T004 Apply database schema updates using `npx prisma db push` and regenerate Prisma client with `npx prisma generate`
- [X] T005 [P] Implement core bundle database query, serialization, and savings computation functions in `lib/bundles.ts`
- [X] T006 [P] Write unit tests for bundle serialization and savings calculations in `tests/unit/bundles.test.ts`

**Checkpoint**: Foundation ready - data layer and schema ready for user story implementation

---

## Phase 3: User Story 1 - Admin Defines and Publishes a Partner Bundle (Priority: P1) 🎯 MVP

**Goal**: Store administrators can assemble promotional bundles, choose products with custom quantities, set package price and limited quota, and publish them via the admin back-office.

**Independent Test**: An admin logs into `/admin/bundles`, creates a new bundle with 2 products (quantities: 5 and 2), sets price to 3,000,000 Toman and quota to 10, saves, and verifies the bundle is stored with active status.

### Implementation for User Story 1

- [X] T007 [P] [US1] Create Zod input validation schemas for admin bundle create/update in `lib/schemas/admin-bundles.ts`
- [X] T008 [P] [US1] Implement `GET` (list with pagination/search) and `POST` (create bundle with constituent items) in `app/api/admin/bundles/route.ts`
- [X] T009 [P] [US1] Implement `GET` (single), `PATCH` (update), and `DELETE` (delete) in `app/api/admin/bundles/[id]/route.ts`
- [X] T010 [US1] Implement Admin Bundle management table, search, and active status toggle in `app/(admin)/admin/bundles/page.tsx`
- [X] T011 [US1] Build Admin multi-product selector and bundle editor form modal in `components/admin/bundles/BundleFormModal.tsx`
- [X] T012 [P] [US1] Write unit tests for Admin Bundle API route handlers in `tests/unit/admin-bundles-api.test.ts`

**Checkpoint**: At this point, User Story 1 is fully functional and administrators can create, edit, and manage partner bundles.

---

## Phase 4: User Story 2 - Wholesale Partner Discovers and Views Exclusive Bundles (Priority: P1)

**Goal**: Authenticated wholesale partners (`Role.WHOLESALE` and `Role.AGENT`) can discover and view active bundles with package price, remaining stock countdown, item breakdown, and savings inside their portal, while public/retail users are strictly blocked.

**Independent Test**: An authenticated wholesale partner navigates to `/partners/bundles` and views active bundles, while a retail user or guest visiting the same route receives 403 Forbidden or redirect.

### Implementation for User Story 2

- [X] T013 [P] [US2] Implement role-gated `GET` endpoint for wholesale partners in `app/api/partners/bundles/route.ts` and `app/api/partners/bundles/[slug]/route.ts`
- [X] T014 [P] [US2] Create luxury partner bundle card component with savings badge, item pills, and remaining stock indicator in `components/partners/bundles/PartnerBundleCard.tsx`
- [X] T015 [US2] Build Partner Bundle showcase page at `app/(main)/partners/bundles/page.tsx` with role checking and redirect for non-partners
- [X] T016 [US2] Add navigation entry to "سبدهای ویژه همکار" in wholesale header and account navigation in `components/layout/Header.tsx` and `components/account/AccountNav.tsx`
- [X] T017 [P] [US2] Write unit tests for Partner Bundle API access control and role gating in `tests/unit/partner-bundles-api.test.ts`

**Checkpoint**: User Stories 1 and 2 work independently. Partners can see exclusive bundles that retail users cannot access.

---

## Phase 5: User Story 3 - All-or-Nothing Bundle Purchase and Synchronized Inventory Settlement (Priority: P1)

**Goal**: Partners can purchase an entire bundle in full as an indivisible package with instant cash/gateway settlement, automatically decrementing both the bundle quota and constituent physical warehouse stocks.

**Independent Test**: A partner adds a bundle to their cart, completes checkout via online cash payment, and the system atomically decrements the bundle quota by 1 and each constituent product's base stock by its bundle multiplier.

### Implementation for User Story 3

- [X] T018 [US3] Update `app/api/cart/items/route.ts` and `lib/cart.ts` to support atomic `bundleId` line items with locked constituent item snapshot
- [X] T019 [US3] Update `components/providers/CartProvider.tsx`, `components/cart/CartDrawer.tsx`, and `components/cart/CartLine.tsx` to display bundle packages without individual item deletion
- [X] T020 [US3] Update `app/api/orders/route.ts` to enforce `paymentTerm: "CASH"`, validate dual stock, decrement bundle and constituent products in transaction, and record bundle in order line items
- [X] T021 [P] [US3] Write unit and integration tests for cart bundle addition and order placement with dual stock deduction in `tests/unit/bundle-orders.test.ts`

**Checkpoint**: At this point, the complete purchase cycle works end-to-end with transaction integrity.

---

## Phase 6: User Story 4 - Depleted and Inactive Bundle Protection (Priority: P2)

**Goal**: Prevent overselling and protect store inventory by marking depleted bundles as «تکمیل ظرفیت», disabling checkout when constituent physical stock runs out, and restoring stock if an order is canceled.

**Independent Test**: When a bundle quota reaches 0, its badge switches to «تکمیل ظرفیت» and purchase is disabled; canceling an order restores both bundle quota and constituent product stocks.

### Implementation for User Story 4

- [X] T022 [US4] Update partner showcase UI and API to calculate real-time availability across both bundle quota and constituent warehouse stocks, rendering «تکمیل ظرفیت» when depleted in `lib/bundles.ts` and `components/partners/bundles/PartnerBundleCard.tsx`
- [X] T023 [US4] Update `applyOrderStatusTransition` in `lib/orders.ts` to restore both bundle stock and constituent variant stocks when an order transitions to `CANCELED`, `FAILED`, or `REVERSED`
- [X] T024 [P] [US4] Add tests verifying out-of-stock rejection (409 Conflict) and order cancellation stock reversal in `tests/unit/bundle-orders.test.ts`

**Checkpoint**: All user stories are functional and edge cases (stock depletion, race conditions, cancellation recovery) are safeguarded.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: System verification, quality gates, and end-to-end validation

- [X] T025 [P] Run full test suite with `npm run test:unit` and verify all tests pass
- [X] T026 Run strict TypeScript check with `npm run typecheck`
- [X] T027 Execute end-to-end validation scenarios documented in `specs/025-b2b-partner-bundles/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion - **BLOCKS all user stories**.
- **User Stories (Phase 3+)**: All depend on Phase 2 completion.
  - Phase 3 (US1 - Admin Bundle Creation) can start immediately after Phase 2.
  - Phase 4 (US2 - Partner Showcase) can start after Phase 2 (reads bundles created by US1).
  - Phase 5 (US3 - Cart & Dual Settlement) depends on Phase 2 & Phase 3.
  - Phase 6 (US4 - Depletion & Restock) depends on Phase 5.
- **Polish (Phase 7)**: Depends on all user stories being complete.

### Parallel Opportunities

- Within Phase 1: `T002` can run alongside `T001`.
- Within Phase 2: `T005` and `T006` can run in parallel after `T004`.
- Within Phase 3: `T007`, `T008`, `T009`, and `T012` can run in parallel.
- Within Phase 4: `T013`, `T014`, and `T017` can run in parallel.
- Within Phase 5: `T021` tests can run in parallel once endpoint logic is drafted.

---

## Implementation Strategy

### MVP First (User Story 1 & Foundational)
1. Complete Phase 1 (Setup) and Phase 2 (Foundational: Prisma schema and DB push).
2. Complete Phase 3 (US1: Admin creates and manages bundles).
3. **Validate MVP**: Admin can create and list multi-item bundles in `/admin/bundles`.

### Incremental Delivery
1. Add Phase 4 (US2: Wholesale partners view exclusive bundles at `/partners/bundles`).
2. Add Phase 5 (US3: Indivisible cart addition and checkout with dual stock decrement).
3. Add Phase 6 (US4: Sold out handling and restock on cancellation).
4. Run Phase 7 (Quality gates: unit tests, typecheck, quickstart validation).

