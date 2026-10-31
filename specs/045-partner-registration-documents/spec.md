# Feature Specification: Partner Registration with Business Documents

**Feature Branch**: `045-partner-registration-documents`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: «یه چیزی مونده هنوز، در بخش ثبت نام همکاران- بخش ثبت نام فیلد های این بخش باید مثل فیلد های صفحه ی همکاران باشه، یعنی چند فیلد آپلود فایل باید اضافه بشه+مسیر بک اندش هم اوکی بشه»

## Background

The shop has two separate ways to become a wholesale partner, and they disagree:

- **The partners page** collects full business details and documents, then waits for an administrator's decision. Wholesale access is granted only on approval.
- **The registration page's «همکار عمده» option** collects only a shop name and an optional licence number, then grants wholesale access immediately, with no documents and no review.

Wholesale access unlocks partner pricing and partner bundles, so the second path bypasses the review the first path exists to enforce. This feature makes registration collect what the partners page collects and sends it through the same review.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register as a partner with documents (Priority: P1)

A shop owner opens the registration page, chooses «همکار عمده», states whether the business is individual or legal, fills in the same details the partners page asks for, attaches the required documents, verifies their mobile number and submits. They get a customer account straight away, and are told their partnership request is under review.

**Why this priority**: This is the request itself. Without it, the registration page cannot produce a reviewable partner application.

**Independent Test**: Complete the partner option on the registration page for each business type, then confirm that an account exists, that an application appears in the administrator's list with its documents, and that the account has no wholesale access yet.

**Acceptance Scenarios**:

1. **Given** a visitor chose «همکار عمده», **When** they select individual (حقیقی), **Then** they see full name, mobile, national code, shop name, shop address, postal code, shop phone, a lease document upload and a business licence upload.
2. **Given** a visitor chose «همکار عمده», **When** they select legal (حقوقی), **Then** they see the representative's full name, mobile and national code, shop name and address, company name and address, legal national ID, economic code, a lease document upload and a registration notice upload.
3. **Given** all required fields and documents are valid and the mobile is verified, **When** the visitor submits, **Then** an account is created and signed in, one pending application is recorded with its documents, and a confirmation states that the request is under review.
4. **Given** a required document is missing, or has a disallowed format or size, **When** the visitor submits, **Then** nothing is created and the message appears on that field, in Persian.
5. **Given** the visitor switches between individual and legal, **When** the fields change, **Then** values common to both remain filled in.

---

### User Story 2 - Wholesale access only after approval (Priority: P1)

An administrator reviews an application that came from registration exactly as they review one from the partners page. Wholesale access begins only when they approve it. No request made outside the review can grant it.

**Why this priority**: Wholesale access carries partner prices and bundles. Leaving the instant path open would make the document fields decorative.

**Independent Test**: Register as a partner, confirm the account cannot reach wholesale prices or partner bundles, then approve the application and confirm that it can.

**Acceptance Scenarios**:

1. **Given** a partner has registered and is awaiting review, **When** they browse or order, **Then** they get customer prices and no partner bundles.
2. **Given** a pending application from registration, **When** an administrator opens it, **Then** its details and documents appear in the same list and view as any other application.
3. **Given** that application, **When** the administrator approves it, **Then** the same account gains wholesale access, with no second account created.
4. **Given** that application, **When** the administrator rejects it, **Then** the account stays a customer account and keeps working.
5. **Given** anyone sends a direct registration request asking for wholesale access, **When** it is processed, **Then** the account is not given wholesale access.

---

### User Story 3 - Customer registration stays as it is (Priority: P2)

A shopper who chooses «خریدار» sees the current short form and finishes without any business fields or uploads.

**Why this priority**: Most registrations are customers, and this change must not slow them down.

**Independent Test**: Complete the customer option and confirm that no business fields, uploads or application appear.

**Acceptance Scenarios**:

1. **Given** a visitor chose «خریدار», **When** the form appears, **Then** it shows no business fields and no uploads.
2. **Given** a customer finished registering, **When** the record is checked, **Then** no partner application exists for them.

---

### Edge Cases

- **Mobile already has an application** (from either path): registration stops before creating an account and says a request already exists for this number.
- **Mobile already has an account**: the visitor is told to sign in. Applying from an existing account stays on the partners page.
- **Username or email already taken**: nothing is created and no documents are kept.
- **Saving fails midway**: no account exists without its application, no application exists without its documents, and no uploaded file is left behind.
- **Connection drops during upload**: the form keeps what was typed, and the visitor can retry without verifying the mobile again while that verification remains valid.
- **Verification expires before submit**: the visitor is asked to verify again, and typed values remain.
- **Double submission**: only one account and one application result.
- **Mobile edited after verification**: the verified number is the one recorded; it cannot differ from the number on the application.
- **Rejected applicant wants to reapply**: the current one-application-per-mobile rule remains, so they contact the shop.

