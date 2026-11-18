# Feature Specification: Card-to-Card Payment While the Gateway Is Down

**Feature Branch**: `047-card-to-card-payment` (not created; no branch hook is configured)

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "Users can not purchase at the moment, so at final checkout, when the user is supposed to move to the payment page, the user should see another page: an indication that the payment gate is down at the moment due to high demand, and the user should transfer money card to card [bank details image], and then click a button so that I (the admin) am alerted and know."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customer is shown how to pay by card-to-card transfer (Priority: P1) 🎯 MVP

A customer finishes checkout and places their order. Instead of being sent to the online payment gateway, they land on a page that tells them, in Persian and in plain words, that the online payment gateway is temporarily unavailable because of high demand, and that they can still complete the purchase by transferring the amount from their bank card to the shop's account. The page shows the order number, the exact amount to pay, and the shop's bank details (bank, card number, account number, IBAN, account holder) with a one-tap copy for each number.

**Why this priority**: Today a customer cannot pay at all, so every order ends stranded. Showing the transfer details restores the ability to buy. It is the whole revenue path while the gateway is down.

**Independent Test**: As a signed-in customer, add a product, complete checkout, and confirm the next screen is the transfer page (not the gateway), shows the correct order number and total, and shows the shop's bank details exactly as given in the Assumptions.

**Acceptance Scenarios**:

1. **Given** a customer with items in the cart, **When** they place the order at the final checkout step, **Then** the order is created and the customer is shown the card-to-card page instead of being redirected to the payment gateway.
2. **Given** the card-to-card page is shown, **When** the customer reads it, **Then** it states that the payment gateway is temporarily down due to high demand and that paying by card-to-card transfer is the way to complete the order.
3. **Given** the card-to-card page, **When** the customer taps the copy control next to a number, **Then** that number is copied exactly as displayed, without spaces added or removed in a way that breaks it, and the customer sees confirmation that it was copied.
4. **Given** an order whose total is zero, **When** it is placed, **Then** the customer does not see the transfer page and the order completes as it does today.
5. **Given** the page is opened on a phone, **When** it is displayed, **Then** the bank details are readable without zooming and the copy controls are easy to tap.

---

### User Story 2 - Customer tells the shop they have paid, and the admin is alerted (Priority: P1)

After making the transfer, the customer taps a button on the same page saying they have paid. The shop's administrator is alerted immediately, with enough information to find the payment (order number, amount, customer name and mobile number, time). The customer sees a confirmation that their report was received and that the order is waiting for verification.

**Why this priority**: Without this, the owner has no way to know that a transfer was made, so paid orders would sit unnoticed. The alert is what makes manual payment workable.

**Independent Test**: Place an order, tap the "I have paid" button, and confirm the administrator receives one alert containing the order number and amount, and the customer sees a received confirmation.

**Acceptance Scenarios**:

1. **Given** the card-to-card page for an unpaid order, **When** the customer taps "I have paid", **Then** the administrator receives an alert within one minute containing the order number, the amount, the customer's name (if known) and mobile number, and the time.
2. **Given** the customer has tapped the button, **When** the page refreshes or they return later, **Then** it shows that their payment report was already sent and the order is awaiting verification, and the button cannot send a second alert by accident.
3. **Given** the customer taps the button twice quickly, **When** the requests arrive, **Then** exactly one alert is sent.
4. **Given** the alert could not be delivered, **When** the customer taps the button, **Then** the report is still recorded and visible to the administrator in the admin panel, and the customer is not told it failed.
5. **Given** a customer who is not signed in or who does not own the order, **When** they try to report a payment for it, **Then** nothing is recorded and no alert is sent.

---

### User Story 3 - Admin verifies the transfer and confirms the order (Priority: P2)

The administrator receives the alert, checks their bank account, and then marks the order as paid in the admin panel (or rejects the report if no money arrived). Orders that customers say they paid are easy to find in one list. Once the administrator confirms, the order moves forward like any paid order and the customer sees it as paid.

