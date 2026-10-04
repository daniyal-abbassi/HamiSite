# Data Model: Zarinpal Order Payments

## Existing Entities (reused)

### Order (`orders`)

- `id`: persisted order primary key.
- `userId`: owner used by authenticated initiation and existing read APIs.
- `status`: order lifecycle (`PENDING`, `PROCESSING`, terminal failure/cancel states).
- `paymentStatus`: current settlement state (`INITIATED`, `COMPLETED`, `FAILED`, etc.).
- `paymentTerm`: distinguishes cash orders from wholesale `CREDIT_60_DAYS` accounting.
- `subtotal`, `discountAmount`, `shippingPrice`, `totalAmount`: server-computed Decimal amounts in the application's Toman denomination.
- `items`: order snapshots and variant references used by existing stock rollback transitions.

### Payment (`payments`)

- `id`: payment-attempt primary key.
- `orderId`, `userId`: attempt ownership/relationship.
- `transactionNumber`: unique internal reference until provider reference is verified.
- `authority`: nullable unique provider binding used to resolve unauthenticated callbacks.
- `amount`: persisted amount in Toman; callback verification must use this value, converted by the shared gateway helper.
- `method`, `psp`: provider classification (`zarinpal`, or `free` for zero-total settlement).
- `status`: `INITIATED`, `COMPLETED`, `FAILED` and existing states.
- `createdAt`, `updatedAt`: attempt lifecycle.

## Settlement Invariants

1. Request amount is derived from a persisted order. Client input never supplies a trusted price.
2. `Payment.amount` remains Toman; `toZarinpalRial(amountToman)` is the only conversion for both gateway request and verification.
3. An authority resolves to at most one payment attempt and the attempt resolves its order; query-string order identifiers are not trusted for settlement.
4. A nonzero attempt becomes completed only after gateway verification code 100 or 101.
5. The conditional payment claim and order row lock ensure status/inventory/credit transitions occur once.
6. A zero-total attempt is created as already completed in the same database transaction that advances the order; it has no gateway authority.
7. No new Prisma model, column, enum or migration is planned.
