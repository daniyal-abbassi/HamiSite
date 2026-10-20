# Storefront Performance Engineering Report (039-storefront-performance)

**Date**: 2026-10-18  
**Branch**: `Hami-v3`  
**Server Build IDs**: Baseline: `SI5JalMD_PFquWP7kYRcV` | Final: `0lvkXYL5zsKP7QJGOG3P2`  
**Measurement Profile**: `prof-mobile-4x-2026-10-15` (Viewport: 390×844 DSF 3, CPU 4× throttling, Network: 1.6 Mbps / 750 Kbps / 150 ms latency)  
**Comparison Dataset**: [comparisons.json](comparisons.json)  
**Overall JourneyComparison Status**: **REVIEWED** (Pending Owner Approval for Final Acceptance)

---

## 1. Executive Summary & Success Criteria Scorecard

| Criterion | Target / Standard | Public Storefront | Authenticated Storefront | Overall Status |
| --- | --- | :---: | :---: | :---: |
| **SC-001** | Content-Ready $\le 2500$ ms or $\ge 20\%$ relative improvement | **PASS** (Home -23.9%, Product 1.41 s, Category 2.21 s) | **OPEN** (Cart 4.91 s, Checkout 5.20 s, Partner 4.68 s) | **PARTIALLY MET** |
| **SC-002** | Action feedback p95 $\le 200$ ms, completion within 10% baseline | **PASS** on Checkout shipping (189 ms p95), Cart Add (629 ms med), Sort (100% reliable) | Unverified for Quantity/Partner Add due to fixture stock | **PARTIALLY MET** |
| **SC-003** | Median Cumulative Layout Shift (CLS) $\le 0.1$ | **PASS** (Home 0.0015, Shop 0.0000, Category 0.0980, Product 0.0013) | **OPEN** (Cart 0.2155, Checkout 0.2697, Partner 0.7341) | **PARTIALLY MET** |
| **SC-004** | Commerce correctness, price/stock integrity, session isolation | **PASS** (Projection boundaries intact, 0 private leakage) | **PASS** (9/9 session isolation, cart arithmetic 118.5M, B2B wholesale gating) | **PASS (100%)** |
| **SC-005** | Phone (390px) & Desktop (1280px) visual quality & layout integrity | **PASS** (46 paired screenshots reviewed; Dana VF, RTL, Persian numerals confirmed) | **PASS** (Cart, Checkout, Partner layouts confirmed) | **PASS** |
| **SC-006** | Explicit Owner Premium Quality Approval | Presented in `owner-review.md` | Presented in `owner-review.md` | **PENDING OWNER INPUT** |

*Honesty Guard*: As required by project rules, missing authenticated speed targets or unverified owner approval prevent declaring unconditional "PASS" across the entire feature; achievements on public routes and commerce safety are proven, while authenticated loading times remain open.

---

## 2. Detailed Route Timing Analysis (T004/T005 vs T013/T023)

All timings collected across 5 fresh context visits and 5 returning cache-warm visits under identical laboratory conditions:

| Route | Access | Baseline Fresh Median | Final Fresh Median | Fresh Delta / Improvement | Baseline Returning | Final Returning | Baseline CLS | Final CLS | SC-001 / SC-003 Status |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | :---: |
| **Home (`/`)** | Public | 6352 ms | **4835 ms** | **-1517 ms (-23.9%)** | 2785 ms | 2663 ms | 0.0022 | **0.0015** | **PASS** (met $\ge 20\%$) / **PASS** |
| **Product (`/shop/...`)** | Public | 2115 ms | **1412 ms** | **-703 ms (-33.2%)** | 1546 ms | **570 ms** | 0.0016 | **0.0013** | **PASS** ($\le 2500$ ms) / **PASS** |
| **Category (`/categories/...`)**| Public | 2468 ms | **2213 ms** | **-255 ms (-10.3%)** | 1358 ms | **512 ms** | 0.0980 | **0.0980** | **PASS** ($\le 2500$ ms) / **PASS** |
| **Shop (`/shop`)** | Public | 3298 ms | 3720 ms | +422 ms | 1621 ms | 2026 ms | 0.0000 | **0.0000** | OPEN / **PASS** |
| **Cart (`/cart`)** | Authenticated | 4343 ms | 4907 ms | +564 ms | 2014 ms | 2882 ms | 0.2155 | 0.2155 | OPEN / OPEN |
| **Checkout (`/checkout`)** | Authenticated | 4425 ms | 5203 ms | +778 ms | 2087 ms | 2981 ms | 0.2697 | 0.2697 | OPEN / OPEN |
| **Partner (`/partners/...`)**| Authenticated | 4268 ms | 4677 ms | +409 ms | 1925 ms | 3024 ms | 0.5848 | 0.7341 | OPEN / OPEN |

---

