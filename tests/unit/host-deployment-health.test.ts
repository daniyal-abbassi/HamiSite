import { describe, it, expect } from "vitest";
import { validateEnvironment, maskSecret } from "@/lib/env";

describe("Host Deployment: Environment Validation Contract", () => {
  it("passes validation with valid production environment configuration", () => {
    const mockEnv = {
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://postgres:securepass@127.0.0.1:5432/hami_storefront?schema=public",
      APP_BASE_URL: "https://hamihamrah.com",
      NEXTAUTH_SECRET: "super-secure-production-random-secret-key-12345",
      HOSTNAME: "127.0.0.1",
      PORT: "3000",
    };

    const result = validateEnvironment(mockEnv, { isProduction: true });
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(result.values.PORT).toBe(3000);
    expect(result.values.HOSTNAME).toBe("127.0.0.1");
  });

  it("fails fast with explicit error when DATABASE_URL is missing", () => {
    const mockEnv = {
      NODE_ENV: "production",
      APP_BASE_URL: "https://hamihamrah.com",
    };

    const result = validateEnvironment(mockEnv, { isProduction: true });
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("DATABASE_URL");
    expect(result.errors.some((e) => e.includes("DATABASE_URL"))).toBe(true);
  });

  it("rejects non-PostgreSQL connection strings", () => {
    const mockEnv = {
      NODE_ENV: "production",
      DATABASE_URL: "mysql://user:pass@localhost:3306/db",
      APP_BASE_URL: "https://hamihamrah.com",
    };

    const result = validateEnvironment(mockEnv, { isProduction: true });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("valid PostgreSQL"))).toBe(true);
  });

  it("requires APP_BASE_URL in production mode", () => {
    const mockEnv = {
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://postgres:pass@localhost:5432/db",
    };

    const result = validateEnvironment(mockEnv, { isProduction: true });
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("APP_BASE_URL");
  });

  it("warns if APP_BASE_URL uses HTTP in production", () => {
    const mockEnv = {
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://postgres:pass@localhost:5432/db",
      APP_BASE_URL: "http://hamihamrah.com",
    };

    const result = validateEnvironment(mockEnv, { isProduction: true });
    expect(result.warnings.some((w) => w.includes("https://"))).toBe(true);
  });

  it("warns when NEXTAUTH_SECRET is absent or weak in production", () => {
    const mockEnv = {
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://postgres:pass@localhost:5432/db",
      APP_BASE_URL: "https://hamihamrah.com",
      NEXTAUTH_SECRET: "short",
    };

    const result = validateEnvironment(mockEnv, { isProduction: true });
    expect(result.warnings.some((w) => w.includes("NEXTAUTH_SECRET"))).toBe(true);
  });
});

describe("Host Deployment: Secret Masking", () => {
  it("masks PostgreSQL connection passwords while keeping host and db intact", () => {
    const dbUrl = "postgresql://myuser:supersecretpassword@10.0.0.5:5432/production_db?schema=public";
    const masked = maskSecret(dbUrl);

    expect(masked).not.toContain("supersecretpassword");
    expect(masked).toContain("myuser");
    expect(masked).toContain("10.0.0.5:5432");
    expect(masked).toContain("/production_db");
    expect(masked).toContain("***");
  });

  it("masks arbitrary token secrets without leaking center characters", () => {
    const secret = "secretToken1234567890abcdef";
    const masked = maskSecret(secret);

    expect(masked).not.toContain("1234567890");
    expect(masked.startsWith("sec")).toBe(true);
    expect(masked.endsWith("def")).toBe(true);
    expect(masked).toContain("***");
  });

  it("handles null and undefined safely", () => {
    expect(maskSecret(null)).toBe("[NOT_SET]");
    expect(maskSecret(undefined)).toBe("[NOT_SET]");
    expect(maskSecret("")).toBe("[NOT_SET]");
  });
});

describe("Host Deployment: Health Endpoint (/api/health)", () => {
  it("responds with 200 and lightweight payload in liveness mode (?mode=live)", async () => {
    const { GET } = await import("@/app/api/health/route");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest("http://127.0.0.1:3000/api/health?mode=live");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("healthy");
    expect(data.service).toBe("hami-storefront-api");
    expect(data.version).toBe("1.0.0");
    expect(typeof data.uptimeSeconds).toBe("number");
  });

  it("responds with 200 and full diagnostic report in readiness mode", async () => {
    const { GET } = await import("@/app/api/health/route");
    const { NextRequest } = await import("next/server");

    const req = new NextRequest("http://127.0.0.1:3000/api/health");
    const res = await GET(req);

    expect([200, 503]).toContain(res.status);
    const data = await res.json();
    expect(data.service).toBe("hami-storefront-api");
    expect(data.checks).toBeDefined();
    expect(data.checks.database).toBeDefined();
    expect(data.checks.memory).toBeDefined();
    expect(data.checks.memory.rssMb).toBeGreaterThan(0);
    expect(data.checks.memory.heapUsedMb).toBeGreaterThan(0);
  });
});

