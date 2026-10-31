# Auth API Contract

The contract the frontend builds against. Everything here is pinned by tests in
`tests/api/auth.test.ts`, `tests/api/auth-profile.test.ts`,
`tests/api/auth-legacy-login.test.ts`, `tests/unit/http.test.ts` and
`tests/unit/withAuth.test.ts`.

Types are importable: `@/types/api` (envelope, error codes) and `@/types/auth`
(`PublicUser`, requests, responses). Both are **type-only modules** — importing
them from a `"use client"` component bundles zero bytes.

---

## 1. Response envelope

Every endpoint returns one of two shapes.

```ts
type ApiSuccess<T> = { success: true; data: T; meta?: Record<string, unknown> };
type ApiFailure    = { success: false; error: { message: string; code: ApiErrorCode; details?: unknown } };
```

**`error.code` is always present. Branch on it, never on `error.message`.**
Messages are not part of the contract — they may be reworded or localized at any
time. Codes are append-only: a member is never removed or repurposed.

`details` appears only on validation failures and carries zod's `flatten()`
output: `{ formErrors: string[], fieldErrors: Record<string, string[]> }` — use
`fieldErrors` to attach errors to individual inputs.

### Every code

| Code | Status | Meaning |
|---|---|---|
| `VALIDATION_FAILED` | 400 | Body failed schema validation. `details.fieldErrors` is populated. |
| `MALFORMED_JSON` | 400 | Body was not parseable JSON. |
| `INVALID_CURRENT_PASSWORD` | 400 | change-password only: the submitted current password is wrong. |
| `BAD_REQUEST` | 400 | Generic 400 fallback. |
| `INVALID_CREDENTIALS` | 401 | login only: unknown identifier **or** wrong password (deliberately indistinguishable). |
| `OTP_INVALID` | 400 | OTP is incorrect, expired, consumed, or cannot authenticate a customer. |
| `OTP_ATTEMPTS_EXCEEDED` | 429 | Challenge attempt limit reached. |
| `OTP_RATE_LIMITED` | 429 | Phone or trusted-source request limit reached; includes `details.retryAfterSeconds` and a matching `Retry-After` header. |
| `OTP_DELIVERY_FAILED` | 503 | SMS delivery could not be confirmed; provider details are withheld. |
| `REGISTRATION_PROOF_REQUIRED` | 401 | Registration proof is missing, expired, or already consumed. |
| `AUTH_REQUIRED` | 401 | No session, or the session is expired/revoked. |
| `ACCOUNT_DEACTIVATED` | 403 | `isActive` is false. |
| `FORBIDDEN_ROLE` | 403 | Authenticated, but the wrong role for this endpoint. |
| `FORBIDDEN` | 403 | Generic 403 fallback. |
| `NOT_FOUND` | 404 | |
| `DUPLICATE_ACCOUNT` | 409 | username / phoneNumber / email already taken. |
| `CONFLICT` | 409 | Generic 409 fallback. |
| `INTERNAL_ERROR` | 500 | Unhandled server error. |

---

## 2. Session model

- Opaque 32-byte random token, delivered as an **httpOnly** cookie named
  `session_token`. It is **not** readable from JavaScript — do not try.
- Only a SHA-256 hash of the token is stored server-side.
- Cookie attributes: `Path=/`, `HttpOnly`, `SameSite=lax`, `Expires` ~30 days
  out. `Secure` is added **only** when `NODE_ENV=production`.
  Note Next serializes SameSite lowercase (`SameSite=lax`) — match
  case-insensitively if you ever assert on it.
- **Sliding expiry**: every authenticated request bumps the expiry another 30
  days, in the DB and on the cookie. An active user is never logged out.
- No `Authorization` header. No token in the body. No refresh token.

```ts
await fetch("/api/auth/me", { credentials: "same-origin" }); // the default; stated for clarity
```