## Requirements *(mandatory)*

### Functional Requirements

**Registration form**

- **FR-001**: The registration page MUST offer an individual or legal choice once «همکار عمده» is selected.
- **FR-002**: The partner option MUST present the same text fields, labels and required rules as the partners page for the chosen business type.
- **FR-003**: The partner option MUST present the same document uploads as the partners page: lease document and business licence for individual; lease document and registration notice for legal.
- **FR-004**: Uploads MUST accept the same file formats and maximum size as the partners page, and let the visitor see and remove a chosen file before submitting.
- **FR-005**: The partner option MUST NOT ask for separate account credentials beyond what the partners page collects plus mobile verification; the account's username MUST be generated.
- **FR-006**: The shop-licence number field MUST be removed from the partner option, since the licence document replaces it.
- **FR-007**: The customer option MUST keep its present fields and flow.
- **FR-008**: The form MUST validate every field and document before submitting, and show errors per field in Persian.
- **FR-009**: The visual treatment MUST match the existing registration card, including its floating fields and responsive behaviour down to a 360px width.

**Submission**

- **FR-010**: A partner registration MUST create an account and a pending application together, or neither.
- **FR-011**: The application MUST use the same record and review lifecycle as one submitted from the partners page.
- **FR-012**: The mobile on the application MUST be the number verified during registration, regardless of what the request claims.
- **FR-013**: The server MUST enforce all field, document and mobile-verification rules, independently of the browser.
- **FR-014**: If any step fails, no account, application or stored document may remain from that attempt.
- **FR-015**: Registration MUST stop before saving anything if the mobile already has an application or an account.

**Access**

- **FR-016**: An account created through the partner option MUST behave as a customer account until an administrator approves its application.
- **FR-017**: Self-service registration MUST NOT be able to assign wholesale access, by the form or by a direct request.
- **FR-018**: Approval MUST upgrade the existing account rather than create another one.
- **FR-019**: Rejection MUST leave the account usable as a customer account.
- **FR-020**: After submitting, the partner MUST be told their request is under review, and MUST NOT be told or shown that wholesale access is active.

**Documents and privacy**

- **FR-021**: Uploaded documents MUST be stored privately, with no public address, and be viewable only by administrators through the existing review screen.
- **FR-022**: Documents MUST pass the same content safety checks as those on the partners page.

**Compatibility**

- **FR-023**: The partners page MUST keep working unchanged, including for visitors without an account.
- **FR-024**: Accounts that already hold wholesale access MUST keep it; this feature changes no existing account.

### Key Entities

- **Partner application**: one business's request for wholesale access. Holds business type, identity and shop details, company details for legal businesses, attached documents, status (pending, approved, rejected) and review notes. At most one per mobile number.
- **Account**: the person's login and role. Linked to an application by verified mobile number. Starts as a customer, and gains wholesale access only through approval.
- **Business document**: a private uploaded file attached to an application: lease document, business licence or registration notice.
- **Mobile verification**: short-lived proof that the registrant controls the number.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of partner registrations produce a pending application with every required document attached, visible to administrators.
- **SC-002**: 0 accounts gain wholesale access through registration without administrator approval, including through direct requests.
- **SC-003**: Every field and document required on the partners page is required on the registration page, for both business types, with no differences.
- **SC-004**: 0 orphaned accounts, applications or stored files remain after any failed registration attempt.
- **SC-005**: A prepared partner can finish registration on a phone in under 5 minutes.
- **SC-006**: Customer registration has the same number of steps and fields as before.
- **SC-007**: Partners-page submissions keep working with no change in behaviour.

## Assumptions

- **Account timing**: the partner gets a customer account immediately and is signed in, and the application waits for review. This keeps the visitor's progress while protecting wholesale access. The alternative, no account until approval, is possible but leaves the person unable to sign in after submitting.
- **Field parity is exact**: the partner option uses the partners page's fields and nothing else, so username, city and email are not asked; the account's username is generated, as approval already does for partners with no account.
- **Partners page stays**: it remains the route for people who already have an account or do not want to register first. Merging the two pages is out of scope.
- **Existing wholesale accounts are untouched**: accounts that self-registered as wholesale before this change keep their access. Auditing them is a separate decision for the owner.
- **Rejected applicants**: reapplying online remains unavailable, as it is today.
- **Notifications**: no new SMS or email is sent on submission or decision; partners hear from the shop as they do today.
- **Administrator tools**: the existing review list, document viewer and decision flow are sufficient.
- **Dependencies**: the existing mobile verification, private document storage and application review flow.
