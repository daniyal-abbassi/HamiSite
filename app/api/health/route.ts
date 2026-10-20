import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SERVICE_NAME = "hami-storefront-api";
const APP_VERSION = "1.0.0";
const DB_TIMEOUT_MS = 2000;

interface DatabaseProbeResult {
  status: "connected" | "disconnected";
  latencyMs: number;
  error?: string;
}

/**
 * Ping database with a bounded timeout so the health check never hangs.
 */
async function probeDatabase(): Promise<DatabaseProbeResult> {
  const startTime = Date.now();

  const pingQuery = async (): Promise<void> => {
    // Lightweight raw probe to verify network reachability and connection pool
    await prisma.$queryRawUnsafe("SELECT 1");
  };

  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Database probe timed out after ${DB_TIMEOUT_MS}ms`));
    }, DB_TIMEOUT_MS);
    // Unref timer so it doesn't hold open Node process if possible
    if (typeof timer.unref === "function") timer.unref();
  });

  try {
    await Promise.race([pingQuery(), timeoutPromise]);
    const latencyMs = Date.now() - startTime;
    return {
      status: "connected",
      latencyMs,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : "Database connection failed";
    return {
      status: "disconnected",
      latencyMs,
      error: message,
    };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  const uptimeSeconds = Math.round(process.uptime() * 10) / 10;
  const environment = process.env.NODE_ENV || "development";
  const timestamp = new Date().toISOString();

  // 1. Lightweight Liveness Probe (?mode=live)
  // Used by process managers and basic container monitors to confirm the process is alive.
  if (mode === "live") {
    return NextResponse.json(
      {
        status: "healthy",
        service: SERVICE_NAME,
        version: APP_VERSION,
        timestamp,
        uptimeSeconds,
        environment,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }

  // 2. Deep Readiness Probe (Default)
  // Evaluates database connection and system memory footprint.
  const dbResult = await probeDatabase();

  const memoryUsage = process.memoryUsage();
  const memory = {
    rssMb: Math.round((memoryUsage.rss / (1024 * 1024)) * 10) / 10,
    heapUsedMb: Math.round((memoryUsage.heapUsed / (1024 * 1024)) * 10) / 10,
    heapTotalMb: Math.round((memoryUsage.heapTotal / (1024 * 1024)) * 10) / 10,
  };

  const isDbConnected = dbResult.status === "connected";
  const isHighLatency = isDbConnected && dbResult.latencyMs > 1500;

  let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
  if (!isDbConnected) {
    overallStatus = "unhealthy";
  } else if (isHighLatency) {
    overallStatus = "degraded";
  }

  const statusCode = overallStatus === "unhealthy" ? 503 : 200;

  const payload = {
    status: overallStatus,
    service: SERVICE_NAME,
    version: APP_VERSION,
    timestamp,
    uptimeSeconds,
    environment,
    checks: {
      database: dbResult,
      memory,
    },
  };

  return NextResponse.json(payload, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
