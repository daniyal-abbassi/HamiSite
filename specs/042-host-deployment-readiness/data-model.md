# Phase 1 Data Model: Host Deployment Readiness (042-host-deployment-readiness)

**Feature**: `042-host-deployment-readiness`  
**Date**: 2026-10-18  

---

## Entities & Schemas

### 1. `HealthStatusReport`

Represents the diagnostic snapshot returned by the `/api/health` endpoint.

```typescript
export interface HealthStatusReport {
  /** Overall service status */
  status: "healthy" | "degraded" | "unhealthy";
  
  /** Service identifier */
  service: "hami-storefront-api";
  
  /** Package version */
  version: string;
  
  /** ISO 8601 timestamp of health evaluation */
  timestamp: string;
  
  /** Process uptime in seconds */
  uptimeSeconds: number;
  
  /** Node.js runtime environment (e.g. 'production') */
  environment: string;
  
  /** Subsystem health checks */
  checks: {
    /** Database connectivity status */
    database: {
      status: "connected" | "disconnected";
      latencyMs: number;
      error?: string;
    };
    
    /** System memory metrics */
    memory: {
      rssMb: number;
      heapUsedMb: number;
      heapTotalMb: number;
    };
  };
}
```

#### Status Transition & HTTP Mapping:
- **`healthy`**: Database is connected, latency < 1500ms, memory within normal bounds. Maps to **HTTP 200 OK**.
- **`degraded`**: Database connected but high latency (> 1500ms). Maps to **HTTP 200 OK** with `status: "degraded"`.
- **`unhealthy`**: Database disconnected or timeout exceeded (> 2000ms). Maps to **HTTP 503 Service Unavailable**.

---

### 2. `DeploymentEnvironment`

Represents the validated production environment contract on the host.

```typescript
export interface DeploymentEnvironment {
  /** PostgreSQL connection string (mandatory) */
  DATABASE_URL: string;
  
  /** Canonical public HTTPS origin (mandatory, e.g. https://hamihamrah.com) */
  APP_BASE_URL: string;
  
  /** Session / Auth encryption secret (mandatory in production) */
  NEXTAUTH_SECRET?: string;
  
  /** Next.js node environment */
  NODE_ENV: "production" | "development" | "test";
  
  /** Host network binding (default: '0.0.0.0' or '127.0.0.1') */
  HOSTNAME?: string;
  
  /** Listening port on host (default: 3000) */
  PORT?: number;
  
  /** Optional payment gateway merchant ID */
  ZARINPAL_MERCHANT_ID?: string;
  
  /** Sandbox mode flag for Zarinpal */
  ZARINPAL_SANDBOX?: boolean;
}
```

---

### 3. `DeploymentPreflightResult`

Represents the structured result of running `tools/deploy/preflight.mjs`.

```typescript
export interface PreflightCheckItem {
  name: string;
  description: string;
  category: "runtime" | "environment" | "database" | "build" | "security";
  passed: boolean;
  message: string;
  durationMs: number;
  remedy?: string;
}

export interface DeploymentPreflightResult {
  timestamp: string;
  nodeVersion: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  allPassed: boolean;
  checks: PreflightCheckItem[];
}
```

