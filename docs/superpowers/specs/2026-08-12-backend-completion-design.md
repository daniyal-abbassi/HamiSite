# Backend Completion — Design Spec

Date: 2026-08-12
Status: Approved, pending implementation plan

## Context

HamiHamrah is a branded, single-shop e-commerce platform distributing cellphones to
both retail and B2B/wholesale customers, targeting the Iranian market. The current
codebase (`app/api/*`, `lib/*`, `prisma/schema.prisma`) is a Next.js 14 App Router API
with a Postgres/Prisma data layer covering products, cart, orders, addresses, coupons,
and B2B pricing tiers — but authentication is a stub (login/register verify credentials
and return the user with no session), every route that touches user-scoped data trusts
a client-supplied `userId`, there is no admin API, no payment integration, and no
automated tests.

A large `openapi.json` exists in the repo describing a much bigger multi-tenant admin
platform ("Mixin API v4": campaigns, SMS marketing, Instagram import, page builder,
support tickets, PSP config, etc.). That spec is **not** the target for this project —
it's leftover reference schema. This phase treats HamiHamrah as a single branded shop
and ignores everything in `openapi.json` outside that scope.

This is the backend-completion phase. A separate frontend design phase follows once
this is implemented; that phase will use the "Aura" landing-page reference
(`/home/lain/Downloads/Telegram Desktop/prompt.txt`) as a *style/structure* reference —
liquid-glass card treatment, motion-driven sections, gradient/noise headline
technique — reskinned into HamiHamrah's brand colors (`#640211` background, in the
RAL 3004 "purple red" family, `#F2F4ED` text) and a real e-commerce IA, not reproduced
literally (it's an email-client landing page).

## Goals

- Real, revocable sessions replacing the current no-op login.
- Close the authorization hole: cart/orders/addresses currently accept a client-supplied
  `userId` instead of deriving it from the authenticated session.
- An admin API surface sufficient to actually operate the shop (products, inventory,
  orders, coupons, customers, basic reporting) — no admin UI yet, API only.
- A payment flow shaped around Zarinpal, working end-to-end today via a mock gateway
  (Zarinpal merchant credentials aren't available yet), swappable to live Zarinpal by
  setting env vars with no route/flow changes.
- Integration test coverage for everything new/changed in this phase.

## Explicitly out of scope for this phase

- SMS OTP login/verification. The schema's `OtpCode`/`OtpPurpose` models stay unused.
- The AGENT-on-behalf-of-WHOLESALE order flow. `Order.agentId` and the `AGENT` role
  stay present in the schema but unenforced.
- IMEI/serial-level unit tracking. Inventory stays an aggregate `stock` count per
  `ProductVariant`.
- Live Zarinpal credentials — mock gateway until the merchant account exists.
- Everything in `openapi.json` beyond this shop's needs (campaigns, SMS marketing,
  Instagram import, page builder, tickets, PSP config UI, multi-tenant anything).
- The frontend. This spec is API-only.

## 1. Data model changes

One new table; everything else reuses the existing schema as-is.

```prisma
model Session {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String   @unique
  userAgent String?
  createdAt DateTime @default(now())
  expiresAt DateTime
}
```

- The raw session token is a random 32-byte value, set as the httpOnly/secure/
  `sameSite=lax` cookie value on the client. Only its hash is stored server-side.
- Expiry: 30 days, sliding — each authenticated request that resolves a valid session
  bumps `expiresAt`.
- Logout deletes the row and clears the cookie.

## 2. Auth & sessions

- `withAuth(handler, { roles? })` — new wrapper in `lib/auth.ts`, composed with the
  existing `withErrorHandling` (`lib/http.ts`). Reads the session cookie, loads
  `Session` + `User`. Throws `ApiError(401)` if the session is missing/expired,
  `ApiError(403, "Account deactivated")` if `!user.isActive`, and `ApiError(403)` if
  `roles` is given and the user's role isn't included. Passes `{ user }` into the
  wrapped handler.
- `POST /api/auth/login`, `POST /api/auth/register` — same validation as today, but on
  success create a `Session` row and set the cookie instead of just returning the user.
- `POST /api/auth/logout` — new. Deletes the current session row, clears the cookie.
- `GET /api/auth/me` — new. Returns the sanitized current user via `withAuth`.
- No SMS OTP this phase (see Out of scope).

## 3. Hardening existing routes

The important fix, not just an addition: cart, addresses, and orders routes currently
accept `userId` as a client-supplied query/body parameter, meaning any caller can read
or mutate any other user's cart, orders, or addresses. Every one of those routes is
wrapped in `withAuth` and switched to read `userId` — and `role`, where used for B2B
pricing/credit-limit checks — from the authenticated `user`, never from the request
body/query. Public routes (products, categories, brands, health) stay open with no
auth. Coupon validation stays open as a pre-checkout lookup, but resolves the current
user from the session (when authenticated) for user-scoped coupon-usage checks instead
of trusting a client-supplied id.

## 4. Admin API

New `/api/admin/*` namespace. Every route wrapped `withAuth(handler, { roles: [Role.ADMIN] })`.

- **Products** — `POST /api/admin/products`, `PATCH /api/admin/products/[id]`,
  `DELETE /api/admin/products/[id]`, plus variant sub-resource CRUD:
  `POST/PATCH/DELETE /api/admin/products/[id]/variants[/[variantId]]`. Every
  create/update/delete writes a `ProductHistory` row (`CREATED`/`UPDATED`/`DELETED`) —
  that model exists in the schema today and is currently unused.
- **Categories / Brands** — currently GET-only; add `POST/PATCH/DELETE`.
- **Stock adjustments** — `PATCH /api/admin/variants/[id]/stock`, requires a `reason`
  string, writes a `ProductHistory` entry. Kept as its own endpoint (separate from the
  general variant PATCH) so stock changes are always an intentional, audited action.
- **Orders** — `GET /api/admin/orders` (list all, filterable by status/user — unlike
  the customer-scoped `GET /api/orders`), `PATCH /api/admin/orders/[id]/status`
  enforcing the existing `OrderStatus` transitions (reuses `TERMINAL_CANCEL_STATUSES`
  from `lib/orders.ts`).
- **Coupons** — `POST/PATCH/DELETE /api/admin/coupons`. Creation doesn't exist at all
  today; only customer-facing validation does.
- **Customers** — `GET /api/admin/users`, `GET /api/admin/users/[id]`,
  `PATCH /api/admin/users/[id]` for role changes and toggling `isActive` (this is how
  an admin kills a compromised account — deactivating flips `withAuth`'s `isActive`
  check on the very next request the attacker makes).
- **Reporting** — one lightweight `GET /api/admin/reports/summary` (order count/revenue
  by status, last 30 days). Not the full `openapi.json` reports suite — just enough to
  run the shop day to day.

## 5. Payments

- `lib/payment/gateway.ts` — interface:
  `requestPayment(order): Promise<{ redirectUrl: string; authority: string }>` and
  `verifyPayment(authority, status): Promise<{ success: boolean; refId?: string }>`.
- `lib/payment/zarinpal.ts` — real implementation, active only when
  `ZARINPAL_MERCHANT_ID` is set.
- `lib/payment/mock.ts` — dev-mode fallback, used automatically when that env var is
  absent (the current state, since Zarinpal merchant requirements aren't sorted yet).
  Auto-succeeds after a short redirect round-trip so the full flow — pay, callback,
  `Payment` row, `Order.paymentStatus` transition — is testable end to end today.
  Swapping to live Zarinpal later is purely an env var change; no route or flow changes.
- `POST /api/orders/[id]/pay` — `withAuth`, ownership-checked against the order, calls
  `gateway.requestPayment`, creates a `Payment` row (`status: INITIATED`), returns the
  redirect URL.
- `GET /api/payments/callback` — called by the gateway; calls `gateway.verifyPayment`,
  then in a single `prisma.$transaction` updates the `Payment` row and
  `Order.paymentStatus`/`Order.status` together (`COMPLETED` + `PROCESSING` on success,
  `FAILED` on failure).

## 6. Testing

- **Vitest** as the runner — fast, ESM-native, minimal config. Next.js route handlers
  are imported directly as modules and invoked with a constructed `Request`
  (`import { POST } from '@/app/api/orders/route'`), no need to run a real HTTP server.
- **Real Postgres, not mocked Prisma.** The order flow relies on `prisma.$transaction`
  with several dependent reads/writes (stock decrement, credit-limit check, coupon
  usage); mocking that faithfully is more fragile than running it against a real
  database. A `db:test:reset` script (`prisma migrate reset --force --skip-seed`
  against `DATABASE_URL_TEST`) resets state between runs; a minimal test-only seed (a
  couple of users per role, one product with a variant, one coupon) replaces the full
  demo seed for speed.
- **Coverage for this phase:** auth (login/register/logout/me, bad credentials,
  deactivated account), the ownership-hardening fix on cart/orders/addresses
  (including a regression test that a client-supplied `userId` is ignored in favor of
  the session's), RBAC on admin routes (403 for non-admin roles), the stock-adjustment
  audit trail, and the payment mock's happy/failure paths through the callback
  transaction.
- Wired into `package.json` as `test` / `test:watch`. CI wiring is out of scope — there
  is no CI config in the repo yet; that's a separate, later concern.

## Open items for the next phase (frontend)

- Persian/RTL layout, Toman pricing display, and any user-facing localization are
  frontend concerns, not addressed here — the API stays technical/English in its
  error messages and field names.
- Live Zarinpal credentials, once available, are a config change only (see §5).
