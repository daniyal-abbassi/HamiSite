# Contract: Card-to-Card Payment API

All routes use the existing JSON envelope (`{ success, data | error }`), same-origin, session cookie.

## `POST /api/orders/:id/pay` (changed)
Unchanged checks (owner only, not paid, not terminal, zero total settles at once). New: if the setting is on and the total is above zero, respond `200 { manual: true, orderId }` and call no gateway. If the setting is off, behave as today. Response type becomes `PaymentInitiation | { manual: true; orderId: number }`.

## `GET /api/orders/:id/manual-payment` (new, customer)
Owner only; `403` for another user, `404` unknown order, `409` if the order is already paid or terminal, `409` if the setting is off.
`200 { orderNumber, amount, paymentStatus: "INITIATED" | "SENT", bank: { bankName, cardNumber, accountNumber, iban, holder } }`

## `POST /api/orders/:id/manual-payment/report` (new, customer)
Owner only, same-origin. No body. Atomically moves `INITIATED → SENT`.
- Winner of the claim: creates the manual Payment row, sends one admin alert, `200 { paymentStatus: "SENT", alreadyReported: false }`.
- Already `SENT`: `200 { paymentStatus: "SENT", alreadyReported: true }`, no alert.
- `COMPLETED` or terminal: `409`.
Alert failure never changes the response; the report stays recorded.

## `GET /api/admin/settings/card-to-card`, `PUT /api/admin/settings/card-to-card` (new, ADMIN)
`GET → 200 { enabled: boolean }`. `PUT { enabled: boolean } → 200 { enabled }`. Non-admin: `403`.

## `POST /api/admin/orders/:id/payment` (new, ADMIN)
`{ action: "confirm" | "reject" }`.
- `confirm`: from `INITIATED` or `SENT`; order becomes `PROCESSING` + `COMPLETED`; sends the existing new-order alert. `409` if already `COMPLETED` or terminal.
- `reject`: only from `SENT`; order returns to `INITIATED`; `409` otherwise.

## `GET /api/admin/orders` (changed)
New optional query `paymentStatus` (a `PaymentStatus` value). Unknown value: `400`.

## Admin alert text (Persian, Telegram)
Order number, amount, customer name and mobile number, time, and the mini-app button used for new-order alerts.
