# Tasks: One-Step Phone Sign-In With Automatic Registration

Spec: [spec.md](spec.md) · Plan: [plan.md](plan.md)

- [x] T001 `app/api/auth/otp/verify/route.ts`: in the LOGIN branch, find the user by the challenge's phone; if none and the challenge has no linked user, create the retail customer (D3 in research.md) and sign in; retry the transaction once on a unique-constraint race (FR-001, FR-003, FR-005)
- [x] T002 Keep inactive, ADMIN and AGENT numbers failing with `OTP_INVALID` and no new row (FR-007, FR-009)
- [x] T003 `tests/api/auth-otp.test.ts`: new number signs in; wrong code and request-only create nothing; concurrent verify gives one account and one session; account created between request and verify; deactivated customer not replaced
- [x] T004 `app/api/orders/route.ts`: fill empty `firstName`, `lastName`, `city` from the first order, never overwrite (FR-011, FR-012)
- [x] T005 `tests/api/orders.test.ts`: profile completion fills empty fields and leaves existing ones
- [x] T006 `components/layout/UserMenu.tsx`: show the phone number instead of the generated username when there is no name (FR-013)
- [x] T007 Amend `specs/043-smsir-otp-login/spec.md` and `contracts/otp-auth-api.md`
- [ ] T008 Verify in CI (no local test database): typecheck and the API tests
- [ ] T009 After deploy, run the manual steps in [quickstart.md](quickstart.md) and record the constitution amendment note (owner instruction 2026-11-18)

## Known limits (not in scope)
- `OrderDetailClient` still prints `customer.username` where an order has one; for auto-registered customers that reads `m98912…`. Orders carry their own name, so this only shows in the admin/own order view.
- A generated username `m<digits>` could in theory collide with an unrelated user's username; the verify then fails with a server error instead of signing in. Not seen in practice.
