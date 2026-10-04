# Implementation Plan: Zarinpal Order Payments

**Branch**: `017-zarinpal-payment` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)

**Input**: Approved feature specification in `specs/017-zarinpal-payment/spec.md`.

## Summary

Complete the existing checkout-to-Zarinpal integration using the current `Order` and `Payment` records, the `PaymentGateway` adapter, and the callback's transaction/conditional-claim design. Keep order totals in Toman in PostgreSQL, convert once at the gateway boundary to integer Rial for both request and verification, return customers to a Persian RTL payment result page, and handle zero-total orders without a gateway request. No new runtime dependency or Prisma table is expected.

## Technical Context

**Language/Version**: TypeScript 5.5; Node.js 20 types; React 19.2.8

**Primary Dependencies**: Next.js 15.5.25 App Router, Prisma 5.20, PostgreSQL, existing `PaymentGateway` interface and Zod; no dependency planned.

**Storage**: Existing `orders` and `payments` tables. `Payment.amount` and `Order.totalAmount` remain in the app's Toman denomination.

**Testing**: Vitest. Existing payment unit and API suites; API checks only with `.env.test` pointed at a separate test schema. Sandbox payment confirmation requires a sandbox merchant ID and a publicly reachable callback URL.

**Target Platform**: Same-origin Next.js app with authenticated checkout/order pages and an unauthenticated gateway callback.

**Project Type**: Single web application with App Router UI, route handlers and Prisma persistence.

**Performance Goals**: Avoid a server-to-self network hop for rendering payment results; bound provider requests with a timeout; never hold a database transaction open during gateway network calls.

**Constraints**: Preserve existing order ownership, B2B credit and stock transition rules; do not mark orders paid from callback parameters; keep merchant secrets server-only; do not use production credentials in local validation; no schema reset or reseed.

**Scale/Scope**: Cash checkout, authenticated retry from order detail, gateway request/verify, payment callback, zero-total settlement, and Persian RTL result state. Wholesale 60-day credit remains outside the gateway path.

## Constitution Check

**Pre-design gate — REQUIRES A RECORDED PRINCIPLE III AMENDMENT BEFORE IMPLEMENTATION**

- **I. Honest Interface — PASS**: Only a server-confirmed provider result or a transactionally completed zero-total order can show success.
- **II. Persian RTL by Default — PASS**: Payment result/error copy remains Persian-first and uses existing RTL components and number formatting.
- **III. Database-backed Storefront and Back Office — APPROVED SCOPE EXPANSION**: The current principle defers the shopper payment journey. The owner explicitly approved implementation of the Zarinpal cash-order path on 2026-10-04. Before source edits, record a narrow amendment for checkout, Zarinpal verification and order settlement; leave unrelated post-purchase fulfillment work out of scope.
- **IV. Design Is Open — Luxury Is the Quality Bar — PASS**: Use existing checkout/order visual language and avoid an unrelated redesign.

**Post-design gate**

- Existing persisted `Payment`/`Order` fields are sufficient; do not add schema fields or run `db:push` unless implementation research proves otherwise and the owner approves a revised plan.
- Existing gateway and settlement APIs stay the integration seam. Provider requests happen outside the order settlement transaction; database writes use conditional state updates and row locking as already established in the callback.
- The mock gateway stays development-only. Production requires a merchant ID, HTTPS public callback origin, and real Zarinpal configuration.
- The approved spec's zero-total path is handled against the existing order lifecycle and inventory reservation; it must not call the gateway.

## Research Findings

See [research.md](./research.md). The application already has order creation, pay initiation, a Zarinpal adapter, a development mock gateway, persisted authority-linked payment attempts, callback verification and transactional order transitions. Main gaps are Toman-to-Rial conversion, a sandbox switch, robust provider response/network handling, callback-to-result navigation, and zero-total settlement.

## Architecture Decisions

1. **Keep existing persistence**: `Payment.amount` stores the original Toman order total; authority, status and provider reference remain on `Payment`. The callback retrieves the amount from this row. No billing model is added.
2. **Convert only at the provider boundary**: A shared conversion function maps stored Toman to integer Rial for both request and verify. The same rounded Rial integer is used for one payment attempt. Reject invalid negative/non-finite values before network calls.
3. **Preserve the gateway seam**: `getPaymentGateway()` selects the Zarinpal adapter when configured, and the mock only in development. Add an explicit sandbox setting and keep credentials server-only. Do not silently fall back to mock in production.
4. **Keep side effects atomic**: Provider I/O happens before/after, never inside, database transactions. Settlement first conditionally claims an initiated payment, then serializes the associated order and applies the established stock/credit transition once.
5. **Return with a safe result state**: The callback redirects to a Persian result page with a small allowlisted status value and an order identifier derived from the persisted authority relation. The page shows no private order details without using the existing authenticated order API.
6. **Settle zero totals locally**: The authenticated pay route checks the persisted order total. Exactly zero creates a completed zero-value payment and transitions the order transactionally; a negative amount fails closed.
7. **No database schema change**: Existing nullable unique authority, decimal amount, payment status, order relation and indices support the flow. Keep `.env` and `.env.test` separate.

