---
description: "Dependency-ordered implementation tasks for SMS.ir OTP customer authentication"
---

# Tasks: SMS.ir OTP Customer Login

**Input**: Design documents in `specs/043-smsir-otp-login/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/otp-auth-api.md`, and `quickstart.md`.

**Tests**: No test-authoring tasks are included because the feature specification does not explicitly request writing tests. Each story below retains an independent acceptance criterion; use the existing test and validation setup when implementing.

**Organization**: Tasks are grouped by the three user stories. Story 2 depends on the shared OTP implementation in Story 1 because it extends the same verification route.

## Phase 1: Setup (Shared Configuration)

**Purpose**: Declare server-side provider and OTP configuration without exposing secrets to the client.

- [X] T001 Add optional server-only `SMS_IR_API_KEY`, `SMS_IR_TEMPLATE_ID`, `SMS_IR_CODE_PARAMETER`, `OTP_HASH_SECRET`, and `OTP_SOURCE_HASH_SECRET` configuration and validation in `lib/env.ts` and document empty placeholders, Sandbox/production separation, and the trusted proxy header setting `OTP_TRUSTED_PROXY_HEADER` in `.env.example`; OTP routes must fail closed if required secrets are missing, and each OTP secret must be at least 32 bytes.

---

## Phase 2: Foundational (Shared OTP Infrastructure)

**Purpose**: Provide persisted challenge state, safe SMS delivery, code primitives, and abuse controls before story endpoints are added.

**⚠️ CRITICAL**: Complete this phase before implementing any user story.

- [X] T002 Extend `OtpCode` and its enums in `prisma/schema.prisma` with `codeDigest` (HMAC-SHA-256; never plaintext), new-flow purpose restricted to `LOGIN` or `REGISTER`, status values `PENDING`, `SENT`, `CONSUMED`, `SUPERSEDED`, `FAILED`, `LOCKED`, `attemptCount` starting at zero and locking at 5, and `expiresAt` five minutes after issuance; retain nullable `userId`, canonical `phoneNumber`, nullable `providerMessageId`, nullable hashed `requesterHash`, and `createdAt`, and add indexes for `(phoneNumber, purpose, createdAt)`, `(requesterHash, createdAt)`, and status/expiry; remove the legacy plaintext `code` column and invalidate only outstanding `otp_codes` during rollout, preserving all `User`, order, cart, and payment rows.
- [X] T003 [P] Add `OtpRequestBucket` in `prisma/schema.prisma` with HMAC-derived `key` as primary key, atomic integer `count`, short-lived `expiresAt`, and `updatedAt`; its key must contain no raw phone number or IP address.
- [X] T004 [P] Implement the server-only SMS.ir adapter in `lib/sms-ir.ts` using `POST https://api.sms.ir/v1/send/verify`, `X-API-KEY`, `mobile`, `templateId`, and `parameters`; convert canonical `+98` numbers to the 10-digit national provider format, map provider responses to a small internal result, and never log credentials, codes, full phone numbers, or provider payloads.
- [X] T005 [P] Implement code generation and HMAC verification in `lib/otp.ts`: generate a six-digit code, bind the HMAC-SHA-256 digest to challenge ID, canonical phone, and purpose using `OTP_HASH_SECRET`, compare safely, and apply the five-minute expiry without persisting or returning plaintext code.
- [X] T006 Implement concurrency-safe request limits in `lib/otp-rate-limit.ts` using persisted challenge/bucket state and trusted proxy IP resolution; enforce a 60-second resend cooldown, at most 5 sends per phone in a rolling hour, and a configurable default of 20 requests per trusted client IP per 10 minutes; store only HMAC-derived source identifiers and reject before SMS dispatch.
- [X] T007 [P] Add Zod request/verify schemas in `lib/schemas/otp.ts` for a normalized valid Iranian mobile, purpose `LOGIN` or `REGISTER`, opaque challenge ID, and exactly six decimal code digits; fold Persian digits before validation and reject unsupported formats.

**Checkpoint**: Shared schema, provider adapter, code primitives, and atomic limits are ready; no route can yet authenticate a user.

---

## Phase 3: User Story 1 — Returning Customer Sign-in (Priority: P1) 🎯 MVP

**Goal**: Let an existing active retail or wholesale customer sign into the original account and retain its profile, cart, orders, and payment history.

**Independent Test**: Use a migrated RETAIL or WHOLESALE account with a known mobile and an existing order. Complete OTP sign-in with that phone, confirm the same user ID and existing order are visible, verify equivalent Persian/English Iranian phone formats resolve identically, and confirm its shared legacy password fails.

