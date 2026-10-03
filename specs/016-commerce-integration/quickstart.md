# Quickstart: Catalog, Account and Admin Integration

**Feature**: `specs/016-commerce-integration`
**Date**: 2026-10-04

This is the implementation guide and validation walk for `016-commerce-integration`.

## Prerequisites

1. PostgreSQL is available and `.env` points to the intended development schema.
2. `.env.test` must point to a separate isolated test schema before API tests. It was absent when this feature was implemented, so do not run API test commands until an isolated schema is configured.
3. The development inventory before import was 0 products, 3 variants, 0 images, 3 categories and 3 brands. The current database contains the 189 products, 311 variants and 1,570 image rows in the reviewed source export, plus pre-existing taxonomy rows. The import reported 32 categories and 39 brands created and 189 products created on its first run.
4. For a fresh incomplete development database, run `npm run db:import-catalog` after reviewing the read-only counts. It matches by slug/name, creates missing catalog records, and never deletes records or overwrites populated product/business fields. Existing products may receive additive backfills for nullable fields that were empty. Do not run `db:fresh`, `db:reset`, or the full `db:seed` as a shortcut.

## Runtime Data Modules

- Public pages, API handlers, and catalog-derived server components use `lib/catalog-db.ts` and the asynchronous `*-db.ts` query helpers.
- `lib/catalog.ts` remains a synchronous legacy fixture for existing unit tests; it is not imported by application runtime code.
- Catalog import provenance is recorded in `CatalogImportMetadata`. Image bytes remain under the existing local media path; image references and primary-image metadata are stored in PostgreSQL.
- Purchase/cart, checkout, payment, order-submission and post-purchase customer flows are explicitly deferred.

## Validation Walk

### 1. Type and unit checks

```bash
npm run typecheck
npm run test:unit
```

Expected: no type errors; catalog serializers/query semantics, Persian filtering, DTO compatibility, category subtree counts, brand counts and account form behavior pass. Typecheck passed during implementation. Unit tests were not run.

### 2. Isolated API checks

```bash
npm run test -- tests/api/catalog.test.ts tests/api/auth-profile.test.ts tests/api/admin-catalog.test.ts
```

Run only after creating `.env.test` and verifying it is not the development schema. Expected: catalog GET routes read the database, admin catalog writes are visible on subsequent reads, role restrictions remain enforced, profile updates respect the existing whitelist, and error envelopes remain stable.

### 3. Local server and browser

Start one Next development server and confirm it owns the intended port before checking the UI. Open `/`, `/shop`, a category page, a brand page, a product detail, `/account`, and each admin route at 360 px and 1280 px.

Expected:

- The initial HTML contains database-backed catalog content without waiting for a client-only catalog fetch.
- Search, category/brand filters, sorting and pagination agree with the URL and result counts.
- Product and variant details, text, tags, images, prices and availability match database records; missing data stays visibly missing.
- The account page saves only supported profile fields and changes passwords through the existing session contract.
- Admin catalog edits, image selection, dashboard counts and record tables reflect persisted database values after refresh.
- Loading, empty, not-found, validation, conflict, authorization and service failure states are understandable in Persian RTL.
- No buyer cart, checkout, payment or post-purchase journey is used to claim completion for this feature.

### 4. Production build

Run `npm run build` only after checking for running `next-server`, `next dev` or `next start` processes. A build rewrites `.next`; restart the development server afterward before trusting browser results. Verify a page's referenced client chunk returns successfully, not only the HTML document.

## Safe Database Notes

- If the schema changes, use `npm run db:push` after reviewing generated changes; this repository has no complete Prisma migration baseline.
- Never use `db:reset` or `db:fresh` for this feature.
- Do not reseed the dev database blindly; prior runs can replace product history, carts and pricing tiers.