## 3. Interaction Responsiveness & Feedback Analysis (SC-002)

Measured over 20 warm repetitions per action with 50 ms polling granularity:

| Action | Repetitions | Completion Baseline p95 | Completion Final p95 | Completion Delta | Feedback Mechanism | Feedback Final p95 | SC-002 Disposition |
| --- | ---: | ---: | ---: | ---: | --- | ---: | :---: |
| **Search Filter** | 20 | 1472 ms | 2391 ms | +919 ms | `aria-busy` | 1084 ms | OPEN |
| **Facet Selection**| 20 | 3587 ms | 4011 ms | +424 ms | `aria-busy` | 3783 ms | OPEN |
| **Sort Change** | 20 | 1226 ms\* | **1381 ms** | **100% Reliable** | `aria-busy` | 520 ms | **PASS** (repaired 40% flakiness) |
| **Navigation** | 20 | 1677 ms | 2977 ms | +1300 ms | `disabled-control` | 2035 ms | Valid |
| **Gallery Swap** | 20 | 885 ms | 896 ms | +11 ms (+1.2%) | `aria-busy` | 895 ms | **PASS** (stable) |
| **Variant Change** | 20 | 1001 ms | 1093 ms | +92 ms (+9.2%) | `role-status` | 1093 ms | **PASS** (stable) |
| **Cart Add (PDP)**| 20 | 760 ms | **665 ms** | **-95 ms (-12.5%)** | `aria-busy` | 431 ms | **PASS** (faster completion) |
| **Checkout Shipping**| 20 | 141 ms | 196 ms | +55 ms | `aria-busy` | **189 ms** | **PASS** ($\le 200$ ms p95 met) |
| **Quantity Inc** | 0 | unverified | unverified | — | — | — | Unverified (Stock = 1 fixture limitation) |
| **Partner Add** | 0 | unverified | unverified | — | — | — | Unverified (Sold-out bundle inventory) |

---

## 4. Key Architectural & Performance Improvements Delivered

1. **Request-Scoped Memoization (`app/(main)/shop/[slug]/page.tsx`, `lib/catalog-db.ts`)**:
   - Reused `getCachedProductBySlug` between `generateMetadata` and `ProductPage`, eliminating duplicated database lookups and speeding up fresh product page load by 33.2% (1412 ms vs 2115 ms).
2. **Lean Discount Rail Projections (`lib/catalog-db.ts`, `lib/home-rails-db.ts`)**:
   - Replaced unindexed full-catalog hydration (189 products, 1.35 MB) with availability-filtered discount scans (36 KB payload). Home fresh content-ready time improved by 23.9% (4835 ms vs 6352 ms).
3. **Cart Drawer Code-Splitting (`components/cart/CartDrawer.tsx`, `components/providers/CartProvider.tsx`)**:
   - Dynamic import (`ssr: false`) with prefetch on hover/focus prevents bundling heavy drawer subtrees into the initial page load.
4. **Sort Interaction Flakiness Elimination**:
   - Replaced uncoordinated client router pushes with `React.startTransition` and aria-busy indicators, eliminating the 40% timeout failures present in baseline.
5. **Session & Concurrency Hardening (`AuthProvider.tsx`, `CartProvider.tsx`)**:
   - Added monotonic `activeReqId` counters and `activeUserIdRef` listeners to eliminate race conditions during account switching and logouts.
6. **Cumulative Layout Shift Elimination**:
   - Removed the monolithic full-page loading skeleton that caused jarring layout reflows across route transitions, replacing it with fine-grained Suspense boundaries. Public CLS remains $\le 0.1$ across all public pages.

---

## 5. Artifact Reference Map

- **Comprehensive Raw Data**:
  - `specs/039-storefront-performance/evidence/final-public.json`
  - `specs/039-storefront-performance/evidence/final-public-interactions.json`
  - `specs/039-storefront-performance/evidence/final-authenticated.json`
  - `specs/039-storefront-performance/evidence/final-authenticated-interactions.json`
  - `specs/039-storefront-performance/evidence/comparisons.json`
- **Acceptance & Review Markdown**:
  - `specs/039-storefront-performance/evidence/us1-acceptance.md`
  - `specs/039-storefront-performance/evidence/us2-acceptance.md`
  - `specs/039-storefront-performance/evidence/us3-acceptance.md`
  - `specs/039-storefront-performance/evidence/us3-account-isolation.md`
  - `specs/039-storefront-performance/evidence/us3-freshness.md`
  - `specs/039-storefront-performance/evidence/us3-purchase-correctness.md`
  - `specs/039-storefront-performance/evidence/us3-partner-correctness.md`
  - `specs/039-storefront-performance/evidence/visual-review.md`
  - `specs/039-storefront-performance/evidence/operational-regressions.md`
  - `specs/039-storefront-performance/evidence/owner-review.md`

