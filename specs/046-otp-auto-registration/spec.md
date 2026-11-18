# Feature Specification: One-Step Phone Sign-In With Automatic Registration

**Feature Branch**: `046-otp-auto-registration` (not created; no branch hook is configured)

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "When a new user enters their number in the login form, the form does not authorize it. The user has to sign up first and then enter the site. I don't want that, it takes time and the user does not have time to sign up and then enter the site. The OTP should accept the code and register the user automatically, and later, if the user has bought something, they can complete their info there."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New visitor signs in and is registered in one step (Priority: P1) 🎯 MVP

A first-time visitor enters their mobile number in the login form, receives a code by SMS, and types it. They are signed in right away. An account for that number is created for them on the spot, with no separate sign-up form and no extra fields to fill in first.

**Why this priority**: Today a new visitor who tries to sign in is turned away and must go through a longer registration form. Visitors who give up there are lost sales. This is the whole point of the change.

**Independent Test**: With a mobile number that has never been used on the shop, request a code from the login form, enter it, and confirm the visitor ends up signed in, with exactly one new account for that number and no sign-up form shown.

**Acceptance Scenarios**:

1. **Given** a valid Iranian mobile number with no account, **When** the visitor requests a code from the login form and enters the correct code, **Then** an account for that number is created, the visitor is signed in, and they continue to where they were going.
2. **Given** the same number, **When** the visitor enters a wrong, expired or already-used code, **Then** no account is created and no one is signed in.
3. **Given** a number with no account, **When** the visitor requests a code, **Then** the screen and the message they receive look exactly the same as for an existing customer, so the form does not reveal whether a number is already registered.
4. **Given** a new number entered in Persian digits, English digits, or another supported Iranian mobile format, **When** the visitor verifies it, **Then** the account is created under the one standard form of that number.

---

### User Story 2 - Returning customer is unaffected (Priority: P1)

A customer who already has an account (from the old shop or from a previous automatic registration) signs in with their number and code exactly as before and reaches the same account, with the same profile, cart and orders.

**Why this priority**: The change must not create duplicate accounts or split a customer's history across two accounts.

**Independent Test**: Sign in twice with the same number and once with a migrated customer's number; confirm each time the visitor lands in the one existing account and that no second account is created.

**Acceptance Scenarios**:

1. **Given** a customer account exists for a number, **When** that number is verified, **Then** the visitor is signed into that same account and no new account is created.
2. **Given** two people verify the same new number at nearly the same moment, **When** both codes are valid, **Then** only one account exists afterwards.
3. **Given** a customer's account has been deactivated, **When** their number is verified, **Then** they are not signed in and no replacement account is created.

---

### User Story 3 - Complete details later, when they matter (Priority: P2)

An automatically registered customer starts with a bare account: only a verified phone number. They are never asked for a name, address or business details at sign-in. When they want to place an order, or open their profile, they are asked for whatever the purchase needs, and the details are saved to the same account for next time.

**Why this priority**: Skipping registration is only useful if the missing details are collected at the point where they are needed. Without it, orders would be missing delivery and contact details.

**Independent Test**: Sign in as a brand-new visitor, go to checkout, and confirm the missing details are requested there, saved to the same account, and not asked again on the next visit.

**Acceptance Scenarios**:

1. **Given** an automatically registered customer with no profile details, **When** they browse, add to the cart and view their account, **Then** nothing blocks them and the profile shows which details are still empty.
2. **Given** the same customer at checkout, **When** the order needs details they have not provided, **Then** they are asked for exactly those details, and the order can proceed once they are given.
3. **Given** details were saved at checkout, **When** the customer signs in again later, **Then** the details are already there.

---

### User Story 4 - Staff access stays separate (Priority: P2)

Administrators and agents keep their existing staff sign-in. The phone-code path never creates a staff account, never signs a number into a staff account, and never grants business, wholesale or credit privileges.

**Why this priority**: Opening automatic account creation to the public must not become a way into the back office or to special pricing.

**Independent Test**: Verify a code for the phone number of a staff account and confirm no staff session is created; verify a new number and confirm the new account has only the ordinary retail customer role.

**Acceptance Scenarios**:

1. **Given** a number that belongs to an administrator or agent account, **When** it is verified through the customer login form, **Then** no staff session is created.
2. **Given** an automatically registered customer, **When** their account is inspected, **Then** it has the ordinary retail customer role, no credit, and no business verification.

---

### Edge Cases

