# Feature Specification: Backend Security Review and Corrections

**Feature Branch**: `Hami-v3`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "https://farsiui.ir/skills/backend-security" — apply the selected backend-security guidance to the existing Hami Hamrah server.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Protect customer and staff actions (Priority: P1)

As a customer or staff member, I can use my own account and authorized store actions without another user gaining access to my records or privileges by changing a request.

**Why this priority**: Unauthorized reads or state changes can expose personal data, alter orders, or affect payments.

**Independent Test**: With isolated test identities representing a customer, another customer, a staff role, and an unauthenticated visitor, attempt the same sensitive read and state change. Authorized actions succeed; cross-account, unauthenticated, and insufficient-role attempts are denied without disclosing protected data or changing records.

**Acceptance Scenarios**:

1. **Given** a customer record owned by one account, **When** another account requests or changes it by substituting its identifier, **Then** no protected record is returned or changed.
2. **Given** a staff-only operation, **When** a customer or unauthenticated visitor attempts it, **Then** the operation is denied before protected content or state is exposed.
3. **Given** a valid customer session, **When** an account or order action is performed, **Then** it uses the authenticated identity and verified server-side eligibility rather than a claimed identity or permission from the request.

---

### User Story 2 - Keep money and external boundaries trustworthy (Priority: P2)

As the store owner, I can rely on payment, pricing, upload, import, and external-message handling to reject forged or malformed input and avoid duplicate or unauthorized effects.

**Why this priority**: These boundaries can affect money, confidential files, and integrity of the catalog and order history.

**Independent Test**: In an isolated environment, replay or alter representative payment and order messages; submit unexpected fields or files; and exercise representative outbound requests. The system rejects unsupported input and unauthorized destinations, applies a valid event at most once, and preserves existing data after denial.

**Acceptance Scenarios**:

1. **Given** a customer order, **When** the customer submits a different price, total, user identity, or eligibility value, **Then** the server uses its trusted records and does not accept the altered claim.
2. **Given** a payment result or other external notification, **When** it is invalid, stale, repeated, or conflicts with the current order state, **Then** it cannot create an unauthorized or duplicate settlement.
3. **Given** an upload, import input, or server-initiated fetch, **When** its content or destination is outside the allowed scope, **Then** it is rejected without disclosing internal resources or modifying unrelated records.

---

### User Story 3 - Repeat an evidence-based security review (Priority: P3)

As a maintainer, I can install the selected guidance, see which server trust boundaries were reviewed, and reproduce each finding and correction without exposing secrets or damaging real store data.

**Why this priority**: A repeatable record helps later changes preserve the same protections and distinguishes verified weaknesses from suspicions.

**Independent Test**: From a clean checkout, follow the documented guidance installation and review procedure; choose one recorded finding, repeat its safe test in an isolated environment, and compare the result after correction.

**Acceptance Scenarios**:

1. **Given** a clean checkout, **When** a maintainer follows the installation instructions, **Then** the selected guidance and its accompanying reference files are available and their source and version or revision are identifiable.
2. **Given** a suspected weakness, **When** it is reported, **Then** the report identifies the affected operation, severity, evidence status, potential harm, correction, and safe verification method.
3. **Given** a corrected weakness, **When** the same authorized, denied, and boundary-case checks are repeated, **Then** the report records the observed result and any remaining uncertainty.

### Edge Cases

