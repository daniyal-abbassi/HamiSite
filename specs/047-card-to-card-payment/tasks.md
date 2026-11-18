---

description: "Task list for Card-to-Card Payment While the Gateway Is Down"
---

# Tasks: Card-to-Card Payment While the Gateway Is Down

**Input**: Design documents from `/specs/047-card-to-card-payment/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/card-to-card-api.md

**Tests**: Included. Money and alert-once guarantees need API tests; they run only against a dedicated test database (CI has one, this machine does not).

**Organization**: Grouped by user story. Status: implementation complete on branch `feat/card-to-card-payment`; T032 (CI), T035 to T037 (owner actions, deploy, live check) remain.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on open tasks)
- **[Story]**: US1 to US4, as in spec.md

## Phase 1: Setup

- [x] T001 Create the branch `feat/card-to-card-payment` from `main`; stage by explicit path only (never `git add -A`, the working tree holds the owner's uncommitted edits)

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: the setting store, the money helpers and the alert that every story uses.

- [x] T002 Add `model SiteSetting` to `prisma/schema.prisma` mapped to `site_settings`: `id Int @id @default(autoincrement())`, `key String @unique`, `value String`, `updatedAt DateTime @updatedAt`. Additive only; apply with `npm run db:push`, never `migrate reset` or reseed (data-model.md)
- [x] T003 Add `prisma.siteSetting.deleteMany()` to `resetDb()` in `tests/helpers/db.ts` so the test database stays clean
- [x] T004 [P] Create `lib/site-settings.ts`: `getCardToCardEnabled()` returns `true` when the row `payment.cardToCard` is missing, is `"on"`, or the read throws (default on, research D3); `setCardToCardEnabled(enabled)` upserts `"on"`/`"off"`
- [x] T005 [P] Create `lib/payment/card-to-card.ts` exporting the bank details exactly as in spec.md Assumptions (bank `بانک ملت`, card `6104 3387 9323 1370`, account `2401092980`, IBAN `IR78 0120 0100 0000 2401 0929 80`, holder `اسماعیل عباسی`) as constants, plus the method name `"card-to-card"`
- [x] T006 [P] In `lib/telegram-bot.ts` add `formatPaymentReportedMessage` and `notifyAdminsPaymentReported` beside `notifyAdminsNewOrder`: Persian text with order number, amount, customer name, mobile number and time, the same mini-app button, never throws (FR-007, research D6)
- [x] T007 Create `tests/api/card-to-card.test.ts` with the shared setup (seed, login cookies, Telegram sender mocked via `vi.mock("@/lib/telegram-bot")`, a helper that creates an unpaid order for `seed.retail`)

**Checkpoint**: setting, constants and alert exist; later tasks only wire them in.

---

## Phase 3: User Story 1 - Customer is shown how to pay by card-to-card transfer (Priority: P1) 🎯 MVP

**Goal**: With the mode on, checkout ends on a transfer page showing the order number, exact amount and bank details.

**Independent Test**: Place an order as a customer with the setting on: checkout lands on `/order/<id>/transfer` with the correct number, total and bank details; another user gets `403`; a zero-total order is unaffected.

- [x] T008 [P] [US1] In `tests/api/card-to-card.test.ts`: setting on → `POST /api/orders/:id/pay` returns `{ manual: true, orderId }` and the mocked gateway is not called; setting off → unchanged gateway response; zero-total order still settles (`free: true`) (FR-001, FR-015, FR-016)
- [x] T009 [P] [US1] In `tests/api/card-to-card.test.ts`: `GET /api/orders/:id/manual-payment` returns `orderNumber`, `amount` equal to the order total and the T005 bank details to the owner; `403` for another user, `404` unknown order, `409` for a paid or terminal order, `409` when the setting is off (FR-003, FR-010, FR-018)
- [x] T010 [US1] In `app/api/orders/[id]/pay/route.ts`: after the existing ownership, paid/terminal and zero-total checks, if `getCardToCardEnabled()` return `ok({ manual: true, orderId })` before any gateway call (research D2)
- [x] T011 [US1] Create `app/api/orders/[id]/manual-payment/route.ts` (`GET`, `withAuth`, owner only) per the contract; the bank details come from `lib/payment/card-to-card.ts` and are never imported by a client component (FR-018, research D7)
- [x] T012 [US1] Extend `PaymentInitiation` in `types/store.ts` with `{ manual: true; orderId: number; free?: never; redirectUrl?: never; authority?: never }`
- [x] T013 [P] [US1] In `components/checkout/CheckoutClient.tsx` (after `apiPost(.../pay)`): when `payment.manual`, `router.push(`/order/${order.id}/transfer`)`; keep the existing `free` and redirect branches
- [x] T014 [P] [US1] In `components/order/OrderDetailClient.tsx` (the `/pay` call near line 59): same `manual` branch so the order-page pay button reaches the transfer page too (FR-014)
- [x] T015 [US1] Create `app/(main)/order/[id]/transfer/page.tsx` and a client component `components/order/TransferClient.tsx`: right-to-left Persian page saying the payment gateway is temporarily down because of high demand and that the order can be paid by card-to-card; shows order number, amount in Toman, and card number, account number, IBAN and holder; a copy button on card, account and IBAN that copies the number and shows a confirmation, with the number also shown selectable; instructions to transfer the exact total, keep the receipt and tap the button afterwards; readable at 360px, buttons at least 44x44px, labeled for screen readers (FR-002 to FR-005, FR-017)

**Checkpoint**: US1 works alone: customers can see how to pay. It is the shippable MVP.

---

## Phase 4: User Story 2 - Customer tells the shop they have paid, and the admin is alerted (Priority: P1)

**Goal**: One tap records the report and alerts the admin exactly once.

**Independent Test**: Tap "I have paid" on an unpaid order: `paymentStatus` becomes `SENT`, one Payment row exists, one alert is sent; a second or concurrent tap changes nothing and sends nothing.

- [x] T016 [P] [US2] In `tests/api/card-to-card.test.ts`: first report returns `paymentStatus: "SENT"`, `alreadyReported: false`, creates one `Payment` (`method "card-to-card"`, `status SENT`, `amount` = order total) and calls `notifyAdminsPaymentReported` once; a repeat returns `alreadyReported: true` with no alert and no second row; two concurrent reports give one alert and one row (FR-007, FR-008, SC-002)
- [x] T017 [P] [US2] In `tests/api/card-to-card.test.ts`: an alert that throws still leaves the order `SENT` and the Payment row recorded, and the response is `200` (FR-009); a non-owner gets `403` and nothing changes; a `COMPLETED` or terminal order returns `409` (FR-010)
- [x] T018 [US2] Create `app/api/orders/[id]/manual-payment/report/route.ts` (`POST`, `withAuth`, `assertSameOrigin`): in one transaction lock the order (`SELECT id FROM "orders" WHERE id = ... FOR UPDATE`), `updateMany` where `paymentStatus = INITIATED` set `SENT`, and only if the claim count is 1 create the Payment row with `transactionNumber` `<orderNumber>-<8 hex>`, `userId` = owner, no `authority`; after commit call `notifyAdminsPaymentReported(...)` without awaiting and without letting it fail the request (research D4)
- [x] T019 [US2] In `components/order/TransferClient.tsx`: the "I have paid" button posts to the report route, disables while sending, then shows "your payment report was received and the order is waiting for verification"; when the page loads with `paymentStatus "SENT"` it shows that state and no active button (FR-006, FR-008)
- [x] T020 [P] [US2] In `components/order/OrderDetailClient.tsx`: when `paymentStatus` is `SENT`, show "در انتظار تأیید پرداخت" in place of the pay button (FR-011)

**Checkpoint**: US1 and US2 together give the full customer path and the alert.

---

## Phase 5: User Story 3 - Admin verifies the transfer and confirms the order (Priority: P2)

**Goal**: The admin finds reported orders and confirms or rejects them; confirming settles like the gateway.

**Independent Test**: With a reported order, confirm it in the admin panel: order is `PROCESSING` and paid; the customer sees it paid; rejecting returns it to unpaid.

- [x] T021 [P] [US3] In `tests/api/card-to-card.test.ts`: confirm from `SENT` sets order `paymentStatus COMPLETED` and `status PROCESSING`, marks the manual Payment `COMPLETED`; confirm from `INITIATED` (never reported) works and creates a `COMPLETED` Payment; a second confirm returns `409`; confirm on a terminal order returns `409` (FR-012)
- [x] T022 [P] [US3] In `tests/api/card-to-card.test.ts`: reject from `SENT` returns the order to `INITIATED` and marks that Payment `FAILED`, after which the customer can report again; reject from `INITIATED` returns `409`; a non-admin gets `403` on both actions (FR-011, FR-012)
- [x] T023 [P] [US3] In `tests/api/card-to-card.test.ts`: `GET /api/admin/orders?paymentStatus=SENT` returns only reported orders; an unknown value returns `400` (FR-013)
- [x] T024 [US3] Create `app/api/admin/orders/[id]/payment/route.ts` (`POST`, `withAuth` roles `[Role.ADMIN]`, body `{ action: "confirm" | "reject" }`): lock the order, reuse `applyOrderStatusTransition` and the terminal-state guard exactly as `app/api/payments/callback/route.ts` does; confirm also calls `notifyAdminsNewOrder` like the callback; `revalidateHomepage()` after (research D5)
- [x] T025 [US3] In `app/api/admin/orders/route.ts`: accept an optional `paymentStatus` query validated with `z.nativeEnum(PaymentStatus)` and add it to `where`; `400 "Invalid paymentStatus"` otherwise
- [x] T026 [P] [US3] In `components/admin/orders/OrdersAdminClient.tsx`: add an "در انتظار تأیید" filter that requests `paymentStatus=SENT`, next to the existing status filter
- [x] T027 [P] [US3] In `components/admin/orders/OrderAdminDetailClient.tsx`: when `paymentStatus` is `INITIATED` or `SENT` show "تأیید پرداخت" and, only for `SENT`, "رد پرداخت", each behind a confirmation prompt, calling the T024 route and refreshing the order

**Checkpoint**: the admin can release or bounce a reported payment; US1 to US3 are the full money flow.

---

## Phase 6: User Story 4 - Return later, and switch back to the gateway (Priority: P3)

**Goal**: The owner flips the mode from the dashboard; customers can return to the transfer page.

**Independent Test**: Turn the switch off in the dashboard: a new order goes to the gateway. Turn it on: it goes to the transfer page. An unpaid order opens the transfer page from the order page.

- [x] T028 [P] [US4] In `tests/api/card-to-card.test.ts`: `PUT /api/admin/settings/card-to-card` `{ enabled: false }` then `GET` returns `false` and `/pay` takes the gateway path; non-admin gets `403`; with no row the setting reads as on (FR-015, SC-006)
- [x] T029 [US4] Create `app/api/admin/settings/card-to-card/route.ts` (`GET`, `PUT`, `withAuth` roles `[Role.ADMIN]`, body validated `{ enabled: boolean }`) using `lib/site-settings.ts`
- [x] T030 [US4] Add a small card component `components/admin/dashboard/CardToCardSwitch.tsx` (accessible switch, current state loaded from the T029 `GET`, optimistic update with error rollback, Persian label "پرداخت کارت‌به‌کارت") and render it on `app/(admin)/admin/page.tsx` below the dashboard
- [x] T031 [US4] In `components/order/OrderDetailClient.tsx`: when the mode is on and the order is unpaid, the pay button leads to the transfer page (covered by T014); when the mode is off it leads to the gateway as today. Confirm both with the existing order-page flow

**Checkpoint**: all four stories work and the owner can switch modes.

---

## Phase 7: Polish and release

- [ ] T032 Run `npm run typecheck`; open the PR; wait for CI (typecheck and API tests) to pass
- [x] T033 Update `specs/001-premium-rtl-storefront` or the payment docs only if a doc names the gateway as the only payment path (grep `docs/zarinpal-payment.md` and `docs/api/*` for "pay" contracts); amend them with the manual path
- [x] T034 Add a constitution amendment entry (v1.5.0 → 1.6.0) recording the owner's instruction of 2026-11-19 for the manual payment path
- [ ] T035 Owner action, before deploy: provide `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ADMIN_IDS` and put them in the server's `.env.production.local` (missing today, so no alert would be sent); confirm the bank details in spec.md Assumptions character for character (SC-007)
- [ ] T036 Merge, then deploy to `i-083f7151b773eb5a3`: build in the separate copy `/var/www/hami-build` with `NODE_OPTIONS=--max-old-space-size=1536`; run `npm run db:push` against the production database (additive table only, no reset, no seed); sync `.next`; `pm2 reload tools/deploy/ecosystem.config.cjs --update-env`; set the switch explicitly from the dashboard
- [ ] T037 Run the manual steps in `quickstart.md` on https://hamihamrah-shop.cyou: test order, transfer page, "I have paid" alert, confirm, switch off and on

---

## Dependencies and order

- T001 → T002 → T003. T004, T005, T006 can run in parallel after T002 (T004 needs the table). T007 needs T003.
- US1 (T008 to T015): T010, T011 need T004 and T005; T012 before T013 and T014; T015 needs T011.
- US2 (T016 to T020) needs T006 and T018 needs the transfer page route from US1 only for the UI (T019).
- US3 (T021 to T027) is independent of US2 in code but its tests build orders in the `SENT` state through the report route (T018) or by direct database setup.
- US4 (T028 to T031): T029 before T030.
- Polish: T032 → T033 → T034 → T035 → T036 → T037. T035 must finish before T036.

## Parallel opportunities

- T004, T005, T006 (different files).
- Within a story, the test tasks marked [P] (same file, different cases) and the component tasks marked [P] (T013, T014, T020, T026, T027).

## Implementation strategy

1. **MVP**: Phase 1, Phase 2, then US1 only. This alone lets customers see how to pay.
2. **Money flow**: US2 and US3 together are what make payments usable; ship them in the same release as US1 because a transfer page without an alert or a confirm path strands orders.
3. **Then**: US4 (the dashboard switch). Until it ships the owner can change the setting through the T029 route or the database; the default is on.

## Summary

- 37 tasks: Setup 1, Foundational 6, US1 8, US2 5, US3 7, US4 4, Polish 6.
- Open items that need you, not code: T035 (Telegram settings, bank detail confirmation).
