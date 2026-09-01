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

### 401 means exactly one thing

**A 401 always means "your session is gone; re-authenticate."** Nothing else
returns 401. That makes a global interceptor safe:

```ts
if (res.status === 401) { clearUser(); redirect("/login"); }
```

A wrong *current* password in change-password is deliberately a **400**, not a
401, precisely so this interceptor can't log a user out over a typo.

---

## 3. Endpoints

### `POST /api/auth/register`

Body: `RegisterRequest`. Only `username`, `password`, `phoneNumber` are required.
`role` accepts `RETAIL` or `WHOLESALE` **only** — `AGENT` and `ADMIN` are
provisioned out-of-band and are rejected as validation errors.
`shopName` / `businessLicenseNumber` are silently dropped unless the role is
`WHOLESALE`. `agentId` is only valid on `WHOLESALE` and must reference an
active `AGENT`.

Succeeds with **200** (not 201), returns `PublicUser`, **and logs the user in** —
the session cookie is set on the response.

| Status | Code |
|---|---|
| 200 | — `data: PublicUser`, `meta.message: "Account created"` |
| 400 | `VALIDATION_FAILED` (incl. bad role, password < 6, bad agentId), `MALFORMED_JSON` |
| 409 | `DUPLICATE_ACCOUNT` — message names the field: username, phoneNumber or email |

### `POST /api/auth/login`

Body: `{ identifier: string, password: string }`. `identifier` is a **username
or a phone number** (see §5).

| Status | Code |
|---|---|
| 200 | — `data: PublicUser`, `meta.message: "Login successful"`, sets the cookie |
| 400 | `VALIDATION_FAILED`, `MALFORMED_JSON` |
| 401 | `INVALID_CREDENTIALS` — identical for unknown account and wrong password, in both body *and* response time |
| 403 | `ACCOUNT_DEACTIVATED` — only reachable with otherwise-valid credentials |

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
`creditLimit`, `creditUsed`, `agentId`, `phoneNumber`, `username`,
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
| `phoneVerified` | `boolean` | **not enforced at login today** |
| `nationalNumber`, `city` | `string \| null` | |
| `shopName`, `businessLicenseNumber` | `string \| null` | WHOLESALE only |
| `businessVerified` | `boolean` | admin-asserted |
| `creditLimit`, `creditUsed` | `number \| null` | serialized `Decimal`. **Handle null** — the columns default to 0 but the serializer's type is nullable. |
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

- On **register**, normalization happens before the uniqueness check, so the two
  spellings can never become two accounts.
- On **login**, the identifier is normalized too, so a user stored as `+98912…`
  can type `0912…` and still get in.
- Anything not recognisable as an Iranian mobile passes through untouched, which
  is what lets a username share the field.

Legacy-imported customers are the main users of the phone branch: their
`username` is their raw pre-normalization phone number, so both forms work.

---

## 6. Known constraints

- **Username login is case-sensitive**, and intentionally stays that way. The
  unique index on `username` is case-sensitive, so `Alice` and `alice` can both
  exist; a case-insensitive lookup would pick one arbitrarily and could sign a
  user into the wrong account. Fixing it properly needs a citext or
  normalized-username column.
- **No rate limiting.** The server does not throttle login attempts — do not
  assume it does. Client-side backoff is not a security control.
- **No password reset / forgot-password, and no OTP.** A user who forgets their
  password currently has no self-service path.
- **`phoneVerified` is never checked at login.** It is set by the importer and
  the seed script and is otherwise decorative today.
- **No CSRF token** — see the same-origin warning in §2.
- Expired session rows are never deleted. They are correctly rejected at read
  time, so this is a storage concern, not a security one.
- **19 non-auth routes still return 500 on a malformed JSON body.** The auth
  routes and the two new endpoints use `parseJsonBody`; the rest have not been
  swept yet.

---

## 7. Open decision: legacy password cutover — BLOCKER

Every customer imported from the old shop currently shares one password,
`IMPORTED_CUSTOMER_PASSWORD = "Imported@12345"`, a constant living in a tracked
source file (`prisma/legacy-import/customers.ts`).

This is fine for a dev database and **catastrophic against production data.**

It is not laziness — it is forced. The old site is a SaaS storefront platform
whose API authenticates *shops* via a single `Authorization: Api-Key` header,
not end users. It has **no login endpoint** and exposes **no password hashes** on
any read schema. There is nothing to migrate.

Options, none chosen:

1. **Forced OTP-based first login** — needs SMS/OTP, currently out of scope.
2. **Password reset at cutover** — needs a reset flow, currently out of scope.
3. **One-time random per-user password delivered by SMS** — needs SMS.
4. **Push new credentials into the legacy system** via that API's
   `CustomerUpdateSchema.new_password` field — requires write calls against the
   live production shop.

Since options 1–3 all depend on capabilities that do not exist yet, **this is a
hard prerequisite for any production cutover, not a nice-to-have.** Resolve it
before pointing this backend at real customer data.
