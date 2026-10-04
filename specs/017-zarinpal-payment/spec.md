# Feature Specification: Zarinpal Order Payments

**Feature Branch**: `017-zarinpal-payment`

**Created**: 2026-10-04

**Status**: Approved — 2026-10-04

**Input**: User request: explore the Zarinpal payment skill and implement the existing checkout payment path; use the provided `zarinpal-payment` guide and CLI-installed copy at `docs/zarinpal-payment.md`.

## Objective

Let an authenticated retail customer complete a cash order through Zarinpal from checkout, then see a truthful result after the gateway returns. Payment status must be based on server-side verification and the persisted order/payment attempt, never on the browser redirect alone.

## User Scenarios & Testing

### User Story 1 — Pay for a cash order (Priority: P1)

At checkout, a signed-in retail customer submits a valid order and is redirected to the configured Zarinpal payment page. A wholesale credit-term order continues to settle through the existing credit workflow without contacting the gateway.

**Why this priority**: This is the primary shopper journey requested and is already represented by checkout and order-payment routes.

**Independent Test**: With a Zarinpal sandbox merchant configured, create an order using an isolated test database, initiate payment, and verify the generated gateway request uses the server-computed order total, correct rial amount, and a same-origin application callback URL. Confirm the browser receives only a gateway redirect URL and no merchant credential.

**Acceptance Scenarios**:

1. **Given** an authenticated customer with a valid cash order, **When** checkout submits it, **Then** the server creates a persisted payment attempt and redirects the browser to Zarinpal.
2. **Given** a customer submits a client payload containing an altered price, **When** the order is created and payment is initiated, **Then** the gateway amount still comes from the validated persisted order total.
3. **Given** a wholesale customer chooses the existing 60-day credit term, **When** checkout completes, **Then** the credit flow remains unchanged and Zarinpal is not called.
4. **Given** an order total is zero after server-side pricing and discounts, **When** the order is finalized, **Then** it is settled through the application's explicit zero-total path without sending an invalid zero-value gateway request.

### User Story 2 — Confirm or reject a gateway return (Priority: P1)

After Zarinpal redirects the browser to the callback, the server resolves the payment by its stored authority and verifies successful returns against Zarinpal using the stored amount. It transitions the order and payment exactly once and returns the customer to a clear result page.

**Why this priority**: A request/redirect without trusted confirmation cannot safely fulfill an order.

**Independent Test**: With a gateway stub and isolated database, exercise a successful callback, a cancelled callback, a failed verification, a retry/duplicate callback, and a verification network failure; inspect persisted payment and order state after each.

**Acceptance Scenarios**:

1. **Given** a pending attempt and callback `Status=OK`, **When** Zarinpal confirms code 100, **Then** the payment stores the gateway reference and the order advances using the existing order-status transition rules.
2. **Given** Zarinpal returns code 101 for an already-verified authority, **When** the callback is repeated, **Then** the customer sees success and stock, credit, and order transitions are not applied twice.
3. **Given** callback `Status=NOK`, **When** the gateway returns the customer, **Then** the attempt and order follow existing failure/reversal rules and the result page reports cancellation/failure.
4. **Given** an unknown authority or mismatched optional order identifier, **When** a callback arrives, **Then** no order is settled and the customer receives a safe failure result.
5. **Given** the verification service is unavailable, **When** the callback cannot be verified, **Then** no paid state is written; the attempt remains safely retryable and the customer sees a recoverable result.
6. **Given** two callbacks race for the same or different attempts on one order, **When** both are processed, **Then** persisted order transitions and inventory/credit reversals occur at most once.

### User Story 3 — Understand the payment result and recover (Priority: P2)

Customers returning from the gateway see a Persian RTL result for success, cancellation, verification failure, unknown attempt, or temporary gateway failure, with a safe route to their order or orders list.

**Why this priority**: Customers need confirmation and a retry path without treating a browser redirect as proof of payment.

**Independent Test**: Open each supported result state and verify its message, order link behavior, and retry destination; confirm order data remains protected by the existing session authorization.

**Acceptance Scenarios**:

1. **Given** a verified payment, **When** the customer returns, **Then** a success state is shown with a link to the authenticated order detail.
2. **Given** a cancelled or rejected payment, **When** the customer returns, **Then** the page clearly distinguishes it from success and offers the existing order retry path when the order remains payable.
3. **Given** a guest opens a result URL containing an order identifier, **When** they follow the order link, **Then** existing authentication and ownership checks still apply.

## Edge Cases

- Zarinpal request creation succeeds but the local payment attempt cannot be stored; the user must not be redirected to an untracked authority.
- The same authority callback is delivered repeatedly after success or failure.
- An order has several payment attempts and one settles before another callback arrives.
- The user changes or closes the browser while payment is pending.
- The merchant ID is absent, the sandbox flag is invalid, the configured public URL is absent, or production callback URL is not HTTPS.
- Gateway responses are non-JSON, malformed, or contain an unexpected status code.
- The order amount is fractional in Toman; request and verify must use the same deterministic integer-rial conversion.

## Functional Requirements