> **Same-origin only.** The frontend lives in this same Next.js app, and
> `SameSite=Lax` is the *only* CSRF defense — there is no CSRF token. Moving the
> frontend to a different origin invalidates this design: it would need CORS with
> `Access-Control-Allow-Credentials`, `SameSite=None; Secure`, and a real CSRF
> strategy. Do not deploy the frontend cross-origin without revisiting this.

### Session-protected endpoints use 401 for missing sessions

On session-protected endpoints, `AUTH_REQUIRED` means the session is gone and the user should re-authenticate. OTP and registration endpoints use their own 4xx codes and must not be treated as expired sessions by a global interceptor:

```ts
if (res.status === 401) { clearUser(); redirect("/login"); }
```

A wrong *current* password in change-password is deliberately a **400**, not a
401, precisely so this interceptor can't log a user out over a typo.

---

## 3. Endpoints

### `POST /api/auth/register`

Requires the single-use `registration_proof` HttpOnly cookie issued after a successful REGISTER OTP verification. The request body contains profile fields; `phoneNumber` and `password` are not accepted as registration credentials.
`role` accepts `RETAIL` **only**. `WHOLESALE`, `AGENT` and `ADMIN` are rejected as
validation errors: wholesale access comes only from an administrator approving a
partner application, and `AGENT` and `ADMIN` are provisioned out-of-band.

The server binds the account phone to the proof, assigns an unusable random password hash, and creates a session atomically. Succeeds with **200** and clears the proof cookie.

| Status | Code |
|---|---|
| 200 | — `data: PublicUser`, `meta.message: "Account created"` |
| 400 | `VALIDATION_FAILED` (incl. bad role), `MALFORMED_JSON` |
| 401 | `REGISTRATION_PROOF_REQUIRED` — missing, expired, or replayed proof |
| 409 | `DUPLICATE_ACCOUNT` — username, phone, or email already taken |

### `POST /api/auth/register/partner`

Creates a customer account and a pending partner application in one operation, or neither. Requires the same `registration_proof` cookie. The body is `multipart/form-data` with the fields of `POST /api/partners`, validated by the same rules:

| Field | When |
|---|---|
| `entityType` (`INDIVIDUAL` or `LEGAL`), `fullName`, `nationalCode`, `shopName`, `shopAddress`, `leaseDocument` (file) | always |
| `postalCode`, `shopPhone`, `businessLicense` (file) | `INDIVIDUAL` |
| `companyName`, `companyAddress`, `legalNationalId`, `economicCode`, `registrationNotice` (file) | `LEGAL` |

Documents are JPG, PNG, WebP or PDF, at most 10 MB each, and not empty. A `mobile` field is ignored; the application and the account both take the verified number from the proof. The account has role `RETAIL` and a generated `partner_<digits>` username. It gains `WHOLESALE` only when an administrator approves the application, which upgrades this same account. A rejection leaves it a working customer account.

| Status | Code |
|---|---|
| 200 | — `data: { user: PublicUser, application: { id, entityType, status } }`, `meta.message: "Application submitted"`. Sets the session cookie and clears the proof cookie. |
| 400 | `MALFORMED_JSON`; `VALIDATION_FAILED` with `details.fieldErrors` for text or `details.field` for a document |
| 401 | `REGISTRATION_PROOF_REQUIRED` — missing, expired, or replayed proof |
| 403 | `FORBIDDEN` — cross-origin request |
| 409 | `CONFLICT` — this mobile already has an application. `DUPLICATE_ACCOUNT` — this mobile already has an account. Refused before anything is stored, so the proof stays usable. |

Stored documents are removed on any failure after they are written.

### `POST /api/auth/otp/request`

Body: `{ phoneNumber: string, purpose: "LOGIN" | "REGISTER" }`. Iranian phone values are canonicalized. A valid request returns the same generic confirmation regardless of account existence: `{ challengeId, maskedPhone, expiresInSeconds: 300, resendAfterSeconds: 60 }`. Delivery errors do not include provider details. Rate limits return `OTP_RATE_LIMITED` and `Retry-After`.

