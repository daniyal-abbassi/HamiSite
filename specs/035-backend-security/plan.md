# Implementation Plan: Backend Security Review and Corrections

**Branch**: `Hami-v3` (Spec Kit feature identifier: `035-backend-security`) | **Date**: 2026-10-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/035-backend-security/spec.md`

## Summary

Install and verify the selected FarsiUI Backend Security guidance, inventory the existing application's server trust boundaries, and test representative authorized and denied paths before changing code. Correct only confirmed application-layer weaknesses with focused changes that preserve account, catalog, admin, and payment contracts. Keep a reproducible report that separates observed failures, source-only concerns, and unavailable provider or production evidence. The work adds no new public product capability or new API by default.

## Technical Context

**Language/Version**: TypeScript (installed compiler 5.9.3); Node.js 22.17.0 locally; Next.js 15.5.25 App Router

**Primary Dependencies**: Prisma Client 5.20.x, PostgreSQL, Zod 3.x, bcryptjs 2.x, Vitest 4.1.x; built-in Node crypto; project auth and payment modules

**Storage**: PostgreSQL through Prisma for users, sessions, catalog, orders, payments, and audit history; private partner documents and catalog images under `data/uploads/`

**Testing**: Existing pure unit suite via `vitest.frontend.config.ts`; backend/API Vitest suite via `vitest.config.ts` only with a verified separate disposable test database because `tests/setup.ts` clears 19 tables before every test; focused fake-provider and route tests where possible; `npm run typecheck` and `npm run build` after code changes

**Target Platform**: Same-origin Next.js application on a Node.js server; local or isolated nonproduction environment for active security checks

**Project Type**: Existing storefront and administrative web service in one repository

**Performance Goals**: Preserve current legitimate request paths and response behavior; bound abusive input and expensive operations without adding an unnecessary remote request to ordinary authenticated actions. No new numerical latency target is introduced by the spec.

**Constraints**: No live credentials, customer data, real charges, database reset or reseed for audit proof; retain the API envelope and documented auth/payment contracts; no broad auth rewrite or dependency swap without evidence; never build under a running Next server

**Scale/Scope**: Inventory 60 existing `app/api/**/route.ts` entry points, grouped by trust boundary, plus server helpers, admin middleware, background notification/import paths, 18 existing API test files, and the chosen skill's 11 files. Exercise a representative path per existing sensitive category and expand only where evidence points.

## Constitution Check

*GATE: Evaluated before research; re-evaluated after design.*

| Principle or constraint | Plan response | Gate |
| --- | --- | --- |
| Honest Interface | Treat server-side price, stock, role, and payment facts as trusted-record decisions; denied or unavailable checks are never presented as passes. | Pass |
| Persian RTL | Security changes should preserve existing Persian API/client messaging and customer journeys; no visual redesign is planned. | Pass |
| Database-backed storefront | Keep Prisma/PostgreSQL as authority; protect existing records and use a separate disposable database for destructive backend tests. | Pass |
| Approved payment scope | Preserve `specs/017-zarinpal-payment/contracts/payment.md`, including provider verification, atomic settlement, and wholesale credit path. | Pass |
| API and DTO compatibility | Maintain `docs/api/auth.md` response envelope and route contracts unless a verified security defect requires a deliberate, tested correction. | Pass |
| Definition of Done | Typecheck/build and focused regression are required for code changes; real-browser and client-chunk checks apply when a changed server response affects the UI. | Pass |
| Reference-only directories | Ignore `docs/inspires/` as executable code or backend authority. | Pass |

No constitution violation is required. The audit may identify a conflict between existing behavior and the constitution; document and resolve that in implementation rather than silently changing the contract during planning.

## Phase 0: Research and Decisions

See [research.md](research.md). Its decisions cover skill provenance, the existing session and role model, ownership checks, payment verification and replay controls, outbound and file boundaries, evidence standards, and the destructive-test guard. All planning unknowns are resolved as scoped review questions or explicitly unverified deployment/provider conditions.

## Phase 1: Design and Contracts

- [data-model.md](data-model.md) defines the audit record, protected operation, trust boundary, finding, and verification result. It does not add a production database table; any later schema change must be justified by a confirmed correction.
- [contracts/security-review.md](contracts/security-review.md) defines the audit report and verification contract and maps existing auth and payment interfaces that must remain compatible. It introduces no new endpoint.
- [quickstart.md](quickstart.md) gives the selected skill installation, safe database preflight, baseline inventory, focused tests, repeat-check procedure, and handoff checks.

## Project Structure

### Documentation (this feature)

```text
specs/035-backend-security/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   └── security-review.md
├── quickstart.md
├── checklists/
│   └── requirements.md
└── tasks.md                  # Created by speckit-tasks, not this plan
```

### Source Code (repository root)

```text
app/api/
├── auth/                     # Session creation, login, profile, password
├── addresses/ cart/ orders/  # Customer-object and purchase boundaries
├── payments/                 # Provider callback and test-only confirmation
├── partners/                 # Application and sensitive document submissions
├── admin/                    # Staff-only records, imports, image uploads
└── tma/                      # Telegram mini-app authentication and data
middleware.ts                # Pre-render admin access gate
lib/
├── auth.ts                   # Session and role wrapper
├── http.ts                   # Validation and API error envelope
├── orders.ts                 # Order state transitions
├── payment/                  # Fixed-provider requests and verification
├── partner-uploads.ts        # Sensitive document storage
├── digikala.ts               # External catalog fetch
└── telegram-auth.ts          # Telegram assertion verification
tests/
├── api/                      # Database-backed route cases
├── unit/                     # Pure and selected database-backed helpers
├── setup.ts                  # Destructive reset guard
└── helpers/                  # Test records and request helpers
prisma/schema.prisma          # Existing data model; change only if justified
```

**Structure Decision**: Work within the existing single Next.js application. Start with an inventory across all API routes, then trace representative boundaries through the listed helpers and existing tests. Add narrow tests beside the relevant route or helper; avoid a parallel security framework, new service, or generic middleware layer unless a repeated defect proves one necessary.

## Post-Design Constitution Check

The Phase 1 artifacts preserve the same pass decisions above. The review contract explicitly protects authenticated and denied paths, provider result semantics, data isolation, and existing response envelopes. The quickstart blocks database-backed tests until disposable targets are verified and stops/restarts Next around builds. No new API, dependency, or production schema is assumed.
