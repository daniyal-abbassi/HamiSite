/**
 * PM2 Ecosystem Configuration for Hami Hamrah
 * 
 * Usage on host:
 *   pm2 start tools/deploy/ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup
 */

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

