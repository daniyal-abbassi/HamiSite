# Research: SMS.ir OTP Customer Login

## Decisions

### SMS provider transport

- **Decision**: Call SMS.ir's server-side Verify endpoint with built-in `fetch`: `POST https://api.sms.ir/v1/send/verify`, header `X-API-KEY`, JSON body containing `mobile`, `templateId`, and `parameters` with the approved template parameter name/value.
- **Rationale**: This matches the SMS.ir REST API contract and avoids a dependency for a single HTTP request. Provider credentials stay in server environment configuration.
- **Alternatives considered**: SMS.ir SDK or a generic SMS package. No SDK is needed for the documented endpoint, and an abstraction spanning multiple providers is outside the approved feature scope.
- **Operational note**: Sandbox uses a test key and template ID `123456`; API success indicates the simulated request was accepted, not that a handset received a real SMS. Production requires the production key and an approved verification template. Keep Sandbox and production configuration separate, and never put the key in client-visible variables.
- **References**: [SMS.ir REST API](https://sms.ir/rest-api/), [SMS.ir Sandbox guide](https://app.sms.ir/developer/help/sandbox), [SMS.ir help](https://sms.ir/help/#content-5-0).

### Phone normalization for SMS.ir

- **Decision**: Normalize accepted user inputs to the project's canonical `+98` format for lookup/storage, validate an Iranian mobile number, then adapt it to the provider's documented national mobile representation (10 digits without the trunk `0`) at the SMS.ir boundary. Keep the canonical value in the challenge and user record.
- **Rationale**: Existing `normalizeIranianMobile` already folds Persian digits and common Iranian formats to `+98...`; the Sandbox request accepted the 10-digit national representation. Keeping provider formatting at the adapter boundary avoids contaminating database identity rules.
- **Alternatives considered**: Store/send each user's original text or persist the provider-form number. Both make equivalent numbers compare inconsistently.

### Challenge storage and verification

- **Decision**: Use PostgreSQL through Prisma as the challenge source of truth. Store an HMAC-SHA-256 digest of the six-digit code (keyed by a dedicated `OTP_HASH_SECRET`), never plaintext. Persist purpose, canonical phone, expiry, attempts, consumed/superseded state and creation time. Verify and consume with a conditional atomic database update so concurrent requests cannot redeem the same code twice.
- **Rationale**: A six-digit code is cheap to brute-force if only an unkeyed hash is leaked. HMAC prevents offline guessing without the separate server secret. Database-backed conditional state works across app instances and fits the existing stack.
- **Alternatives considered**: Plaintext OTP in the existing `OtpCode` model (current behavior; unacceptable for the new sign-in flow); unkeyed digest (low entropy makes offline guessing trivial); process memory (does not coordinate instances or restarts); Redis (additional service is unnecessary for the current single-host scope).

### Throttling and request-source identity

- **Decision**: Enforce rolling per-phone send limits from persisted challenge/delivery timestamps and enforce source limits with a short-lived database bucket keyed by an HMAC of the trusted client IP. Resolve client IP only from deployment-configured trusted proxy headers; do not trust arbitrary `X-Forwarded-For` supplied by a caller. Apply cooldown and count updates atomically.
- **Rationale**: Limits must survive restarts and coordinate app instances. Hashing the address reduces stored personal data; short retention limits exposure. The deployment proxy boundary must be explicit to prevent bypass.
- **Alternatives considered**: In-memory counters (resettable and per-process); storing raw IP long term (unnecessary personal data); accepting the first forwarded IP unconditionally (spoofable); Redis (out-of-scope operational dependency).
- **Initial source default**: 20 requests per trusted client IP per 10 minutes, configurable by deployment. This is intentionally looser than the per-phone send quota to reduce false lockouts for shared office/mobile-carrier IPs while still slowing automated bursts. Ensure database increments cannot race into an over-limit send.

### Login, registration, and account enumeration

- **Decision**: Keep one generic OTP-request response for valid phone input whether or not a customer exists, and send the same neutral message template. LOGIN verification may report that no customer account is associated only after the requester proves control of the phone. REGISTER verification returns a short-lived, single-use registration proof bound to the verified canonical phone; `/api/auth/register` must consume it transactionally before creating a RETAIL/WHOLESALE account and session.
- **Rationale**: Generic request responses avoid revealing account membership to unauthenticated callers. Registration proof prevents client-side claims or replay from bypassing phone verification and avoids creating abandoned accounts before verification.
- **Alternatives considered**: Return account existence from request endpoint (enumeration); create a provisional active user before code verification (abandoned/unverified accounts); create the account from the verify endpoint using incomplete registration fields (mixes identity proof with profile validation).
- **Legacy recovery**: Never attach a phone-less or unreachable legacy account using name/email alone. Preserve the existing support-assisted identity recovery path from the spec.

### Staff authentication and sessions

- **Decision**: Keep existing same-origin session creation and cookie helpers. Restrict password authentication to ADMIN/AGENT; customer login is OTP-only. OTP verification may create only a session for an existing active RETAIL/WHOLESALE user, using that user's current role and privilege fields unchanged.
- **Rationale**: It preserves staff access and existing session/API behavior while preventing the shared imported customer password from authenticating customers.
- **Alternatives considered**: Remove password login entirely (would lock out staff); introduce a separate session/auth provider (unnecessary and risks cookie/API incompatibility).

### Delivery failure and observability

- **Decision**: Treat SMS.ir's response as provider acceptance/rejection, not delivery confirmation. Do not log request bodies, OTP values, API keys, or raw phone numbers. Record only bounded delivery metadata such as provider status/message ID and timestamps; return a generic provider-unavailable response on rejected/failed dispatch. Avoid automatic send retries when the provider outcome is ambiguous; let the user request again after server-side limits allow it.
- **Rationale**: A network timeout can occur after a provider accepted a message. Automatic retries can create duplicate paid messages, and logs must not become a source of OTPs or credentials.
- **Alternatives considered**: Blind retry on every timeout (duplicate cost and confusing code ordering); expose raw provider errors (credential/data leakage and unstable public contract).

## Resolved Clarifications

- Provider endpoint, authentication header, payload shape, Sandbox template, and production template approval path are documented by SMS.ir.
- Runtime language, database, auth/session integration, and phone normalization are confirmed from the repository.
- The API key is environment-only; the Sandbox credential previously shared in chat must not be reused. Use a rotated Sandbox key for any later integration run, and a distinct production key for production.
- No unresolved `NEEDS CLARIFICATION` remains for the design phase. The source-throttle default is set to 20 requests per 10 minutes per trusted client IP and remains configurable for production tuning.