- [X] T008 Implement `POST /api/auth/otp/request` in `app/api/auth/otp/request/route.ts` using `lib/schemas/otp.ts`, `lib/otp.ts`, `lib/otp-rate-limit.ts`, and `lib/sms-ir.ts`; send the same neutral template and return the same generic confirmation for any valid-format number whether registered or not, with only an opaque challenge ID, masked phone, 300-second expiry, and 60-second resend delay.
- [X] T009 Implement the LOGIN branch of `POST /api/auth/otp/verify` in `app/api/auth/otp/verify/route.ts`; verify only `SENT`, unexpired challenges, increment failed attempts atomically, consume a correct challenge exactly once, allow only active RETAIL/WHOLESALE users, set `phoneVerified` and `phoneVerifiedAt` only after proof, and create the session with existing helpers without changing role or business/credit fields.
- [X] T010 Restrict password authentication in `app/api/auth/login/route.ts` to ADMIN and AGENT while preserving the existing staff `INVALID_CREDENTIALS` failure envelope; perform the existing password comparison before role-based rejection so RETAIL/WHOLESALE customers cannot authenticate with the imported shared password.
- [X] T011 Replace the customer password form with the OTP request/verify flow in `components/auth/LoginForm.tsx`; show masked destination, expiry, retry timing, generic provider failures, invalid/expired feedback, and the existing safe `next` redirect; after success refresh `AuthProvider` and cart state, and show support-assisted recovery for legacy numbers that cannot receive SMS without inventing contact details.
- [X] T012 Map the new stable OTP API error codes to Persian customer messages in `lib/api-error-fa.ts` without displaying provider responses, full phone numbers, OTP values, or account existence before phone proof.

**Checkpoint**: Returning customers can access their original account via SMS; customers cannot use password login, and staff password API authentication remains available.

---

## Phase 4: User Story 2 — Verified New Customer Registration (Priority: P2)

**Goal**: Create one retail or wholesale account only after the user proves ownership of an unused mobile number.

**Independent Test**: Request REGISTER for an unused number, verify it, submit profile data, and confirm exactly one verified account and one session are created. Replay or expire the proof and confirm no account is created; attempt an existing number and confirm no duplicate account is created.

- [X] T013 Add `RegistrationProof` in `prisma/schema.prisma` with unique `tokenHash`, canonical `phoneNumber`, `expiresAt` (short-lived, at most 10 minutes), nullable `consumedAt`, and `createdAt`; store only the token digest, never the cookie token.
- [X] T014 Add the REGISTER branch to `app/api/auth/otp/verify/route.ts`; after atomically consuming the challenge, create a single-use proof bound to its canonical phone and set only a Secure, HttpOnly, SameSite=Lax proof cookie; return only the masked phone and proof expiry, with no account or session yet.
- [X] T015 Update `registerSchema` in `lib/schemas/auth.ts` so `phoneNumber` and `password` are not trusted registration credentials; preserve the existing profile constraints (`username` 3–50 characters, optional `email` max 255, `firstName`/`lastName`/`city` max 100, `shopName` max 200, `businessLicenseNumber` max 100, and self-service roles RETAIL/WHOLESALE only).
- [X] T016 Require and consume the registration proof transactionally in `app/api/auth/register/route.ts`; bind the created account's phone to the proof, set `phoneVerified=true` and `phoneVerifiedAt`, reject expired/mismatched/replayed proofs and unique conflicts, create only RETAIL/WHOLESALE users, preserve the existing non-null `passwordHash` constraint with a fresh random unusable hash, create the session, and clear the proof cookie.
- [X] T017 Convert `components/auth/RegisterForm.tsx` to a two-step profile-and-phone-verification flow; remove the customer password field, request and verify a REGISTER code before submission, retain existing retail/wholesale profile fields and `next` redirect, and do not create an account before the verified proof exists.

**Checkpoint**: New customer registration is verified, single-use, and duplicate-safe; existing customer records remain untouched.

---

## Phase 5: User Story 3 — Staff Access Remains Available (Priority: P2)

**Goal**: Preserve the existing ADMIN/AGENT password sign-in experience while keeping customer OTP sign-in separate and preventing OTP from granting staff access.

**Independent Test**: Sign in as an active ADMIN and AGENT through the staff password mode and confirm their existing roles/permissions; submit customer credentials through that mode and an ADMIN/AGENT phone through OTP and confirm neither produces an unauthorized session.

