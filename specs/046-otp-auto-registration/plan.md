# Implementation Plan: One-Step Phone Sign-In With Automatic Registration

**Branch**: `046-otp-auto-registration` (not created) | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/046-otp-auto-registration/spec.md`

## Summary

A valid code for a number with no account now creates a retail customer and signs them in, in the same request that verifies the code. The change lives in one server route, `POST /api/auth/otp/verify` (LOGIN branch). The login form, the code-request route, the SMS adapter, the rate limits and the checkout form need no behavioural change: the request route already sends the same SMS for unknown numbers, and checkout already collects name, phone and address per order. Spec 043's rule "a verified code for an unknown number signs nobody in" is reversed and must be amended.

## Technical Context

**Language/Version**: TypeScript, Next.js 15.5 App Router, Node 20+

**Primary Dependencies**: Prisma 5 (PostgreSQL), zod, existing `lib/otp.ts`, `lib/auth.ts` (session helpers), `lib/otp-rate-limit.ts`

**Storage**: PostgreSQL via Prisma. No schema change: `User.username` and `passwordHash` are required, `firstName`, `lastName`, `city`, `email` are already optional

**Testing**: Vitest API tests under `tests/api/` against a dedicated test database (the suite refuses to run elsewhere)

**Target Platform**: Linux server (PM2 + Caddy on EC2, `us-east-2`)

**Project Type**: Web application, single Next.js app

**Performance Goals**: Verify stays one database transaction; no extra network calls

**Constraints**: One account per phone under concurrent verification; the unique `phoneNumber` column is the arbiter. No enumeration signal between known and unknown numbers. Production server has 913 MB RAM: do not build on it without raising the Node heap

**Scale/Scope**: One route file, one test file, a few display fallbacks, doc amendments

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Scope of auth work**: constitution v1.2.0 lists auth as out of scope for the 2026-10-01 admin reopening, and later features (043 OTP login, 045 partner registration) changed auth with owner approval. This feature is requested directly by the owner on 2026-11-18. **PASS WITH NOTE**: record the owner instruction in the constitution's amendment log when this ships.
- **Database authority**: accounts live in PostgreSQL and the change is additive. PASS.
- **No destructive data changes**: no reseed, reset or schema push. PASS.
- **Secrets**: no new secrets; no phone number or code in logs. PASS.

Post-design re-check: unchanged. PASS WITH NOTE.

## Project Structure

### Documentation (this feature)

```text
specs/046-otp-auto-registration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── otp-verify-auto-registration.md
└── tasks.md             # created by /speckit-tasks, not by this command
```

### Source Code (repository root)

```text
app/api/auth/otp/verify/route.ts     # LOGIN branch: find-or-create the customer
tests/api/auth-otp-auto-register.test.ts   # new
components/layout/UserMenu.tsx       # name fallback already present (username); verify only
specs/043-smsir-otp-login/           # amend spec.md and contracts/otp-auth-api.md
```

**Structure Decision**: Single web application. Backend change confined to the verify route; no new modules.

## Complexity Tracking

No constitution violations to justify.