## Project Structure

### Documentation

```text
specs/017-zarinpal-payment/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/payment.md
```

`docs/zarinpal-payment.md` contains the CLI-installed provider guide. Repository task tracking will use Beads, as required by `AGENTS.md`; the later `/speckit-tasks` phase will create one Beads item per implementation task and put only their IDs in its task index.

### Source Code (repository root)

```text
app/
├── api/orders/[id]/pay/route.ts        # Authenticated payment request and zero-total settlement
├── api/payments/callback/route.ts      # Provider return, verification and atomic settlement
└── (main)/payment/result/page.tsx      # Persian RTL return experience

components/
├── checkout/CheckoutClient.tsx         # Redirect or render immediate zero-total result
└── order/OrderDetailClient.tsx         # Existing authenticated retry action

lib/payment/
├── gateway.ts                           # Provider config selection and gateway contract
├── zarinpal.ts                          # API request/verify, currency conversion, sandbox URLs
└── mock.ts                              # Development-only behavior remains unchanged

lib/orders.ts                            # Existing status, stock and B2B credit transition rules
types/store.ts                           # Payment initiation response if immediate success needs it
.env.example                             # Sandbox and production configuration examples
AGENTS.md                                 # Link to the installed payment guide
```

**Structure Decision**: Keep one same-origin Next.js application. Browser checkout calls the authenticated payment route; Zarinpal returns to a public callback route; the callback verifies server-to-server and redirects to a minimal result page. Existing order APIs continue to enforce ownership.

## Implementation Sequence (for `/speckit-tasks` after plan approval)

1. Record the narrow constitution Principle III exception and document provider/currency configuration. This is the prerequisite for source changes.
2. Harden the Zarinpal adapter: Toman-to-Rial conversion, sandbox/production endpoint selection, response parsing, timeout and error handling; preserve the mock contract.
3. Harden authenticated payment initiation: validate payable state and persisted amount, create a tracked authority-linked attempt, enforce public HTTPS callback configuration in production, and handle zero/negative totals transactionally.
4. Complete callback behavior: status/cancellation mapping, DB-amount verification, code 100/101 handling, safe duplicate/replay responses, failure transitions, recoverable network errors and final result redirect.
5. Add the result page and connect checkout/order retry responses without changing the B2B credit path.
6. Document configuration and operational behavior, then run focused payment API/unit validation only against an isolated `.env.test` schema, typecheck, production build and browser/manual checks. Perform a real sandbox round trip only when sandbox merchant credentials and a public callback host are configured.

## Dependency Graph and Checkpoints

```text
Constitution/config contract
        ↓
Gateway currency + environment behavior
        ↓
Authenticated payment initiation ───→ zero-total settlement
        ↓                                  ↓
Callback verification + atomic order settlement
        ↓
Persian result page and retry connection
        ↓
Isolated validation, build, sandbox/browser checkpoint
```

- **Checkpoint A — Provider boundary**: request and verify send identical integer Rial; sandbox and production URLs are selected as specified; malformed/failed provider responses never yield an authority success.
- **Checkpoint B — Settlement**: only verified code 100/101 settles; callback replay/concurrency cannot repeat order/stock/credit effects; transient verification failure remains recoverable.
- **Checkpoint C — Shopper path**: cash order can return to checkout result; zero-value orders bypass the gateway; credit orders are unchanged; order ownership remains enforced.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Incorrect currency denomination or rounding | Under/over-charge | Keep Toman persisted; one conversion shared by request and verify; cover boundary values before sandbox confirmation. |
| Provider/API endpoint differences across guides | Requests fail or route incorrectly | Keep the owner-approved `api.zarinpal.com` production v4 API host; explicitly document sandbox and StartPay URLs. |
| Request accepted upstream but local attempt write fails | User could not be linked to payment | Do not return/redirect the authority unless its attempt is persisted; log only a sanitized operational error. |
| Duplicate or racing callback attempts | Duplicate stock/credit changes or paid/failed state conflict | Conditional payment claim and order row lock inside one Prisma transaction; treat already-resolved orders idempotently. |
| Provider verification times out | User may retry or callback may replay | Do not mark paid or failed on transport uncertainty; preserve initiated state and show a recoverable result. |
| Missing/invalid production callback origin or credentials | Payment return cannot reach the app or mock can be exposed | Fail closed before creating gateway requests; require explicit HTTPS `APP_BASE_URL` and merchant ID in production. |
| Existing constitution still excludes shopper payments | Implementation conflicts with project rules | Update the narrow exception first, before source changes, and keep post-purchase fulfillment outside scope. |

## Open Questions

1. A live sandbox round trip cannot be performed until a sandbox merchant ID and publicly reachable callback URL are configured; neither secret will be added to the repository.
