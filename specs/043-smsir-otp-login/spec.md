# Feature Specification: SMS OTP Customer Login

**Feature Branch**: `Hami-v3`  
**Created**: 2026-10-20  
**Status**: Draft  
**Input**: User requested an SMS.ir Sandbox test and SMS-code sign-in for returning legacy customers while retaining their existing accounts and history.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Returning customer sign-in (Priority: P1) 🎯 MVP

As a returning customer from the previous shop, I want to verify the mobile number already associated with my account so that I can access my existing profile, cart, and order history without relying on a shared legacy password.

**Why this priority**: Customers must be able to return to the new storefront without losing the identity and purchase history they already have.

**Independent Test**: Use a migrated customer account with an existing mobile number, request a code, verify it, and confirm the customer reaches that same account and sees its existing orders.

**Acceptance Scenarios**:

1. **Given** a migrated, active customer account with a valid Iranian mobile number, **When** the customer requests and enters the current code, **Then** the customer is signed into that same account and can access its pre-existing order history.
2. **Given** a migrated account with an old shared password, **When** the customer attempts password sign-in, **Then** that password does not authenticate the customer.
3. **Given** a number entered in Persian digits, English digits, or a supported Iranian mobile format, **When** the customer requests a code, **Then** the number resolves to the same normalized account identity.

### User Story 2 - New customer registration (Priority: P2)

As a new retail or wholesale customer, I want to verify my mobile number during registration so that my account is associated with a number I can receive messages on.

**Why this priority**: New accounts must use the same verified phone sign-in path and must not create duplicate accounts for an existing customer's number.

**Independent Test**: Register with a previously unused mobile number, verify the code, and confirm exactly one customer account is created and signed in.

**Acceptance Scenarios**:

1. **Given** a valid mobile number with no existing account, **When** the customer completes registration and verifies the code, **Then** one account is created and the customer is signed in.
2. **Given** a mobile number already associated with a customer account, **When** it is entered during registration, **Then** no duplicate account is created and the customer is guided to sign in to the existing account.
3. **Given** a registration attempt with an unverified mobile number, **When** the process is abandoned or the code is invalid or expired, **Then** no active customer account is created.

### User Story 3 - Staff access remains available (Priority: P2)

As an administrator or agent, I want to keep the existing staff sign-in path so that customer SMS sign-in does not lock me out of the back office.

**Why this priority**: Customer authentication changes must not accidentally change access for privileged staff accounts.

**Independent Test**: Verify that a staff account can still sign in through its authorized staff flow and a customer cannot use that flow to gain staff access.

**Acceptance Scenarios**:

1. **Given** an active administrator or agent account, **When** it signs in using the existing staff credentials, **Then** its existing role and permissions are preserved.
2. **Given** a customer account, **When** it completes SMS verification, **Then** it receives only its existing customer role and permissions.

### Edge Cases

- A code is expired, already used, incorrect, or entered after the permitted number of attempts.
- A customer requests repeated codes too quickly or from multiple network addresses.
- The SMS provider is unavailable, rejects the request, or reports an unsuccessful response; no session or account is created from an unverified request.
- A legacy account has no usable mobile number, an invalid number, or a number that no longer belongs to the customer; it must not be silently linked to a different account.
- A mobile number is entered with Persian numerals, an international prefix, spaces, or punctuation; equivalent Iranian mobile formats resolve consistently.
- The SMS is delayed or never arrives; the user receives a clear retry or support path without weakening authentication.
- Concurrent verification requests must not allow multiple active codes or cause a code to be accepted more than once.
- A customer has high-value wholesale or credit privileges; successful phone verification must not itself grant new business verification, credit, or permissions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow retail and wholesale customers to request a one-time sign-in code for a valid Iranian mobile number.
- **FR-002**: The system MUST verify a submitted code before signing in a customer or completing a new customer registration.
- **FR-003**: When a verified mobile number belongs to a migrated customer, the system MUST authenticate the existing account and preserve its profile, cart, order, and payment history.
- **FR-004**: The system MUST NOT create a second customer account when a verified mobile number already belongs to an account.
- **FR-005**: Customer sign-in MUST NOT accept the shared legacy customer password.
- **FR-006**: A new customer account MUST NOT become active until its mobile number has been verified.
- **FR-007**: The system MUST allow only active customer accounts to sign in, and SMS verification MUST NOT change a user's role, business verification, credit eligibility, or account activity state.
- **FR-008**: Administrator and agent sign-in MUST continue through their existing authorized staff flow, without granting staff permissions through customer SMS verification.
- **FR-009**: Each code MUST expire after five minutes, be accepted at most once, and allow no more than five verification attempts.
- **FR-010**: The system MUST enforce a resend cooldown of at least 60 seconds and a maximum of five code requests per mobile number in any rolling hour; requests MUST also be limited by their source to reduce automated abuse and message cost.
- **FR-011**: The system MUST provide a generic request confirmation that does not reveal whether a mobile number already has an account.
- **FR-012**: The system MUST not expose verification codes or SMS service credentials in browser responses, user-facing errors, or application logs.
- **FR-013**: The system MUST show a masked destination number and clear instructions for code expiry, retry timing, and provider failure.
- **FR-014**: If a customer cannot receive messages at the mobile number associated with a legacy account, the system MUST direct them to a support-based identity recovery path and MUST NOT attach the account using name or email alone.

### Key Entities *(include if data is involved)*

- **Customer Account**: A retail or wholesale identity with a verified mobile number and its existing profile, cart, business permissions, and purchase history.
- **Verification Challenge**: A short-lived, single-use request bound to a mobile number and purpose, with an expiry and limited verification attempts.
- **Customer Session**: The authenticated customer state created only after a valid challenge is completed.
- **SMS Delivery Attempt**: A record of whether a verification message was accepted or rejected by the messaging service, without retaining the code itself.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A returning customer with access to the registered mobile number can reach the original account and its prior order history in one sign-in flow.
- **SC-002**: At least 95% of valid sign-in attempts complete within 60 seconds after the customer receives the code.
- **SC-003**: 100% of expired, previously used, incorrect, or over-attempt codes are rejected in verification checks.
- **SC-004**: 100% of verified legacy mobile numbers resolve to their existing account; no duplicate account is created for those numbers.
- **SC-005**: No verification code or SMS API credential appears in browser-visible responses or application logs during acceptance checks.
- **SC-006**: SMS Sandbox verification checks complete without sending real customer messages or consuming production credit.

## Assumptions

- SMS one-time codes are the sign-in method for retail and wholesale customer accounts; administrator and agent sign-in remains separate.
- The legacy customer import supplies the mobile numbers used to locate existing accounts. Accounts without a usable number require support-assisted recovery.
- Customer records, orders, carts, and payment history already imported into the new system remain associated with their current account identities.
- The SMS.ir Sandbox is for integration checks only. Production sign-in requires an active production credential and an approved verification template.
- Initial limits are five-minute expiry, five attempts per code, a 60-second resend cooldown, and five sends per mobile number per hour; these may be tuned after operational review without weakening abuse protection.
