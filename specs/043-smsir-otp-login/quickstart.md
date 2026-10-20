# Quickstart: SMS.ir OTP Login Validation

This guide is for implementation and acceptance validation. Configure the SMS.ir Sandbox credential in a local ignored environment file or secret manager; Sandbox acceptance does not prove handset delivery.

## Prerequisites

- Node.js version supported by this repository (20+), PostgreSQL, and project dependencies installed.
- A disposable local/test database. Confirm `.env` and `.env.test` point to separate schemas before any database operation.
- A rotated SMS.ir Sandbox API key and Sandbox template ID `123456`; configure them only in a local ignored env file or secret manager:

```dotenv
SMS_IR_API_KEY=<sandbox-key>
SMS_IR_TEMPLATE_ID=123456
OTP_HASH_SECRET=<random-secret-at-least-32-bytes>
OTP_SOURCE_HASH_SECRET=<separate-random-secret-at-least-32-bytes>
OTP_TRUSTED_PROXY_HEADER=x-real-ip
OTP_SOURCE_REQUEST_LIMIT=20
OTP_SOURCE_WINDOW_SECONDS=600
```

Production must use a distinct production API key and approved production template. Never use the Sandbox key in production. `SMS_IR_BASE_URL` should be fixed/allow-listed by deployment configuration rather than accepted from request input.

## Prepare the local schema and app

1. Review the Prisma diff and take a database backup before rollout. This schema replaces the legacy plaintext OTP field with a digest; invalidate only outstanding rows in `otp_codes` before applying it. Preserve users, sessions, carts, orders, and payments.
2. Apply schema changes to the selected development/test database with `npm run db:push` and regenerate Prisma Client if required. Confirm the target DB and resulting diff first. Do not use `db:fresh`, `db:reset`, or a blind production reseed.
3. Start the app using the project's normal development command. Keep SMS calls pointed at Sandbox.

## Acceptance scenarios

1. **Existing customer login**: Use a test RETAIL or WHOLESALE user with a known canonical mobile and an existing order. In automated tests, use a mocked SMS adapter that captures the generated code only inside the test process. Request LOGIN, verify it, then confirm the same user ID and prior order are returned after session authentication.
2. **Registration**: With the mocked adapter, request REGISTER for an unused number, verify, then submit valid profile fields with the proof cookie. Confirm one user is created with a verified phone and one session. Replay the proof and confirm no second user is created.
3. **Legacy password rejection**: Attempt customer password login with an imported/shared password and confirm generic failure. Verify ADMIN/AGENT password login still works in an isolated test database.
4. **Limits and challenge rules**: Confirm wrong code increments attempts; the sixth attempt is rejected; expiry, supersession, replay, and concurrent duplicate verification cannot establish more than one session/proof.
5. **Abuse controls**: Confirm the 60-second resend cooldown, five-per-phone rolling-hour limit, and default 20-per-IP/10-minute source limit block SMS dispatch before provider call; `Retry-After` matches the limiting window.
6. **Provider error handling**: Use a mocked rejection and an ambiguous timeout; return a generic user-safe error, do not log secrets or raw payload, and do not blindly retry an ambiguous request.
7. **Data preservation**: Compare the existing customer ID, role, business/credit fields, cart, order, and payment relations before and after OTP sign-in; they must be unchanged except for phone verification metadata and a newly created session.
8. **Privacy and UI**: Check responses/logs for OTP, API key, raw phone, or full provider payload. Check Persian RTL copy, masked number, loading/retry/error states, and mobile layout.

## SMS.ir Sandbox behavior

The Sandbox verifies request formatting and simulated provider acceptance. It does not deliver a real message to a handset or charge production credit, and must not be treated as a source for the generated OTP value. Therefore a Sandbox HTTP/API success does not prove customer delivery or complete the verify flow. Use a mocked SMS adapter for end-to-end automated verification without returning the code to the browser. Production readiness additionally requires a production credential, approved template, provider-account configuration, and a controlled real-number acceptance check.

## Relevant design references

- [API contract](contracts/otp-auth-api.md)
- [Data model and state transitions](data-model.md)
- [SMS.ir REST API](https://sms.ir/rest-api/)
- [SMS.ir Sandbox guide](https://app.sms.ir/developer/help/sandbox)
