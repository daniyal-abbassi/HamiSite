# Research: Automatic Registration at Code Verification

## D1 — Where the account is created
**Decision**: In `POST /api/auth/otp/verify`, inside the existing transaction, in the LOGIN branch, when the challenge has no linked user.
**Rationale**: The code is consumed in that transaction already, so "verified" and "created" are atomic. A failed code never reaches the create. `POST /api/auth/otp/request` already sends the same SMS for unknown numbers (it only sets `userId` when a user exists), so nothing about the request step leaks account existence.
**Alternatives**: (a) Create the account at request time — rejected, violates FR-003 and lets anyone mass-create accounts without proving ownership. (b) Keep REGISTER purpose and have the login form fall back to it — rejected, it needs a second code or a client-side guess about whether the number exists, which is the leak FR-004 forbids.

## D2 — Race between request and verify, and between two verifies
**Decision**: At verify, when `challenge.userId` is null, look the user up by `phoneNumber` first. If none, create; on a unique-constraint error (`P2002`) re-read and use the existing row. Apply the same checks as today: active, role RETAIL or WHOLESALE.
**Rationale**: `phoneNumber` is unique, so the database guarantees FR-005. The re-read covers a registration finishing between the request and the verify, and two concurrent verifies of the same number.
**Alternatives**: advisory locks — rejected, the unique index already does the job.

## D3 — Values for the required columns
**Decision**: `username = "m" + digits of the E.164 number` (unique because the phone is), `passwordHash` = hash of 48 random bytes (same as `/api/auth/register`, unusable as a password), `role = RETAIL`, `phoneVerified = true`, `phoneVerifiedAt = database now`, `creationMethod = "otp-auto"`, all profile fields empty.
**Rationale**: matches existing practice (`register` route, partner route use derived usernames and random hashes) with no schema change. `creationMethod = "otp-auto"` satisfies FR-015 by making auto-registered users queryable.
**Alternatives**: random username — works but loses a useful human-readable key for support.

## D4 — Staff, inactive and wholesale numbers
**Decision**: Unchanged behaviour. If the phone belongs to an inactive account or to ADMIN/AGENT, the verify fails with the same generic `OTP_INVALID`. No replacement account is created.
**Rationale**: FR-007, FR-009. The unique phone index would block a second account anyway.

## D5 — Collecting details later
**Decision**: No new screen. The order form already requires first name, last name, phone, city and address per order and offers saved addresses (`CheckoutClient`, `POST /api/orders`).
**Rationale**: FR-011 is already met at the point of purchase. **Gap found and closed (T004):** checkout did not save the entered name back to the user, so `POST /api/orders` now fills the customer's empty first name, last name and city from the order, never overwriting existing values.

## D6 — Nameless accounts in the UI
**Decision**: `UserMenu` showed `firstName ?? username`, which with D3 would read `m989121234567`. It now shows the phone number (`09…`) when there is no name (T006).

## D7 — Abuse
**Decision**: Keep the existing limits (60 s resend, 5 per phone per hour, 20 per source per 10 min, 5 attempts). No CAPTCHA now. Detection via `creationMethod = "otp-auto"` plus the admin account list.
**Rationale**: matches the assumption in the spec; revisit if volume of junk accounts appears.

## Resolved unknowns
None remained marked NEEDS CLARIFICATION.
