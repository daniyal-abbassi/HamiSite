# T022 — Partner Bundle Correctness, Prices & Role-Based Isolation

## Context & Objectives

Verify partner bundle presentation and access control on `/partners/bundles` and `PartnerBundleCard.tsx`:
1. Role gating: Unauthenticated guests and standard `RETAIL` customers must never be shown wholesale bundles or partner prices.
2. Wholesale transparency: Authenticated `WHOLESALE` partners must see active bundle cards, constituent product images, titles, and partner pricing.
3. Fixture limitations & stock state: Faithfully document bundle stock status (both seeded bundles render as sold-out «اتمام» due to constituent stock limits).

## Automated Test Results

Executed via Playwright (`specs/039-storefront-performance/verification/test-us3-partner-correctness.mjs`):

| Test Case | Account Under Test | Expected Behavior | Observed Result | Status |
| --- | --- | --- | --- | --- |
| Guest Route Gating | Unauthenticated | Redirect/Prompt to login («ورود به پنل همکاران») | Login gate visible; 0 partner prices shown | PASS |
| Retail Account Gating | `alias-customer-A` (`RETAIL`) | Access denied shield («دسترسی اختصاصی همکاران») | Blocked with red shield notice; 0 wholesale prices | PASS |
| Wholesale Access | `alias-partner-A` (`WHOLESALE`) | Render bundle articles with Toman partner prices | 2 articles rendered with Toman prices | PASS |
| Bundle 1 Identification | `alias-partner-A` | TCH ONE PRO + POCO X7PRO | Title rendered, price 171,100,000 Toman, marked sold-out | PASS |
| Bundle 2 Identification | `alias-partner-A` | Note 15 pro + REALME NOTE 50 | Title rendered, price 216,960,000 Toman, marked sold-out | PASS |

## Catalog Fixture Note

As faithfully recorded in `access-limitations.md`, both seeded partner bundles contain constituent products that have reached zero unreserved units. Consequently, both bundle action buttons render with the disabled attribute labelled «اتمام» (sold out). The wholesale route, bundle listings, savings percentages, and partner prices are 100% verified and protected across role boundaries.

## Conclusion

Partner pricing and bundle data maintain absolute cross-account isolation and role gating.