**Why this priority**: The alert tells the owner something happened; confirming is what actually releases the order. It matters right after the transfer page works, but a first version can lean on the existing order status controls.

**Independent Test**: With an order whose customer reported payment, open the admin panel, find it in the awaiting-verification list, mark it paid, and confirm the customer's order page shows it as paid.

**Acceptance Scenarios**:

1. **Given** orders where customers tapped "I have paid", **When** the administrator opens the order list, **Then** those orders are clearly marked as awaiting verification and can be filtered to.
2. **Given** an order awaiting verification, **When** the administrator confirms the payment, **Then** the order becomes paid and proceeds through the normal order process, and the customer sees that.
3. **Given** an order awaiting verification, **When** the administrator rejects the report, **Then** the order returns to unpaid and the customer can see the transfer page again.
4. **Given** a customer who never tapped the button, **When** the administrator receives the money anyway, **Then** the administrator can still confirm payment for that order manually.
5. **Given** an order is confirmed paid, **When** anyone looks at it again, **Then** it cannot be reported or confirmed a second time as if it were new.

---

### User Story 4 - Return to the transfer page later, and switch back to the gateway when it is up (Priority: P3)

A customer who placed an order but did not finish transferring can open the order from their account and reach the same transfer page, with the same details. When the online gateway works again, the owner can turn the transfer page off so checkout goes to the gateway again, without a new release of the shop.

**Why this priority**: Customers do not always pay immediately, and the gateway outage is temporary. Neither blocks the first release, but both avoid stranded orders and a permanent workaround.

**Independent Test**: Place an order and leave without paying; open it from the account page and confirm the transfer details are shown. Then turn the mode off and confirm a new order goes to the gateway.

**Acceptance Scenarios**:

1. **Given** an unpaid order placed in this mode, **When** the customer opens it from their account, **Then** they can reach the transfer page for that order.
2. **Given** the owner turns the card-to-card mode off, **When** a customer places a new order, **Then** they are sent to the online gateway as before.
3. **Given** the mode is turned off, **When** a customer opens an old unpaid order, **Then** they can still pay it either way the shop currently offers.

---

### Edge Cases

- The customer never taps "I have paid": the order stays unpaid and visible to the administrator as an ordinary pending order. No automatic cancellation is introduced by this feature.
- The customer taps "I have paid" without having transferred anything: the administrator finds no money, rejects the report, and the order returns to unpaid. Nothing is shipped on the customer's word alone.
- The customer transfers a different amount than the order total: the administrator decides; the page tells the customer to transfer exactly the order total and to keep the transfer receipt.
- The customer changes the order after placing it, or the total changes: the page always shows the order's current total.
- Two orders from one customer awaiting payment at once: each page and each alert refers to its own order number so the administrator can tell them apart.
- The customer closes the page before reading the details: they can come back to it from the order page (US4).
- The bank details must never be editable by customers or appear anywhere except to the owner of the order, on the payment page.
- A customer copies a number on a device that blocks copying: the number is shown in full and selectable so it can still be copied by hand.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: While card-to-card mode is on, placing an order with a non-zero total MUST show the customer the card-to-card page instead of redirecting to the online payment gateway.
- **FR-002**: The page MUST state, in Persian, that the online payment gateway is temporarily unavailable due to high demand and that the customer can complete the purchase by card-to-card transfer.
- **FR-003**: The page MUST show the order number, the exact amount to pay in Toman, and the shop's bank details exactly as listed in the Assumptions.
- **FR-004**: Each of the card number, account number and IBAN MUST have a control that copies it, and the page MUST confirm when a copy succeeded.
- **FR-005**: The page MUST tell the customer to transfer exactly the order total, to keep the receipt, and to tap the button after transferring.
- **FR-006**: The page MUST offer a single button reporting that the customer has paid. Tapping it MUST record the report and alert the administrator.
- **FR-007**: The administrator alert MUST include the order number, the amount, the customer's name (if known) and mobile number, and the time of the report, and MUST be sent exactly once per report.
- **FR-008**: A second tap, a page refresh or a repeated request MUST NOT send a second alert for the same report.
- **FR-009**: The report MUST be recorded even if the alert cannot be delivered, and the administrator MUST be able to see it in the admin panel.
- **FR-010**: Only the signed-in owner of an order MUST be able to view its transfer page and report a payment for it.
- **FR-011**: A reported order MUST be shown as awaiting verification to both the customer and the administrator. Reporting MUST NOT mark the order as paid and MUST NOT start fulfilment.
- **FR-012**: The administrator MUST be able to confirm a reported payment (order becomes paid and continues through the normal order process) or reject it (order returns to unpaid), and MUST be able to confirm payment for an order that was never reported.
- **FR-013**: The administrator MUST be able to list orders awaiting verification.
- **FR-014**: A customer MUST be able to reach the transfer page again for any unpaid order placed in this mode, from the order page.
- **FR-015**: The owner MUST be able to turn card-to-card mode on and off without a new release of the shop. When it is off, checkout MUST go to the online gateway as it does today.
- **FR-016**: Orders with a zero total MUST NOT be affected and MUST NOT show the transfer page.
- **FR-017**: The page and its text MUST be right-to-left, readable on a phone, and usable by keyboard and screen reader (copy controls and the report button reachable and labeled).
- **FR-018**: Bank details MUST NOT be shown to anyone who is not the signed-in owner of an unpaid order in this mode.

