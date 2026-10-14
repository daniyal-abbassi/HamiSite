---
description: "Executable tasks for backend security review and corrections"
---

# Tasks: Backend Security Review and Corrections

**Input**: Design documents in `specs/035-backend-security/`

**Prerequisites**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/security-review.md](contracts/security-review.md), [quickstart.md](quickstart.md)

**Tests**: Required by the three user stories and FR-010/FR-012. Write focused cases before a correction; a passing baseline is valid when the control already works.
**Organization**: Story tasks are independently testable after the shared setup. The final report consolidates their evidence. Beads tracks the implementation workflow and any unresolved findings.

## Phase 1: Setup

**Purpose**: Obtain the exact guidance and establish a safe audit environment without touching store data.

- [X] T001 Install the FarsiUI Backend Security guidance using the command in `specs/035-backend-security/quickstart.md`; verify `.agents/skills/backend-security/SKILL.md` and all companion `.agents/skills/backend-security/references/` files, and record the source, revision or digest, date, and any missing file in `specs/035-backend-security/review.md`.
- [X] T002 Run the read-only `.env` versus `.env.test` preflight from `specs/035-backend-security/quickstart.md`; inspect ownership of the test target without printing URLs or secrets, and record whether `tests/setup.ts` may safely clear its 19 tables in `specs/035-backend-security/review.md`. If disposable ownership is not established, mark database-backed cases unavailable and use only pure checks.

**Checkpoint**: Guidance is identified and the test boundary is known; no reset, seed, charge, or live-data probe has run.

---

## Phase 2: Foundational Audit Inventory

**Purpose**: Provide the shared evidence map used by every story.

- [X] T003 Inventory every current `app/api/**/route.ts` entry point and `middleware.ts` in `specs/035-backend-security/review.md`; group them under all eight categories in `specs/035-backend-security/contracts/security-review.md` and record an inspected example or evidence-based not-applicable decision for each category.
- [X] T004 Trace `lib/auth.ts`, `lib/http.ts`, `lib/orders.ts`, `lib/payment/`, `lib/partner-uploads.ts`, `lib/digikala.ts`, and `lib/telegram-auth.ts` into the operations in `specs/035-backend-security/review.md`; for each selected boundary record actor, path/method, input source, sensitive sink, existing control, source location, and runtime-test access.
- [X] T005 Define isolated guest, customer A, customer B, and staff fixtures plus safe fake-provider/file/request cases in `specs/035-backend-security/review.md`; cross-reference `tests/helpers/`, `tests/api/`, and `tests/unit/`, and label scenarios unavailable when the disposable database or provider access is not established.

**Checkpoint**: Each sensitive category has a traceable operation and planned evidence, and destructive test eligibility is explicit.

---

## Phase 3: User Story 1 — Protect Customer and Staff Actions (Priority: P1) 🎯 MVP

**Goal**: Legitimate account and staff actions work while guest, cross-account, inactive, and lesser-role attempts reveal no protected record and change no protected state.

**Independent Test**: With the isolated actors from T005, run a permitted and a denied read/mutation for a customer-owned object and an admin operation. Compare both responses and stored state. If database cases are unavailable, report that limit and run only pure checks.

### Tests and Evidence

- [X] T006 [P] [US1] Add or extend session, inactive-account, unexpected identity/role field, and authorized profile/password cases in `tests/api/auth.test.ts` and pure session tests in `tests/unit/auth.test.ts`; run the pure file first and run API cases only after T002 permits resets.
- [X] T007 [P] [US1] Add customer A/B identifier substitution, authorized action, denied response, and unchanged-record assertions in `tests/api/addresses.test.ts` and `tests/api/orders.test.ts`; cover the corresponding paths in `app/api/addresses/[id]/route.ts` and `app/api/orders/[id]/route.ts`.
- [X] T008 [P] [US1] Add guest/customer/staff read and mutation cases, including no protected payload before denial, in `tests/api/admin-users.test.ts`; inspect `middleware.ts`, `app/api/admin/users/route.ts`, and `app/api/admin/users/[id]/route.ts` separately.

### Implementation and Verification

