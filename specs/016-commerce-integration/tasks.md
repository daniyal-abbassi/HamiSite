---
description: "Task list for storefront and back-office database integration"
---

# Tasks: Storefront and Back-office Data Integration

**Input**: Design documents in `specs/016-commerce-integration/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: No test tasks included; the user has not requested tests or verification.

## Phase 1: Setup

**Purpose**: Record the approved source-of-truth change and establish safe database facts.

- [X] T001 Amend Principle III and constitution version for approved Prisma catalog source, API scope, safe reconciliation, and deferred purchase path in `.specify/memory/constitution.md`
- [X] T002 Inventory development database catalog counts and compare stable slugs against `data/hami-products.json` without writes in `scripts/` or `prisma/legacy-import/`
- [X] T003 Record inventory gaps and safe reconciliation decisions in `specs/016-commerce-integration/research.md`

## Phase 2: Foundational

**Purpose**: Represent current catalog data losslessly and provide one shared database read layer.

- [X] T004 Add only required description, kind, product specs, variant option, and import provenance fields in `prisma/schema.prisma`
- [X] T005 Implement safe idempotent catalog reconciliation for missing records in `prisma/legacy-import/catalog.ts` (preserves orders, carts, product history, and existing unrelated records)
- [X] T006 Add shared Prisma catalog DTO serializers and query functions in `lib/catalog-db.ts`
- [X] T007 Convert catalog-derived helpers to asynchronous database reads in `lib/home-rails-db.ts`, `lib/category-departments-db.ts`, `lib/brand-counts-db.ts`, and `lib/shop-query-db.ts`

## Phase 3: User Story 1 - Browse current catalog information (Priority: P1)

**Goal**: Public API and server-rendered storefront pages consistently reflect Prisma catalog records.

**Independent Test**: Compare product, category, brand and listing records against database rows; verify URL search/filter/sort/pagination behavior and removed-record states.

### Implementation

- [X] T008 [US1] Move product list and detail API handlers to shared Prisma catalog queries in `app/api/products/route.ts` and `app/api/products/[slug]/route.ts`
- [X] T009 [US1] Move category and brand public API handlers to database-backed serializers in `app/api/categories/route.ts` and `app/api/brands/route.ts`
- [X] T010 [US1] Convert homepage and catalog rail server readers to asynchronous database data in `app/(main)/page.tsx`, `components/home/`, and `lib/home-rails-db.ts`
- [X] T011 [US1] Convert shop listing, product detail, metadata and related-item readers to asynchronous database queries in `app/(main)/shop/`
- [X] T012 [US1] Convert category and brand pages and counts to database-backed records in `app/(main)/categories/[slug]/page.tsx` and `app/(main)/brands/[slug]/page.tsx`
- [X] T013 [US1] Remove runtime catalog JSON reads from client/server catalog consumers in `components/shop/` and `lib/`

## Phase 4: User Story 2 - Manage an account and profile (Priority: P1)

**Goal**: Customers can manage supported persisted profile details and passwords using existing sessions.

**Independent Test**: Sign in, update allowed fields, refresh to confirm persistence, change password, and sign out; confirm guests can still browse.

### Implementation

- [X] T014 [US2] Add responsive Persian RTL profile and password forms using existing auth APIs in `app/(main)/account/`
- [X] T015 [US2] Add authenticated account navigation entry in `components/layout/UserMenu.tsx`
- [X] T016 [US2] Handle expired sessions, field validation, email conflicts and API failures in `app/(main)/account/`

## Phase 5: User Story 3 - Maintain back-office records (Priority: P1)

**Goal**: Existing authorized admin pages read and mutate PostgreSQL records with confirmed outcomes.

**Independent Test**: As an admin, read and update product, variant, category, brand, image, coupon, user and order records; refresh and confirm persisted values and role restrictions.

### Implementation

- [X] T017 [US3] Move product list/create/detail/update/delete and variant handlers to Prisma in `app/api/admin/products/` and `app/api/admin/variants/`
- [X] T018 [US3] Move category and brand CRUD handlers to Prisma in `app/api/admin/categories/` and `app/api/admin/brands/`
- [X] T019 [US3] Persist catalog image metadata and primary/remove actions in Prisma while retaining media file storage in `app/api/admin/catalog-images/route.ts`
- [X] T020 [US3] Derive dashboard inventory counts and source labels from Prisma in `app/api/admin/dashboard/route.ts`
- [X] T021 [US3] Update admin product/detail readers and clients for database DTOs in `app/(admin)/admin/`, `components/admin/`, and `types/store.ts`
- [X] T022 [US3] Keep existing database-backed coupon, user, order, variant and report surfaces connected without changing customer purchase routes in `app/api/admin/`

## Phase 6: Polish and Cross-Cutting Concerns

**Purpose**: Complete integration documentation and review the resulting change set.

- [X] T023 Reconcile implementation notes, safe database instructions and exclusions in `specs/016-commerce-integration/quickstart.md` and `specs/016-commerce-integration/plan.md`
- [X] T024 Review runtime catalog imports and admin writes for JSON-store dependencies; verify customer purchase-path files remain outside the feature in `app/` and `lib/`
- [X] T025 Update the code knowledge graph after source changes with `graphify update .`

## Dependencies and Execution Order

- Setup must complete before schema changes or catalog cutover. Database inventory gates reconciliation and cutover.
- Foundational tasks precede user stories. T004 precedes T005/T006; T006 and T007 precede public catalog routes and pages.
- User Stories 1, 2 and 3 can progress independently after the shared foundation, except admin product clients depend on the shared DTO shape.
- Polish follows all implementation work.

## Parallel Opportunities

- After T002, documentation task T003 can be completed independently of code design.
- Once the foundation is ready, account UI work T014-T016 is independent of catalog and admin implementation.
- Admin category/brand work and image metadata work touch separate route trees and can be developed independently after shared data conventions are settled.

## Implementation Strategy

Complete the database inventory and shared catalog foundation first, then deliver public browsing as the first MVP. Add account/profile and admin flows on the existing auth and admin APIs. Do not include customer cart, checkout, payment, order submission or post-purchase work.
