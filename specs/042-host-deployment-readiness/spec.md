# Feature Specification: Host Deployment Readiness (042-host-deployment-readiness)

**Feature Branch**: `042-host-deployment-readiness`  
**Created**: 2026-10-18  
**Status**: Draft  
**Input**: User description: "get ready, we are gonna deploy it on a host little by little https://farsiui.ir/skills/improve-codebase-architecture"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Production Host Runtime & Health Observability (Priority: P1) 🎯 MVP

As a system operator deploying Hami Hamrah onto a host server (VPS or dedicated Linux host), I want a self-contained, optimized standalone runtime with comprehensive health and readiness checks so that I can launch the application with minimal memory overhead, verify that the application and database are healthy, and receive automated notifications of degradation or process failure.

**Why this priority**: Without a validated standalone runtime and operational health endpoints, deploying to a host is unpredictable, resource-heavy, and difficult to monitor. Deep health checks are the foundational prerequisite for reverse-proxy upstreams and process managers (such as PM2 or systemd).

**Independent Test**: Can be tested independently by creating the standalone production build, starting the server process on a host port, probing the health endpoint (`/api/health`), and verifying that it accurately reports operational status, database connectivity, process uptime, and system readiness without exposing internal secrets.

**Acceptance Scenarios**:

1. **Given** a production build on the host, **When** the application server starts up, **Then** it initializes smoothly as a standalone process with isolated runtime assets and responds to HTTP requests without requiring development dependencies.
2. **Given** a running application instance, **When** an automated health check queries the health probe endpoint, **Then** the endpoint returns HTTP 200 with JSON detailing service status (`healthy`), database responsiveness, uptime, and application version.
3. **Given** a database outage or unreachable connection, **When** the health probe endpoint is queried, **Then** it returns HTTP 503 Service Unavailable with status `unhealthy` and descriptive diagnostic status, allowing reverse proxies to stop routing customer traffic to the failing node.
4. **Given** a termination signal (`SIGTERM` or `SIGINT`) sent by the host process manager, **When** received, **Then** the application performs graceful shutdown, allowing in-flight requests to complete before closing database connections and exiting cleanly.

---

### User Story 2 - Environment Contract & Host Proxy Hardening (Priority: P2)

As a DevOps engineer configuring the host environment, I want a strict, fail-fast configuration contract and robust reverse-proxy header support so that missing environment secrets or incorrect host headers are caught before serving traffic, and users enjoy secure HTTPS sessions across the reverse proxy.

**Why this priority**: Silent configuration drift, missing runtime secrets (database credentials, auth secrets, payment gateways), or improper reverse-proxy forwarding lead to security vulnerabilities, broken authentication cookies, or silent runtime crashes mid-checkout.

**Independent Test**: Can be independently verified by executing configuration validation with valid and missing environment variables, and sending requests with reverse-proxy headers (`X-Forwarded-Proto: https`, `X-Forwarded-Host`) to verify SSL termination recognition, canonical URL resolution, and secure cookie headers.

**Acceptance Scenarios**:

1. **Given** a host environment missing mandatory configuration keys (such as `DATABASE_URL` or `NEXTAUTH_SECRET`), **When** startup or preflight runs, **Then** the process fails fast with an explicit error list naming the missing keys without leaking secret values.
2. **Given** an upstream reverse proxy terminating TLS (such as Nginx or Caddy), **When** requests arrive with `X-Forwarded-Proto: https`, **Then** the application generates secure cookies and resolves absolute links using HTTPS.
3. **Given** requests directed to public static assets and images, **When** served through the host, **Then** appropriate HTTP cache-control headers (`immutable`, long-term max-age for hashed assets) and security headers (CSP, HSTS, frame-ancestors, nosniff) are properly returned.

---

### User Story 3 - Progressive Deployment Safety & Host Preflight (Priority: P3)

As an administrator staging deployments "little by little", I want an automated host preflight verification tool and a step-by-step deployment runbook so that migrations, static assets, and database schemas are safely verified without risking destructive resets, data loss, or prolonged downtime.

**Why this priority**: Progressive host deployments require predictable, non-destructive steps. In accordance with project constitution rules, blind database reseeding or destructive migrations must be blocked, and prerequisites must be validated before switching live traffic.

**Independent Test**: Running the host deployment preflight command (`node tools/deploy/preflight.mjs`) validates Node version, environment variables, database connectivity, standalone build presence, and schema push safety, exiting with 0 on complete readiness or non-zero with actionable remedial steps on any failure.

**Acceptance Scenarios**:

1. **Given** a staging or production host checkout, **When** `node tools/deploy/preflight.mjs` is executed, **Then** it systematically validates Node.js runtime version, environment variables presence, database reachability, migration state, and build artifacts, printing a green readiness summary.
2. **Given** an attempt to run a destructive database command (such as `prisma migrate reset` or blind seeding) during host deployment, **When** checked against host scripts, **Then** deployment tooling explicitly blocks destructive commands and enforces safe schema evolution (`db:push` or non-destructive migrations).
3. **Given** an operator deploying step-by-step, **When** following the deployment runbook (`specs/042-host-deployment-readiness/quickstart.md`), **Then** each progressive stage (1: environment & database check, 2: standalone build, 3: process manager registration, 4: reverse proxy configuration, 5: post-cutover health audit) has clear verification commands.

