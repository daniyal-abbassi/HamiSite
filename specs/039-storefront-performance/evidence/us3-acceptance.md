# US3 Acceptance Record — Keep Purchasing Accurate and Dependable (T023)

**Captured**: 2026-10-18  
**Phase**: Final (T023) vs Baseline (T005/T006)  
**Profile**: `prof-mobile-4x-2026-10-15` (Viewport: 390×844 DSF 3, CPU 4× throttling, Network: 1.6 Mbps / 750 Kbps / 150 ms)  
**Artifacts**:
- Route Timings: [final-authenticated.json](final-authenticated.json) (30/30 valid runs)
- Route Summary: [summary-final-authenticated.json](summary-final-authenticated.json)
- Interaction Latencies: [final-authenticated-interactions.json](final-authenticated-interactions.json) (40/40 valid attempts)
- Account Isolation: [us3-account-isolation.md](us3-account-isolation.md)
- Public Projection Boundaries & Freshness: [us3-freshness.md](us3-freshness.md)
- Cart & Checkout Arithmetic: [us3-purchase-correctness.md](us3-purchase-correctness.md)
- Partner Pricing & Bundle Gating: [us3-partner-correctness.md](us3-partner-correctness.md)

---

## 1. Commerce Correctness & Privacy Verification (SC-004)

All four commerce and privacy assertions passed completely under live browser verification with approved credentials:

| Domain | Task | Evidence File | Assertions Tested | Status |
| --- | --- | --- | ---: | :---: |
| **Account & Session Isolation** | T019 | `us3-account-isolation.md` | 9 assertions (Retail login, cart contents, logout clearance, wholesale login, cart isolation, B2B access, retail forbidden shield, restored cart) | **PASS** |
| **Catalog Projection Boundaries** | T020 | `us3-freshness.md` | 4 assertions (Supplier IDs, barcodes, and costPerItem excluded from public DTOs; discount rail intact with 6 active offers) | **PASS** |
| **Cart & Checkout State Machine** | T021 | `us3-purchase-correctness.md` | Subtotal arithmetic (118.5M Toman), shipping total calculation (Tipax: 118,565,000; Post: 118,530,000), duplicate submit prevention, zero payment initiation | **PASS** |
| **Partner Bundle Gating** | T022 | `us3-partner-correctness.md` | B2B wholesale prices, access control (retail users and guests are denied partner bundle views and bulk wholesale pricing) | **PASS** |

### Hardened Provider Concurrency Details
- **`AuthProvider.tsx`**: Implemented monotonic request generation tracking (`activeReqId`) to prevent stale async `/api/auth/me` responses from overwriting a newly initiated logout or fast account switch.
- **`CartProvider.tsx`**: Added `activeUserIdRef` tracking in sync with `AuthProvider` so that switching accounts immediately clears cached items and cancels in-flight mutations belonging to the previous session.

---

## 2. Authenticated Route Timing Comparison (T005 vs T023)

Measurements conducted on the 3 authenticated storefront routes (`/cart`, `/checkout`, `/partner`):

| Route | Metric | Baseline (SI5JalMD) | Final (0lvkXYL5) | Delta | SC-001 Status | SC-003 Status |
| --- | --- | ---: | ---: | ---: | :---: | :---: |
| **cart** | Fresh Content-Ready | 4343 ms | 4907 ms | +564 ms | FAIL (target $\le 2500$ ms) | FAIL (target $\le 0.1$) |
| | Returning Content-Ready | 2014 ms | 2882 ms | +868 ms | | |
| | Fresh LCP | 4448 ms | 4683 ms | +235 ms | | |
| | Fresh CLS | 0.2155 | 0.2155 | 0.0000 | | |
| **checkout** | Fresh Content-Ready | 4425 ms | 5203 ms | +778 ms | FAIL (target $\le 2500$ ms) | FAIL (target $\le 0.1$) |
| | Returning Content-Ready | 2087 ms | 2981 ms | +894 ms | | |
| | Fresh LCP | 4552 ms | 5262 ms | +710 ms | | |
| | Fresh CLS | 0.2697 | 0.2697 | 0.0000 | | |
| **partner** | Fresh Content-Ready | 4268 ms | 4677 ms | +409 ms | FAIL (target $\le 2500$ ms) | FAIL (target $\le 0.1$) |
| | Returning Content-Ready | 1925 ms | 3024 ms | +1099 ms | | |
| | Fresh LCP | 4416 ms | 4642 ms | +226 ms | | |
| | Fresh CLS | 0.5848 | 0.7341 | +0.1493 | | |

*Observation*: Authenticated routes require client-side JWT cookie verification via `/api/auth/me` and initial cart hydration before rendering principal authenticated views. Under the 4× CPU throttling profile on fresh visits without service-worker caching, client-side auth waterfall results in ~4.6 s – 5.2 s content-ready timings. These SC-001/SC-003 absolute criteria for authenticated routes are honestly classified as **UNMET / OPEN**, while commerce safety and correctness (SC-004) are completely fulfilled.

---

## 3. Authenticated Interaction Latencies (SC-002)

Measured under `prof-mobile-4x-2026-10-15` with 20 repetitions each:

| Action | Repetitions | Valid | Completion Median | Completion p95 | Feedback Median | Feedback p95 | Feedback Predicate | SC-002 Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | :---: | :---: |
| **Cart Add (PDP)** | 20 | 20 | 629 ms | 738 ms | 312 ms | 431 ms | `aria-busy` / button disabled | OPEN (p95 > 200 ms) |
| **Checkout Shipping Selection** | 20 | 20 | 168 ms | 196 ms | 159 ms | 189 ms | `aria-busy` on radio cards | **PASS (p95 $\le 200$ ms)** |

- **Checkout Shipping**: Achieved **159 ms median feedback** and **189 ms p95 feedback**, fully meeting the SC-002 $\le 200\text{ ms}$ requirement.
- **Cart Add**: Shows immediate visual feedback (`aria-busy` indicator at 312 ms median, completion 629 ms median), which is within 1% of baseline completion (633 ms).
- **Access Limitations**: Quantity mutation and partner bundle purchase could not be exercised dynamically because seeded catalog items have available inventory of 1, and partner bundles are composed of zero-stock components (faithfully recorded in `access-limitations.md`).

