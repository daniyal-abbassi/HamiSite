---

description: "Task list for One-Step Phone Sign-In With Automatic Registration"
---

# Tasks: One-Step Phone Sign-In With Automatic Registration

**Input**: Design documents from `/specs/046-otp-auto-registration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/otp-verify-auto-registration.md

**Tests**: Included. The API tests are the only proof of the one-transaction, one-account guarantees, and they run only against a dedicated test database (CI has one; this machine does not).

**Organization**: Grouped by user story. Status as of PR #5 (`feat/otp-auto-registration`, CI green): `[x]` is merged into that branch, `[ ]` is still open.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 to US4, as in spec.md

## Phase 1: Setup

No setup work. There is no schema change, no new dependency, no new environment variable, and the SMS provider setup is reused.

## Phase 2: Foundational (blocking prerequisites)

- [x] T001 Amend `specs/043-smsir-otp-login/spec.md` and `specs/043-smsir-otp-login/contracts/otp-auth-api.md`: a valid code for a number with no account now creates and signs in a retail customer (spec 043 said it signed nobody in)

**Checkpoint**: the old contract no longer contradicts the new behaviour.

---

## Phase 3: User Story 1 - New visitor signs in and is registered in one step (Priority: P1) 🎯 MVP

**Goal**: A valid code for an unknown number creates one retail customer and signs them in, with no sign-up form.

**Independent Test**: Verify a code for a number never used on the shop; confirm one new account (`role = RETAIL`, `phoneVerified = true`, `creationMethod = "otp-auto"`, empty name) and one session. Wrong code or request-only creates nothing.

- [x] T002 [US1] In `app/api/auth/otp/verify/route.ts` LOGIN branch: look the user up by the challenge's phone number; if none and the challenge has no linked user, create it with `username = "m" + digits of phoneNumber`, `passwordHash` of 48 random bytes, `role = RETAIL`, `phoneNumber` from the challenge, `creationMethod = "otp-auto"`; `phoneVerified` and `phoneVerifiedAt` are set by the existing update that follows (FR-001, FR-002, FR-003)
- [x] T003 [US1] In the same file: wrap the transaction so a unique-constraint error (`P2002`) rolls it back whole and is retried once, which then finds the winner's account (FR-005)
- [x] T004 [P] [US1] In `tests/api/auth-otp.test.ts`: new number signs in with one user and one session; wrong code creates no user and no session; requesting a code alone creates no user
- [x] T005 [P] [US1] In `tests/api/auth-otp.test.ts`: the same code verified twice at once gives statuses `[200, 400]`, one user, one session; an account created between request and verify is signed into, not duplicated
- [x] T006 [P] [US1] Confirm the existing test "returns the same request confirmation for unknown and registered numbers" in `tests/api/auth-otp.test.ts` still passes, so the screen and message do not reveal whether a number is registered (FR-004, SC-004)

**Checkpoint**: US1 works alone and is the shippable MVP.

---

## Phase 4: User Story 2 - Returning customer is unaffected (Priority: P1)

**Goal**: Existing customers reach the same account; no duplicates; deactivated accounts stay blocked.

**Independent Test**: Sign in with a migrated customer's number and with a number auto-registered earlier; each lands in its one existing account.

- [x] T007 [P] [US2] Existing test "authenticates the original customer account and consumes the challenge once" in `tests/api/auth-otp.test.ts` covers FR-006 for retail; keep it green
- [x] T008 [P] [US2] In `tests/api/auth-otp.test.ts`: a deactivated customer's number returns `OTP_INVALID`, creates no replacement and no session (FR-007)
- [ ] T009 [P] [US2] In `tests/api/auth-otp.test.ts`: a WHOLESALE customer signs in with `role` and `businessVerified` unchanged (FR-006, SC-005). Only retail is asserted today

**Checkpoint**: US1 and US2 together are the full sign-in behaviour.

---

## Phase 5: User Story 3 - Complete details later, when they matter (Priority: P2)

**Goal**: A bare account is never blocked, and its missing details are collected at checkout and kept.

**Independent Test**: Sign in as a brand-new visitor, place an order, sign in again: the name and city from the order are on the account and are not asked again.

- [x] T010 [US3] In `app/api/orders/route.ts`, inside the order transaction: fill `firstName`, `lastName` and `city` from the order only where the user's value is empty, never overwrite (FR-011, FR-012)
- [x] T011 [P] [US3] In `tests/api/orders.test.ts`: empty profile is filled from the order; an existing name and city are left alone
- [x] T012 [P] [US3] In `components/layout/UserMenu.tsx`: show `0` + the phone number without `+98` when `firstName` is empty (FR-013)
- [ ] T013 [P] [US3] In `components/account/AccountClient.tsx` (rendered by `app/(main)/account/page.tsx`): when `firstName`, `lastName` or `city` is empty, show a short Persian notice above the form that names the missing details (FR-011, "the profile shows which details are still empty"). Today the empty inputs are the only hint
- [ ] T014 [P] [US3] In `components/order/OrderDetailClient.tsx` (line 206): do not print the generated username `m98912…` as the customer's name; fall back to the order's own `firstName lastName` (FR-013)

**Checkpoint**: a customer who signs in, shops and orders ends with a complete profile without ever filling a sign-up form.

---

## Phase 6: User Story 4 - Staff access stays separate (Priority: P2)

**Goal**: The phone-code path never creates or signs in staff, and never grants business privileges.

**Independent Test**: Verify a code for an ADMIN number: no session. Verify a new number: the account has `role = RETAIL`, `businessVerified = false`.

- [x] T015 [P] [US4] Existing test "does not grant staff access through a customer OTP challenge" in `tests/api/auth-otp.test.ts` covers an ADMIN number (FR-009); keep it green
- [x] T016 [P] [US4] The T004 assertion `role: "RETAIL", businessVerified: false` covers FR-008 for new accounts
- [ ] T017 [US4] In `app/(admin)/admin/users/page.tsx`: show how each account was created (`creationMethod`) so auto-registered accounts can be found and unusual volume noticed (FR-015). Today they are findable only by querying the database

**Checkpoint**: all four stories are independently verifiable.

---

## Phase 7: Polish and release

- [x] T018 CI green on PR #5 (typecheck and API tests, run against the CI test database)
- [ ] T019 Merge PR #5
- [ ] T020 Deploy to `i-083f7151b773eb5a3` with the larger Node heap (`NODE_OPTIONS=--max-old-space-size=1536`) or a build made elsewhere, then `pm2 reload tools/deploy/ecosystem.config.cjs --update-env`; the 913 MB server crashes a default build
- [ ] T021 Run the manual steps in `quickstart.md` on https://hamihamrah-shop.cyou with a number you control
- [ ] T022 Add an entry to the constitution's amendment log recording the owner instruction of 2026-11-18 for this auth change (Constitution Check "pass with note")

---

## Dependencies and order

- T001 first; it blocks nothing in code but keeps the specs consistent.
- US1 (T002 to T006) is independent and is the MVP. T003 depends on T002.
- US2 and US4 tests depend on T002 only. US3 is independent of US1 in code, but is only useful after US1 exists.
- T019 → T020 → T021. T022 can happen any time before the release note.

## Parallel opportunities

- T004, T005, T006 (same test file, different cases, write together) and T009, T013, T014, T017 touch different files and can run side by side.

## Implementation strategy

1. **MVP**: US1 (done): this alone removes the sign-up wall.
2. **Then**: the open items T009, T013, T014, T017 are small and can ride on a follow-up PR; none blocks the release.
3. **Release**: T019 to T022.

## Summary

- 22 tasks: 14 done, 8 open (T009, T013, T014, T017 are small follow-ups; T019 to T022 are the release steps).
- Per story: US1 has 5 tasks, US2 3, US3 5, US4 3, plus 1 foundational and 5 release/polish tasks.
- MVP: User Story 1, already in PR #5.
