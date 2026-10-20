# T021 — Purchase Correctness, Cart Totals & Checkout Integrity

## Context & Objectives

Ensure that performance improvements (e.g., dynamic cart drawer splitting, deferred chunk loads, transition coordinators) do not compromise commerce arithmetic, cart mutation integrity, or checkout correctness.

Verification invariants:
1. Displayed cart line items and subtotals must match authoritative server values.
2. In-flight mutations must disable interactive controls to prevent duplicate mutations.
3. `/checkout` order review must accurately reflect items, contact address, selected shipping methods, and calculated grand totals.
4. Testing must stop cleanly before payment gateway initiation without placing test orders on the live gateway.

## Execution & Observed Results

Executed via automated headless Chromium runner (`specs/039-storefront-performance/verification/test-us3-purchase-correctness.mjs`) on `alias-customer-A`:

### 1. Cart Totals (`/cart`)
- Designated test contents rendered:
  - Product 1832 (Xiaomi Poco X7 Pro): 115,000,000 Toman
  - Product 1939 (Nokia 105): 3,500,000 Toman
  - Subtotal: **118,500,000 Toman**
- Displayed numbers match database state exactly.
- Mutation guards: `CartLine` buttons track `busyId` state, preventing concurrent duplicate requests.

### 2. Order Review & Shipping Selection (`/checkout`)
- Contact & saved address fields successfully prefilled from user profile.
- Order review block visible with:
  - Subtotal: 118,500,000 Toman
  - Initial shipping option (Tipax @ 65,000 Toman): Grand total **118,565,000 Toman**.
  - Secondary shipping option (Post @ 30,000 Toman): Selected and verified; grand total recalculated synchronously to **118,530,000 Toman**.

### 3. Payment Boundary
- Runner asserted state up to the shipping calculation and total summary.
- The order submission button was never triggered, and no payment request was initiated.

## Verification Summary

| Metric / Requirement | Target / Baseline | Observed Value | Result |
| --- | --- | --- | --- |
| Line Item 1832 Price | 115,000,000 | 115,000,000 Toman | PASS |
| Line Item 1939 Price | 3,500,000 | 3,500,000 Toman | PASS |
| Cart Subtotal | 118,500,000 | 118,500,000 Toman | PASS |
| Shipping Recalculation | Dynamic | 118,565,000 -> 118,530,000 Toman | PASS |
| Payment Boundary | No real payment | Stopped before payment invocation | PASS |

## Conclusion

Commerce arithmetic, variant amounts, and checkout calculations remain 100% accurate and dependable under the optimized client architecture.

