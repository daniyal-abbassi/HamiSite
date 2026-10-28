#!/usr/bin/env node
/**
 * Host Deployment Preflight Verification Tool
 * 
 * Verifies Node.js runtime, environment contracts, database reachability,
 * migration safety, and standalone build artifacts before process cutover.
 * 
 * Usage:
 *   node tools/deploy/preflight.mjs [--json] [--strict] [--skip-build-check]
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "../..");

// CLI Argument parsing
const args = process.argv.slice(2);
const isJsonOutput = args.includes("--json");
const isStrict = args.includes("--strict");
const skipBuildCheck = args.includes("--skip-build-check");

const knownArgs = ["--json", "--strict", "--skip-build-check"];
for (const arg of args) {
  if (!knownArgs.includes(arg)) {
    console.error(`Unknown argument: ${arg}`);
    process.exit(2);
  }
}

/**
 * Lightweight .env parser so preflight can inspect host .env without external dotenv binary.
 */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

// Load env files in priority order
const fileEnv = {
  ...loadEnvFile(path.join(ROOT_DIR, ".env")),
  ...loadEnvFile(path.join(ROOT_DIR, ".env.production")),
  ...loadEnvFile(path.join(ROOT_DIR, ".env.local")),
};

// Merge with process.env
const mergedEnv = {
  ...fileEnv,
  ...process.env,
};

function maskSecret(secret) {
  if (!secret) return "[NOT_SET]";
  if (secret.startsWith("postgres://") || secret.startsWith("postgresql://")) {
    try {
      const url = new URL(secret);
      const user = url.username ? url.username : "***";
      const host = url.host || "localhost:5432";
      const pathname = url.pathname || "";
      return `${url.protocol}//${user}:***@${host}${pathname}`;
    } catch {
      return "postgresql://***:***@masked-host";
    }
  }
  if (secret.length <= 6) return "***";
  return `${secret.slice(0, 3)}***${secret.slice(-3)}`;
}

const checks = [];

function recordCheck({ name, description, category, passed, message, durationMs, remedy }) {
  checks.push({
    name,
    description,
    category,
    passed,
    message,
    durationMs: Math.round(durationMs),
    remedy,
  });
}

