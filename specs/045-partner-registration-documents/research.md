# Research: Partner Registration with Business Documents

No unknowns remained in the Technical Context. These are the design decisions, checked against the code on 2026-10-31.

## 1. Endpoint shape

- **Decision**: Add `POST /api/auth/register/partner`, accepting multipart form data.
- **Rationale**: `/api/auth/register` parses JSON and `/api/partners` is anonymous. Partner registration needs both files and the registration proof, and it creates a session.
- **Alternatives**: Making `/api/auth/register` accept both formats mixes two contracts in one handler. Having the browser call the two existing endpoints in turn cannot be atomic, and violates FR-010.

## 2. Shared logic

- **Decision**: Extract text validation and file presence rules from `app/api/partners/route.ts` into `lib/partner-application-input.ts`, and `clientValidate` from `PartnerForm.tsx` into `lib/partner-form-validation.ts`.
- **Rationale**: One definition guarantees field parity (SC-003). `lib/content/partners.ts` already holds the field lists.
- **Alternatives**: Copying the rules would drift, as the two intakes already have.

## 3. Atomicity across database and disk

- **Decision**: Validate everything, check for duplicates, write the files, then run one transaction that locks and consumes the proof and creates the user, application and session. If anything fails after files are written, delete them.
- **Rationale**: Disk writes cannot join a transaction, and holding a row lock during uploads would be slow. Consuming the proof only inside the transaction allows a retry after a failure (spec edge case).
- **Alternatives**: Writing files after commit risks an application with no documents.

## 4. Which mobile number is recorded

- **Decision**: Read the phone from the registration proof, and ignore any mobile sent by the client. Normalize it to E.164 for the application.
- **Rationale**: FR-012. `executeApplicationDecision` matches users on both the raw and the normalized number, so approval finds the account.

## 5. Generated username

- **Decision**: `partner_<digits>`, the format approval already uses. A unique-constraint conflict is reported as `DUPLICATE_ACCOUNT`.
- **Rationale**: Consistent with existing records. Login uses OTP, so customers never type it.

## 6. Closing the self-service path

- **Decision**: Restrict `role` in `registerSchema` to `RETAIL`, and remove `shopName`, `businessLicenseNumber` and `agentId` from registration. A request for `WHOLESALE` receives `400 VALIDATION_FAILED`.
- **Rationale**: FR-017. Wholesale access reaches partner pricing and bundles. An explicit rejection is easier to test than silently downgrading.
- **Alternatives**: Silently downgrading would hide the failure from a caller who expected wholesale.

## 7. Account during review

- **Decision**: Role `RETAIL`, `businessVerified` false, signed in immediately. Confirmed by the owner on 2026-10-31.
- **Rationale**: Existing role checks already deny wholesale features, so no new access logic is needed.

## 8. Order of the steps in the form

- **Decision**: Keep mobile verification last, after fields and documents are filled in.
- **Rationale**: The proof lasts 10 minutes, so verifying first could expire it while a partner gathers documents.

## 9. Tests

- **Decision**: Unit tests for shared validation, Playwright with mocked responses for the form, and API tests only with an isolated `.env.test` database.
- **Rationale**: API setup resets database tables, and the dev database holds the owner's data.