- [X] T009 [US1] Review the remaining authenticated account, cart, partner, admin, and TMA rows in `specs/035-backend-security/review.md` for operation-specific role/ownership decisions and extra write fields; for any proven gap, add its failing case beside the affected `tests/api/` or `tests/unit/` file before changing the exact `app/api/**/route.ts` or `lib/` path recorded in that row.
- [X] T010 [US1] Correct confirmed session, ownership, role, and overposting defects only in the affected `lib/auth.ts`, `middleware.ts`, or `app/api/**/route.ts` paths identified by T006–T009; preserve `docs/api/auth.md` envelopes and record the precise correction paths in `specs/035-backend-security/review.md`. If no defect is confirmed, record the passing control and make no speculative rewrite.
- [X] T011 [US1] For public authentication and other costly operations inventoried in T003, record existing retry/request bounds and safe excess-attempt behavior in `specs/035-backend-security/review.md`; test confirmed missing bounds around `app/api/auth/login/route.ts`, `app/api/auth/register/route.ts`, or the exact affected route in `tests/api/auth.test.ts` or a matching `tests/api/` file before a targeted fix.
- [X] T012 [US1] Repeat authorized, guest, inactive, cross-account, lesser-role, malformed, and oversized cases relevant to each US1 correction in `tests/api/auth.test.ts`, `tests/api/addresses.test.ts`, `tests/api/orders.test.ts`, and `tests/api/admin-users.test.ts`; record response and protected-state results in `specs/035-backend-security/review.md`.

**Checkpoint**: The exercised account and staff boundaries have paired allowed/denied evidence; unresolved cases remain explicitly unverified.

---

## Phase 4: User Story 2 — Keep Money and External Boundaries Trustworthy (Priority: P2)

**Goal**: Trusted records determine money and order effects; provider, file, import, and outbound input cannot create duplicate or unauthorized effects.

**Independent Test**: With the fake gateway or approved sandbox and disposable data, alter customer-supplied values, replay or race a callback, and submit disallowed file/destination inputs. A valid flow succeeds once; denied cases leave payment, order, stock, credit, files, and unrelated records consistent. Label unavailable provider/concurrency conditions.

### Tests and Evidence

- [X] T013 [P] [US2] Add authorized order payment plus changed price, total, user identity, and eligibility claims in `tests/api/pay.test.ts`; assert server-derived values from `app/api/orders/[id]/pay/route.ts` and no unauthorized order/payment mutation.
- [X] T014 [P] [US2] Add invalid, stale, repeated, and competing callback cases in `tests/api/payments-callback.test.ts` and pure provider checks in `tests/unit/payment-zarinpal.test.ts`; assert a valid result settles once under `specs/017-zarinpal-payment/contracts/payment.md`.
- [X] T015 [P] [US2] Add mismatched MIME/bytes, oversized file, unsafe filename, unauthorized retrieval, and valid upload cases in `tests/api/admin-catalog-images.test.ts` and `tests/api/admin-partner-documents.test.ts` (create if absent); inspect `lib/partner-uploads.ts`, `app/api/catalog-images/[filename]/route.ts`, and `app/api/admin/partners/[id]/documents/[docType]/route.ts`.
- [X] T016 [P] [US2] Exercise allowed/disallowed URL, redirect destination, timeout/size, and malformed external assertion cases with local fakes in `tests/unit/digikala-security.test.ts` (create if absent) and `tests/unit/telegram-auth.test.ts`; trace `lib/digikala.ts`, `lib/telegram-auth.ts`, `app/api/admin/importer/digikala/search/route.ts`, and `app/api/admin/importer/digikala/product/route.ts`, and record unavailable network behavior.

### Implementation and Verification

