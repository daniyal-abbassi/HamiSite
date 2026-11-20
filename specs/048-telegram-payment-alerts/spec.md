# Feature Specification: Reliable Telegram Alerts for Card-to-Card Payments

**Feature Branch**: `048-telegram-payment-alerts` (not created; no branch hook is configured)

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "When a customer wants to pay by card-to-card, no message arrives in the Telegram bot we set up."

## What was found before writing this

Read-only checks on the production server on 2026-11-21:

- The bot token and one administrator chat are configured; the server can reach Telegram.
- The production log shows both alert types failing on 2026-11-19: the "new order" alert and the "customer reported a card-to-card payment" alert. Each was rejected by Telegram with HTTP 400 ("bad request").
- The 400 response body, which says *why*, is thrown away, so the log cannot tell us whether the cause is the message format, the button link, or the administrator not having started the bot.

So this is not specific to card-to-card: **every administrator alert is failing**, and the system gives no usable signal about the reason. The shop owner only notices when a customer has already paid and nobody reacts.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin is alerted when a customer reports a card-to-card payment (Priority: P1) 🎯 MVP

A customer pays by card-to-card transfer and taps "I have paid". The administrator receives one Telegram message with the order number, amount, customer name, mobile number and time, plus a button that opens the order for verification.

**Why this priority**: This message is the only way the owner learns that money is waiting to be verified. Without it, paid orders sit unnoticed.

**Independent Test**: Place a test order, choose card-to-card, tap "I have paid", and confirm the administrator's Telegram shows exactly one alert for that order within one minute.

**Acceptance Scenarios**:

1. **Given** a customer on the transfer page with an unpaid order, **When** they tap "I have paid", **Then** the administrator receives one Telegram alert for that order within one minute.
2. **Given** an order whose customer name or city contains characters that are special in Telegram formatting (underscores, asterisks, brackets, backticks), **When** the alert is sent, **Then** it is still delivered and the text shows those characters as written.
3. **Given** the customer taps "I have paid" twice, **When** the second tap is processed, **Then** no second alert is sent.
4. **Given** several administrators are configured, **When** an alert is sent, **Then** every one of them who can receive it does, and one unreachable administrator does not block the others.

---

### User Story 2 - Admin is alerted when a new order is placed (Priority: P1)

When a customer places any order, the administrator receives the "new order" alert with the button that opens the order sheet in the Telegram mini app.

**Why this priority**: It fails for the same reason as Story 1 and shares the same sending path. Fixing one without the other would leave the shop half-blind.

**Independent Test**: Place a test order and confirm one "new order" alert arrives with a working button.

**Acceptance Scenarios**:

1. **Given** a customer places an order, **When** it is saved, **Then** the administrator receives a "new order" alert within one minute.
2. **Given** the administrator taps the button in the alert, **When** the mini app opens, **Then** it shows that order.

---

### User Story 3 - A failed alert is visible and explained (Priority: P2)

When Telegram refuses or cannot be reached, the failure is recorded with the reason Telegram gave, and an order that was reported as paid but never alerted can be found afterwards.

**Why this priority**: The failure went unnoticed for days because the reason was discarded. Even after the fix, the owner needs to know when alerts stop working again.

**Independent Test**: Temporarily configure an invalid recipient and confirm the server log names the Telegram reason, and that the affected order can be identified as "reported, not alerted".

**Acceptance Scenarios**:

1. **Given** Telegram rejects an alert, **When** the rejection is logged, **Then** the log includes Telegram's stated reason and the order number, and never includes the bot token.
2. **Given** an alert could not be delivered, **When** the owner reviews orders awaiting verification, **Then** the order is still listed there; a failed alert never hides it or cancels the customer's report.
3. **Given** an alert fails, **When** the customer taps "I have paid", **Then** the customer still sees the normal "received" confirmation.

---

### Edge Cases

- The administrator has never opened the bot, or blocked it: Telegram refuses delivery to them. The failure is logged with that reason; delivery to other administrators continues.
- Telegram is unreachable or slow: the customer's report is still saved and confirmed; the alert may be retried or flagged, but never delays the customer.
- The mini-app button link is not acceptable to Telegram: the alert is still delivered as plain text without the button rather than not at all.
- The bot token or administrator list is missing or empty: this is reported once clearly in the log instead of failing silently.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST deliver one administrator alert when a customer reports a card-to-card payment, containing order number, amount, customer name, mobile number and report time.
- **FR-002**: The system MUST deliver one administrator alert when a new order is placed.
- **FR-003**: Alert text MUST be delivered for any customer-supplied value (names, cities, notes), including characters that Telegram treats as formatting.
- **FR-004**: If the order-opening button cannot be attached, the system MUST still deliver the text of the alert.
- **FR-005**: The system MUST NOT send a second payment-report alert for the same order.
- **FR-006**: A delivery failure for one administrator MUST NOT prevent delivery to the others.
- **FR-007**: A delivery failure MUST NOT fail, delay or undo the customer's order or payment report.
- **FR-008**: On any delivery failure the system MUST record Telegram's stated reason and the order number, and MUST NOT record the bot token.
- **FR-009**: A missing bot token or empty administrator list MUST be reported clearly rather than silently skipped.
- **FR-010**: The owner MUST be able to identify orders that were reported as paid but whose alert was never delivered.

### Key Entities

- **Administrator alert**: a message about an order sent to each configured administrator; has a kind (new order, payment reported), a recipient, and a delivery outcome with a reason on failure.
- **Order awaiting verification**: an order whose customer has reported a card-to-card payment and which an administrator has not yet confirmed or rejected.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a test of 20 orders with varied customer names (including special characters), 100% of "I have paid" reports produce an administrator alert within one minute.
- **SC-002**: No customer ever sees an error or a delay on the transfer page because an alert failed.
- **SC-003**: When an alert fails, the owner can learn the reason from the log in under two minutes without reading source code.
- **SC-004**: Zero orders sit in "reported as paid" for more than one hour without the owner having been alerted or able to see them in the awaiting-verification list.

## Assumptions

- The Telegram bot, token and administrator chat already exist and are the ones set in production; no new channel is introduced (consistent with spec 047).
- The administrator has started the bot at least once. If not, that is a setup step reported by the failure log, not something the code can fix.
- The most likely causes of the HTTP 400 are the message formatting, the mini-app button link, or the administrator not having started the bot; the discarded response body prevents confirming which. Finding the actual cause is the first task of planning.
- The existing awaiting-verification view in the admin area is the place the owner reviews unconfirmed payments; no new admin screen is required for FR-010 beyond making failed alerts identifiable.
- Retrying failed alerts automatically is out of scope for this version; visibility (FR-008, FR-010) is in scope.
- Customer-facing wording and the transfer page itself are unchanged.
