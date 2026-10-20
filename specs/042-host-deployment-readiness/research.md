# Phase 0 Research: Host Deployment Readiness (042-host-deployment-readiness)

**Feature**: `042-host-deployment-readiness`  
**Date**: 2026-10-18  
**Topic**: Progressive Host Deployment, Standalone Next.js Runtime, Deep Health Observability & Migration Safety

---

## Technical Context & Decisions

### 1. Next.js Standalone Build Architecture

- **Context**: In traditional Next.js deployments, running `next start` on a host requires the entire root `node_modules/` folder (several hundred megabytes of devDependencies, build tools, TypeScript, Tailwind, etc.). Next.js provides `output: "standalone"` to automatically trace dependencies and create an isolated production bundle under `.next/standalone/`.
- **Decision**: Configure `output: "standalone"` in `next.config.mjs`. In addition, create a dedicated host runner/preflight step that ensures public assets (`public/`) and client bundles (`.next/static/`) are properly positioned in the standalone distribution.
- **Rationale**: Standalone builds reduce deployment payload size by 60–80%, eliminate the risk of devDependencies running in production, and run cleanly with standard Node: `node .next/standalone/server.js`.
- **Alternatives Considered**:
  - *Full `node_modules` deploy (`npm run start`)*: High memory usage, large disk footprint, deployment failure risk if devDependencies fail to install on host.
  - *Docker containerization*: While powerful, the user requested deploying on a host "little by little" (likely VPS/systemd/PM2), where a lightweight standalone Node process is simpler, faster to inspect, and transparent.

---

### 2. Deep Health & Readiness Check (`/api/health`)

- **Context**: Existing `/api/health` returned a hardcoded JSON snippet with legacy naming (`mixin-ecommerce-api`) and did not verify database availability. Reverse proxies (Nginx, Caddy) and load balancers need real status to route traffic safely.
- **Decision**: Upgrade `/api/health` into a multi-level health probe:
  - **Liveness probe (`?mode=live` or standard ping)**: Instant 200 OK proving the Node process is running.
  - **Readiness probe (default GET `/api/health`)**: Actively tests PostgreSQL connection via Prisma query (with a strict 2-second timeout), measures memory footprint (`process.memoryUsage()`), measures process uptime, and checks application version.
  - **HTTP Status Codes**: Returns HTTP 200 if database is reachable; returns HTTP 503 Service Unavailable if database is unreachable or degraded, enabling reverse proxies to gracefully failover or hold traffic.
- **Rationale**: Aligns with modern production engineering practices and the clean architecture principles from `improve-codebase-architecture`.

---

### 3. Environment Variable Validation Contract

- **Context**: Missing environment variables in production often cause silent runtime errors midway through user actions (e.g., checkout failure, broken image links).
- **Decision**: Implement a centralized environment validator (`lib/env.ts` or deployment preflight) that checks mandatory production keys (`DATABASE_URL`, `APP_BASE_URL`, `NEXTAUTH_SECRET`) before application initialization.
- **Rules**:
  - Missing required keys trigger immediate, descriptive startup failure listing the missing variable names.
  - Variable values must never be logged or echoed in error messages or responses.
  - `.env.example` must be kept up to date with clear explanations of required vs. optional keys.

---

### 4. Database Safety & Migration Guard

- **Context**: Constitution Principle III requires PostgreSQL/Prisma source of truth and explicitly mandates `db:push` while forbidding blind reseeding or destructive migrations.
- **Decision**: Host deployment tooling and preflight checks will explicitly verify that deployment scripts only execute non-destructive schema synchronization (`npx prisma db push --accept-data-loss=false` or migration deploy).
- **Rationale**: Prevents accidental data loss or schema drift when deploying updates "little by little" to a live host.

---

### 5. Host Preflight Verification (`tools/deploy/preflight.mjs`)

- **Context**: When performing staged deployments on a host, operators often forget small prerequisites (Node version mismatch, missing static files, database unreachable, firewall blocking ports).
- **Decision**: Build an automated preflight script (`tools/deploy/preflight.mjs`) that audits:
  1. Node.js version (>= 20.0.0)
  2. Mandatory environment variables present in `.env` or process environment
  3. Database reachability and latency probe
  4. Build artifacts present (`.next/standalone/server.js`, `.next/static`, `public`)
  5. Security headers and reverse-proxy compatibility
- **Rationale**: Provides instant verification before restarting the host process, giving the operator 100% confidence.

---

## Summary of Architectural Seams

```text
[Reverse Proxy: Nginx / Caddy]
      │  (TLS termination, X-Forwarded-Proto, gzip/brotli, static cache)
      ▼
[Host Process Manager: PM2 / systemd]
      │  (SIGTERM/SIGINT graceful shutdown, cluster/fork mode, auto-restart)
      ▼
[Node Standalone Server: .next/standalone/server.js]
      │
      ├──> /api/health (Readiness / Liveness probe with DB ping)
      ├──> Middleware & Route Handlers (Security headers, Host validation)
      └──> Prisma Client ──> [PostgreSQL Database (Local or Hosted)]
```

