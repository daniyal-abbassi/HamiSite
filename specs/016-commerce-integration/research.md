# Research: Storefront and Back-office Data Integration

**Feature**: `specs/016-commerce-integration`
**Date**: 2026-10-04

## Findings

### R1 — The runtime catalog is currently a JSON seam

`lib/catalog.ts` reads `data/hami-products.json` synchronously and maps it to the public product DTO. `app/api/products`, `app/api/products/[slug]`, `/api/categories` and `/api/brands` also use that seam. Server-rendered pages and helpers (`shop-query`, `home-rails`, category/brand pages, department counts, related products and metadata) import the same module directly.

**Decision**: Replace the runtime catalog read path with shared asynchronous Prisma queries and DTO mapping. Server Components and route handlers call that layer directly; do not populate the initial page via a browser fetch or a server-to-self HTTP call.

**Alternatives considered**: Continue to use the JSON export (rejected because the owner selected the database); fetch the existing public API from Server Components (rejected because it adds an HTTP hop while duplicating a server-side call within the same app).

### R2 — Admin catalog writes currently diverge from the database

Product, brand, category and catalog-image admin endpoints use `updateCatalog` / `readCatalogSync`; admin product pages also resolve slugs through the JSON catalog. The admin dashboard mixes database order/user counts with JSON catalog counts and reports its catalog source as JSON. Coupons, users, order management, variants and reports already use Prisma in their route handlers.

**Decision**: Repoint the JSON-backed admin routes and dashboard to existing Prisma models, preserving their current route paths, auth/RBAC, validation and response shapes. Leave admin screens that are already database-backed on their current endpoints.

**Alternatives considered**: Maintain two writable sources and synchronize after every edit (rejected because the database is the chosen source of truth); redesign all admin endpoints and UI (rejected because compatible endpoint shapes make a bounded migration possible).

### R3 — The database model needs to preserve current catalog detail

`Product`, `ProductVariant`, `ProductImage`, `ProductTag`, `Category` and `Brand` already store most catalog fields. The current public DTO also exposes separate plain-text product description and arbitrary variant option groups. The relational schema has one product description and variant `color`/`storage` fields, so it cannot directly preserve all current JSON fields without a small additive schema change or an equivalent lossless representation.

**Decision**: Preserve current visible product detail by adding only the missing fields identified at implementation time (currently `Product.descriptionText` and structured `ProductVariant.options` are expected). Use an additive Prisma change and the repository-required `db:push` workflow; do not create a migration baseline or reset data.

**Alternatives considered**: Drop arbitrary variant option labels or derive all plain text from HTML (rejected because those lose current storefront content); add a separate table for every option key/value (not selected because current values are flexible catalog attributes and the existing schema already uses compact records).

### R4 — Database population must be non-destructive

The checked-in export contains 189 products, 39 brands and 32 categories. `prisma/seed.ts` can import data from the legacy service but may also recreate sample users and other records. Repository guidance warns that reseeding can destroy B2B pricing tiers, carts and product history. The actual local database inventory has not been inspected in this planning turn.

**Decision**: Make read-only database counts and catalog coverage the first implementation gate. If records are absent, add a scoped idempotent catalog reconciliation/import that does not reset unrelated tables or overwrite order/cart/history data. Match category, brand and product records using stable slugs and produce a report for ambiguous/unmatched rows before cutover.

**Alternatives considered**: Run `db:fresh`, `db:reset` or the complete seed immediately (rejected as destructive and unnecessary); silently display an empty database catalog (rejected because it would hide a data migration failure).

### R5 — Product images use a DB reference plus local mirrors

Product and variant image metadata exists in Prisma. The frontend uses local mirrored primary images for reliability; `data/catalog-images.json` currently maps export IDs to mirrored asset paths, while admin uploads save bytes under the catalog media path and JSON image metadata.

**Decision**: Keep local image files as an optimization/storage concern, move image metadata and primary-image selection into Prisma, and resolve mirror assets using a stable source identity rather than assuming export IDs equal database IDs. Do not use the JSON export as runtime product metadata.

**Alternatives considered**: Remove local mirrors and fetch every remote image (rejected due documented upstream latency/failure); store image binaries in PostgreSQL (rejected because existing media storage is already established and binary persistence is not part of the requested source-of-truth decision).

### R6 — Account APIs exist; a profile management page does not

The current same-origin auth API supports `GET/PATCH /api/auth/me` and `POST /api/auth/change-password`; the existing frontend has login/register and shared session state but no account/profile management route. Editable profile fields and read-only fields are pinned in `docs/api/auth.md` and `lib/schemas/auth.ts`.

**Decision**: Add `/account` using the existing API contract, expose only allowed profile fields, and link it from the signed-in menu. Do not change session cookies, authentication rules, or the unsupported password-reset/OTP scope.

### R7 — Constitution III must reflect this owner-approved scope

The current constitution requires the JSON catalog seam and freezes `app/api/**`, while this feature explicitly selects the database source of truth and all current catalog/account/admin surfaces. The owner has authorized that functional scope on 2026-10-04.

**Decision**: The implementation work must update Principle III and increment the constitution version before code is committed. Keep same-origin auth, honest data presentation and the explicit buyer purchase-flow exclusion. The constitution's rule to obtain owner approval before committing an amendment remains in force.

## Open Implementation Checks

- Read-only development inventory on 2026-10-04: 0 products, 3 variants, 0 product images, 3 categories and 3 brands. The checked-in export contains 189 products, 311 variants, 1,570 images, 32 categories and 39 brands. A scoped, additive import is required before runtime cutover; do not reset or run the general seed.
- The inventory read only aggregate counts and did not display connection credentials or modify records.
- The export has unique category and brand names and no duplicate non-empty variant barcode/SKU values, so those can be used for conservative matching during import.
- Confirm every public and admin consumer has been moved off runtime JSON reads before removing `lib/catalog-store` from runtime imports.
- Preserve Persian search normalization and current product image presentation while moving filters and counts to Prisma.
- Keep `.env.test` on a schema distinct from the dev `.env`; API test setup truncates tables.
