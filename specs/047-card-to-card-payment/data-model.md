# Data Model: Card-to-Card Payment

## New table: `SiteSetting` (`site_settings`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int, autoincrement | primary key |
| `key` | String, unique | e.g. `payment.cardToCard` |
| `value` | String | `"on"` or `"off"` for this feature |
| `updatedAt` | DateTime, `@updatedAt` | |

Created with `db:push` (additive). Missing row or failed read means **on** (research D3).

## Existing tables, reused

**Order**: `paymentStatus` carries the payment state; no new column.

| State | `Order.paymentStatus` | Latest manual `Payment.status` |
|-------|----------------------|--------------------------------|
| Unpaid | `INITIATED` | none, or `FAILED` after a rejection |
| Customer says paid | `SENT` | `SENT` |
| Confirmed | `COMPLETED` (order `status` → `PROCESSING`) | `COMPLETED` |

**Payment** (manual row): `method = "card-to-card"`, `psp = null`, `authority = null`, `amount` = order total, `transactionNumber` = `<orderNumber>-<8 hex>`, `userId` = the order owner.

## State transitions

```text
INITIATED --(customer reports)--> SENT --(admin confirms)--> COMPLETED
                                   |
                                   +--(admin rejects)--> INITIATED
INITIATED --(admin confirms without a report)--> COMPLETED
```
A `COMPLETED` or terminal order (`CANCELED`, `FAILED`, `REVERSED`) accepts no further report, confirmation or rejection.

## Invariants
- At most one active report per order (the `INITIATED → SENT` claim is atomic).
- Only an admin can move an order to `COMPLETED` through this path.
- A manual Payment row is never reachable by a gateway callback (no `authority`).
