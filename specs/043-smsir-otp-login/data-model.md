# Data Model: SMS.ir OTP Customer Login

## Existing records to preserve

### User (existing Prisma model)

The `User` row remains the durable account identity. Its primary key and relations to `Cart`, `Order`, `Payment`, `Address`, and `Session` are not recreated during login or migration.

Relevant existing fields:

| Field | Use / rule |
|---|---|
| `id` | Stable identity used by existing carts, orders, and payments. |
| `role` | Existing `RETAIL` or `WHOLESALE`; OTP never changes role. ADMIN and AGENT continue on staff password flow. |
| `phoneNumber` | Unique canonical Iranian number (`+98...`) used for lookup. |
| `phoneVerified`, `phoneVerifiedAt` | Mark verified only after a successful OTP proof. Existing imported verification state must not be silently upgraded. |
| `isActive` | Inactive accounts cannot sign in; OTP does not reactivate them. |
| business and credit fields | Retain unchanged. Phone possession does not grant wholesale approval or credit. |
| `passwordHash` | Existing non-null schema constraint remains. Customer password login is disabled; registration must set a fresh high-entropy unusable hash unless a separately reviewed additive schema change makes it nullable. Staff password hashes remain unchanged. |

## VerificationChallenge (existing `OtpCode`, additive migration)

Repurpose the existing `otp_codes` table/model. The current `code` column contains plaintext and must no longer be read or written by the new flow. The schema transition may invalidate any outstanding legacy OTP challenges; these are short-lived and cannot be carried into the new verifier. Use the repo's additive `db:push` workflow and explicitly review Prisma's proposed column changes before applying them. Do not reset/reseed user or order data.

| Field | Type | Rule |
|---|---|---|
| `id` | integer / opaque public challenge ID | Internal primary key; public API may expose an opaque UUID instead of sequential ID. |
| `userId` | nullable relation to `User` | Set only when the number maps to an eligible existing customer; no relation for a new registration challenge. |
| `phoneNumber` | canonical string | Required; normalized before lookup and SMS send. |
| `codeDigest` | string | HMAC-SHA-256 of code, challenge ID, phone, purpose, keyed with dedicated server secret. Never store or return plaintext. |
| `purpose` | `LOGIN` or `REGISTER` | Restrict the OTP flow to customer sign-in or registration. Existing enum values may be retained for compatibility, but legacy flows must not bypass these rules. |
| `status` | enum | `PENDING`, `SENT`, `CONSUMED`, `SUPERSEDED`, `FAILED`, `LOCKED`; transition rules below. |
| `attemptCount` | integer | Starts at zero, increments atomically for each submitted verification attempt, locks at 5. |
| `expiresAt` | timestamp | Five minutes from issuance; checked against database time on verification. |
| `providerMessageId` | nullable string | SMS.ir delivery request identifier only; no sensitive response body. |
| `createdAt` | timestamp | Supports rolling per-phone send count. |
| `requesterHash` | nullable string | HMAC of trusted source IP with a separate server secret, for rate-limit grouping; no raw IP persisted. |

Indexes/constraints: index `(phoneNumber, purpose, createdAt)` for rolling count and active challenge lookup; index `(requesterHash, createdAt)` for source throttling; index status/expiry for cleanup. Enforce one current challenge per phone and purpose through transactionally superseding old active challenges (or a partial unique index if supported by the schema workflow).

### Challenge state transitions

```text
PENDING -> SENT -> CONSUMED
                   -> LOCKED
                   -> SUPERSEDED
                   -> (expired by expiresAt)
PENDING -> FAILED
SENT -> SUPERSEDED (new send)
```

Only `SENT`, unexpired challenges may be verified. Wrong code increments attempts in the same conditional write that confirms the challenge is still active. A correct code atomically consumes the challenge. Two concurrent correct submissions must result in exactly one successful consume. Failed provider submission cannot be verified. Retain only minimal audit metadata and expire/purge stale challenges under a documented retention window.

## OtpRequestBucket (new Prisma model or equivalent atomic rate-limit storage)

| Field | Type | Rule |
|---|---|---|
| `key` | string primary key | HMAC-derived bucket identifier containing scope and time window; no raw phone/IP. |
| `count` | integer | Atomic increment; reject before provider call when configured limit is exceeded. |
| `expiresAt` | timestamp | Short TTL; cleanup may be scheduled or lazy. |
| `updatedAt` | timestamp | Operational housekeeping. |

Phone send count can be derived from recent challenge rows; this bucket is required for the source-IP limit and can also carry fixed-window request caps. Initial default: 20 requests per trusted client IP per 10 minutes, configurable in deployment settings. Updates must be atomic so concurrent requests cannot exceed the cap.

## RegistrationProof (new Prisma model or equivalent)

Created only after a valid `REGISTER` challenge is atomically consumed.

| Field | Type | Rule |
|---|---|---|
| `id` | integer primary key | Internal identifier. |
| `tokenHash` | string unique | SHA-256/HMAC digest of random bearer token; raw token is delivered only in a short-lived HttpOnly, Secure, SameSite=Lax cookie. |
| `phoneNumber` | canonical string | Binds the proof to the phone that passed OTP. |
| `expiresAt` | timestamp | Short-lived (e.g. 10 minutes) and single-use. |
| `consumedAt` | nullable timestamp | Set transactionally with account creation. |
| `createdAt` | timestamp | Audit and cleanup. |

The registration route must verify the cookie token digest, expiry, and unused state in the same transaction that creates the customer and consumes the proof. The canonical phone on the proof is the sole source of the created account's phone; the client does not submit or override it. A duplicate phone/username/email fails without creating a second user. The proof cookie is cleared after success or browser expiry.

## CustomerSession (existing `Session` model)

Reuse the existing session model and cookie helper after successful login or account creation. Create a session only after successful challenge verification for an active customer or after registration-proof consumption. Keep the same-origin cookie attributes and current role authorization behavior.

## SMS delivery audit

Use challenge status, `providerMessageId`, timestamps, and a sanitized provider status code as the minimum audit record. Do not retain the OTP, API key, full provider payload, or raw phone/IP in logs. If delivery history needs a dedicated table later, keep it bounded by retention and linked to the challenge without copying secrets.

## Validation invariants

- Iranian phone input is normalized to one canonical format before every lookup, uniqueness check, throttle check, and challenge creation.
- A LOGIN challenge may only sign in a matching, active RETAIL/WHOLESALE user; staff users must not receive customer sessions.
- A REGISTER challenge may only prove an unused phone; account role is restricted to RETAIL/WHOLESALE.
- Existing imported accounts with `phoneVerified=false` may become verified only after current phone possession is proven.
- A code or registration proof cannot be reused, replayed, or accepted after expiry, lockout, supersession, or provider failure.
- Rate-limit checks and challenge issuance must be concurrency-safe across server instances.
