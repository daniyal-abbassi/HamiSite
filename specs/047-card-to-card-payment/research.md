# Research: Card-to-Card Payment

## D1 — No new status: reuse `PaymentStatus.SENT`
**Decision**: Order and Payment payment states map as: unpaid = `INITIATED`; customer reported = `SENT`; confirmed = `COMPLETED`; rejected = back to `INITIATED` (the rejected Payment row becomes `FAILED`).
**Rationale**: `SENT` exists in the enum and no code reads or writes it (checked: only `INITIATED`, `COMPLETED`, `FAILED` are used). This satisfies the owner's "no awaiting-verification status" without a schema or enum change. The gateway's guard `claimed where status = INITIATED` stays valid because manual Payment rows use `method = "card-to-card"` and no `authority`.
**Alternatives**: a new enum value — rejected by the owner.

## D2 — Where the customer is diverted
**Decision**: In `POST /api/orders/:id/pay`, after the existing ownership, paid/terminal and zero-total checks, if the setting is on return `{ manual: true, orderId }` and skip the gateway. `CheckoutClient` and `OrderDetailClient` (the two callers) push to `/order/:id/transfer` on `manual`.
**Rationale**: one decision point, and the order-page "pay" button follows the same rule automatically.

## D3 — The on/off setting
**Decision**: New table `site_settings` (`key` unique string, `value` string, `updatedAt`). Key `payment.cardToCard`, value `"on"` or `"off"`. Read through `lib/site-settings.ts`. **Default when the row is missing or the read fails: on.**
**Rationale**: the owner wants the switch in the dashboard, which needs persistence; this is the smallest persistent store. The default is on because the safe failure while the gateway is down is the manual path, and a missing table before `db:push` must not break checkout. The deploy sets the value explicitly.
**Alternatives**: an environment variable (rejected: not in the dashboard, needs a restart); reusing an unrelated table (rejected: hack).

## D4 — Report is idempotent and alerts once
**Decision**: `POST .../report` runs one transaction: lock the order (`SELECT ... FOR UPDATE` as the callback does), `updateMany where paymentStatus = INITIATED` set `SENT`; if the claim count is 1, create the Payment row (`method "card-to-card"`, `status SENT`, `amount` = order total, unique `transactionNumber`). Only the call that wins the claim sends the alert. A repeat call returns the current state with no alert.
**Rationale**: satisfies FR-007, FR-008 and the double-tap edge case using the same locking pattern as the callback.

## D5 — Admin confirm and reject reuse gateway settlement rules
**Decision**: New admin-only `POST /api/admin/orders/:id/payment` with `{ action: "confirm" | "reject" }`. Confirm: lock order; refuse if already `COMPLETED` or terminal; mark the latest manual Payment `COMPLETED` (create one if the customer never reported); set order `paymentStatus COMPLETED`, `status PROCESSING` via `applyOrderStatusTransition`; send the existing new-order alert as the gateway callback does. Reject: only from `SENT`; Payment row → `FAILED`, order `paymentStatus` → `INITIATED`.
**Rationale**: mirrors `app/api/payments/callback/route.ts` and `app/api/orders/[id]/pay/route.ts` (zero-total branch) so stock and terminal-state protections stay identical.

## D6 — Admin alert channel
**Decision**: Add `notifyAdminsPaymentReported` next to `notifyAdminsNewOrder`, reusing its Telegram transport and "open in mini app" button.
**Finding**: the production env has no Telegram variables, so today no alert is sent in production, including the new-order alert. FR-009 keeps the report visible in the admin panel regardless.
**Needs the owner**: a Telegram bot token and their chat ID, set in `.env.production.local`. Fallback if they prefer: an SMS to the owner through the existing SMS.ir account, which needs a second approved template (not planned unless asked).

## D7 — Bank details placement
**Decision**: Constants in `lib/payment/card-to-card.ts`, returned only by `GET /api/orders/:id/manual-payment` to the signed-in owner of an unpaid order while the mode is on (FR-018). Not in any client component.
**Alternatives**: store in `site_settings` and make editable — deferred, mentioned as an open item.

## D8 — Admin surfaces
**Decision**: The switch is a small card on the admin dashboard (`app/(admin)/admin/page.tsx`) calling `PUT /api/admin/settings/card-to-card`. The orders list gets a `paymentStatus` filter so "awaiting verification" is `paymentStatus = SENT`. The order detail screen gets confirm and reject buttons. The Telegram mini-app order sheet is left alone for now.

## Resolved unknowns
Where the switch lives: admin dashboard (owner decision). New status needed: no (owner decision, D1).