- **FR-001**: Cash checkout MUST initiate payment using the server-created order and its persisted final total; client-provided amount fields MUST NOT affect the gateway amount.
- **FR-002**: The application MUST preserve each payment attempt in the existing `Payment` model, including its unique authority, order, user, amount in the application's Toman unit, provider and status.
- **FR-003**: The Zarinpal adapter MUST convert stored Toman to the integer Rial amount required by the supplied guide using one shared conversion for both request and verify.
- **FR-004**: The merchant credential MUST remain server-side; production MUST use the real gateway and fail closed when configuration is incomplete. Local development MAY use the existing mock gateway when no merchant credential is configured.
- **FR-005**: The callback MUST resolve the order only through the stored authority. It MUST ignore client-supplied amount and MUST verify `Status=OK` with the stored payment amount before marking a payment successful.
- **FR-006**: Verification code 100 MUST record the reference and settle the existing order. Code 101 MUST be treated as an idempotent success without repeating order, inventory, or credit transitions.
- **FR-007**: Cancellation and definite verification failure MUST follow the existing order failure/status-transition behavior. Temporary gateway/network failure MUST NOT grant or record payment success and MUST leave a safe recovery path.
- **FR-008**: Callback processing MUST handle repeated and concurrent callbacks without double-settling an order or double-adjusting inventory/credit.
- **FR-009**: The callback MUST return the browser to an accessible Persian RTL result page with distinct success, cancelled/failed, unknown-attempt, configuration, and temporary-error states.
- **FR-010**: Zero-total orders MUST bypass Zarinpal and use a persisted, transactionally applied zero-total settlement path; negative totals MUST be rejected.
- **FR-011**: The existing wholesale credit-term path and development-only mock confirmation route MUST retain their current intended behavior.
- **FR-012**: Sandbox/production endpoints and the public callback URL MUST be configured explicitly; a production callback MUST use HTTPS and the merchant ID MUST never appear in client responses or logs.
- **FR-013**: Payment initiation, callback, result, and order retry behavior MUST preserve existing same-origin session, order ownership, and status transition rules.

## Key Entities

- **Order**: Existing persisted purchase, authoritative final amount, customer, items, and order/payment statuses.
- **Payment attempt**: Existing persisted attempt bound to one order and user by a unique gateway authority; stores the amount in Toman, provider, status, and verified reference.
- **Gateway result**: Untrusted callback inputs plus the server-to-server verification outcome; only the latter can settle a payment.

## Tech Stack and Commands

- Next.js App Router, TypeScript, Prisma, PostgreSQL, existing Zarinpal gateway interface.
- Type validation: `npm run typecheck`
- Unit tests: `npm run test:unit`
- API tests: `npm test -- tests/api/pay.test.ts tests/api/payments-callback.test.ts` only when `.env.test` points to an isolated database schema.
- Build: `npm run build` only after stopping any Next server using `.next`; restart it after the build before browser checks.

## Project Structure

- Gateway behavior: `lib/payment/`.
- Order/payment APIs: `app/api/orders/` and `app/api/payments/`.
- Checkout and customer results: `components/checkout/`, `app/(main)/payment/`, and existing order routes.
- Persistence contract: `prisma/schema.prisma` and existing `Payment`/`Order` tables; schema additions are not expected unless plan research proves they are necessary.
- Tests: existing `tests/unit/payment-*` and `tests/api/pay*` suites.
- Installed guide: `docs/zarinpal-payment.md`.

## Code Style

- Keep gateway calls behind the existing `PaymentGateway` interface.
- Compute and persist the amount on the server before redirecting; use the same pure Toman-to-Rial conversion in request and verification.
- Use Prisma transactions and conditional status updates for settlement; keep gateway/network calls outside database transactions.
- Keep Persian customer-facing messages, RTL page structure, and existing API envelopes.

## Testing Strategy

- Unit coverage for currency conversion, sandbox/production URL selection, malformed responses, codes 100/101, and timeout/error behavior.
- API coverage for order ownership, server-derived amount, payment-attempt persistence, callback success/failure, unknown authority, duplicates, concurrent callbacks, and zero totals using isolated `.env.test`.
- Live sandbox confirmation requires an owner-provided sandbox merchant ID; no production charge is part of local validation.
- Browser check checkout → gateway redirect → return result at desktop/mobile widths when sandbox credentials and reachable callback host are available.

## Boundaries

- **Always**: trust persisted order totals and gateway verification; do not expose credentials; use the existing database rows and transition helpers; protect order details with existing auth.
- **Ask first**: add dependencies, alter the Prisma payment/order schema, change inventory/credit accounting, or enable production payment credentials.
- **Never**: commit merchant secrets, mark an order paid from callback query parameters alone, verify using a client amount, or use the development-only mock confirmation in production.

## Success Criteria

- **SC-001**: A valid cash order yields one tracked payment attempt and a Zarinpal redirect whose request and verify amounts are identical and correctly converted from stored Toman.
- **SC-002**: Only a verified code 100/101 (or the approved zero-total path) produces a paid order; failed, cancelled, unknown, and unavailable gateway cases never show success.
- **SC-003**: Replaying or racing callbacks settles an order and applies inventory/credit effects at most once.
- **SC-004**: Customers can understand every return state and reach/retry their own order without weakening authorization.
- **SC-005**: No merchant credential or secret payment detail appears in browser bundles, API responses, logs, or committed configuration.

## Assumptions

- Existing order amounts are stored and displayed in Toman; the supplied Zarinpal guide requires Rial, so the gateway boundary multiplies by ten.
- Existing `Payment` and `Order` persistence and `applyOrderStatusTransition` rules are authoritative; a separate billing table is not needed.
- `APP_BASE_URL` is the canonical public origin for gateway callbacks; production configuration must be HTTPS and publicly reachable.
- The mock gateway remains for local development without a merchant ID; live payment tests use sandbox credentials supplied outside the repository.
- Zero-total cash orders may be completed without a bank request, but only after server-side order pricing and discount validation.

## Open Questions

- None. The owner approved the assumptions and acceptance criteria on 2026-10-04; production credentials remain an operator-provided deployment configuration.
