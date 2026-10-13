# Tasks: Review Partner Requests in Admin Dashboard (بررسی درخواست‌های همکاری در پنل مدیریت)

**Feature**: `specs/026-partner-requests-review`  
**Status**: Ready for Implementation

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions, Zod validation schemas, and shared helper skeletons

- [X] T001 Define TypeScript types and interfaces for admin partner applications in `types/partner-applications.ts`
- [X] T002 [P] Create Zod input validation schemas for decision review and list query filters in `lib/schemas/admin-partners.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data queries, document streamer helper, and elevation transaction logic that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Implement core partner application queries, pagination, search, and status filtering in `lib/partner-applications.ts`
- [X] T004 [P] Implement secure document file streamer helper in `lib/partner-documents.ts`
- [X] T005 [P] Implement atomic wholesale user account elevation transaction in `lib/partner-applications.ts`
- [X] T006 [P] Write unit tests for partner application queries, elevation logic, and filter serialization in `tests/unit/partner-applications.test.ts`

**Checkpoint**: Foundation ready - data access, document streaming, and account promotion layers ready for user story implementation

---

## Phase 3: User Story 1 - Administrator Lists and Filters Partner Applications (Priority: P1) 🎯 MVP

**Goal**: Administrators can view all submitted partner applications in a searchable, filterable table at `/admin/partners` with a pending counter in the sidebar.

**Independent Test**: An admin logs into `/admin`, sees the «درخواست‌های همکاری» sidebar item with pending badge counter, navigates to `/admin/partners`, and filters by status (`در انتظار بررسی`, `تأییدشده`, `ردشده`) and search queries.

### Implementation for User Story 1

- [X] T007 [P] [US1] Implement `GET /api/admin/partners` (list with pagination, search, status, and entity filters) and `GET /api/admin/partners/count` (pending count) in `app/api/admin/partners/route.ts` and `app/api/admin/partners/count/route.ts`
- [X] T008 [P] [US1] Create luxury status badge component `PartnerStatusBadge` in `components/admin/partners/PartnerStatusBadge.tsx`
- [X] T009 [US1] Add "درخواست‌های همکاری" navigation item with live pending count badge to `components/admin/AdminSidebar.tsx`
- [X] T010 [US1] Build Admin partner applications management page and client table at `app/(admin)/admin/partners/page.tsx` and `app/(admin)/admin/partners/PartnersAdminClient.tsx`
- [X] T011 [P] [US1] Write unit tests for Admin Partner Applications listing API route in `tests/unit/admin-partners-api.test.ts`

**Checkpoint**: At this point, User Story 1 is functional: admins can view, search, and filter all inbound partner applications.

---

## Phase 4: User Story 2 - Administrator Inspects Application Details and Uploaded Documents (Priority: P1)

**Goal**: Administrators can open an application's detailed view, inspect all applicant commercial details, and securely preview or download uploaded verification documents.

**Independent Test**: An admin clicks «بررسی» on an application in `/admin/partners`, the inspection modal opens displaying full commercial info, and clicking document buttons loads secure previews of the lease agreement and trade license.

### Implementation for User Story 2

- [X] T012 [P] [US2] Implement `GET /api/admin/partners/[id]` (application detail) in `app/api/admin/partners/[id]/route.ts`
- [X] T013 [P] [US2] Implement secure authenticated document streaming endpoint `GET /api/admin/partners/[id]/documents/[docType]` in `app/api/admin/partners/[id]/documents/[docType]/route.ts`
- [X] T014 [US2] Build detailed application inspection modal with document previews in `components/admin/partners/PartnerApplicationModal.tsx`
- [X] T015 [P] [US2] Write unit tests for document streaming endpoint access control in `tests/unit/admin-partners-api.test.ts`

**Checkpoint**: At this point, User Stories 1 and 2 work together: admins can inspect any application and its verification files securely.

---

## Phase 5: User Story 3 - Administrator Approves Application and Activates Wholesale Account (Priority: P1)

**Goal**: Administrators can approve a verified partner application, which automatically upgrades the applicant's user account to `Role.WHOLESALE` with their shop name and records reviewer metadata.

**Independent Test**: An admin clicks «تأیید درخواست» in the inspection modal, confirms the action, the application status switches to `APPROVED`, and the applicant can immediately access `/partners/bundles` upon login.

### Implementation for User Story 3

- [X] T016 [US3] Implement `POST /api/admin/partners/[id]/decision` with action `APPROVE`, elevating the applicant user account to `Role.WHOLESALE` in `app/api/admin/partners/[id]/decision/route.ts`
- [X] T017 [US3] Add approval confirmation dialog and review note input to `components/admin/partners/PartnerApplicationModal.tsx`
- [X] T018 [P] [US3] Write unit and integration tests for application approval and wholesale user promotion in `tests/unit/admin-partners-api.test.ts`

**Checkpoint**: The complete onboarding loop is functional: approved partners immediately receive wholesale access.

---

## Phase 6: User Story 4 - Administrator Rejects Application with Clear Reason (Priority: P2)

**Goal**: Administrators can reject ineligible or incomplete applications, requiring a clear rejection reason that is recorded in the audit log.

**Independent Test**: An admin clicks «رد درخواست», enters a rejection reason, confirms, and the application transitions to `REJECTED` with the reason preserved.

### Implementation for User Story 4

- [X] T019 [US4] Update `app/api/admin/partners/[id]/decision/route.ts` to support action `REJECT` with mandatory rejection note validation
- [X] T020 [US4] Add rejection dialog with validation for rejection reason to `components/admin/partners/PartnerApplicationModal.tsx`
- [X] T021 [P] [US4] Write unit tests for application rejection and reason persistence in `tests/unit/admin-partners-api.test.ts`

**Checkpoint**: All 4 user stories are functional and edge cases (audit trail, invalid rejection prevention, already finalized records) are safeguarded.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: System verification, quality gates, and end-to-end validation

- [X] T022 [P] Run full test suite with `npm run test:unit` and verify all tests pass
- [X] T023 Run strict TypeScript check with `npm run typecheck`
- [X] T024 Execute end-to-end quickstart validation scenarios documented in `specs/026-partner-requests-review/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion - **BLOCKS all user stories**.
- **User Stories (Phase 3+)**: All depend on Phase 2 completion.
  - Phase 3 (US1 - Application List & Sidebar): Starts immediately after Phase 2.
  - Phase 4 (US2 - Detail & Document Inspection): Depends on Phase 2 & Phase 3.
  - Phase 5 (US3 - Approval & Account Promotion): Depends on Phase 4.
  - Phase 6 (US4 - Rejection with Reason): Can run alongside Phase 5.
- **Polish (Phase 7)**: Depends on all user stories being complete.

### Parallel Opportunities

- Within Phase 1: `T002` can run in parallel with `T001`.
- Within Phase 2: `T004`, `T005`, and `T006` can run in parallel after `T003`.
- Within Phase 3: `T007`, `T008`, and `T011` can run in parallel.
- Within Phase 4: `T012`, `T013`, and `T015` can run in parallel.
- Within Phase 5: `T018` can run in parallel with endpoint drafting.
- Within Phase 6: `T021` can run in parallel with modal dialog drafting.

---

## Implementation Strategy

### MVP First (User Story 1 & Foundational)
1. Complete Phase 1 (Setup: types and Zod schemas).
2. Complete Phase 2 (Foundational: query helpers and unit tests).
3. Complete Phase 3 (US1: Admin views, filters, and searches applications in `/admin/partners`).
4. **Validate MVP**: Admin can see application `#1` submitted earlier.

### Incremental Delivery
1. Add Phase 4 (US2: Inspect details and view lease/license documents).
2. Add Phase 5 (US3: Approve application and promote account to wholesale).
3. Add Phase 6 (US4: Reject application with reason).
4. Run Phase 7 (Quality gates: unit tests, typecheck, quickstart validation).

