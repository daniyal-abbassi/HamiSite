# Implementation Plan: Storefront and Back-office Data Integration

**Branch**: `016-commerce-integration` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/016-commerce-integration/spec.md`

## Summary

Use PostgreSQL/Prisma as the runtime source of truth for the public catalog, customer account/profile surfaces and the existing admin surfaces. Replace JSON-backed catalog reads and writes with one asynchronous server-side data layer, retaining the current public response shape and server-rendered first response. Move catalog CRUD and dashboard summaries to Prisma, add a customer profile surface over existing auth/profile endpoints, and preserve the current Persian RTL visual system. The customer cart-to-payment and post-purchase flow remains a separate feature.

Before changing the runtime source, inventory the existing database and reconcile catalog coverage without resetting or blindly reseeding it. Extend the Prisma schema only for catalog fields the current UI needs but the database cannot represent (notably free-form variant options and separate plain-text product description). Keep local image binaries as static assets while their catalog metadata is persisted in Prisma.

## Technical Context

**Language/Version**: TypeScript 5.5; Node.js 20 types; React 19.2.8

**Primary Dependencies**: Next.js 15.5.25 App Router, Prisma 5.20, PostgreSQL, Zod, Tailwind CSS 3.4; no new runtime dependency planned

**Storage**: Existing PostgreSQL database and Prisma models. Local mirrored/uploaded image files remain on disk; product, variant, image-reference, category and brand metadata lives in PostgreSQL.

**Testing**: Vitest. Use `npm run test:unit`, targeted API tests only with `.env.test` pointing at an isolated test schema, `npm run typecheck`, browser checks at 360 px and 1280 px, and a production build only with the Next server/build-directory precautions in `CLAUDE.md`.

**Target Platform**: Same-origin Next.js web application, server-rendered public pages and authenticated admin/client surfaces.

**Project Type**: Single web application with App Router frontend, route handlers and shared server-side libraries.

**Performance Goals**: Keep the initial catalog content in the server-rendered response. Do not add a browser fetch solely to populate the initial catalog view. Apply filtering, sorting and pagination in the database where practical; retain Persian text matching behavior and avoid fetching unrelated records for ordinary pages.

**Constraints**: Preserve current API paths, response envelopes and visible DTO fields where possible. Keep auth sessions same-origin and httpOnly. Do not run `db:fresh`, `db:reset`, or `db:seed` blindly. This repository has no Prisma migration baseline; use `db:push` only for reviewed additive schema changes, and keep `.env` and `.env.test` on separate schemas. Keep the shopper purchase flow out of scope.

**Scale/Scope**: Public product, category and brand listing/detail surfaces; homepage catalog rails and category/brand counts; customer registration/login/session/profile/password surfaces; existing admin dashboard and catalog, image, coupon, user and order management surfaces. The checked-in export has 189 products, 39 brands and 32 categories; actual database coverage must be measured before cutover.

## Constitution Check

**Pre-design gate**

- **I. Honest Interface — PASS**: Read authoritative database values and keep missing price, image and availability visibly unknown; do not synthesize claims.
- **II. Persian RTL — PASS**: Keep Persian-first copy, logical layout and existing localized value formatting.
- **III. Static Data Seam — OWNER-APPROVED FEATURE EXCEPTION**: On 2026-10-04 the owner specified that the database is the catalog source of truth and approved all existing catalog, account/profile and admin surfaces. This revises the current requirement that public browsing use JSON and freezes `app/api/**`. The implementation must update Principle III and its version before code changes are committed; the same-origin session design and the explicit purchase-path exclusion remain in force.
- **IV. Premium Design Quality — PASS**: Preserve the existing storefront/back-office direction; design the new account and data/error states to match it.
- **Stack / reference boundaries — PASS**: Keep Next.js App Router, TypeScript and Prisma; do not use `docs/inspires/` as runtime code or data plumbing.

**Post-design gate**

- The shared database data layer is additive and reuses the current app; no new service or dependency is required.
- The design retains the JSON response contract for existing consumers while using database primary keys and relations. Missing database catalog content is handled by a scoped import/reconciliation step, not a destructive reset or general seed run.
- Only the catalog metadata needed to represent the existing UI may be added to Prisma. Schema changes are additive and use `db:push` after the environment has been verified.
- Customer cart, checkout, order-submission, payment and post-purchase surfaces remain out of scope; no purchase-path success claim or acceptance gate is added.

## Project Structure

### Documentation (this feature)

```text
specs/016-commerce-integration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    ├── catalog.md
    └── account-admin.md
```

### Source Code (repository root)

```text
app/
├── (main)/
│   ├── account/                       # New profile and password-management surface
│   ├── page.tsx                        # Database-backed homepage rails/counts
│   ├── shop/                           # Database-backed listing and product detail
│   ├── categories/[slug]/              # Database-backed category listing
│   └── brands/[slug]/                  # Database-backed brand listing
├── (admin)/admin/                      # Existing admin UI; keep paths and presentation
└── api/
    ├── products/, categories/, brands/ # Existing public contracts, Prisma-backed reads
    ├── auth/                            # Existing session/profile contracts
    └── admin/                           # Prisma-backed catalog mutations and summaries

components/
├── auth/                               # Existing registration/login; shared account state
├── admin/                              # Existing CRUD clients and image manager
├── home/                               # Existing catalog rails and category/brand modules
├── layout/UserMenu.tsx                 # Account/profile entry point
└── shop/                               # Existing product, category, brand and listing views

lib/
├── catalog-db.ts                       # Async Prisma queries and DTO mapping used by runtime
├── catalog.ts                          # Legacy synchronous fixture helper; no application runtime imports it
├── prisma.ts                            # Existing shared Prisma client
├── serializers.ts                      # Shared numeric/date/stock serialization as needed
├── category-departments-db.ts           # Resolve curated departments against database records/counts
├── home-rails-db.ts                     # Async database-backed homepage queries
├── brand-counts-db.ts                   # Database-backed brand counts
├── shop-query-db.ts                     # Database-backed listing query
└── shop-category-tiles-db.ts            # Database-backed category tiles

prisma/
├── schema.prisma                        # Additive catalog fields only if the UI contract needs them
└── legacy-import/                       # Reuse mappings where safe; do not run the full seed workflow

tests/
├── api/                                 # Catalog/account/admin contract and authorization coverage
└── unit/                                # Query, serializer and URL/filter behavior
```

**Structure Decision**: Keep a single Next.js project. Public Server Components and API route handlers call shared async data-access functions directly; browser components continue to call same-origin APIs only for interactive account/admin operations. This avoids an extra server-to-self HTTP hop on the initial catalog render and prevents duplicate query semantics.

## Implementation Progress

- Constitution Principle III amended to record the user-approved database source of truth, catalog API/admin scope, additive reconciliation rule and deferred customer purchase path.
- Read-only development inventory completed: before reconciliation, the database had 0 products, 3 variants, 0 images, 3 categories and 3 brands.
- Added optional Prisma fields for `Product.kind`, `Product.descriptionText`, `ProductVariant.options`, plus import provenance for the source snapshot timestamp. Applied through `db:push` after confirming `.env` targeted the development `public` schema; `.env.test` is absent.
- Added and ran `prisma/legacy-import/catalog.ts`. Initial run created 32 missing categories, 39 missing brands, 189 products, and their 311 variants/1,570 image references. A second run made no creates and only backfilled missing optional product fields; the importer is repeatable and does not overwrite populated records.
- Public catalog APIs/pages, catalog-derived homepage helpers, admin catalog/dashboard APIs and the customer account surface now use Prisma-backed data. Production runtime catalog imports use `lib/catalog-db.ts` and the `*-db.ts` helpers; the synchronous `lib/catalog.ts` remains only for legacy test fixtures. Buyer purchase APIs remain outside this feature.
- `npm run typecheck` and `git diff --check` pass. Test suites and browser checks were not run; `.env.test` is absent, and the repository instructions prohibit using the development database for tests.

## Phase 0: Research

Completed findings and decisions are recorded in [research.md](./research.md). The database coverage inventory is a required first implementation gate because the checked-in JSON export may contain catalog rows absent from the current database.

## Phase 1: Design & Contracts

- Existing persisted entities and the minimal additive schema surface are described in [data-model.md](./data-model.md).
- Public catalog and account/admin route behavior is documented in [contracts/catalog.md](./contracts/catalog.md) and [contracts/account-admin.md](./contracts/account-admin.md).
- The safe database setup and validation walk is in [quickstart.md](./quickstart.md).

## Implementation Sequence for `/speckit-tasks`

1. Amend Principle III to record the approved database source of truth, approved API/catalog-admin scope, safe data reconciliation rule and deferred customer purchase path.
2. Run read-only inventory and coverage checks for the current dev database against expected catalog categories, brands, products, variants and images. Do not reset or reseed.
3. Add a scoped, idempotent catalog import/reconciliation path only for missing or incomplete records; preserve existing order/cart/history relations and report unmatched source rows. Verify representative media and arbitrary variant attributes.
4. Add the smallest additive Prisma fields required to preserve current product description and arbitrary variant option data; generate the client and apply with `db:push` only after confirming the active schema.
5. Implement a shared asynchronous Prisma catalog query/serialization layer. Preserve Persian search normalization, product visibility/availability rules, route slugs, image mirrors, and current listing/detail DTO fields.
6. Move public product, category and brand route handlers to the shared database layer without changing paths, envelopes, query keys, pagination metadata or storefront semantics.
7. Move all public Server Component readers and catalog-derived homepage utilities to async database calls: home rails, shop results/facets/tiles, category and brand pages/counts, product metadata/detail/related products and currency freshness metadata.
8. Repoint admin product, category, brand, catalog-image and dashboard endpoints from JSON reads/writes to Prisma. Keep existing auth/RBAC, validation and response contracts; store catalog image metadata on records while leaving file bytes on the existing media path.
9. Add a customer `/account` surface for the already-supported editable profile fields and password change; link it from the authenticated user menu. Keep registration, login, logout and session behavior on the existing same-origin contract.
10. Review runtime imports and preserve the purchase/cart/checkout/payment exclusion. Typecheck and whitespace checks are complete; isolated API tests and browser checks remain follow-up verification because `.env.test` is absent.

## Complexity Tracking

No additional service or runtime dependency is proposed. The feature touches several existing consumers because the catalog module is currently synchronous and JSON-backed; a shared async data layer is the simplest way to keep server pages, public routes and admin reads consistent.