### `POST /api/auth/otp/verify`

Body: `{ challengeId: string, code: string }`; Persian digits are accepted. Challenges expire after five minutes and allow at most five attempts. LOGIN consumes the challenge once and creates a session only for an active RETAIL/WHOLESALE account. REGISTER consumes the challenge and sets a 10-minute, single-use `registration_proof` HttpOnly, SameSite=Lax cookie; it does not create an account or session. Neither response contains the code or provider payload.

The SMS.ir integration is server-only. Configure `SMS_IR_API_KEY`,
`SMS_IR_TEMPLATE_ID`, and optionally `SMS_IR_CODE_PARAMETER`; use separate
Sandbox and production credentials/templates. `OTP_HASH_SECRET` and
`OTP_SOURCE_HASH_SECRET` must each contain at least 32 bytes. The optional
`OTP_TRUSTED_PROXY_HEADER` is trusted only when a proxy overwrites it;
source throttling defaults to 20 requests per 600 seconds and can be tuned with
`OTP_SOURCE_REQUEST_LIMIT` and `OTP_SOURCE_WINDOW_SECONDS`.

### `POST /api/auth/login`

Body: `{ identifier: string, password: string }`. This endpoint is staff-only: ADMIN and AGENT retain password login; RETAIL/WHOLESALE always receive generic `INVALID_CREDENTIALS` after password comparison. Customers use OTP.

| Status | Code |
|---|---|
| 200 | — `data: PublicUser`, `meta.message: "Login successful"`, sets the cookie for staff |
| 400 | `VALIDATION_FAILED`, `MALFORMED_JSON` |
| 401 | `INVALID_CREDENTIALS` — identical for unknown account and wrong password, in both body *and* response time |
| 403 | `ACCOUNT_DEACTIVATED` — only reachable with otherwise-valid staff credentials |

### `GET /api/auth/me`

No body. Returns the current `PublicUser` and refreshes the cookie.

| Status | Code |
|---|---|
| 200 | — `data: PublicUser` (no `meta`) |
| 401 | `AUTH_REQUIRED` |
| 403 | `ACCOUNT_DEACTIVATED` |

### `PATCH /api/auth/me`

Body: `UpdateProfileRequest`. At least one field required.

**Editable:** `firstName`, `lastName`, `city`, `email`, `receiveNewsletters`.

**Not editable, and silently ignored if sent:** `role`, `isActive`,
`agentId`, `phoneNumber`, `username`,
`phoneVerified`, `businessVerified`, `nationalNumber`, `shopName`,
`businessLicenseNumber`, `cardNumber`. These are login identifiers, privileges,
financial fields, server-asserted verification state, the evidence behind that
state, or a fraud vector. Changing any of them is an admin operation.

**Three-state semantics** — this is the part worth reading twice:

| You send | Result |
|---|---|
| field omitted | unchanged |
| `"city": null` | cleared to NULL |
| `"city": "Tehran"` | set |

| Status | Code |
|---|---|
| 200 | — `data: PublicUser`, `meta.message: "Profile updated"` |
| 400 | `VALIDATION_FAILED` (incl. empty body), `MALFORMED_JSON` |
| 401 | `AUTH_REQUIRED` |
| 409 | `DUPLICATE_ACCOUNT` — email taken. Re-sending your *own* current email is a no-op, not a conflict. |

### `POST /api/auth/change-password`

Body: `{ currentPassword: string, newPassword: string }`. `newPassword` must be
≥ 6 chars and must differ from the current one.

