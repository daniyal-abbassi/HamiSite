# Data Model: Storefront and Back-office Data Integration

**Feature**: `specs/016-commerce-integration`
**Date**: 2026-10-04

## Existing Persisted Entities

### Product

Existing Prisma model `Product` is the authoritative catalog record. It owns the stable database ID and unique route slug; descriptive and SEO fields; main and secondary categories; optional brand; display and comparison prices; offer dates; availability, stock and quantity rules; guarantee; and relations to variants, images, tags, pricing tiers and history.

**Required query behavior**: public listing/detail DTOs map from the same Product relation graph, filter unavailable records according to current storefront rules, and serialize Prisma Decimal/Date values to the established numeric/ISO API shapes.

**Expected additive field**: `descriptionText` when no lossless plain-text description is already persisted. Keep the existing `description` field for the current rich description.

`kind` and structured `specs` preserve the current homepage department counts and product specification table. These fields are nullable and filled from the reviewed source only when missing on an existing product.

### ProductVariant

Existing model `ProductVariant` belongs to exactly one Product. It stores color/storage, guarantee, price and comparison price, stock state and count, identifiers, default selection, image relation and tier prices.

**Expected additive field**: a structured `options` value to preserve arbitrary labeled variant attributes used by the existing product detail selector. Continue projecting known color/storage attributes into their existing fields for API consumers.

### ProductImage

Each image belongs to one product and stores its URL, alt text, default flag and display order. Variants may reference an image. The URL and image-selection metadata are database-owned; the referenced image bytes remain in the existing local media/mirror store.

### Category

Existing `Category` stores a unique slug, description, hierarchy, presentation metadata, availability/menu flags, order and level. Products can reference a main category and multiple secondary categories. Public category pages use descendant relationships for subtree listings/counts.

### Brand

Existing `Brand` stores its unique name and slug, image/SEO metadata, active flag and order. Product counts are derived from database relations rather than a stored JSON count.

### ProductTag

Existing tag rows belong to one product and preserve the storefront's product tags. A product's public DTO exposes these values as a list.

### User and Session

Existing `User` stores account identity, role, contact/profile fields and authorization state. `Session` stores only hashed session tokens, ownership and expiry. Customer profile writes remain limited to the editable fields in `docs/api/auth.md`; role, phone number, financial and verification state remain protected.

### Admin-managed records

Existing `Coupon`, `Order`, `OrderItem`, `Payment` and `ProductHistory` models back current admin coupon, order, reporting and audit surfaces. Admin order management stays in scope. Customer cart, order submission, payment initiation/callback and post-purchase tracking are excluded from this feature.

## Read DTOs (not persisted entities)

### Public Catalog Product

The public DTO is a serialized read view of Product, variants, image records, tags, brand and category. It retains the currently consumed fields including `id`, `name`, `englishName`, `slug`, `description`, `descriptionText`, `displayPrice`, `compareAtPrice`, `available`, `stock`, `stockType`, `specialOffer`, `brand`, `mainCategory`, `otherCategories`, `tags`, `images` and `variants`.

For variant options, store key/value labels losslessly and serialize them as the existing `{ label, value }[]` view. `displayPrice` and stock remain derived/serialized values, not duplicated authority.

### Category and Brand Views

Category/brand public views serialize database IDs and slugs, relation counts, image fields and SEO data. Counts are query-derived and must agree with the corresponding destination page's subtree/filter semantics.

## Identity and Lifecycle Rules

- Database IDs identify records in database relations. Public URLs continue to use unique slugs.
- JSON export IDs are migration input only and are not assumed to match database IDs.
- Category and brand references are validated before product writes; existing relation restrictions on delete remain enforced.
- Product updates, variant changes, stock changes and image selection must retain existing admin authorization and history/audit behavior.
- Deleting a product must follow existing order/cart/history relation safety; reconciliation must never cascade-delete business history.
- Missing public records become not-found/empty states, not synthetic catalog rows.