---

### Edge Cases

- **Database Connection Pool Exhaustion**: How does the health check respond when all connection slots are saturated? The probe uses a bounded timeout (max 2 seconds) and reports database connectivity failure rather than hanging indefinitely.
- **Cold Boot & Build Drift**: What happens if the host has older compiled assets than the current commit? Preflight verifies that standalone `.next` build timestamps match or succeed the latest source modifications.
- **Port Conflict on Host**: What happens if port 3000 is occupied by an existing process? The host startup script supports dynamic `PORT` and `HOSTNAME` bindings with sensible defaults (127.0.0.1:3000).
- **Incomplete Static Asset Upload**: What happens if static files in `.next/static` or `public` are missing from the standalone directory? Preflight verifies that required static assets and public media folders are linked/copied into the standalone bundle.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Build configuration MUST support an optimized `standalone` output mode that packages only the production runtime files and dependencies needed for hosting.
- **FR-002**: System MUST provide a deep health endpoint (`/api/health`) that reports application status, system uptime, application version, memory usage, and live database responsiveness.
- **FR-003**: Health endpoint MUST respond with HTTP 200 when all core components are operational and HTTP 503 when the database or critical services are unreachable.
- **FR-004**: System MUST include a dedicated production startup script that correctly handles standalone asset paths, port binding, and OS signals (`SIGTERM`, `SIGINT`) for zero-downtime restarts under PM2/systemd.
- **FR-005**: System MUST validate all critical production environment variables at startup/preflight, terminating with clear error messages if required variables are absent or malformed.
- **FR-006**: System MUST maintain `.env.example` with documented descriptions, default types, and requirements for all production environment variables without containing actual secrets.
- **FR-007**: Host reverse proxy configuration MUST support standard forwarding headers (`X-Forwarded-Proto`, `X-Forwarded-Host`, `X-Real-IP`) and enforce secure HTTPS session cookies.
- **FR-008**: System MUST provide an automated preflight script (`tools/deploy/preflight.mjs`) that verifies Node runtime compatibility, database reachability, environment readiness, and build artifact integrity before traffic cutover.
- **FR-009**: Host deployment process MUST strictly forbid destructive database commands (such as `prisma migrate reset` or blind reseeding) to protect production data integrity.
- **FR-010**: System MUST provide an architectural deployment runbook (`specs/042-host-deployment-readiness/quickstart.md`) detailing the phased "little by little" deployment workflow (Prerequisites -> Build -> Migrate -> Start -> Proxy -> Verify).
- **FR-011**: System security headers (HSTS, Content Security Policy, X-Frame-Options, X-Content-Type-Options) MUST remain active and valid in production host standalone mode.
- **FR-012**: Health and preflight tools MUST NEVER log or output sensitive credentials, connection passwords, or auth secrets in reports or HTTP responses.

---

### Key Entities *(include if feature involves data)*

- **DeploymentEnvironment**: Represents host runtime configuration, containing validated keys for database connection, authentication secrets, port bindings, base URLs, and integration parameters.
- **HealthStatusReport**: Represents operational health diagnostic snapshot, containing status (`healthy` | `degraded` | `unhealthy`), timestamp, uptime seconds, version, database status (`connected` | `disconnected`), and system memory footprint.
- **DeploymentPreflightResult**: Represents the preflight audit output, containing individual check items (node version, env keys, db connection, standalone build, asset links), their boolean pass/fail status, execution duration, and actionable failure messages.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Standalone deployment bundle reduces total deployment footprint by at least 60% compared to a full `node_modules` repository checkout.
- **SC-002**: Deep health endpoint (`/api/health`) responds in under 200 milliseconds under normal operation and under 2500 milliseconds during a database timeout.
- **SC-003**: 100% of missing or malformed production environment variables are detected and reported before the application accepts public traffic.
- **SC-004**: Automated preflight tool (`tools/deploy/preflight.mjs`) executes in under 10 seconds and accurately flags any missing prerequisites.
- **SC-005**: Graceful shutdown handles process termination within 5 seconds without dropping active HTTP connections.
- **SC-006**: Zero production database resets or destructive schema wipes can be triggered by standard deployment scripts.

---

## Assumptions

- The target host is a Linux server (Ubuntu/Debian or similar) running Node.js 20+ LTS with reverse proxy (Nginx, Caddy, or Traefik) and process management (PM2 or systemd).
- PostgreSQL database is hosted either locally on the server or on an accessible network host, reachable via `DATABASE_URL`.
- The repository follows a staged deployment approach ("little by little"): first verifying preflight and DB connection, then testing standalone build locally, then deploying to host behind reverse proxy with gradual cutover.
- Existing business logic and Server Component data layers remain untouched, adhering to Constitution rules.

