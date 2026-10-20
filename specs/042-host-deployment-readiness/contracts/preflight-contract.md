# Preflight CLI Contract: Host Deployment Readiness

**Command**: `node tools/deploy/preflight.mjs` (or `npm run deploy:preflight`)  
**Input Arguments**:
- `--json`: Output machine-readable JSON summary conforming to `DeploymentPreflightResult`.
- `--strict`: Fail with exit code 1 if any warning is detected (default fails only on fatal errors).
- `--skip-build-check`: Validate environment, database, and Node version without checking for pre-built `.next/standalone` (useful during initial setup before build).

**Output Exit Codes**:
- `0`: All required preflight checks passed. Host is ready for process launch or cutover.
- `1`: One or more critical checks failed (e.g. database unreachable, missing mandatory environment variables, missing build files).
- `2`: Invalid CLI invocation arguments.

**StdOut Format (Human-Readable)**:
```text
======================================================
  HAMI HAMRAH — Host Deployment Preflight Check
======================================================
[PASS] Node.js Version: v20.18.0 (>= 20.0.0 required)
[PASS] Environment: DATABASE_URL is defined and valid
[PASS] Environment: APP_BASE_URL is defined
[PASS] Database Connectivity: PostgreSQL connected (latency: 12ms)
[PASS] Database Schema: Prisma Client generated and tables queryable
[PASS] Standalone Build: .next/standalone/server.js exists
[PASS] Static Assets: .next/static and public directory present
[PASS] Security Headers: next.config.mjs enforces production security headers
------------------------------------------------------
Result: 8/8 checks passed. Host is READY for deployment.
======================================================
```