- The code is wrong, expired, already used, or entered after the allowed number of attempts: no account and no session are created, and the existing attempt limits still apply.
- Someone requests many codes quickly or from many addresses: the existing resend delay and request limits still apply. Automatic registration must not make it easier to flood the SMS service.
- Someone abandons the form after requesting a code: no account exists until the code is verified.
- The SMS service is down or rejects the request: no account and no session are created, and the visitor sees a clear retry message.
- A person types a number that is not theirs: they cannot get in, because the code goes only to that number's owner. A number that is verified becomes the proof of ownership.
- The old separate sign-up page and its form remain reachable for anyone who wants to fill in their details up front, and a customer who does so still ends up with one account.
- An account created automatically has no name: every place that shows the customer's name must still read sensibly (for example showing the phone number or a neutral label).
- A wholesale or credit customer from the old shop signs in: their existing privileges are preserved, and nothing in this change grants new ones.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a visitor verifies a valid code for a mobile number that has no customer account, the system MUST create a customer account for that number and sign the visitor in, in the same step.
- **FR-002**: The system MUST NOT require any sign-up form, name, address, email or other profile field before an automatically registered visitor is signed in.
- **FR-003**: The system MUST create an account only after the code for that number has been verified; requesting a code alone MUST NOT create an account.
- **FR-004**: The login form MUST behave identically, and the code message MUST be identical, whether or not the number already has an account.
- **FR-005**: The system MUST never create more than one customer account for the same standardized mobile number, including when two verifications for the same new number happen at the same time.
- **FR-006**: A customer who already has an account MUST be signed into that same account with their profile, cart, orders and any wholesale or credit privileges unchanged.
- **FR-007**: A deactivated customer account MUST NOT be signed in or replaced by a new account when its number is verified.
- **FR-008**: Automatically registered accounts MUST have the ordinary retail customer role, no credit, and no business verification. Phone verification alone MUST NOT grant any other privilege.
- **FR-009**: The phone-code path MUST NOT create a staff account or sign a number into a staff account.
- **FR-010**: The system MUST keep all existing code protections: expiry, one-time use, wrong-attempt limit, resend delay, per-number and per-source request limits.
- **FR-011**: The customer's profile MUST show which details are still missing, and checkout MUST ask for exactly the details the order needs when they are missing, saving them to the same account.
- **FR-012**: Details a customer has already provided MUST NOT be asked for again.
- **FR-013**: Every screen and message that shows a customer's name MUST remain readable when the account has no name.
- **FR-014**: The existing separate sign-up path MUST keep working for visitors who prefer to fill in their details first, without producing a second account for the same number.
- **FR-015**: Every automatic registration MUST be recorded in a way an administrator can find, so that unusual volumes of new accounts can be noticed.

### Key Entities *(include if feature involves data)*

- **Customer account**: A person's identity on the shop, keyed by one verified mobile number. It may start with nothing but that number and gains name, address and business details later.
- **Verified phone number**: The standardized mobile number whose ownership was proven by entering a valid code. It is the only thing required to have an account.
- **Sign-in code**: A short-lived, single-use code sent by SMS to a mobile number, with limited attempts and a resend delay.
- **Profile completeness**: Which of the details needed for ordering (name, delivery address, contact details) the customer has already provided.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new visitor goes from entering their number to being signed in in under 1 minute, with no more than two screens (number, then code).
- **SC-002**: 100% of valid, first-time numbers that complete code verification end up signed in with exactly one account.
- **SC-003**: Zero duplicate accounts exist for any mobile number after the change, including under simultaneous attempts.
- **SC-004**: No customer-facing difference (screen, timing within normal variation, or message) lets someone tell whether a number is already registered.
- **SC-005**: 0 existing customers lose orders, carts, profile data or privileges as a result of the change.
- **SC-006**: A customer who completes details at checkout is never asked for the same details again on their next order.
- **SC-007**: The share of visitors who reach a signed-in state after entering a number for the first time increases compared with the current sign-up-first flow (to be measured by comparing new-account counts per week before and after launch).

## Assumptions

- The shop is retail-first: new automatic accounts are retail customers. Wholesale or partner status continues to be granted only through the existing partner application process.
- The existing code-sending service, template and limits are reused as is, and the code is already working in production.
- The standard mobile-number normalization already used for sign-in is the one used to decide whether an account exists.
- Checkout already knows which details an order needs; this feature only ensures missing details are requested there and saved, rather than defining new order requirements.
- Showing a masked phone number (or a neutral label) is acceptable wherever a name is not yet known.
- Staff sign-in with username and password is unchanged and out of scope.
- Account deletion, merging two accounts, and changing a phone number are out of scope.
