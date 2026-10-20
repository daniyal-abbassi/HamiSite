# T012 — Catalog Query Regression Review

## Tested Seams & Behaviors

1. **Unknown-Slug Refusal (404)**:
   - **Requirement**: An invalid or non-existent product slug must immediately trigger Next.js `notFound()` without materializing synthetic data or breaking metadata generation.
   - **Verification**: In `app/(main)/shop/[slug]/page.tsx`, both `generateMetadata` and `ProductPage` access `productForRequest(slug)` (memoized via React `cache`). If null, `notFound()` is executed. Tested via `e2e/storefront-query-contracts.spec.ts` (`GET /shop/این-محصول-وجود-ندارد-039-check` returns HTTP 404).

2. **Filter Intersection and Unknown Brand/Category Refusal**:
   - **Requirement**: Unrecognized filter query parameters must cleanly show the empty state message without falling back to an unfiltered query or causing a 500 error.
   - **Verification**: Navigating to `/shop?brand=unknown-039-brand` displays the Persian empty message (`در برندها یا دسته‌بندی‌های ما پیدا نشد`) with 0 products.

3. **Price Sorting & Pagination Integrity**:
   - **Requirement**: Sorting by price (`price-asc`, `price-desc`) must reorder results consistently, and pagination must load distinct sets of products without duplicating across pages.
   - **Verification**: `/shop?sort=price-asc` correctly sets the select value and sorts products by lowest unit price. Page 2 produces distinct products with active pagination indicator «۲».

4. **DTO and Seam Compatibility**:
   - **Requirement**: `availableProductsForDiscountRail()` in `lib/catalog-db.ts` must return canonical `CatalogProduct` DTOs matching `serializeProduct(record, true)`.
   - **Verification**: All required product and variant keys (`id`, `name`, `slug`, `displayPrice`, `compareAtPrice`, `variants`, etc.) are preserved. Discount rail ordering (`specialOffer: "desc"`, `updatedAt: "desc"`, `id: "asc"`) is maintained.
   - Unit test suites (`tests/unit/catalog-seam-shape.test.ts`, `tests/unit/additional-products-rail.test.ts`) pass with zero regressions.

