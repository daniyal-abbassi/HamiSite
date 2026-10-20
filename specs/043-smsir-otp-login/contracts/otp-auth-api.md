# Contract: Customer OTP Authentication API

These are same-origin Next.js routes using the existing JSON response/error envelope and session cookie. All provider calls and OTP generation/verification happen server-side. Exact envelope keys should match the shared `lib/http.ts` implementation when coding.

## `POST /api/auth/otp/request`

Request:

```json
{
  "phoneNumber": "۰۹۱۲۱۲۳۴۵۶۷",
  "purpose": "LOGIN"
}
```

`purpose` is `LOGIN` or `REGISTER`. Normalize and validate the Iranian mobile number before dispatch. Return the same generic response for any valid-format number regardless of account existence:

```json
{
  "success": true,
  "data": {
    "challengeId": "opaque-id",
    "maskedPhone": "۰۹۱۲••••۵۶۷",
    "expiresInSeconds": 300,
    "resendAfterSeconds": 60
  }
}
```

The endpoint does not disclose whether the number is registered. It sends a neutral code message for either purpose. Invalid formats return a validation error. Rate-limited requests return HTTP 429 with a stable error code and `retryAfterSeconds`; do not expose provider/account detail. Provider rejection/unavailability returns a generic 503-style error and no usable challenge. API keys, code values, raw provider payload, and full phone numbers are never included in response bodies or logs.

## `POST /api/auth/otp/verify`

Request:

```json
{
  "challengeId": "opaque-id",
  "code": "123456"
}
```

For LOGIN, a valid challenge belonging to an active RETAIL/WHOLESALE user is consumed atomically, `phoneVerified` is updated, and the existing session helper sets the same-origin session cookie. Response data contains the sanitized existing user and no OTP/provider secrets.

For REGISTER, a valid challenge is consumed and a short-lived RegistrationProof is created. Set its random token in a Secure, HttpOnly, SameSite=Lax cookie; do not return the token to JavaScript. Return only the verified masked phone and proof expiry. No `User` or customer session is created at this step.

Failure contract:

| Condition | Response behavior |
|---|---|
| Invalid code | Generic invalid/expired response; increment attempt count atomically. |
| Expired, used, superseded, failed, or locked challenge | Generic invalid/expired response; no session/proof. |
| More than 5 attempts | Lock challenge and reject. |
| LOGIN number has no eligible customer | Return generic account-not-found only after phone ownership has been proven; do not create a session. |
| Inactive account or staff role | Do not authenticate; do not change activation/role/permissions. |

## `POST /api/auth/register`

Existing profile fields remain validated by the registration schema; remove password as a customer credential and require the registration-proof cookie established by REGISTER verification. A successful request must atomically consume the proof, create one RETAIL/WHOLESALE user with the proof's canonical verified phone, and create a session. The existing non-null `passwordHash` column requires a random, high-entropy, unusable generated hash until a separately reviewed schema change is approved. Clients cannot submit `phoneVerified`, role escalation, business approval, or credit changes.

Example request (profile-field shape abbreviated; exact public fields should follow existing register schema):

```json
{
  "username": "customer-name",
  "email": "optional@example.test",
  "firstName": "نام",
  "lastName": "نام‌خانوادگی",
  "role": "RETAIL"
}
```

The phone number is taken from the verified proof rather than trusted from the request. Duplicate phone/username/email returns the existing stable duplicate-account error. Expired, missing, mismatched, or consumed proof returns unauthorized/validation failure and creates no user. Clear the proof cookie on success.

## `POST /api/auth/login` (existing route)

Retain username/password authentication only for `ADMIN` and `AGENT`. RETAIL and WHOLESALE password attempts must fail with the same generic invalid-credentials response, including the imported shared legacy password. Staff role and permissions are unchanged. Customer OTP login must use `/api/auth/otp/request` and `/api/auth/otp/verify`.

## Provider adapter boundary

`lib/sms-ir.ts` is server-only. It reads `SMS_IR_API_KEY` and `SMS_IR_TEMPLATE_ID` only on the server, sends `X-API-KEY` to `https://api.sms.ir/v1/send/verify`, and maps provider responses to a small internal result. Sandbox and production use separate credentials/configuration. Never expose provider response bodies directly. Do not automatically retry ambiguous timeouts, which can duplicate messages.

## Security and compatibility requirements

- Keep current same-origin deployment and session-cookie behavior; do not add cross-origin OTP endpoints.
- Validate JSON shape, phone, purpose, opaque challenge ID, and six-digit code server-side.
- Apply request-source and per-phone throttles before sending SMS, and attempt limits before code comparison.
- Use constant-time digest comparison where possible and atomic consume/update predicates in PostgreSQL.
- Use CSRF protections consistent with existing same-origin API conventions; OTP routes must not weaken current protections.
- Keep current success/error envelope conventions consumed by browser clients.
- No code, raw API key, full SMS provider response, or raw source IP appears in logs or errors.