- [X] T017 [US2] Trace `app/api/pricing/quote/route.ts`, `app/api/orders/route.ts`, `app/api/orders/[id]/pay/route.ts`, `app/api/payments/callback/route.ts`, `lib/orders.ts`, and `lib/payment/` in `specs/035-backend-security/review.md`; record trusted price/discount/eligibility source, provider verification, authority lookup, transaction, replay, and concurrent-state controls before changing them.
- [X] T018 [US2] Correct only confirmed price, settlement, replay, or concurrency defects in the exact `app/api/orders/`, `app/api/payments/`, `lib/orders.ts`, or `lib/payment/` files supported by T013–T014/T017; keep cash, wholesale-credit, zero-total, and existing callback behavior in `specs/017-zarinpal-payment/contracts/payment.md`, and record any required contract change in `specs/035-backend-security/review.md`.
- [X] T019 [US2] Correct only confirmed file, import, outbound, or external-assertion defects in the affected `lib/partner-uploads.ts`, `lib/digikala.ts`, `lib/telegram-auth.ts`, `app/api/admin/catalog-images/route.ts`, `app/api/admin/importer/digikala/search/route.ts`, `app/api/admin/importer/digikala/product/route.ts`, or `app/api/admin/partners/[id]/documents/[docType]/route.ts` supported by T015–T016; include redirect final destination, content/size bounds, and unrelated-record effects in `specs/035-backend-security/review.md`.
- [X] T020 [US2] Repeat each relevant valid, malformed, unauthorized, replay, and concurrent case from `tests/api/pay.test.ts`, `tests/api/payments-callback.test.ts`, `tests/api/admin-catalog-images.test.ts`, and focused `tests/unit/` files after any correction; record response plus payment/order/stock/credit/file state in `specs/035-backend-security/review.md`.

**Checkpoint**: Every exercised money and external boundary has a legitimate-path result and a matching rejected-path result; unsupported provider or production claims are labeled unverified.

---

## Phase 5: User Story 3 — Repeat an Evidence-Based Security Review (Priority: P3)

**Goal**: A maintainer can install the exact guidance, follow the safe review, reproduce one finding or verified control, and understand every remaining limit.

**Independent Test**: From a clean checkout, use `specs/035-backend-security/quickstart.md` to install the guide and locate its references, then reproduce one isolated recorded case and compare the report's expected and actual results. If no weakness is found, reproduce a documented passing control; do not invent a finding.

### Report and Reproduction

- [X] T021 [US3] In `specs/035-backend-security/review.md`, identify each protected operation with `operationId` "Unique within the review", `entryPoint` "Existing source path and method where applicable", `actorClass` "Named from existing roles or external contract; no invented principal", `targetType` "Existing record or resource type", `permissionRule` "Traceable to contract or confirmed behavior", `expectedEffect` "Match observed code path", and `reviewStatus` "Include evidence or limitation" as specified in `specs/035-backend-security/data-model.md`.
- [X] T022 [US3] In `specs/035-backend-security/review.md`, identify each trust boundary with `boundaryId` "Unique within the review" and `operationId` that "Must identify an inventoried operation"; record `inputSource` "State the actual source", `sensitiveSink` "State the actual target", `currentControl` "Name evidence, not an assumed guarantee", and `testAccess` "Never imply a test ran when it did not".
- [X] T023 [US3] In `specs/035-backend-security/review.md`, give each concern a `findingId` "Unique within the review", an `operationId` or `boundaryId` where "At least one must resolve to the inventory", and a `severity` with "State potential harm and scope"; use `evidenceStatus` where "Observed requires a reproducible runtime result; source proof stays labeled as source evidence", and include safe evidence, impact, smallest supported correction, state, and Beads follow-up for unresolved critical/high work.
- [X] T024 [US3] In `specs/035-backend-security/review.md`, link each corrected finding to verification records whose `findingId` "Must exist" and whose `caseType` must "Match the finding's risk"; record expected/actual response, protected-record effect or unverified status, environment/date, authorized and denied repeats, and required limitations when a check cannot run.
- [X] T025 [US3] Reproduce one recorded finding or passing control using `specs/035-backend-security/quickstart.md`, compare actual outcomes with `specs/035-backend-security/review.md`, and amend the guide/report if installation, test isolation, or evidence steps are not repeatable within the SC-006 ten-minute setup target.

**Checkpoint**: Provenance, inventory, findings, corrections, verification, and uncertainty are reproducible without secrets or production data.

---