- A route may check that someone is signed in but omit ownership or role checks for the particular record; both conditions must be evaluated.
- A request may identify a legitimate record yet include extra fields that would change price, role, ownership, or status; unexpected write fields must not take effect.
- Two valid-looking requests may arrive together or the same external event may be retried; the final state must not double-charge, double-settle, or violate inventory or order invariants.
- A remote URL may redirect to a private or otherwise disallowed destination; the final connection destination matters.
- File names, types, sizes, and contents may disagree; a file's claimed label is not proof that it is safe.
- A security control may be visible in source yet fail at runtime or on an alternate route; classify it as unverified until the relevant boundary is exercised.
- Some payment and authenticated paths may require provider sandbox access or suitable test accounts. If unavailable, report the exact limitation instead of claiming a pass or using real credentials or production data.
- A correction can deny a legitimate user or break the existing payment and order flow; preserve an authorized-path check alongside each denial test.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Maintainers MUST be able to obtain the complete FarsiUI backend-security guidance selected by the owner from a clean checkout and identify its source and version or revision.
- **FR-002**: The review MUST inventory existing server entry points and trust boundaries for authentication, account and object access, staff permissions, orders and pricing, payment results, uploads, imports, outbound requests, and sensitive error or audit output; absent categories MUST be recorded as not applicable with evidence.
- **FR-003**: Sensitive reads and state changes MUST require an authenticated identity and permission for the specific operation and record; a supplied identifier, role, or ownership claim MUST NOT grant access.
- **FR-004**: Inputs crossing a server trust boundary MUST have bounded and explicit accepted values; unexpected write fields and malformed or oversized inputs MUST NOT alter protected data.
- **FR-005**: Server-side queries, file operations, and outbound connections MUST prevent untrusted input from selecting unauthorized records, files, commands, or network destinations.
- **FR-006**: Price, totals, discounts, eligibility, and settlement decisions MUST derive from trusted current records; retries and concurrent requests MUST NOT cause duplicate money-related or inventory effects.
- **FR-007**: External notifications and files MUST be accepted only when their origin, integrity, freshness, scope, and content are sufficient for the intended action; otherwise they MUST fail without unrelated side effects.
- **FR-008**: For each existing authentication or costly public operation, the review MUST record its request and retry limits; attempts beyond those recorded limits MUST be denied or delayed, and failure responses MUST NOT disclose secrets or protected records.
- **FR-009**: Every reported issue MUST distinguish observed behavior from a source-only concern and include affected operation, severity, evidence, impact, proposed correction, and safe verification steps.
- **FR-010**: Confirmed critical and high-severity issues that can be corrected safely within this feature MUST be addressed with targeted changes and repeated authorized, denied, and boundary-case checks; an unresolved issue MUST have its blocker and follow-up recorded.
- **FR-011**: Verification MUST use isolated test identities, data, and payment facilities where applicable; it MUST NOT reset, reseed, charge against, or disclose real customer or development records to prove a finding.
- **FR-012**: The review MUST preserve the existing legitimate customer, staff, and payment journeys when a protection is changed, and report any path that could not be exercised.
- **FR-013**: The final report MUST list the environment, date, inspected operations, evidence sources, findings, corrections, repeated checks, and unverified boundaries in a form another maintainer can follow.

### Key Entities *(include if feature involves data)*

- **Protected operation**: A server action or data access, its actor, target record, permitted role or ownership relationship, and expected effect.
- **Trust boundary**: The point where customer, staff, file, external service, or other untrusted information may influence a protected operation.
- **Security finding**: An observed weakness or explicitly unverified concern, with affected operation, severity, evidence, impact, and correction.
- **Verification result**: The authorized, denied, replay, or boundary-case observation after a correction, including remaining limitations.
- **Review record**: The selected guidance provenance, inspected environment and date, boundary inventory, findings, and verification results.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The review inventories 100% of the existing sensitive operation categories named in FR-002, with an inspected example or an evidence-based not-applicable statement for each.
- **SC-002**: In every exercised cross-account and insufficient-role case, unauthorized requests reveal no protected record and cause no protected state change, while the matching authorized case still succeeds.
- **SC-003**: Every exercised invalid or repeated payment result has no unauthorized or duplicate settlement; a valid test result follows the intended order state transition once.
- **SC-004**: 100% of findings identify target, severity, evidence status, impact, correction, and verification method; 100% of corrected findings include a repeated denial and legitimate-path result.
- **SC-005**: No confirmed critical weakness remains in the reviewed scope at handoff; each unresolved high-severity issue has a documented blocker and owner-visible follow-up.
- **SC-006**: A maintainer can install the selected guidance, identify its source, and begin the documented review from a clean checkout within 10 minutes.
- **SC-007**: No isolated verification run changes real customer, order, pricing, or payment records, and no captured evidence contains a live secret.

## Assumptions

- The requested URL identifies the FarsiUI Backend Security skill, including its companion reference files. This feature covers application-layer backend security in the existing storefront; infrastructure and operating-system hardening, live penetration testing, and browser-only controls are outside its scope.
- Existing authentication, staff roles, data ownership rules, and approved payment contracts remain the authority for intended behavior. The review will verify their enforcement rather than replace them by default.
- The project already has backend operations for the categories in FR-002, but an individual flow may be absent, disabled, or inaccessible in the chosen environment. The inventory will establish that before judging it.
- Safe tests use a separate disposable test dataset or controlled service simulation. Provider behavior, production defenses, and live abuse rates remain unverified unless appropriate evidence is available.
- The selected skill's local installation may be ignored by version control; documented provenance and installation steps are therefore necessary for a clean checkout.
