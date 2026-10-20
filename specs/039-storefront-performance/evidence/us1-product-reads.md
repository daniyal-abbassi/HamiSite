# T008 — Product reader audit

The product page and `generateMetadata` both called `findProductBySlug(slug)` for the same request. On 2026-10-18, a development request for the frozen product showed Prisma's batched `WHERE slug IN ($1,$2)`: one SQL round trip, but two identical inputs and two materialized/serialized product results. The comparison used the same route and database, with no mutation.

The route now uses React's request-scoped `cache` around the existing reader with the primitive decoded route slug as its key. A repeat request showed `WHERE slug = $1 LIMIT $2`; the duplicate input disappeared. The reader's 404 handling, metadata path, JSON-LD nonce, product DTO, and public freshness policy are unchanged. This is a server efficiency fix; no SC-001 timing pass is claimed from it until the paired production capture.

Baseline sample IDs: `product-fresh-r1` through `product-fresh-r5` and `product-returning-r1` through `product-returning-r5` in `baseline-public.json`. Final sample IDs and visual result: pending the final production capture. The accompanying product UI Verify capture checks title, price, and principal image on the same route.
