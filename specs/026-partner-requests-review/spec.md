# Feature Specification: Review Partner Requests in Admin Dashboard (بررسی درخواست‌های همکاری در پنل مدیریت)

**Feature Branch**: `026-partner-requests-review`

**Created**: 2026-10-13

**Status**: Ready for Planning

**Input**: User description: "handle review partner's requests section in admin dashboard"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Administrator Lists and Filters Partner Applications (Priority: P1)

As a store administrator, I want to view a dedicated list of all wholesale partner applications with status indicators, contact details, business information, and filtering capabilities in the admin portal, so that I can promptly triage new inbound wholesale partnership inquiries without missing prospective B2B clients.

**Why this priority**: Without a central listing, administrators have zero visibility into submitted partner applications sitting in the database. This is the prerequisite for all triage and review workflows.

**Independent Test**: An administrator navigates to `/admin/partners` (or the partner requests section from the admin sidebar), views all submitted partner applications sorted by newest first, filters by status (`در انتظار بررسی`, `تأییدشده`, `ردشده`), and sees accurate applicant names, business types, contact numbers, and submission timestamps.

**Acceptance Scenarios**:

1. **Given** an authenticated administrator in the admin dashboard, **When** they click "درخواست‌های همکاری" in the navigation sidebar, **Then** they see a table of all partner applications showing applicant name, shop/company name, mobile number, business type (حقیقی / حقوقی), submission date in Persian Jalali calendar, and current review status badge.
2. **Given** applications with different statuses (`PENDING`, `APPROVED`, `REJECTED`), **When** the administrator filters by status tab, **Then** only applications matching the selected status are displayed.
3. **Given** a search query entered into the search input (e.g. searching by mobile number, applicant name, or shop name), **When** the admin submits or types the query, **Then** the list updates to display matching applications.

---

### User Story 2 - Administrator Inspects Application Details and Uploaded Documents (Priority: P1)

As a store administrator, I want to open an application's detailed view to inspect all submitted legal/commercial data and view or download uploaded verification documents (such as lease agreements, business licenses, or company registration notices), so that I can rigorously verify the authenticity and eligibility of the applicant before granting wholesale privileges.

**Why this priority**: Legitimate wholesale pricing is strictly reserved for verified businesses. Admins must be able to view and inspect uploaded documents to make informed approval decisions.

**Independent Test**: An administrator clicks "بررسی" on a pending application, opens the inspection modal or detail page, reviews all submitted text fields, clicks on document thumbnails, and views or downloads the uploaded lease and license images/PDFs.

**Acceptance Scenarios**:

1. **Given** an administrator inspecting an individual (`INDIVIDUAL`) business application, **When** they view the application details, **Then** they see the full name, national code, mobile, shop phone, shop name, full address, 10-digit postal code, and preview links for the uploaded lease document and business license.
2. **Given** an administrator inspecting a corporate (`LEGAL`) business application, **When** they view the application details, **Then** they see the full name, national code, mobile, company name, company address, 11-digit legal national ID, 12-digit economic code, and preview links for the uploaded lease document and official registration notice.
3. **Given** an uploaded document (image or PDF), **When** the administrator clicks the document preview button, **Then** the document opens securely in a high-resolution viewer or downloads for verification.

---

### User Story 3 - Administrator Approves Application and Activates Wholesale Account (Priority: P1)

As a store administrator, I want to approve a verified partner application with an optional note, so that the applicant's status updates to "Approved", their wholesale user account is automatically activated with wholesale privileges, and the review history records who approved it and when.

**Why this priority**: Completes the loop from public partnership application to an active wholesale customer capable of ordering partner bundles and bulk wholesale goods.

**Independent Test**: An admin clicks "تأیید درخواست", confirms the approval modal, the application status switches to `APPROVED` («تأییدشده»), and the applicant user account is updated to `Role.WHOLESALE` with the approved shop name.

**Acceptance Scenarios**:

1. **Given** a pending partner application, **When** the administrator clicks "تأیید درخواست" and confirms, **Then** the application status updates to `APPROVED`, recording the reviewing administrator ID and the current timestamp.
2. **Given** an approved partner application, **When** the approval transaction executes, **Then** the applicant's user account (matching mobile number) is elevated to wholesale partner status (`Role.WHOLESALE`) and associated with their registered shop name, allowing immediate access to partner bundles and bulk pricing.
3. **Given** an already approved or rejected application, **When** an administrator views it, **Then** the primary decision buttons are disabled or display the finalized decision state with review notes and reviewer metadata.

---

### User Story 4 - Administrator Rejects Application with Clear Reason (Priority: P2)

As a store administrator, I want to reject an incomplete, fake, or ineligible application and record a specific rejection reason, so that the application is formally closed and an audit trail exists explaining why the application was declined.

**Why this priority**: Protects store operations from unverified or fraudulent requests and maintains clear internal audit records.

**Independent Test**: An admin clicks "رد درخواست", enters a rejection reason (e.g., "تصویر جواز کسب ناخوانا است"), confirms, and the application status transitions to `REJECTED` («ردشده») with the reason preserved.

**Acceptance Scenarios**:

