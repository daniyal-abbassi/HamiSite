# Implementation Plan: Partner Registration with Business Documents

**Branch**: `045-partner-registration-documents` (work happens on `main`; no feature branch was requested) | **Date**: 2026-10-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/045-partner-registration-documents/spec.md`

## Summary

Registration's «همکار عمده» option becomes a real partner intake. It collects the partners page's fields and documents, then creates a customer account and a pending partner application in one operation. Self-service wholesale access is removed from `POST /api/auth/register`; wholesale access now comes only from the existing administrator approval, which already upgrades an existing account by mobile number.

Approach: a new `POST /api/auth/register/partner` endpoint reuses the partners page's validation and document storage, which are first extracted into shared modules. No schema change is needed.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20+, React 19, Next.js 15.5 App Router

**Primary Dependencies**: Prisma, Zod, `motion`, existing `AuthShell`, `AuthField`, `lib/partner-uploads.ts`, `lib/partner-applications.ts`

**Storage**: PostgreSQL (`User`, `PartnerApplication`, `RegistrationProof`); private files under `data/uploads/partner-documents/`. No schema change.

**Testing**: Vitest unit tests (`npm run test:unit`), Playwright with mocked network responses for the form, API tests against an isolated `.env.test` schema only

**Target Platform**: Linux host, standalone Next.js, mobile-first browsers

**Project Type**: Web application (one repo, App Router pages and route handlers)

**Performance Goals**: Two documents of up to 10 MB each upload on a phone connection; a prepared partner finishes in under 5 minutes (SC-005)

**Constraints**: Same-origin session cookies; the registration proof lives 10 minutes and is single-use; nothing may remain after a failed attempt (FR-014); the partners page must not change behaviour (FR-023); `db:push` only, and no reseeding

**Scale/Scope**: One new endpoint, one narrowed endpoint, two extracted modules, one new form section

## Constitution Check

*GATE: passed before Phase 0 and re-checked after Phase 1.*

| Principle | Status | How this plan complies |
|---|---|---|
| I. Honest Interface | Pass | After submission the UI says the request is under review and never implies wholesale access (FR-020). |
| II. Persian RTL by Default | Pass | Reuses Persian labels and errors from `lib/content/partners.ts`; numeric inputs keep `dir="ltr"`; new CSS uses logical properties. |
| III. Database-backed Storefront and Back Office | Pass | Persisted records and existing authorization are reused; the UI reports only confirmed results. Files stay outside `public/`. |
| IV. Luxury Is the Quality Bar | Pass | Extends the approved auth card rather than introducing a second style. |

**Re-check after design**: Pass. No violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/045-partner-registration-documents/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── partner-registration.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
app/api/auth/register/
├── route.ts                  # narrowed: customer accounts only
└── partner/route.ts          # new: multipart partner registration
app/api/partners/route.ts     # uses the extracted input parser; behaviour unchanged
components/auth/
├── RegisterForm.tsx          # partner branch, multipart submit, under-review state
├── PartnerRegistrationFields.tsx  # new: business type, fields, documents
└── AuthFileField.tsx         # new: upload control in the auth card style
components/partners/PartnerForm.tsx   # uses the extracted client validation
lib/
├── partner-application-input.ts      # new: shared server parsing of text and files
├── partner-form-validation.ts        # new: shared client validation
├── partner-uploads.ts                # adds removal of stored documents
├── schemas/auth.ts                   # role restricted to RETAIL
└── api-error-fa.ts                   # any new error code in Persian
docs/api/auth.md              # contract update; pinned by tests
tests/ and e2e/uiverify-auth-otp.spec.ts
```

**Structure Decision**: A dedicated endpoint keeps the JSON customer route simple and leaves `/api/partners` usable by anonymous visitors. Shared logic moves to `lib/` so the two intakes cannot drift apart (SC-003).

## Complexity Tracking

No constitution violations to justify.
