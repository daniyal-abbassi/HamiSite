# Quickstart: Validating Card-to-Card Payment

Prerequisites: a dedicated test database (the suite refuses any other). Never run tests against production or development data.

## Automated
1. `npm run typecheck`
2. `npx vitest run tests/api/card-to-card.test.ts` with the Telegram sender mocked.

Expected cases (see `contracts/card-to-card-api.md`):
- setting on: `/pay` returns `{ manual: true }` and calls no gateway; setting off: gateway path unchanged; zero-total order unaffected
- `GET manual-payment`: owner gets the bank details; another user `403`; paid or terminal order `409`
- report: first call moves `INITIATED → SENT`, creates one Payment row, sends one alert; second call and a concurrent pair send no extra alert and create no extra row
- confirm: order `PROCESSING` + `COMPLETED`; second confirm `409`; confirm without a prior report works
- reject: back to `INITIATED`; reject from `INITIATED` `409`
- non-admin cannot confirm, reject or flip the setting
- admin order list filters by `paymentStatus=SENT`

## Manual (after deploy)
1. Run `db:push` on the server (additive table). Set the switch on from the admin dashboard.
2. Place a test order as a customer: checkout lands on the transfer page with the right amount and the bank details from the spec; the copy buttons work.
3. Tap "I have paid": you receive the alert (needs the Telegram variables) and the page shows it was reported; a second tap sends nothing.
4. In the admin panel: filter orders awaiting verification, confirm the test order, check the customer sees it paid.
5. Turn the switch off: a new order goes to the gateway.