**Revokes every other session.** The requesting session stays alive — the user
is not logged out and does not lose their cart. `data.revokedSessions` reports
how many other devices were signed out; surface it ("Signed out of 2 other
devices").

| Status | Code |
|---|---|
| 200 | — `data: { passwordChanged: true, revokedSessions: number }` |
| 400 | `INVALID_CURRENT_PASSWORD`, `VALIDATION_FAILED`, `MALFORMED_JSON` |
| 401 | `AUTH_REQUIRED` — session invalid, **not** "wrong password" |

### `POST /api/auth/logout`

No body. Deletes **only the current** session row and clears the cookie at
`Path=/`. Other devices stay signed in.

| Status | Code |
|---|---|
| 200 | — `data: { loggedOut: true }` |
| 401 | `AUTH_REQUIRED` |

---

## 4. `PublicUser`

The only user shape any endpoint returns. `passwordHash` is never present.

| Field | Wire type | Notes |
|---|---|---|
| `id` | `number` | |
| `role` | `"RETAIL" \| "WHOLESALE" \| "AGENT" \| "ADMIN"` | |
| `username` | `string` | login identifier, **case-sensitive** |
| `email` | `string \| null` | unique when set |
| `firstName`, `lastName` | `string \| null` | |
| `phoneNumber` | `string` | E.164, login identifier |
| `phoneVerified` | `boolean` | Set only after successful SMS proof or trusted import. |
| `nationalNumber`, `city` | `string \| null` | |
| `shopName`, `businessLicenseNumber` | `string \| null` | WHOLESALE only |
| `businessVerified` | `boolean` | admin-asserted |
| `agentId` | `number \| null` | assigned sales rep |
| `isActive` | `boolean` | |
| `receiveNewsletters` | `boolean` | |
| `createdAt`, `updatedAt` | `string` | ISO 8601 |

A compile-time assertion in `types/auth.ts` fails `npm run typecheck` if this
interface and the server's `sanitizeUser` ever diverge, so the table above
cannot silently go stale.

---

## 5. Phone numbers

`09121112233`, `9121112233`, `0912 111 2233` and `+989121112233` all normalize
to **`+989121112233`**.

- OTP requests normalize before lookup or challenge creation, so the two
  spellings address the same account and cannot create duplicate challenges.
- Registration binds the new account number to the canonical phone held by its
  verified proof; the request body cannot substitute another number.

Legacy-imported customers may still have a raw phone as their username, but
customer access now uses the canonical `phoneNumber` and SMS verification.

---

## 6. Known constraints

- **Username login is case-sensitive**, and intentionally stays that way. The
  unique index on `username` is case-sensitive, so `Alice` and `alice` can both
  exist; a case-insensitive lookup would pick one arbitrarily and could sign a
  user into the wrong account. Fixing it properly needs a citext or
  normalized-username column.
- OTP request routes throttle by HMAC-derived phone and trusted source identifiers. Configure `OTP_TRUSTED_PROXY_HEADER` only when a trusted proxy overwrites that header.
- **No password reset / forgot-password.** A user who forgets their
  password currently has no self-service path.
- A successful customer OTP login sets `phoneVerified` and `phoneVerifiedAt`;
  the account role, profile, business fields, cart, and order history remain
  unchanged.
- **No CSRF token** — see the same-origin warning in §2.
- Expired session rows are never deleted. They are correctly rejected at read
  time, so this is a storage concern, not a security one.
- **19 non-auth routes still return 500 on a malformed JSON body.** The auth
  routes and the two new endpoints use `parseJsonBody`; the rest have not been
  swept yet.

---

## 7. Legacy password cutover

Every customer imported from the old shop currently shares one password,
`IMPORTED_CUSTOMER_PASSWORD = "Imported@12345"`, a constant living in a tracked
source file (`prisma/legacy-import/customers.ts`).

The legacy importer still assigns a shared placeholder password because the
source system does not expose customer password hashes. The customer login API
now rejects password authentication for RETAIL/WHOLESALE accounts, including
that shared value. Customers prove the original phone through SMS.ir and retain
their original account ID and associated data. ADMIN/AGENT password login stays
available. Production release still requires production SMS.ir credentials,
approved template configuration, and an end-to-end delivery acceptance check.
