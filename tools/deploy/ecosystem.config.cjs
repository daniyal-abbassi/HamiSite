/**
 * PM2 Ecosystem Configuration for Hami Hamrah
 *
 * Usage on host:
 *   pm2 start tools/deploy/ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup
 *
 * Next.js standalone output does NOT auto-load .env files at runtime
 * (only next build / next dev do). We read .env.production.local here,
 * in PM2's own process, and pass the values through explicitly.
 */
const fs = require("fs");
const path = require("path");

function loadEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

const fileEnv = loadEnvFile(path.join(__dirname, "..", "..", ".env.production.local"));

module.exports = {
  apps: [
    {
      name: "hami-storefront",
      // Use the standalone server directly or via the server runner wrapper
      script: ".next/standalone/server.js",
      cwd: "./",
      instances: "max", // Scale across all available CPU cores, or set a number (e.g. 2)
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",
        ...fileEnv,
      },
      // Graceful shutdown: give in-flight requests 5000ms before forceful termination
      kill_timeout: 5000,
      listen_timeout: 8000,
      // Error & output log files
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