## Phase 6: Polish and Cross-Cutting Validation

- [X] T026 Reconcile `specs/035-backend-security/review.md` with FR-001–FR-013 and SC-001–SC-007 in `specs/035-backend-security/spec.md`; include environment/date, all sensitive categories, evidence source, limits, no live secrets, no confirmed unresolved critical issue, and an owner-visible Beads item for every unresolved high issue.
- [X] T027 Run focused pure tests and `npm run typecheck` for changed `tests/unit/`, `app/api/`, and `lib/` paths; run database-backed `tests/api/` cases only if T002 established a disposable target, and record pass/fail/unverified commands in `specs/035-backend-security/review.md`.
- [X] T028 If code changed, stop any active Next server before `npm run build`, restart it afterward, and record build result in `specs/035-backend-security/review.md`; if a changed server response affects a page, verify that path in a real browser and confirm a referenced `/_next/static/` client chunk loads.
- [X] T029 Check `git diff --check`, re-read `git status --short`, and record changed paths, validation, Beads issue status, and unresolved follow-ups in `specs/035-backend-security/review.md`; preserve owner edits and do not commit or push without separate authority.

---

## Dependencies and Execution Order

```text
T001–T002 (guidance + safe environment)
       ↓
T003–T005 (shared inventory and isolated cases)
       ├── US1: T006–T012 ──┐
       ├── US2: T013–T020 ──┼── T026–T029 (final reconciliation)
       └── US3: T021–T025 ──┘
```

- Phase 1 has no prerequisite. T002 gates every database-backed test; a failed gate changes those cases to unverified and does not block pure inspection or tests.
- Phase 2 follows Phase 1. T003 defines the operation IDs before T004/T005 record selected boundaries and fixtures.
- US1, US2, and US3 can start after Phase 2. They are independently testable; the final report waits for all selected story evidence.
- Within US1, T006–T008 precede any correction in T009–T011; T012 repeats the affected cases.
- Within US2, T013–T017 precede corrections T018–T019; T020 repeats affected cases.
- Within US3, T021–T022 populate report structure, T023–T024 populate findings/results, and T025 checks reproducibility. No vulnerability is presumed.
- Phase 6 follows the desired story phases. A code-changing build follows focused tests and requires stopping the active server first.

## Parallel Opportunities

- T006, T007, and T008 touch different test files after T005; their test design can proceed independently.
- T013–T016 touch distinct payment, upload, and unit test files after T005; each can be drafted separately.
- US1 and US2 checks can proceed independently after the shared foundation. One agent owns this checkout, so use these opportunities as sequencing flexibility, not simultaneous edits to the same file.

### Parallel example: User Story 1

```text
T006 → tests/api/auth.test.ts + tests/unit/auth.test.ts
T007 → tests/api/addresses.test.ts + tests/api/orders.test.ts
T008 → tests/api/admin-users.test.ts
```

### Parallel example: User Story 2

```text
T013 → tests/api/pay.test.ts
T014 → tests/api/payments-callback.test.ts + tests/unit/payment-zarinpal.test.ts
T015 → tests/api/admin-catalog-images.test.ts
T016 → tests/unit/digikala-parser.test.ts + tests/unit/telegram-auth.test.ts
```

### Independent review example: User Story 3

```text
T021 → protected-operation table in specs/035-backend-security/review.md
T022 → trust-boundary table in specs/035-backend-security/review.md after T021
```

## Implementation Strategy

1. **MVP**: Complete Phases 1–3. Prove one authorized customer action, its cross-account denial, and one staff role denial with response and persisted-state evidence. If database isolation is unavailable, report the MVP verification as incomplete rather than treating source review as a pass.
2. **Money and external scope**: Complete Phase 4 with fake or sandbox facilities and targeted corrections only where evidence shows a failure.
3. **Repeatable handoff**: Complete Phase 5 and Phase 6; preserve the report's distinction among observed results, source-only concerns, and unavailable checks.
4. Use Beads for discovered correction work and blockers. `tasks.md` is the Spec Kit implementation sequence; no broad rewrite, migration, new public endpoint, real payment, or production probe is assumed.
