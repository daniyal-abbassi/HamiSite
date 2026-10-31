# Tasks: Partner Registration with Business Documents

**Input**: Design documents from `/specs/045-partner-registration-documents/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/partner-registration.md, quickstart.md

**Tests**: The spec does not ask for TDD. The test tasks included here are the ones the project requires anyway: `CLAUDE.md` requires a capture with each UI change, and `docs/api/auth.md` is pinned by tests. They are written alongside the code they cover.

**Safety**: Never run bare `npm test` or `npx vitest run`, whose setup deletes data. Use `npm run test:unit`, and run `tests/api/` only against the isolated `.env.test` schema. No `db:push`, migration or reseed is needed.

**Organization**: Tasks are grouped by user story so each can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: The user story the task belongs to (US1, US2, US3)

## Phase 1: Setup

**Purpose**: Confirm the starting point

- [X] T001 Run `npm run typecheck` and `npm run test:unit`, and record the two known failures (`tests/unit/admissible-claims.test.ts`, `tests/unit/persian-rtl-ui.test.ts`) as the baseline in specs/045-partner-registration-documents/tasks.md notes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extract the partners page's rules so both intakes share one definition (SC-003), without changing its behaviour (FR-023)

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Create lib/partner-application-input.ts by moving `textSchema`, the required-file rules per entity type (`INDIVIDUAL`: `leaseDocument`, `businessLicense`; `LEGAL`: `leaseDocument`, `registrationNotice`) and form-data reading out of app/api/partners/route.ts, exposing one `parsePartnerApplication(formData, { mobile })` function that throws the same `VALIDATION_FAILED` errors, including `details.fieldErrors` and `details.field`
- [X] T003 Update app/api/partners/route.ts to call `parsePartnerApplication`, keeping its anonymous access, responses and `409 CONFLICT` message unchanged
- [X] T004 [P] Create lib/partner-form-validation.ts by moving `clientValidate`, `EMPTY_VALUES`, `FormValues`, `FormFiles` and `FormErrors` out of components/partners/PartnerForm.tsx, and make the mobile rule optional through a parameter so registration can validate it separately
- [X] T005 Update components/partners/PartnerForm.tsx to import from lib/partner-form-validation.ts with no visible change
- [X] T006 [P] Add `deletePartnerDocuments(names: string[])` to lib/partner-uploads.ts, which removes stored files from `PARTNER_UPLOAD_DIR`, ignores a file that is already gone, and accepts only plain filenames, never paths
- [X] T007 [P] Add a unit test in tests/unit/partner-application-input.test.ts covering both entity types: required text rules (postal code "باید ۱۰ رقم", legal national ID "باید ۱۱ رقم", economic code "باید ۱۲ رقم"), required documents, and a rejected format and size ("JPG/PNG/WebP/PDF", at most 10 MB, not empty)

**Checkpoint**: The partners page behaves exactly as before, using shared rules

---

## Phase 3: User Story 1 - Register as a partner with documents (Priority: P1) MVP

**Goal**: A shop owner registers from the registration page with the partners page's fields and documents, and gets a customer account plus a pending application

**Independent Test**: Complete the partner option for both business types, then confirm the account exists, the application and documents appear for administrators, and the account has no wholesale access

### Backend for User Story 1

- [X] T008 [US1] Create app/api/auth/register/partner/route.ts for `POST`: call `assertSameOrigin`, read multipart data (`MALFORMED_JSON` on failure), and read the `registration_proof` cookie and find the unconsumed, unexpired proof (`401 REGISTRATION_PROOF_REQUIRED` otherwise), per contracts/partner-registration.md
- [X] T009 [US1] In app/api/auth/register/partner/route.ts, call `parsePartnerApplication` with the proof's phone normalized by `normalizeIranianMobile`, ignoring any client `mobile` (FR-012)
- [X] T010 [US1] In app/api/auth/register/partner/route.ts, before writing files, return `409 CONFLICT` if the mobile has an application and `409 DUPLICATE_ACCOUNT` if it has an account, leaving the proof unconsumed (FR-015)
- [X] T011 [US1] In app/api/auth/register/partner/route.ts, save documents with `savePartnerDocument`, then in one transaction lock the proof (`FOR UPDATE`), consume it, and create the `User` (`role = RETAIL`, `businessVerified` false, username `partner_<digits>`, random `passwordHash`, `firstName` and `lastName` split from the full name, `nationalNumber`, `shopName`, `phoneVerified = true`, `creationMethod = "otp"`), the `PartnerApplication` (`status = PENDING`, `ipAddress`, `userAgent`) and the `Session`
- [X] T012 [US1] In app/api/auth/register/partner/route.ts, wrap T011 so any failure calls `deletePartnerDocuments` for files already written, map Prisma `P2002` to `409 DUPLICATE_ACCOUNT` (or `409 CONFLICT` for the application's `mobile`), and on success set the session cookie, clear the proof cookie, and return `{ user, application: { id, entityType, status } }` (FR-010, FR-014)
- [X] T013 [P] [US1] Add any missing Persian copy for the new responses in lib/api-error-fa.ts, including a message telling someone with an existing account to sign in

### Frontend for User Story 1

- [X] T014 [P] [US1] Create components/auth/AuthFileField.tsx in the auth card style: label, chosen file name and size, a remove action, Persian error text, accepting `image/jpeg,image/png,image/webp,application/pdf`, with a 44px minimum target, and styles added to components/auth/auth-card.css
- [X] T015 [US1] Create components/auth/PartnerRegistrationFields.tsx: the حقیقی/حقوقی choice from `partnerEntityOptions`, and text and file fields driven by `partnerSharedFields`, `partnerIndividualFields` and `partnerLegalFields` in lib/content/partners.ts, using `AuthField` and `AuthFileField`, leaving out `mobile`, which the form already renders; use the representative labels for legal businesses as the partners page does
- [X] T016 [US1] Update components/auth/RegisterForm.tsx so «همکار عمده» renders `PartnerRegistrationFields` and removes the username, city, email, shop name and licence-number fields from that branch (FR-005, FR-006), keeping shared values when switching business type
- [X] T017 [US1] Update components/auth/RegisterForm.tsx so the partner branch validates with lib/partner-form-validation.ts before mobile verification, then submits `FormData` to `/api/auth/register/partner`, mapping `details.fieldErrors` and `details.field` onto fields, and keeping typed values and chosen files after a failure
- [X] T018 [US1] Update components/auth/RegisterForm.tsx to show an under-review confirmation with the request number after success, and to refresh auth and cart state, without implying wholesale access (FR-020)

### Tests for User Story 1

- [X] T019 [P] [US1] Add Playwright coverage in e2e/uiverify-auth-otp.spec.ts with mocked responses: fields per business type, a rejected file, multipart submission to the new endpoint, and the under-review confirmation
- [X] T020 [P] [US1] Add API tests in tests/api/auth-register-partner.test.ts for success, a client `mobile` ignored in favour of the proof's phone, missing proof, duplicate mobile, and no files or records left after a forced failure; run only against `.env.test`

**Checkpoint**: A partner can register with documents and appears in the administrator's review list

---

## Phase 4: User Story 2 - Wholesale access only after approval (Priority: P1)

**Goal**: Wholesale access comes only from administrator approval, and registration can no longer grant it

**Independent Test**: Register as a partner, confirm no partner pricing or bundles, then approve and confirm they work on the same account

### Implementation for User Story 2

- [X] T021 [US2] In lib/schemas/auth.ts, restrict `role` in `registerSchema` to `Role.RETAIL`, and remove `shopName`, `businessLicenseNumber` and `agentId`
- [X] T022 [US2] In app/api/auth/register/route.ts, remove the wholesale, `agentId`, `shopName` and `businessLicenseNumber` handling so the route creates only customer accounts
- [X] T023 [US2] Update components/auth/RegisterForm.tsx so the customer branch's JSON request no longer sends `role: "WHOLESALE"`, `shopName` or `businessLicenseNumber`
- [X] T024 [US2] Confirm in lib/partner-applications.ts that `executeApplicationDecision` finds the registered account by mobile and upgrades it without creating a second user, and that rejection leaves it unchanged; change it only if a test shows otherwise (FR-018, FR-019)
- [X] T025 [US2] Update docs/api/auth.md: document `POST /api/auth/register/partner`, narrow `role` to `RETAIL`, and remove the wholesale and `agentId` notes

### Tests for User Story 2

- [X] T026 [P] [US2] Add a unit test in tests/unit/register-schema.test.ts that `registerSchema` rejects `WHOLESALE`, `AGENT` and `ADMIN`, and accepts `RETAIL`
- [X] T027 [P] [US2] Add API tests in tests/api/auth-register-partner.test.ts: a pending partner cannot reach wholesale pricing or bundles; approval upgrades the same user; rejection leaves a working customer; run only against `.env.test`

**Checkpoint**: 0 routes grant wholesale access except approval

---

## Phase 5: User Story 3 - Customer registration stays as it is (Priority: P2)

**Goal**: The «خریدار» option keeps its short form and creates no application

**Independent Test**: Complete the customer option and confirm no business fields, uploads or application appear

- [X] T028 [US3] Verify the customer branch in components/auth/RegisterForm.tsx keeps full name, username, mobile, city and email, and submits JSON to `/api/auth/register`
- [X] T029 [P] [US3] Add Playwright coverage in e2e/uiverify-auth-otp.spec.ts that the customer option shows no document uploads and posts to `/api/auth/register`

**Checkpoint**: All three stories work independently

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T030 [P] Check the partner form at 360px and 1440px with real screenshots in components/auth/auth-card.css: no horizontal overflow, 44px targets, and reduced-motion behaviour (FR-009)
- [X] T031 Run `npm run typecheck` and `npm run test:unit`, and confirm no failures beyond the T001 baseline
- [X] T032 Run the scenarios in specs/045-partner-registration-documents/quickstart.md, including the file count in `data/uploads/partner-documents/` before and after failed attempts
- [X] T033 Run `graphify update .` after the code changes, per CLAUDE.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup; blocks all stories
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on Foundational, and T023 and T027 depend on US1
- **US3 (Phase 5)**: Depends on the US1 form changes
- **Polish (Phase 6)**: Depends on all stories

### User Story Dependencies

- **US1 and US2 must ship together**. US1 alone leaves the self-service wholesale hole open through direct requests, and US2 alone removes the only working partner option from registration.
- **US3** is a regression guard for the form US1 changes.

### Within Each User Story

- Backend before frontend, so the form has a real contract to call
- T008 to T012 are one file, and run in order

### Parallel Opportunities

- T004, T006 and T007 in Phase 2
- T013 and T014 once the contract is fixed
- T019 and T020 in US1
- T026 and T027 in US2

---

## Parallel Example: User Story 1

```text
T013 Add Persian copy in lib/api-error-fa.ts
T014 Create components/auth/AuthFileField.tsx
```

---

## Implementation Strategy

### MVP

Phases 1 to 4 together, since the partner form and the closed self-service path are one safe release. Validate with the quickstart, then deploy.

### Incremental Delivery

1. Foundational: shared rules, with the partners page unchanged
2. US1 and US2: partner intake and the closed path
3. US3 and Polish: regression guards and final checks

## Notes

- Stage files by explicit path, and never include `.mcp.json`
- Commit only when the owner asks
- `e2e/uiverify-auth-otp.spec.ts` overwrites screenshots under `specs/043-smsir-otp-login/verification/`; review `git status` after running it
- Accounts that already hold wholesale access are not touched (FR-024)
- Baseline before this feature (T001): typecheck clean; unit suite 595 passed, 2 failed (`tests/unit/admissible-claims.test.ts`, `tests/unit/persian-rtl-ui.test.ts`)
- T013 needed no change in `lib/api-error-fa.ts`: `DUPLICATE_ACCOUNT` already tells the visitor to sign in, and `RegisterForm` shows the endpoint's own Persian message for `CONFLICT` and document errors
- `lib/registration-proof.ts` was added beyond the plan, so both registration routes spend the proof through one implementation
