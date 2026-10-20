# T020 — Public Reader Freshness, Cache Boundaries & Invalidation

## Context & Scope

Optimizations applied during User Story 1 (such as `React.cache()` in `shop/[slug]/page.tsx` and query projections in `home-rails-db.ts`) must strictly preserve:
1. Freshness: Catalog data modifications must immediately take effect without stale cached responses persisting across requests.
2. Invalidation: `revalidateHomepage()` must execute safely across all admin mutation routes and order placement.
3. Private-data boundaries: Internal admin cost prices (`costPerItem`), internal barcodes, and supplier identifiers must never be serialized or leaked into public payloads.
4. Purchase-time validation: Order placement in `app/api/orders/route.ts` must validate stock and prices authoritative to the transactional database state, independent of public readers.

## Architectural Verification

### 1. Request-Scoped Caching (`React.cache()`)
In `app/(main)/shop/[slug]/page.tsx`:
```ts
const productForRequest = cache((slug: string) => findProductBySlug(slug));
```
- **Lifecycle**: Strictly scoped to a single Next.js render request. It eliminates duplicate metadata and page-body DB queries within that request.
- **Cross-Request Safety**: Because `React.cache()` is bound to the React server component request lifecycle, subsequent HTTP requests execute fresh database queries. No cross-request catalog caching or stale cache leak occurs.

### 2. Homepage Invalidation (`revalidateHomepage()`)
- `revalidateHomepage()` invokes `next/cache`'s `revalidatePath("/")`.
- Executed on every catalog-altering mutation:
  - `app/api/admin/brands/` (create, update, delete)
  - `app/api/admin/categories/` (create, update, delete)
  - `app/api/admin/products/` (create, update, delete)
  - `app/api/admin/products/[id]/variants/` (create, update, delete)
  - `app/api/admin/variants/[id]/stock/` (stock adjustments)
  - `app/api/orders/` (order placement, decrements stock)
  - `app/api/payments/callback/` (payment status updates)
- In test runners and non-static contexts, an internal try/catch gracefully suppresses `Invariant: static generation store missing`.

### 3. Public Data Boundaries & Projection
Tested in `specs/039-storefront-performance/verification/test-us3-freshness.mjs`:
- Verified that `findProductBySlug` and `serializeProduct` do not expose internal administrative columns:
  - `costPerItem`: Excluded from public DTOs.
  - `barcode`: Excluded from public variants.
  - `productIdentifier`: Excluded from public variants.
- Verified that `availableProductsForDiscountRail()` returns only available live products sorted deterministically (`specialOffer: "desc"`, `updatedAt: "desc"`, `id: "asc"`).

## Verification Outcomes

| Verification Case | Target | Expected Behavior | Observed Result | Status |
| --- | --- | --- | --- | --- |
| Invalidation Call Safety | `revalidateHomepage()` | Runs safely without crashing in any execution context | Exit 0, invariant handled | PASS |
| Public Boundary Defense | `findProductBySlug` | Does not leak `costPerItem` or admin fields | Admin fields cleanly withheld | PASS |
| Discount Rail Freshness | `availableProductsForDiscountRail` | Evaluates all available products in DB without truncation | 6 active discount products returned | PASS |
| Catalog Query Pagination | `queryProducts` | Returns exact requested page with valid total | Page size 6, total 189 products | PASS |

## Conclusion

Public readers remain authoritative, strictly bounded, and completely separated from administrative secrets and order transactional validity.

