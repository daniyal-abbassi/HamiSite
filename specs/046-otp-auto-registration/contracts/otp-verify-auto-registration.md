# Contract: `POST /api/auth/otp/verify` (amends specs/043 `otp-auth-api.md`)

Request and response shapes are unchanged: `{ challengeId, code }` in, sanitized user plus session cookie out.

## Changed rule (LOGIN purpose)

Previously: a valid code whose challenge has no eligible customer returned `OTP_INVALID` and created nothing.

Now:
1. Valid code, challenge linked to an active RETAIL/WHOLESALE user → sign that user in (unchanged).
2. Valid code, challenge not linked to a user:
   - look up a user by the challenge's phone number;
   - none exists → create the retail customer described in `data-model.md`, then sign them in;
   - one exists and is active RETAIL/WHOLESALE → sign that user in;
   - one exists but is inactive, ADMIN or AGENT → `OTP_INVALID`, no account, no session.
3. Invalid, expired, locked or reused code → unchanged `OTP_INVALID` / `OTP_ATTEMPTS_EXCEEDED`.

Response data is identical for a new and an existing customer. The message may stay "Login successful" for both.

## Unchanged
- `POST /api/auth/otp/request`: same body, same generic response for known and unknown numbers.
- `purpose: "REGISTER"` and `POST /api/auth/register`: still available for the long form.
- Staff login, rate limits, cookie settings.