### Key Entities *(include if feature involves data)*

- **Order**: the customer's purchase, with a number, a total, an owner and a payment state (unpaid, awaiting verification, paid).
- **Payment report**: the customer's statement that they transferred the money, tied to one order, with the time it was made. At most one active report per order.
- **Shop bank details**: the account the customer transfers to (bank, card number, account number, IBAN, holder name). Owned by the shop, changed only by the owner.
- **Card-to-card mode**: an on/off setting controlled by the owner, deciding whether checkout shows the transfer page or the gateway.
- **Administrator alert**: the notice sent to the owner when a payment report arrives.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A customer who places an order sees the transfer page without any extra click, and can copy the card number and see the amount in under 10 seconds.
- **SC-002**: 100% of payment reports produce exactly one administrator alert within 1 minute, and 0 reports are lost when the alert cannot be delivered.
- **SC-003**: 0 orders become paid or enter fulfilment without an administrator confirming them.
- **SC-004**: The administrator can find every order awaiting verification in one list and confirm one in under 1 minute.
- **SC-005**: The share of customers who place an order and then pay (confirmed by the administrator) can be measured and compared before and after launch.
- **SC-006**: Turning card-to-card mode off sends the next new order to the online gateway with no new release of the shop.
- **SC-007**: The bank details shown to customers match the details in the Assumptions character for character, verified before launch.

## Assumptions

- **Bank details** (Bank Mellat), taken from the image the owner supplied and cross-checked: card number `6104 3387 9323 1370` (passes the standard card checksum); account number `2401092980`; IBAN `IR78 0120 0100 0000 2401 0929 80` (passes the IBAN checksum and contains the account number); account holder `اسماعیل عباسی`. The owner must confirm these before launch; they are transcribed from a picture.
- Card-to-card mode applies to every new order with a non-zero total, for all customers, until the owner turns it off. It is not chosen per customer or per order.
- The order is created when the customer places it, as today. The customer is then sent to the transfer page rather than the gateway, and an unpaid order exists until the administrator confirms the payment.
- The administrator alert uses the shop's existing administrator alert channel (the Telegram order alerts already used for new orders); no new channel is introduced.
- The administrator confirms payment by checking their own bank account. There is no automatic matching of transfers and no receipt upload in this version.
- Stock and order handling for unpaid orders stays as it works today; this feature does not change how long an unpaid order holds stock or when it is cancelled.
- The online gateway integration is left in place, only bypassed while the mode is on.
- The page copy is Persian and written to be calm and reassuring: the problem is the gateway under high demand, not the customer.
- Out of scope: automatic cancellation of unpaid orders, receipt or photo upload, SMS to the customer on confirmation, partial payments and refunds.
