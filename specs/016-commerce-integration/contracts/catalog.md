# Catalog Contracts

**Feature**: `specs/016-commerce-integration`
**Date**: 2026-10-04

All routes remain same-origin and retain the standard response envelope documented by `docs/api/auth.md`:

```ts
type ApiSuccess<T> = { success: true; data: T; meta?: Record<string, unknown> };
type ApiFailure = { success: false; error: { message: string; code: string; details?: unknown } };
```

The source changes to PostgreSQL/Prisma. Existing public consumers keep the current response fields and query semantics unless an explicit later spec changes them.

## Public Catalog

### `GET /api/products`

- Public; no authentication required.
- Query keys: `q`, `brandId`, `categoryId`, `stockType`, `specialOffer`, `minPrice`, `maxPrice`, `sort`, `page`, `pageSize`, `includeVariants`.
- Returns the current public product DTO and pagination metadata (`page`, `pageSize`, `total`, `hasNextPage`).
- Public product DTOs omit procurement and fulfillment identifiers (`costPerItem`, variant `barcode`, `productIdentifier`, and internal `imageId`). Those fields are available only from role-protected admin catalog routes.
- Search retains Persian normalization. Filters and counts operate on database IDs and category subtree/brand semantics consistent with destination pages.

### `GET /api/products/[slug]`

- Public; no authentication required.
- Resolves one product offered by the storefront under its unique database-backed slug; out-of-stock and contact-for-price records remain visible according to current storefront rules.
- Returns the same public product DTO shape as the listing where applicable; missing products return the existing not-found error envelope.

### `GET /api/categories?tree=true`

- Public; no authentication required.
- Returns current category records, optionally nested by parent, preserving the existing row fields and tree metadata.

### `GET /api/brands`

- Public; no authentication required.
- Returns active/current brand rows, ordered according to existing storefront semantics, with database-derived product counts.

## Admin Catalog

Existing admin paths and response envelopes remain stable:

- `/api/admin/products` and `/api/admin/products/[id]` — list, create, read, update and delete products.
- `/api/admin/products/[id]/variants` and nested variant paths; `/api/admin/variants/[id]/stock` — variant and stock management.
- `/api/admin/categories` and `/api/admin/categories/[id]` — category tree and CRUD.
- `/api/admin/brands` and `/api/admin/brands/[id]` — brand CRUD.
- `/api/admin/catalog-images` — multipart image upload and primary/remove actions; record metadata is persisted in Prisma while file bytes use the established media store.
- `/api/admin/dashboard` and `/api/admin/reports/summary` — database-derived inventory and business summaries.

Every admin route retains `Role.ADMIN` authorization, existing validation and conflict/not-found behavior. The API contract may evolve only to correct fields necessary for a coherent database DTO, with matching admin client updates and explicit coverage.

## Explicitly Unchanged for This Feature

Customer cart, checkout, order creation, payment initiation/callback and post-purchase order routes are not implementation or acceptance targets here. The user-facing purchase journey will receive its own spec.
