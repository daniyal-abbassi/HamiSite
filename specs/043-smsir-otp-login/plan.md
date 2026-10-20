# Implementation Plan: SMS.ir OTP Customer Login

**Branch**: `Hami-v3` | **Date**: 2026-10-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/043-smsir-otp-login/spec.md`

## Summary

Add passwordless SMS.ir code sign-in for retail and wholesale accounts, preserving the existing `User` identity so carts, profiles, orders, and payments remain attached. Use the existing PostgreSQL/Prisma store for short-lived, single-use OTP challenges and abuse limits; call SMS.ir server-side through its Verify API. Keep password login for ADMIN and AGENT only. Registration requires a verified-phone proof before the existing registration route can create an account and session.

## Technical Context

**Language/Version**: TypeScript 5.5, Node.js 20+ (Next.js App Router)

**Primary Dependencies**: Next.js 15.5 App Router, Prisma 5.20, PostgreSQL, built-in Node `fetch`; no SMS SDK or new runtime dependency planned.

**Storage**: PostgreSQL via Prisma; existing `OtpCode` is extended/reworked for hashed code, attempt count, challenge state, expiry, and request-source throttling metadata. Existing `User`, `Session`, and account relations remain the identity/session source of truth.

**Testing**: Existing Vitest and Playwright setup; implementation validation should cover unit, API, and end-to-end flows, including provider stub and Sandbox checks. No real production SMS is part of routine tests.

**Target Platform**: Same-origin Next.js web app on the project Linux host; SMS.ir REST API is called only from server routes.

**Project Type**: Full-stack Next.js web application with Prisma REST routes and Persian RTL storefront.

**Performance Goals**: Code-request API response target under 3 seconds at p95 excluding provider-side delivery; successful user sign-in should meet spec SC-002 within 60 seconds after code receipt.

**Constraints**: 5-minute challenge TTL, at most 5 verification attempts, 60-second resend cooldown, at most 5 sends per mobile in a rolling hour, default source limit of 20 requests per 10 minutes per trusted client IP (configurable), generic request confirmation, no code/API-key leakage, no role/privilege changes. Preserve same-origin session cookie behavior and existing API response envelope. Sandbox acceptance does not imply handset delivery. Use additive `db:push` only; never reset or blindly reseed production data.

**Scale/Scope**: Existing retail/wholesale login and registration flows, existing staff password path, SMS.ir verify integration, Prisma challenge state, and the relevant sign-in/registration UI. Single PostgreSQL-backed deployment; no Redis introduction for this scope.

## Constitution Check

*Gate before research:* 

- **I. Honest Interface**: Pass. UI reports only known states (request accepted, retry timing, invalid/expired code, provider unavailable) and does not claim message delivery based only on provider acceptance.
- **II. Persian RTL by Default**: Pass with implementation requirement. Customer copy and states remain Persian-first and the sign-in/registration UI must preserve RTL and responsive behavior.
- **III. Database-backed Storefront and Back Office**: Pass. PostgreSQL/Prisma remains source of truth; existing user IDs and records remain intact; staff authorization and same-origin API envelopes are preserved.
- **IV. Design Is Open — Luxury Is the Quality Bar**: Pass with implementation requirement. Auth surfaces must follow the existing branded experience, with thoughtful loading/error states and mobile layout.
- **Operational constraints**: Pass. Schema changes are additive and applied using `npm run db:push`; no destructive seed/reset step is required.

## Project Structure

### Documentation (this feature)

```text
specs/043-smsir-otp-login/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── otp-auth-api.md
```

### Source Code (repository root)

```text
app/
├── api/auth/
│   ├── login/route.ts             # retain staff password authentication; deny customer password auth
│   ├── otp/request/route.ts       # new OTP request endpoint
│   ├── otp/verify/route.ts        # new verification/sign-in endpoint
│   └── register/route.ts          # require verified registration proof
├── (main)/login/page.tsx          # existing customer/staff entry page, update/reuse
└── (main)/register/page.tsx       # existing registration page, update/reuse
components/auth/
├── LoginForm.tsx                  # existing component, add OTP customer flow
└── RegisterForm.tsx               # existing component, add phone verification step
lib/
├── auth.ts                        # existing session/password helpers
├── phone.ts                       # existing Iranian phone normalization
└── sms-ir.ts                      # proposed server-only SMS.ir adapter
prisma/schema.prisma               # challenge and throttle fields/models
tests/
├── unit/                          # OTP, normalization, provider adapter
└── api/                            # auth route contract/security coverage
e2e/                                # customer/staff browser flows
```

**Structure Decision**: Extend the existing single Next.js + Prisma application. Keep SMS.ir transport and OTP primitives in focused server-only `lib/` modules; expose only same-origin App Router endpoints. Reuse existing auth UI and session helpers rather than introducing another auth system.

## Complexity Tracking

No constitution violations or additional architecture layers are proposed.

## Constitution Check (post-design)

- **I. Honest Interface**: Pass. Provider acceptance is distinct from delivery; user messages must not promise arrival.
- **II. Persian RTL by Default**: Pass. Persian-first customer UI remains required; route contracts are language-neutral.
- **III. Database-backed Storefront and Back Office**: Pass. Verification and registration proofs are persisted/consumed transactionally; existing account relations are not recreated or reassigned.
- **IV. Design Is Open — Luxury Is the Quality Bar**: Pass with implementation requirement. Final auth surfaces need the same quality bar, RTL and mobile checks as other storefront changes.
- **Security and operational fit**: Pass. HMAC-protected OTP digests, atomic single-use verification, rate limits, server-only credentials, same-origin session cookie, and additive Prisma schema updates are specified in the design artifacts.
