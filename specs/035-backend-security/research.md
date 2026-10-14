# Research: Backend Security Review and Corrections

**Date:** 2026-10-14
**Scope:** application-layer server behavior in this repository; research decisions are planning inputs, not vulnerability findings.

## 1. Selected guidance and provenance

**Decision:** During implementation, install the exact [FarsiUI Backend Security skill](https://farsiui.ir/skills/backend-security) with `npx farsiui@latest add backend-security`, then verify `.agents/skills/backend-security/SKILL.md` and its companion references and record a version, source revision, or file digest. The FarsiUI listing links to `MiladJoodi/skills` and states that installation includes 11 skill files. The skill is not currently installed in this checkout; `.agents/skills/` is ignored by Git.

**Rationale:** A single copied guide would omit the topic references and leave a clean checkout unable to reproduce the review. The site provides the intended install command and Codex target path.

**Alternatives considered:** Copy just the page text (incomplete); substitute the existing `security-and-hardening` skill (different requested source); vendor the ignored skill files into Git (conflicts with current repository convention). Retain the existing skill as optional supplementary guidance, not a replacement.

## 2. Audit inventory before correction

**Decision:** Inventory all 60 `app/api/**/route.ts` entry points and server-side helpers, grouped by session/auth, object ownership, staff roles, cart/order/price, provider callbacks, uploads/imports, outbound requests, rate/size limits, and error/log output. Record the exact route and trusted/untrusted data path for every category; deep-test representative and suspicious paths. A source pattern alone is a hypothesis until an observable test or a complete source proof establishes impact.

**Rationale:** The app spans customer, admin, partner, and Telegram surfaces. A wrapper can authenticate a request without authorizing the selected record, and adjacent routes may use different validation. Existing `withAuth`, `middleware.ts`, and `lib/http.ts` are controls to inspect, not grounds for a blanket pass.

**Alternatives considered:** Audit only login or only payments (misses ownership and external boundaries); run broad unscripted live probes (unrepeatable and risky); rewrite the auth layer first (could break established contracts without evidence).

## 3. Preserve the actual session and authorization model

**Decision:** Test the existing opaque session cookie, account-active check, role restrictions, and per-record ownership. Compare authorized, other-customer, lesser-role, and guest outcomes for each selected protected object. Keep `docs/api/auth.md` and `specs/016-commerce-integration/contracts/account-admin.md` as compatibility contracts. Examine admin page middleware and API role checks separately.

**Rationale:** `lib/auth.ts` uses a hashed opaque session token and `withAuth` role options, while `middleware.ts` guards `/admin` page rendering. `SameSite=Lax` and same-origin frontend behavior are documented in `docs/api/auth.md`; cross-origin deployment would require a separate design. No JWT or OAuth conversion is warranted by the current code.

**Alternatives considered:** Introduce JWT, OAuth, or a new permission framework (unrelated to confirmed findings); assume the page middleware protects API routes (it matches `/admin/:path*`, not `/api/admin/:path*`).

## 4. Payment and concurrency boundary

**Decision:** Preserve the approved Zarinpal contract in `specs/017-zarinpal-payment/contracts/payment.md`. Test server-derived order amounts, ownership, zero-total settlement, provider verification, replay, and concurrent callback outcomes using the existing fake or sandbox boundary. Classify any uncovered race or state mismatch by observed result before changing settlement code.

**Rationale:** `POST /api/orders/{id}/pay` loads the order and amount server-side. The unauthenticated callback looks up a persisted authority, verifies positive results with the provider, and uses conditional updates plus an order row lock inside a transaction. Provider callback query parameters are not a signed webhook, so requiring a generic HMAC header would contradict this provider flow.

**Alternatives considered:** Trust callback `Status=OK` or client amount (unsafe); impose generic webhook-signature rules where the provider contract has no such signature (breaks valid payments); send real payments during audit (unnecessary and unsafe).

## 5. External requests and file handling

**Decision:** Trace every server-initiated request and file sink. The current fixed Zarinpal endpoint and DigiKala import path receive separate checks for allowlisted destination, redirect behavior, size/time bounds, and error handling. Review partner documents and catalog images for actual bytes, claimed type, generated filename, private storage, authorization, and retrieval. Record controls that already work; propose only evidenced corrections.

**Rationale:** `lib/payment/zarinpal.ts` selects fixed provider hosts and has a timeout. `lib/digikala.ts` accepts an endpoint URL internally and handles a 307 challenge. `lib/partner-uploads.ts` checks reported MIME and size, while admin catalog images inspect magic bytes. These are distinct trust boundaries; neither a universal SSRF claim nor a universal upload pass follows from one helper.

**Alternatives considered:** Ban all outbound requests or uploads (breaks legitimate features); assume an admin-only route makes its outbound URL or file content intrinsically safe (staff accounts and imported data remain trust boundaries).

## 6. Test isolation and evidence

**Decision:** Run pure unit tests with `vitest.frontend.config.ts` freely, but do not run `npm test`, bare `vitest`, or the backend config until `.env.test` is verified as a separate disposable database and the run is explicitly intended to clear its tables. Do not use `HAMI_ALLOW_DB_RESET=1` as a shortcut. Keep actual secret values out of reports. Unit tests with fake provider/inputs may run without a database; API integration tests use two customer identities and one staff identity in the disposable target.

**Rationale:** `vitest.config.ts` loads `tests/setup.ts`, whose `beforeEach` calls `resetDb()` and deletes rows from 19 tables. `.env.test` exists, but its target must be compared with `.env` without printing credentials; existence is not proof of isolation. `vitest.frontend.config.ts` deliberately has no reset setup and excludes database-backed unit suites.

**Alternatives considered:** Run the full suite with whatever `DATABASE_URL` is active (potential data loss); rely only on static inspection (cannot prove denials, replay, or legitimate-path preservation); reset and reseed the existing development catalog (prohibited by project guidance).

## 7. Reporting, severity, and external limits

**Decision:** Use one report record per concern with route/operation, actor and target, evidence status, severity, impact, correction, authorized/denied check, and repeat result. Critical means proven unauthorized money or broad sensitive-data exposure, high means a proven cross-account or privileged action or substantial integrity risk, and lower priorities reflect narrower impact; severity may be revised when evidence changes. Label unavailable provider, production rate-limit, external network, or test-account evidence as unverified. The review report is an artifact, not a new production database model.

**Rationale:** The requested skill calls for evidence, small targeted fixes, attack-path tests, and explicit limitations. The spec requires 100% finding completeness and repeat checks, while the repository must preserve its current business data.

**Alternatives considered:** A pass/fail checklist without route-level evidence (cannot reproduce); equating missing test access with a pass (false assurance); a new persistent audit table (unnecessary for this feature).

## 8. Build and browser verification boundary

**Decision:** For code corrections, run typecheck and focused tests, stop an active Next server before `npm run build`, restart it, and check any affected browser path plus a client chunk. For review-only documentation, static validation of links, commands, and report completeness suffices.

**Rationale:** `CLAUDE.md` documents the stale `.next` trap and the constitution requires a real browser for frontend changes. Security corrections may change a customer or admin response even if no visual component is edited.

**Alternatives considered:** Build while the active server serves `.next` (can leave broken client assets); infer browser success from an HTML 200 alone (does not prove hydration).