1. **Given** a pending partner application, **When** the administrator clicks "رد درخواست", enters a rejection note, and confirms, **Then** the status transitions to `REJECTED` and the rejection reason is saved.
2. **Given** an administrator attempting to reject an application without entering a reason, **When** they submit, **Then** the interface requires a minimal descriptive note before confirming the rejection.

---

### Edge Cases

- **Applicant Account Pre-existence**: If the applicant already registered a retail account with the same mobile number, approving the application seamlessly upgrades their existing account to `Role.WHOLESALE` without altering their password or existing order history. If no user account exists yet for that mobile number, a wholesale account is provisioned for them.
- **Concurrent Admin Reviews**: If two administrators inspect the same application concurrently, the first approved/rejected submission locks the record transactionally; the second administrator receives a clear notification that the application has already been processed.
- **Missing or Corrupted Document Files**: If an uploaded file was deleted or cannot be read on disk, the detail view displays a clear warning notice («فایل در دسترس نیست») rather than crashing the page.
- **Re-reviewing Decided Applications**: Once finalized (`APPROVED` or `REJECTED`), an application cannot be re-opened without explicit admin confirmation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The admin navigation sidebar MUST include a distinct entry for "درخواست‌های همکاری" (Partner Requests) leading to the partner applications management area (`/admin/partners`).
- **FR-002**: The admin sidebar or header SHOULD display a live counter badge showing the number of pending (`PENDING`) partner applications awaiting review.
- **FR-003**: The partner applications management area MUST display a responsive, searchable, and filterable table of all submitted applications, with status tabs for All («همه»), Pending («در انتظار بررسی»), Approved («تأییدشده»), and Rejected («ردشده»).
- **FR-004**: Each table entry MUST show the application ID, applicant full name, business entity type (حقیقی / حقوقی), mobile number, shop/company name, submission date in Persian Jalali format, and current status badge.
- **FR-005**: Administrators MUST be able to filter by entity type (شخص حقیقی / شرکت حقوقی) and search applications by applicant name, mobile number, national code, or shop name.
- **FR-006**: The system MUST provide an application detail view/modal showing all submitted commercial data:
  - For individual applicants: national code, postal code, shop address, shop phone number.
  - For legal/corporate applicants: company name, company address, legal national ID, economic code.
- **FR-007**: The application detail view MUST provide secure preview and download capabilities for all attached verification documents (lease document, business license, and registration notice).
- **FR-008**: The system MUST provide an "Approve" action («تأیید درخواست همکاری») that updates the application status to `APPROVED`, records the reviewing administrator's user ID and timestamp, and transitions the applicant's account to wholesale role (`Role.WHOLESALE`).
- **FR-009**: The system MUST provide a "Reject" action («رد درخواست همکاری») that requires entering a rejection note, transitions the status to `REJECTED`, and saves the rejection reason.
- **FR-010**: All numbers, national codes, mobile numbers, and dates displayed in the partner review interface MUST be formatted using Persian numerals and Iranian standards under RTL layout rules.
- **FR-011**: Only authenticated users with administrator privileges (`Role.ADMIN`) MUST be permitted to view, inspect, approve, or reject partner applications.
- **FR-012**: The application review view MUST maintain an audit trail recording who reviewed each application, when it was reviewed, and any internal administrator notes attached.

### Key Entities

- **PartnerApplication (درخواست همکاری)**: Represents the inbound wholesale partner submission. Attributes include: ID, entity type (`INDIVIDUAL` / `LEGAL`), status (`PENDING` / `APPROVED` / `REJECTED`), applicant full name, mobile, national code, shop name, shop address, lease document path, business license path, registration notice path, postal code, shop phone, company name, company address, legal national ID, economic code, IP address, user agent, internal notes, reviewing administrator reference, reviewed at timestamp, creation date, and update date.
- **Reviewing Administrator (مدیر بررسی‌کننده)**: The administrator account who inspected and decided the outcome of the application.
- **Wholesale Partner Account (حساب کاربری همکار)**: The user account associated with the approved applicant's mobile number, elevated to `Role.WHOLESALE` with their approved shop name.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An administrator can locate, open, and review all documents of an inbound partner application in under 45 seconds.
- **SC-002**: 100% of approved partner applications successfully grant wholesale privileges (`Role.WHOLESALE`) to the applicant, allowing them to view and order exclusive partner bundles immediately upon login.
- **SC-003**: 100% of non-admin requests to partner application review endpoints or pages are blocked with strict 403 Forbidden access control.
- **SC-004**: Zero data loss: 100% of applicant text fields, uploaded document references, and reviewer timestamps are preserved in database records.
- **SC-005**: 100% of displayed phone numbers, dates, postal codes, and statuses adhere to Persian RTL and Jalali calendar conventions.

## Assumptions

- **Target Users**: Store administrators and back-office operators managing wholesale onboarding.
- **Document Storage**: Uploaded partner verification documents reside in the existing secure upload directory (`storage/partners/` or public asset proxy) and can be accessed securely by authenticated administrators.
- **Notification**: Automated SMS notification upon application approval or rejection is deferred to a future integration; administrators can review status and contact partners directly using the verified mobile number.
- **UI Direction & Language**: The admin interface is designed in Persian (`lang="fa"`, `dir="rtl"`) adhering to the project's luxury dark/gold aesthetic guidelines.