async function runPreflight() {
  const startTime = Date.now();

  // 1. Node.js Version Check
  const nodeStart = Date.now();
  const currentVersion = process.versions.node;
  const majorVersion = parseInt(currentVersion.split(".")[0], 10);
  const isNodeSupported = majorVersion >= 20;

  recordCheck({
    name: "Node.js Version",
    description: "Verify Node.js runtime is version 20 or higher (LTS)",
    category: "runtime",
    passed: isNodeSupported,
    message: isNodeSupported
      ? `Node.js v${currentVersion} (>= 20.0.0 required)`
      : `Node.js v${currentVersion} is unsupported. Node.js 20+ LTS is required.`,
    durationMs: Date.now() - nodeStart,
    remedy: isNodeSupported ? undefined : "Install Node.js 20 LTS or higher on the host (e.g. via nvm or nodejs package manager).",
  });

  // 2. Environment Variables Check
  const envStart = Date.now();
  const dbUrl = mergedEnv.DATABASE_URL?.trim();
  const isDbUrlValid = Boolean(dbUrl && (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")));

  recordCheck({
    name: "DATABASE_URL Contract",
    description: "Verify PostgreSQL connection string is defined and valid",
    category: "environment",
    passed: isDbUrlValid,
    message: isDbUrlValid
      ? `DATABASE_URL is set: ${maskSecret(dbUrl)}`
      : "DATABASE_URL is missing or invalid. Must start with postgresql:// or postgres://",
    durationMs: Date.now() - envStart,
    remedy: isDbUrlValid ? undefined : "Set DATABASE_URL in .env or system environment with valid PostgreSQL credentials.",
  });

  const appBaseUrl = mergedEnv.APP_BASE_URL?.trim();
  let isAppUrlValid = false;
  let isLocalHost = false;
  if (appBaseUrl) {
    try {
      const { hostname } = new URL(appBaseUrl);
      isLocalHost = ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
      isAppUrlValid = !isLocalHost;
    } catch {
      isAppUrlValid = false;
    }
  }

  recordCheck({
    name: "APP_BASE_URL Contract",
    description: "Verify canonical host URL is valid",
    category: "environment",
    passed: isAppUrlValid,
    message: isAppUrlValid
      ? `APP_BASE_URL is set: ${appBaseUrl}`
      : isLocalHost
        ? `APP_BASE_URL points at ${appBaseUrl}; robots.txt, the sitemap and canonical links would publish localhost URLs.`
        : "APP_BASE_URL is missing or invalid in environment.",
    durationMs: 1,
    remedy: isAppUrlValid ? undefined : "Set APP_BASE_URL=https://your-domain.com in .env or environment.",
  });

  // 3. Database Reachability & Schema Safety Check
  const dbProbeStart = Date.now();
  let isDbConnected = false;
  let dbLatencyMs = 0;
  let dbError = "";

  if (isDbUrlValid) {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });

    try {
      const pingStart = Date.now();
      await prisma.$queryRawUnsafe("SELECT 1");
      dbLatencyMs = Date.now() - pingStart;
      isDbConnected = true;
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    } finally {
      await prisma.$disconnect().catch(() => {});
    }
  }

  recordCheck({
    name: "Database Connectivity Probe",
    description: "Verify active connection to PostgreSQL database",
    category: "database",
    passed: isDbConnected,
    message: isDbConnected
      ? `PostgreSQL connected successfully (latency: ${dbLatencyMs}ms)`
      : `Cannot connect to PostgreSQL: ${dbError || "Invalid DATABASE_URL"}`,
    durationMs: Date.now() - dbProbeStart,
    remedy: isDbConnected ? undefined : "Ensure PostgreSQL service is running and DATABASE_URL credentials are correct.",
  });

  // 4. Migration & Schema Safety Check
  const safetyStart = Date.now();
  const packageJsonPath = path.join(ROOT_DIR, "package.json");
  let isDestructiveBlocked = false;

  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const resetScript = pkg.scripts?.["db:reset"] || "";
    // Check that db:reset is explicitly disabled/blocked
    isDestructiveBlocked = resetScript.includes("disabled") || resetScript.includes("exit 1");
  }

  recordCheck({
    name: "Database Reset Safeguard",
    description: "Verify destructive database resets are blocked to prevent data loss",
    category: "database",
    passed: isDestructiveBlocked,
    message: isDestructiveBlocked
      ? "Destructive db:reset is disabled; safe db:push workflow enforced"
      : "Warning: db:reset is not explicitly protected against accidental execution",
    durationMs: Date.now() - safetyStart,
    remedy: isDestructiveBlocked ? undefined : "Ensure db:reset exits with error to protect production data.",
  });

  // 5. Standalone Build & Static Asset Verification
  const buildStart = Date.now();
  if (skipBuildCheck) {
    recordCheck({
      name: "Standalone Build Check",
      description: "Verify .next/standalone bundle exists",
      category: "build",
      passed: true,
      message: "Skipped via --skip-build-check (pre-build stage)",
      durationMs: 1,
    });
  } else {
    const standaloneServer = path.join(ROOT_DIR, ".next/standalone/server.js");
    const hasStandaloneServer = fs.existsSync(standaloneServer);
    const hasStaticChunks = fs.existsSync(path.join(ROOT_DIR, ".next/static"));
    const hasPublicDir = fs.existsSync(path.join(ROOT_DIR, "public"));

    const isBuildComplete = hasStandaloneServer && hasStaticChunks && hasPublicDir;

    recordCheck({
      name: "Standalone Build Artifacts",
      description: "Verify standalone server, static chunks, and public assets exist",
      category: "build",
      passed: isBuildComplete,
      message: isBuildComplete
        ? "Standalone server.js, .next/static, and public/ directory are present"
        : `Missing build files: ${[
            !hasStandaloneServer && ".next/standalone/server.js",
            !hasStaticChunks && ".next/static",
            !hasPublicDir && "public",
          ]
            .filter(Boolean)
            .join(", ")}`,
      durationMs: Date.now() - buildStart,
      remedy: isBuildComplete ? undefined : "Run 'npm run build' followed by 'node tools/deploy/copy-standalone-assets.mjs'.",
    });
  }

  // 6. Security Headers & Next.js Config
  const nextConfigPath = path.join(ROOT_DIR, "next.config.mjs");
  let hasStandaloneConfig = false;
  if (fs.existsSync(nextConfigPath)) {
    const nextConfigContent = fs.readFileSync(nextConfigPath, "utf-8");
    hasStandaloneConfig = nextConfigContent.includes('output: "standalone"');
  }

  recordCheck({
    name: "Next.js Standalone Configuration",
    description: "Verify next.config.mjs specifies output: standalone",
    category: "build",
    passed: hasStandaloneConfig,
    message: hasStandaloneConfig
      ? 'next.config.mjs specifies output: "standalone"'
      : 'next.config.mjs is missing output: "standalone"',
    durationMs: 2,
    remedy: hasStandaloneConfig ? undefined : 'Add output: "standalone" to nextConfig in next.config.mjs.',
  });

  // Evaluation
  const totalChecks = checks.length;
  const passedChecks = checks.filter((c) => c.passed).length;
  const failedChecks = totalChecks - passedChecks;
  const allPassed = failedChecks === 0;

  const result = {
    timestamp: new Date().toISOString(),
    nodeVersion: currentVersion,
    totalChecks,
    passedChecks,
    failedChecks,
    allPassed,
    checks,
  };

  if (isJsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log("======================================================");
    console.log("  HAMI HAMRAH — Host Deployment Preflight Check");
    console.log("======================================================");
    for (const c of checks) {
      const statusTag = c.passed ? "[PASS]" : "[FAIL]";
      console.log(`${statusTag} ${c.name}: ${c.message}`);
      if (!c.passed && c.remedy) {
        console.log(`       -> Remedy: ${c.remedy}`);
      }
    }
    console.log("------------------------------------------------------");
    if (allPassed) {
      console.log(`Result: ${passedChecks}/${totalChecks} checks passed. Host is READY for deployment.`);
    } else {
      console.log(`Result: ${passedChecks}/${totalChecks} passed. ${failedChecks} checks FAILED.`);
    }
    console.log("======================================================");
  }

  if (!allPassed) {
    process.exit(1);
  }
}

runPreflight().catch((err) => {
  console.error("Fatal error during preflight check:", err);
  process.exit(1);
});