- [X] T018 Create a staff password form in `components/auth/StaffLoginForm.tsx` that submits to the existing `/api/auth/login`, displays Persian-safe credential errors, preserves `next`, and refreshes the existing auth/cart providers after a successful staff session.
- [X] T019 Add an explicit customer/staff mode switch in `components/auth/LoginForm.tsx` and update `app/(main)/login/page.tsx` copy so customer access uses OTP by default and staff can deliberately open the password form; keep both modes in the same-origin session flow.

**Checkpoint**: Staff retain password access and role/permission state; customer OTP cannot create staff sessions.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Complete operational documentation, privacy cleanup, and repository metadata for the implemented feature.

- [X] T020 Update the pinned auth API reference in `docs/api/auth.md` with OTP request/verify contracts, staff-only password login, registration proof cookie, stable error behavior, same-origin requirement, and server-only SMS.ir configuration.
- [X] T021 Update `specs/043-smsir-otp-login/quickstart.md` with the final env names and release sequence; document that `npm run db:push` may invalidate outstanding legacy OTP challenges but must preserve users/orders, and that Sandbox acceptance is not handset delivery.
- [X] T022 Add bounded cleanup for expired challenges, request buckets, and consumed/expired registration proofs in `lib/otp-cleanup.ts`; retain only the minimum delivery metadata and never log plaintext codes, API keys, raw phone numbers, raw IPs, or full provider bodies.
- [X] T023 Refresh the code knowledge graph with `graphify update .` after implementation and confirm `graphify-out/` reflects the new OTP routes, provider adapter, and Prisma models.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on setup configuration; blocks all story work.
- **User Story 1 (Phase 3)**: Depends on the shared OTP schema, SMS adapter, code primitives, and rate limiter from Phase 2.
- **User Story 2 (Phase 4)**: Depends on Phase 2 and the OTP request/verify path from User Story 1 because registration proof extends the same verification endpoint.
- **User Story 3 (Phase 5)**: Depends on the staff-only API behavior from User Story 1; its separate form and mode switch can then be implemented without changing the registration path.
- **Polish (Phase 6)**: Depends on the stories being shipped.

### User Story Dependencies

- **User Story 1 (P1)**: First MVP slice after the foundation.
- **User Story 2 (P2)**: Follows User Story 1 to reuse challenge verification and API behavior.
- **User Story 3 (P2)**: Follows User Story 1 to retain password access through the now staff-only API; can proceed independently of User Story 2 after that point.

### Parallel Opportunities

- After T001, T004 (SMS.ir adapter), T005 (OTP crypto), and T007 (request schemas) can be implemented in parallel because they touch separate files.
- T008 request endpoint and T009 verify endpoint share the `app/api/auth/otp/` surface and should be implemented sequentially.
- User Story 2's registration schema/form tasks can be split across separate files after the proof model and verification branch are agreed; the registration route depends on both.
- After User Story 1, User Story 3's staff form can be developed independently of User Story 2's registration form and route.

## Parallel Example: Foundational Work

```text
Task: T004 Implement the server-only SMS.ir adapter in lib/sms-ir.ts
Task: T005 Implement code generation and HMAC verification in lib/otp.ts
Task: T007 Add Zod request/verify schemas in lib/schemas/otp.ts
```

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 to allow a returning customer to sign in to the original account and reject legacy customer passwords.
3. Validate the independent Story 1 acceptance criterion using the project test database and a mocked SMS adapter; do not require a real customer SMS for automated validation.
4. Add registration (Story 2) and staff mode (Story 3) as the next increments.

### Incremental Delivery

1. Setup + shared OTP foundation.
2. Deliver returning-customer OTP login as the MVP.
3. Add verified new-customer registration.
4. Complete the staff password mode and confirm role boundaries.
5. Update API/deployment docs and clean up expired OTP artifacts.

## Notes

- Every implementation task has a unique ID, checkbox, correct phase/story label, and exact repository path.
- No automated test-authoring tasks are included; acceptance criteria above define independent validation for each story.
- Do not use destructive database reset or blind seed commands during rollout.

## Phase 7: Convergence

- [X] T024 Return `retryAfterSeconds` in the stable 429 response, expose it through `lib/api-client.ts`, and show the remaining limit wait in the customer forms per FR-013 (partial).
- [X] T025 Update the RegistrationProof rule in `specs/043-smsir-otp-login/data-model.md` to make the verified proof the sole source of the created phone number per plan: registration-proof decision (partial).
- [X] T026 Check challenge expiry using the database clock after row locking and make expiry part of the atomic consume predicate; cover the boundary behavior per FR-009 and SC-003 (partial).
