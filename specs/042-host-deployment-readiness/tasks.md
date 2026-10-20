# Tasks: Host Deployment Readiness (042-host-deployment-readiness)

**Input**: Feature specification from `specs/042-host-deployment-readiness/spec.md` and design artifacts from `specs/042-host-deployment-readiness/plan.md`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, host deployment scripts, and documentation setup

- [X] T001 Create deploy tools directory structure in `tools/deploy/`
- [X] T002 [P] Update `package.json` with host deployment scripts (`deploy:preflight`, `deploy:build`, `deploy:start-standalone`)
- [X] T003 [P] Update `.env.example` with complete host deployment environment documentation (groupings, descriptions, required vs optional, safe example URLs)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core standalone configuration, environment validation, and automated unit test fixtures

**⚠️ CRITICAL**: No user story implementation tasks can begin until this phase is complete

- [X] T004 Configure `output: "standalone"` and verify production security headers in `next.config.mjs`
- [X] T005 [P] Implement centralized environment validator in `lib/env.ts` with strict schema validation and sensitive secret masking
- [X] T006 [P] Implement unit tests for environment validation and health reporting in `tests/unit/host-deployment-health.test.ts`

**Checkpoint**: Foundation ready — user story implementations can now begin

---

## Phase 3: User Story 1 — Production Host Runtime & Health Observability (Priority: P1) 🎯 MVP

**Goal**: Deliver a reliable standalone runtime and deep health check endpoint (`/api/health`) reporting system uptime, memory, version, and live PostgreSQL latency with fail-fast HTTP 503 handling.

**Independent Test**: Running unit and HTTP tests against `/api/health` returns HTTP 200 with complete diagnostics when DB is reachable, and HTTP 503 when the database connection fails or times out.

- [X] T007 [US1] Implement deep health check route handler in `app/api/health/route.ts` with database connectivity ping, memory reporting, and uptime metrics conforming to `specs/042-host-deployment-readiness/contracts/health-schema.json`
- [X] T008 [P] [US1] Add bounded database probe timeout (max 2000ms) and HTTP 503 fail-fast response in `app/api/health/route.ts`
- [X] T009 [P] [US1] Add liveness probe mode (`/api/health?mode=live`) for lightweight reverse proxy polling in `app/api/health/route.ts`
- [X] T010 [US1] Implement graceful shutdown handlers (`SIGTERM`, `SIGINT`) and asset verification in `tools/deploy/server-runner.mjs`

**Checkpoint**: At this point, User Story 1 is complete and delivers an independent, viable MVP for host runtime and operational observability.

---

## Phase 4: User Story 2 — Environment Contract & Host Proxy Hardening (Priority: P2)

**Goal**: Validate environment variables at startup/preflight, configure process managers, and ensure correct reverse-proxy forwarding behind TLS.

**Independent Test**: Preflight flags missing required environment variables without leaking secrets; PM2 and systemd configuration templates pass syntax and path verification.

- [X] T011 [US2] Verify reverse-proxy forwarding headers (`X-Forwarded-Proto`, `Host`, SSL termination) and secure cookie enforcement
- [X] T012 [P] [US2] Verify static asset cache-control headers and public asset directory copying in standalone build pipeline
- [X] T013 [P] [US2] Create PM2 process manager configuration template in `tools/deploy/ecosystem.config.cjs`
- [X] T014 [US2] Create systemd service unit template in `tools/deploy/hami-storefront.service`

**Checkpoint**: At this point, User Stories 1 and 2 work together to provide hardened process management and reverse-proxy compatibility on the host.

---

## Phase 5: User Story 3 — Progressive Deployment Safety & Host Preflight (Priority: P3)

**Goal**: Build an automated preflight check CLI (`tools/deploy/preflight.mjs`) and enforce Constitution database safety rules (never allow destructive resets or blind reseeding).

**Independent Test**: Executing `node tools/deploy/preflight.mjs` runs Node version, environment variables, database reachability, and standalone artifact checks, exiting with 0 on complete readiness.

- [X] T015 [US3] Implement deployment preflight audit CLI in `tools/deploy/preflight.mjs` conforming to `specs/042-host-deployment-readiness/contracts/preflight-contract.md`
- [X] T016 [P] [US3] Add database connectivity check and safe schema verification (`db:push` validation, blocking destructive resets) in `tools/deploy/preflight.mjs`
- [X] T017 [P] [US3] Add standalone artifact integrity check (`.next/standalone/server.js`, `.next/static`, `public`) in `tools/deploy/preflight.mjs`
- [X] T018 [US3] Verify quickstart runbook execution steps in `specs/042-host-deployment-readiness/quickstart.md`

**Checkpoint**: All three user stories are complete, enabling safe, phased host deployments.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gate verification, test coverage, and documentation alignment

- [X] T019 Run Vitest test suite (`tests/unit/host-deployment-health.test.ts`) and full preflight audit
- [X] T020 [P] Verify TypeScript compilation (`npm run typecheck`) and code hygiene
- [X] T021 [P] Update agent documentation (`AGENTS.md` and `CLAUDE.md`) with host deployment commands and safe migration rules

---

## Dependencies & Execution Order

```text
Phase 1: Setup (T001-T003)
  └──> Phase 2: Foundational (T004-T006)
        └──> Phase 3: User Story 1 (T007-T010) [MVP]
              └──> Phase 4: User Story 2 (T011-T014)
                    └──> Phase 5: User Story 3 (T015-T018)
                          └──> Phase 6: Polish (T019-T021)
```

## Parallel Opportunities

- **Phase 1**: T002 and T003 can execute in parallel.
- **Phase 2**: T005 and T006 can execute in parallel.
- **Phase 3 (US1)**: T008 and T009 can execute in parallel.
- **Phase 4 (US2)**: T012 and T013 can execute in parallel.
- **Phase 5 (US3)**: T016 and T017 can execute in parallel.
- **Phase 6**: T020 and T021 can execute in parallel.

## Implementation Strategy

1. **MVP First**: Complete Phases 1 through 3. The standalone build and deep health check provide immediate host deployment capability.
2. **Hardening**: Complete Phase 4 to configure reverse proxy headers and PM2/systemd templates.
3. **Safety Automation**: Complete Phase 5 to provide the `tools/deploy/preflight.mjs` verification CLI and validate the progressive deployment runbook.

