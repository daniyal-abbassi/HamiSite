# T019 — Account Isolation, Switching & Stale Response Safety

## Context & Scope

Under the optimized storefront experience, state synchronization across authentication transitions must preserve absolute isolation:
- Customer A's cart items, subtotal, and personal data must never be visible to guests or other users.
- In-flight network requests originating from one session must never commit state to another session.
- Logging out must synchronously drop all private cart and profile state.
- Partner tier boundaries (`RETAIL` vs `WHOLESALE`) must strictly control access to B2B bundles and partner pricing.

## Demonstrated Vulnerability & Root-Cause Fix

### Identified Race Hazards in Providers

1. **`AuthProvider.tsx`**:
   - `refresh()` lacked request-generation tracking. If `logout()` occurred while a `refresh()` read was in flight, the delayed HTTP 200 response from `/api/auth/me` would execute `setUser(me)` and `setStatus("authenticated")`, reviving the authenticated session after logout.
   - **Fix**: Introduced `activeReqId = useRef(0)`. Each `refresh()` increments the counter; upon resolution, it checks `activeReqId.current === reqId`. `logout()` immediately increments `activeReqId`, invalidating any in-flight reads.

2. **`CartProvider.tsx`**:
   - `CartProvider` only watched `status` in its sync effect. If a user switched directly between two authenticated accounts (`RETAIL` -> `WHOLESALE`), `status` remained `"authenticated"`, so the cart effect did not trigger a refresh.
   - Any in-flight cart mutation or read (`refresh`, `addItem`, `addBundle`, `updateItem`, `removeItem`, `clear`) from an earlier user could resolve and commit data into the new user's cart state.
   - **Fix**: Added `activeUserIdRef` and `activeReqId`. When `user?.id` changes, previous cart state is cleared synchronously (`setCart(null)`), and `activeReqId` is incremented. All mutations verify both `activeReqId.current === reqId` and `activeUserIdRef.current === reqUserId` before committing state.

## Two-Account Verification Matrix

Tested against live production server via Playwright:

| Test Scenario | Subject | Expected Behavior | Observed Result | Status |
| --- | --- | --- | --- | --- |
| 1. Customer Login | `alias-customer-A` | Authenticates with `role: "RETAIL"` | HTTP 200, role `RETAIL` | PASS |
| 2. Designated Cart Verification | `alias-customer-A` | Cart loads Poco X7 Pro (1832) & Nokia 105 (1939), subtotal 118,500,000 | Both lines visible, correct prices | PASS |
| 3. Explicit Logout | Guest | Auth drops to `guest`; cart cleared; login banner displayed | Login prompt visible, 0 cart items displayed | PASS |
| 4. Partner Login | `alias-partner-A` | Authenticates with `role: "WHOLESALE"` | HTTP 200, role `WHOLESALE` | PASS |
| 5. Cart Isolation | `alias-partner-A` | Customer A's cart items are completely absent | Clean partner session; 0 customer items | PASS |
| 6. Partner Bundle Access | `alias-partner-A` | 2 partner bundles visible with wholesale pricing | 2 bundle articles visible | PASS |
| 7. Return to Customer | `alias-customer-A` | Switched back to retail customer session | HTTP 200, role `RETAIL` | PASS |
| 8. Partner Access Rejection | `alias-customer-A` | `/partners/bundles` blocked with access forbidden notice | Shield notice «دسترسی اختصاصی همکاران» rendered | PASS |
| 9. Cart Restoration | `alias-customer-A` | Designated cart contents restored intact | Subtotal 118,500,000 & items intact | PASS |

## Conclusion

Both `AuthProvider` and `CartProvider` enforce strict auth-before-cart ordering, immediate cache eviction upon logout/switch, and monotonic request-id guards against stale response races. All SC-004 data-isolation assertions pass.

