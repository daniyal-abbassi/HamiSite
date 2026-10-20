#!/usr/bin/env node
/**
 * Standalone Production Server Runner
 * 
 * Verifies standalone asset readiness, sets host binding, and handles graceful OS shutdown
 * (SIGTERM/SIGINT) for process managers (PM2 / systemd).
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "../..");
const STANDALONE_DIR = path.join(ROOT_DIR, ".next/standalone");
const SERVER_SCRIPT = path.join(STANDALONE_DIR, "server.js");

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    ensureDirSync(dest);
    for (const child of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function prepareStandaloneAssets() {
  if (!fs.existsSync(SERVER_SCRIPT)) {
    console.error(`[deploy:runner] Error: Standalone server script not found at ${SERVER_SCRIPT}`);
    console.error("[deploy:runner] Please run 'npm run build' first to create the standalone build.");
    process.exit(1);
  }

  // Ensure public assets are available in standalone root
  const sourcePublic = path.join(ROOT_DIR, "public");
  const targetPublic = path.join(STANDALONE_DIR, "public");
  if (fs.existsSync(sourcePublic) && !fs.existsSync(targetPublic)) {
    console.log("[deploy:runner] Copying public/ assets to standalone directory...");
    copyRecursiveSync(sourcePublic, targetPublic);
  }

  // Ensure static build files are available in standalone .next/static
  const sourceStatic = path.join(ROOT_DIR, ".next/static");
  const targetStatic = path.join(STANDALONE_DIR, ".next/static");
  if (fs.existsSync(sourceStatic) && !fs.existsSync(targetStatic)) {
    console.log("[deploy:runner] Copying .next/static/ assets to standalone directory...");
    copyRecursiveSync(sourceStatic, targetStatic);
  }
}

function runServer() {
  prepareStandaloneAssets();

  const port = process.env.PORT || "3000";
  const hostname = process.env.HOSTNAME || "127.0.0.1";

  console.log(`[deploy:runner] Starting Hami Hamrah standalone server on ${hostname}:${port}...`);

  const serverProcess = spawn(process.execPath, [SERVER_SCRIPT], {
    cwd: STANDALONE_DIR,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: port,
      HOSTNAME: hostname,
    },
    stdio: "inherit",
  });

  let isShuttingDown = false;

  function handleShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n[deploy:runner] Received ${signal}. Initiating graceful shutdown...`);

    // Forward signal to child process
    serverProcess.kill(signal);

    // Force exit after 5 seconds if child hasn't finished
    const forceExitTimer = setTimeout(() => {
      console.warn("[deploy:runner] Server did not terminate gracefully within 5s. Forcing exit.");
      serverProcess.kill("SIGKILL");
      process.exit(1);
    }, 5000);

    if (typeof forceExitTimer.unref === "function") forceExitTimer.unref();
  }

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
  process.on("SIGHUP", () => handleShutdown("SIGHUP"));

  serverProcess.on("close", (code, signal) => {
    if (signal) {
      console.log(`[deploy:runner] Standalone server terminated by signal: ${signal}`);
      process.exit(0);
    } else {
      console.log(`[deploy:runner] Standalone server exited with code: ${code}`);
      process.exit(code || 0);
    }
  });

  serverProcess.on("error", (err) => {
    console.error("[deploy:runner] Failed to start standalone process:", err);
    process.exit(1);
  });
}

runServer();

