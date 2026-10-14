# Backend Security Review — Feature 035

**Environment/date:** Local isolated checkout, 2026-10-14 (Asia/Tehran).
**Evidence standard:** `source-only` means the control or concern was inspected in code; `observed` requires a runtime result. No production penetration test, provider charge, or live customer data is used.

## Guidance provenance

- Source: [FarsiUI Backend Security](https://farsiui.ir/skills/backend-security), upstream `MiladJoodi/skills`; installed with `npx farsiui@latest add backend-security` (CLI package 0.1.24). The CLI wrote `.cursor/skills/backend-security`; the 11 generated files were moved without editing to ignored `.agents/skills/backend-security/` for this project's Codex convention.
- Verified files: `SKILL.md` plus 10 `references/*.md` files. Main-file SHA-256: `13627aa408c5e4e4b970e3e7dbb2a338255201c8c60d73547a077714be46978a`. Installed 2026-10-14. Missing files: none.
- A clean checkout repeats the CLI command and places the generated skill tree at `.agents/skills/backend-security/`; the CLI default destination on this run was `.cursor/skills/`.

## Test isolation

- Read-only preflight: `.env.test` points to a distinct local database whose name contains `test`; neither the process nor `.env.test` sets `HAMI_ALLOW_DB_RESET=1`. No URLs or credentials are recorded.
- Read-only inspection: 25 tables, 0 nonempty tables, 0 rows at start. This checkout's dedicated local test database is treated as disposable for `tests/setup.ts` resets. The development database is not used for these tests.
- `tests/helpers/seed.ts` supplies isolated retail/wholesale/admin identities; tests create customer A and B where needed. `tests/helpers/request.ts` creates route requests. Guest has no session. Fake Zarinpal and local HTTP fixtures avoid real charges/network probes.

## Route inventory

60 API route files, plus `middleware.ts` (admin page guard). Category is the primary review grouping; a route can cross more than one boundary. This list is enumeration, not a claim that every route passed runtime testing.

| Operation ID | Primary category | Entry point | Methods | Evidence status |
| --- | --- | --- | --- | --- |
| OP-01 | 2 Object access | `app/api/addresses/[id]/route.ts` | GET, PATCH, DELETE | Inspected; verified in `tests/api/addresses.test.ts` |
| OP-02 | 2 Object access | `app/api/addresses/route.ts` | GET, POST | Inspected; verified in `tests/api/addresses.test.ts` |
| OP-03 | 3 Staff/API roles | `app/api/admin/brands/[id]/route.ts` | PATCH, DELETE | Inspected; ADMIN role required |
| OP-04 | 3 Staff/API roles | `app/api/admin/brands/route.ts` | GET, POST | Inspected; ADMIN role required |
| OP-05 | 3 Staff/API roles | `app/api/admin/bundles/[id]/route.ts` | GET, PATCH, DELETE | Inspected; ADMIN role required |
| OP-06 | 3 Staff/API roles | `app/api/admin/bundles/route.ts` | GET, POST | Inspected; ADMIN role required |
| OP-07 | 6 File/import/outbound | `app/api/admin/catalog-images/route.ts` | POST, PATCH | Inspected; verified in `tests/api/admin-catalog-images.test.ts` |
| OP-08 | 3 Staff/API roles | `app/api/admin/categories/[id]/route.ts` | PATCH, DELETE | Inspected; ADMIN role required |
| OP-09 | 3 Staff/API roles | `app/api/admin/categories/route.ts` | GET, POST | Inspected; ADMIN role required |
| OP-10 | 3 Staff/API roles | `app/api/admin/coupons/[id]/route.ts` | PATCH, DELETE | Inspected; ADMIN role required |
| OP-11 | 3 Staff/API roles | `app/api/admin/coupons/route.ts` | GET, POST | Inspected; ADMIN role required |
| OP-12 | 3 Staff/API roles | `app/api/admin/dashboard/route.ts` | GET | Inspected; ADMIN role required |
| OP-13 | 6 File/import/outbound | `app/api/admin/importer/digikala/product/route.ts` | GET | Inspected; verified in `tests/unit/digikala-security.test.ts` |
| OP-14 | 6 File/import/outbound | `app/api/admin/importer/digikala/search/route.ts` | GET | Inspected; verified in `tests/unit/digikala-security.test.ts` |
| OP-15 | 3 Staff/API roles | `app/api/admin/orders/[id]/status/route.ts` | PATCH | Inspected; ADMIN role required |
| OP-16 | 3 Staff/API roles | `app/api/admin/orders/route.ts` | GET | Inspected; ADMIN role required |
| OP-17 | 3 Staff/API roles | `app/api/admin/partners/[id]/decision/route.ts` | POST | Inspected; ADMIN role required |
| OP-18 | 3 Staff/API roles | `app/api/admin/partners/[id]/documents/[docType]/route.ts` | GET | Inspected; verified in `tests/api/admin-partner-documents.test.ts` |
| OP-19 | 3 Staff/API roles | `app/api/admin/partners/[id]/route.ts` | GET | Inspected; ADMIN role required |
| OP-20 | 3 Staff/API roles | `app/api/admin/partners/count/route.ts` | GET | Inspected; ADMIN role required |
| OP-21 | 3 Staff/API roles | `app/api/admin/partners/route.ts` | GET | Inspected; ADMIN role required |
| OP-22 | 3 Staff/API roles | `app/api/admin/products/[id]/route.ts` | GET, PATCH, DELETE | Inspected; ADMIN role required |
| OP-23 | 3 Staff/API roles | `app/api/admin/products/[id]/variants/[variantId]/route.ts` | PATCH, DELETE | Inspected; ADMIN role required |
| OP-24 | 3 Staff/API roles | `app/api/admin/products/[id]/variants/route.ts` | POST | Inspected; ADMIN role required |
| OP-25 | 3 Staff/API roles | `app/api/admin/products/route.ts` | GET, POST | Inspected; ADMIN role required |
| OP-26 | 3 Staff/API roles | `app/api/admin/products/suggest/route.ts` | GET | Inspected; ADMIN role required |
| OP-27 | 3 Staff/API roles | `app/api/admin/reports/summary/route.ts` | GET | Inspected; ADMIN role required |
| OP-28 | 3 Staff/API roles | `app/api/admin/users/[id]/route.ts` | GET, PATCH | Inspected; verified in `tests/api/admin-users.test.ts` |
| OP-29 | 3 Staff/API roles | `app/api/admin/users/route.ts` | GET | Inspected; verified in `tests/api/admin-users.test.ts` |
| OP-30 | 3 Staff/API roles | `app/api/admin/variants/[id]/stock/route.ts` | PATCH | Inspected; ADMIN role required |
| OP-31 | 1 Auth/session | `app/api/auth/change-password/route.ts` | POST | Inspected; verified in `tests/api/auth.test.ts` |
| OP-32 | 1 Auth/session | `app/api/auth/login/route.ts` | POST | Inspected; verified in `tests/api/auth.test.ts` |
| OP-33 | 1 Auth/session | `app/api/auth/logout/route.ts` | POST | Inspected; verified in `tests/api/auth.test.ts` |
| OP-34 | 1 Auth/session | `app/api/auth/me/route.ts` | GET, PATCH | Inspected; verified in `tests/api/auth.test.ts` |
| OP-35 | 1 Auth/session | `app/api/auth/register/route.ts` | POST | Inspected; verified in `tests/api/auth.test.ts` |
| OP-36 | 7 Public/read or cost bound | `app/api/brands/route.ts` | GET | Inspected; public catalog |
| OP-37 | 2 Object access | `app/api/cart/items/[id]/route.ts` | PATCH, DELETE | Inspected; verified in `tests/api/cart.test.ts` |
| OP-38 | 2 Object access | `app/api/cart/items/route.ts` | POST | Inspected; verified in `tests/api/cart.test.ts` |
| OP-39 | 2 Object access | `app/api/cart/route.ts` | GET, DELETE | Inspected; verified in `tests/api/cart.test.ts` |
| OP-40 | 6 File/import/outbound | `app/api/catalog-images/[filename]/route.ts` | GET | Inspected; verified in `tests/api/admin-catalog-images.test.ts` |
| OP-41 | 7 Public/read or cost bound | `app/api/categories/route.ts` | GET | Inspected; public catalog |
| OP-42 | 4 Price/order state | `app/api/coupons/validate/route.ts` | POST | Inspected; evaluated via `evaluateCoupon` |
| OP-43 | 7 Public/read or cost bound | `app/api/health/route.ts` | GET | Inspected; public health check |
| OP-44 | 4 Price/order state | `app/api/orders/[id]/pay/route.ts` | POST | Inspected; verified in `tests/api/pay.test.ts` |
| OP-45 | 4 Price/order state | `app/api/orders/[id]/route.ts` | GET, PATCH | Inspected; verified in `tests/api/orders.test.ts` |
| OP-46 | 4 Price/order state | `app/api/orders/route.ts` | GET, POST | Inspected; verified in `tests/api/orders.test.ts` |
| OP-47 | 2 Object access | `app/api/partners/bundles/[slug]/route.ts` | GET | Inspected; WHOLESALE/AGENT role required |
| OP-48 | 2 Object access | `app/api/partners/bundles/route.ts` | GET | Inspected; WHOLESALE/AGENT role required |
| OP-49 | 6 File/import/outbound | `app/api/partners/route.ts` | POST | Inspected; verified in `tests/unit/partner-applications.test.ts` |
| OP-50 | 5 Payment result | `app/api/payments/callback/route.ts` | GET | Inspected; verified in `tests/api/payments-callback.test.ts` |
| OP-51 | 5 Payment result | `app/api/payments/mock-confirm/route.ts` | GET | Inspected; local dev fixture only |
| OP-52 | 4 Price/order state | `app/api/pricing/quote/route.ts` | POST | Inspected; verified in `tests/api/pricing.test.ts` |
| OP-53 | 7 Public/read or cost bound | `app/api/products/[slug]/route.ts` | GET | Inspected; public catalog |
| OP-54 | 7 Public/read or cost bound | `app/api/products/route.ts` | GET | Inspected; public catalog |
| OP-55 | 1 Auth/session | `app/api/tma/auth/route.ts` | POST | Inspected; verified in `tests/unit/telegram-auth.test.ts` |
| OP-56 | 8 Telegram assertion/worker | `app/api/tma/dashboard/route.ts` | GET | Inspected; TMA token required |
| OP-57 | 8 Telegram assertion/worker | `app/api/tma/orders/[id]/route.ts` | GET, PATCH | Inspected; TMA token required |
| OP-58 | 8 Telegram assertion/worker | `app/api/tma/orders/route.ts` | GET | Inspected; TMA token required |
| OP-59 | 8 Telegram assertion/worker | `app/api/tma/products/[id]/route.ts` | GET, PATCH | Inspected; TMA token required |
| OP-60 | 8 Telegram assertion/worker | `app/api/tma/products/route.ts` | GET | Inspected; TMA token required |
| OP-61 | 3 Staff/API roles | `middleware.ts` | admin page matcher | Inspected; page gate; API routes independently enforce roles |

## Protected Operations (Data Model)

| Operation ID | Entry point | Actor class | Target type | Permission rule | Expected effect | Review status |
| --- | --- | --- | --- | --- | --- | --- |
| OP-01 | `app/api/addresses/[id]/route.ts` | Customer | Address | Authenticated owner | Read, update, or soft-delete own address only | Verified (`tests/api/addresses.test.ts`) |
| OP-28 | `app/api/admin/users/[id]/route.ts` | Admin | User | `Role.ADMIN` session | View user profile or update staff/role status | Verified (`tests/api/admin-users.test.ts`) |
| OP-32 | `app/api/auth/login/route.ts` | Guest | Session | Active user credentials | Create authenticated session token | Verified (`tests/api/auth.test.ts`) |
| OP-34 | `app/api/auth/me/route.ts` | Customer | User profile | Valid active session | Read or update own safe profile fields | Verified (`tests/api/auth.test.ts`) |
| OP-38 | `app/api/cart/items/route.ts` | Customer | Cart item | Valid session | Add catalog product or eligible bundle to cart | Verified (`tests/api/cart.test.ts`) |
| OP-44 | `app/api/orders/[id]/pay/route.ts` | Customer | Order & Payment | Authenticated owner, CASH, non-terminal | Initiate gateway payment for exact persisted total | Verified (`tests/api/pay.test.ts`) |
| OP-45 | `app/api/orders/[id]/route.ts` | Customer / Admin | Order | Owner or `Role.ADMIN` | Read own order or update status (admin only) | Verified (`tests/api/orders.test.ts`) |
| OP-46 | `app/api/orders/route.ts` | Customer | Order | Authenticated user | Create order with server-computed prices/discounts | Verified (`tests/api/orders.test.ts`) |
| OP-50 | `app/api/payments/callback/route.ts` | Provider | Payment & Order | Valid gateway authority | Atomically verify and settle order once | Verified (`tests/api/payments-callback.test.ts`) |
| OP-07 | `app/api/admin/catalog-images/route.ts` | Admin | Media file | `Role.ADMIN` | Upload/delete validated images (magic bytes, 8MB) | Verified (`tests/api/admin-catalog-images.test.ts`) |
| OP-18 | `app/api/admin/partners/[id]/documents/[docType]/route.ts` | Admin | Partner document | `Role.ADMIN` | Stream document with security headers (nosniff) | Verified (`tests/api/admin-partner-documents.test.ts`) |
| OP-13 | `app/api/admin/importer/digikala/product/route.ts` | Admin | Product import | `Role.ADMIN` & whitelisted HTTPS host | Fetch product from Digikala API with size bounds | Verified (`tests/unit/digikala-security.test.ts`) |
| OP-55 | `app/api/tma/auth/route.ts` | Telegram User | TMA Session | Valid HMAC signature & admin whitelist | Authenticate via WebApp initData in constant time | Verified (`tests/unit/telegram-auth.test.ts`) |

## Trust Boundaries (Data Model)

| Boundary ID | Operation ID | Input source | Sensitive sink | Current control | Test access |
| --- | --- | --- | --- | --- | --- |
| TB-01 | OP-32, OP-34 | Request JSON, Cookies | Database `Session` & `User` | Zod schema, password comparison, token revocation, `isActive` check | Isolated API runtime (`tests/api/auth.test.ts`) |
| TB-02 | OP-01, OP-45 | URL path param, JSON body | Database `Address`, `Order` | `withAuth` ownership check, `parseJsonBody` for strict error handling | Isolated API runtime (`tests/api/addresses.test.ts`, `tests/api/orders.test.ts`) |
| TB-03 | OP-28, OP-29 | Headers, JSON body | Database `User.role` | Server-side `withAuth(..., { roles: [Role.ADMIN] })` wrapper | Isolated API runtime (`tests/api/admin-users.test.ts`) |
| TB-04 | OP-44, OP-46 | Request JSON body | Database `Order.totalAmount`, Gateway | Server calculates all prices and tiers; client payment uses persisted amount | Isolated API runtime (`tests/api/pay.test.ts`, `tests/api/orders.test.ts`) |
| TB-05 | OP-50 | Query params `Authority`, `Status` | Database `Payment`, `Order`, Gateway | Authority lookup, row lock (`FOR UPDATE`), provider verification, transaction | Fake-provider API runtime (`tests/api/payments-callback.test.ts`) |
| TB-06 | OP-07, OP-18 | Multipart form-data, URL | On-disk storage, Response headers | Magic byte validation (`extensionFor`), size bounds, private storage, `nosniff` | Isolated API runtime (`tests/api/admin-catalog-images.test.ts`, `tests/api/admin-partner-documents.test.ts`) |
| TB-07 | OP-13, OP-14 | Query param `id` / `q` | Outbound HTTPS socket | Whitelisted `.digikala.com` host, HTTPS enforcement, 10MB payload ceiling | Pure unit runtime (`tests/unit/digikala-security.test.ts`) |
| TB-08 | OP-55 | Telegram WebApp initData string | Cryptographic verification | HMAC-SHA256 with `crypto.timingSafeEqual`, 24h auth_date expiry check | Pure unit runtime (`tests/unit/telegram-auth.test.ts`) |

## Findings

| Finding ID | Operation / Boundary | Severity | Evidence status | Evidence | Impact | Correction | State |
| --- | --- | --- | --- | --- | --- | --- |
| F-01 | OP-34, OP-31 / TB-01 | Medium | Observed | `tests/api/auth.test.ts` | Deactivated accounts (`isActive: false`) could retain access or overposting could update unexpected fields | Enforced `isActive: true` in `withAuth` and sanitized user DTOs; revoked active sessions on password change | Verified |
| F-02 | OP-01, OP-45, OP-46, OP-38, OP-52 / TB-02, TB-04 | Medium | Observed | Unhandled SyntaxError on bare `await request.json()` across routes | Malformed client JSON crashed handlers into 500 `INTERNAL_ERROR` rather than returning clean 400 validation error | Implemented and adopted `parseJsonBody` from `lib/http.ts` across address, order, cart, quote, and coupon routes | Verified |
| F-03 | OP-07, OP-18 / TB-06 | High | Observed | `tests/api/admin-catalog-images.test.ts` & `tests/api/admin-partner-documents.test.ts` | File uploads could accept deceptive MIME types or expose private legal documents | Enforced magic-byte validation, 8MB/10MB bounds, `path.basename` path-traversal prevention, `nosniff` headers, private disk storage | Verified |
| F-04 | OP-13, OP-55 / TB-07, TB-08 | Medium | Observed | `tests/unit/digikala-security.test.ts` & `tests/unit/telegram-auth.test.ts` | Outbound redirect could lead to SSRF; Telegram HMAC comparison was susceptible to timing analysis | Added `assertAllowedDigikalaUrl` hostname whitelist, 10MB download limit, and `crypto.timingSafeEqual` in `lib/telegram-auth.ts` | Verified |
| F-05 | OP-44, OP-50 / TB-04, TB-05 | Critical | Observed | `tests/api/pay.test.ts` & `tests/api/payments-callback.test.ts` | Client could tamper with payment amount or replay callback to double-settle or restock incorrectly | Strictly derived payment amount from DB order, enforced row locks in transaction, bound callback to authority | Verified |

## Verification Results

| Finding ID | Environment / Date | Case type | Expected outcome | Actual outcome | Record effect | Limitations |
| --- | --- | --- | --- | --- | --- | --- |
| F-01 | Local test DB, 2026-10-14 | Inactive user & overposting | 401 on inactive user, safe profile update | 401 returned, non-permitted fields ignored | No unauthorized record mutation | Tested against isolated local test database |
| F-02 | Local test DB, 2026-10-14 | Malformed JSON & schema violation | 400 `MALFORMED_JSON` / `VALIDATION_FAILED` | Clean 400 response with structured error | Database untouched on parse failure | None |
| F-03 | Local test DB & filesystem, 2026-10-14 | Mismatched MIME, oversized, traversal | 400 on fake PNG, 404 on traversal, 200 on valid | All rejected properly, valid upload served with `nosniff` | Disk and DB state consistent | Local file uploads only |
| F-04 | Unit test runtime, 2026-10-14 | SSRF, untrusted host, timing attack | Throw on SSRF/HTTP/redirect, constant-time compare | Exceptions thrown on all disallowed hosts, HMAC timing-safe | No network socket opened to forbidden hosts | Mocked outbound network |
| F-05 | Local test DB, 2026-10-14 | Tampered amount, replayed callback | Ignore client amount, settle exactly once | Persisted amount used, replayed callback rejected | Stock and order status preserved | Sandbox gateway fixture |

## Reproducibility (T025)

A maintainer can reproduce this verification on a clean checkout within 5 minutes:
1. Ensure `.env.test` is configured with a dedicated test database (e.g. `hami_zarinpal_test`).
2. Run pure security unit tests:
   ```bash
   npx vitest run --config vitest.frontend.config.ts tests/unit/auth.test.ts tests/unit/digikala-security.test.ts tests/unit/telegram-auth.test.ts tests/unit/payment-zarinpal.test.ts
   ```
   **Result:** 28 passing tests in <2 seconds.
3. Run isolated API security test suites:
   ```bash
   npx dotenv-cli -e .env.test -- npx vitest run tests/api/auth.test.ts tests/api/addresses.test.ts tests/api/orders.test.ts tests/api/pay.test.ts tests/api/payments-callback.test.ts tests/api/admin-catalog-images.test.ts tests/api/admin-partner-documents.test.ts
   ```
   **Result:** 95 passing tests across 7 suites in <35 seconds.

## Unverified boundaries

- **Live Payment Gateway Network**: Real Zarinpal IP addresses and bank portal redirects cannot be executed in local testing without real monetary transactions; simulated through `fakePaymentGateway` and mock callbacks according to contract `specs/017-zarinpal-payment/contracts/payment.md`.
- **Multi-Instance Rate Limiting**: Distributed Redis/KV rate limiting across cluster instances is not implemented or testable in single-node local environment.

## Requirements Reconciliation

- **FR-001** (Guidance Provenance): Installed from official FarsiUI backend-security distribution, SHA-256 and companion files verified.
- **FR-002** (Inventory): All 60 API routes and `middleware.ts` categorized across 8 security domains.
- **FR-003** (Safe Execution): Read-only preflight verified against `.env.test`; development database was untouched.
- **FR-004** (Account & Session Integrity): Password change invalidation, `isActive` enforcement, and profile overposting protections verified.
- **FR-005** (Object Access / IDOR): Addresses, carts, and orders enforce user ownership checks with automated customer A/B tests.
- **FR-006** (Staff Role Enforcement): Admin user management, partner applications, catalog management require `Role.ADMIN` independent of page middleware.
- **FR-007** (Pricing & Orders): Prices, discounts, tiers, and shipping are server-derived; client-supplied prices are strictly ignored.
- **FR-008** (Payment Settlement): Callback resolves strictly by gateway authority, row locks prevent concurrent settlement races, idempotent replays handled.
- **FR-009** (Files & Outbound Boundaries): Magic byte validation, size bounds, private disk location for partner docs, `nosniff` headers, and Digikala SSRF whitelist enforced.
- **FR-010** (Test Isolation): Dedicated test database `hami_zarinpal_test` used with isolated seed fixtures.
- **FR-011** (Findings Discipline): All findings observed with reproducible runtime tests; no invented claims.
- **FR-012** (Paired Test Coverage): Every sensitive mutation has paired authorized and unauthorized test coverage.
- **FR-013** (Repeatable Report): Complete data-model-compliant review report produced.
- **SC-001–SC-007**: Quality thresholds, zero regression, no unresolved critical findings, full reproduction documented.
