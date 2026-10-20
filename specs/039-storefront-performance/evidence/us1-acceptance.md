# US1 Acceptance: Public-Entry Performance & Layout Stability

## Route Comparisons (T004 Baseline vs T013 Final)

Measurements conducted under identical profiles (`mobile 390x844 DSF3`, `CPU 4x`, `1.6 Mbps / 750 Kbps / 150 ms`, production server warm state):

| Route | Metric | Baseline (SI5JalMD) | Final (0Fjj1xY) | Delta / Improvement | SC-001 Target (≤2500ms or ≥20% rel.) | SC-003 Target (CLS ≤ 0.1) |
| --- | --- | ---: | ---: | ---: | :---: | :---: |
| **home** | Fresh Content-Ready | 6352 ms | 4835 ms | **-1517 ms (-23.9%)** | **PASS** (met ≥20% rel.) | |
| | Returning Content-Ready | 2785 ms | 2663 ms | -122 ms (-4.4%) | | |
| | Fresh LCP | 1872 ms | 2492 ms | +620 ms | | |
| | Fresh CLS | 0.0022 | 0.0015 | -0.0007 | | **PASS** |
| **product** | Fresh Content-Ready | 2115 ms | 1412 ms | **-703 ms (-33.2%)** | **PASS** (≤ 2500 ms) | |
| | Returning Content-Ready | 1546 ms | 570 ms | **-976 ms (-63.1%)** | | |
| | Fresh LCP | 2420 ms | 2372 ms | -48 ms (-2.0%) | | |
| | Fresh CLS | 0.0016 | 0.0013 | -0.0003 | | **PASS** |
| **category** | Fresh Content-Ready | 2468 ms | 2213 ms | **-255 ms (-10.3%)** | **PASS** (≤ 2500 ms) | |
| | Returning Content-Ready | 1358 ms | 512 ms | **-846 ms (-62.3%)** | | |
| | Fresh LCP | 2696 ms | 2380 ms | -316 ms (-11.7%) | | |
| | Fresh CLS | 0.0980 | 0.0980 | 0.0000 | | **PASS** |
| **shop** | Fresh Content-Ready | 3298 ms | 3720 ms | +422 ms | OPEN (needs US2 interaction & client work) | |
| | Returning Content-Ready | 1621 ms | 2026 ms | +405 ms | | |
| | Fresh LCP | 2848 ms | 3704 ms | +856 ms | | |
| | Fresh CLS | 0.0000 | 0.0000 | 0.0000 | | **PASS** |

## Summary of Completed Changes for US1
1. **Request-Scoped Memoization on Product Route**: Eliminates duplicated queries across `generateMetadata` and `ProductPage` (`app/(main)/shop/[slug]/page.tsx`).
2. **Selective Available-Only Discount Query**: Replaced 189 full candidate product scans with available-only selection (`lib/catalog-db.ts`, `lib/home-rails-db.ts`), reducing object hydration from 1.35 MB to 36 KB while maintaining strict mathematical offer equivalence.
3. **Eager LCP Loading for Principal Product Cards**: Added `priorityImage` prop across `FeaturedProducts` and `ShopResults` targeting `next/image` in `ProductCard`.
4. **Layout Shift Elimination**: Removed monolithic `loading.tsx` in favor of nested section Suspense boundaries in `app/(main)/page.tsx`.

## Verification Artifacts
- Raw final dataset: `specs/039-storefront-performance/evidence/final-public.json` (40/40 valid samples).
- Visual captures: `specs/039-storefront-performance/evidence/final/*.png` (desktop and mobile viewports).
- End-to-end query contracts: `e2e/storefront-query-contracts.spec.ts` (all 2 tests passed).
- UI Verify visual checks: `e2e/uiverify-*.spec.ts` (all 4 tests passed).

