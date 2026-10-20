# Quickstart Guide: Progressive Host Deployment ("Little by Little")

This runbook guides operators and developers through deploying Hami Hamrah onto a host server (VPS or dedicated Linux instance) step-by-step. Each stage can be tested independently before moving to the next.

---

## Phase 1: Host System Prerequisites

Ensure the host has the required base packages installed:

```bash
# Verify Node.js (v20+ LTS required)
node --version
# Expected: v20.x or higher

# Verify PostgreSQL is running
pg_isready -h localhost -p 5432
# Expected: localhost:5432 - accepting connections
```

---

## Phase 2: Configuration & Environment Setup

1. Copy `.env.example` to `.env.production` (or `.env`):
   ```bash
   cp .env.example .env
   ```
2. Populate the required production variables:
   - `DATABASE_URL`: Connection string to your PostgreSQL instance.
   - `APP_BASE_URL`: Public HTTPS domain (e.g. `https://hamihamrah.com`).
   - `NEXTAUTH_SECRET`: Random 32+ character secret string (`openssl rand -base64 32`).
   - `PORT`: (Default: `3000`).
   - `HOSTNAME`: (Default: `127.0.0.1` behind reverse proxy).

3. Verify environment hygiene and database reachability before building:
   ```bash
   node tools/deploy/preflight.mjs --skip-build-check
   ```

---

## Phase 3: Database Schema Push (Non-Destructive)

In accordance with project constitution rules, **never run `prisma migrate reset` or blind reseeding**.
Run the safe schema update:

```bash
npm run db:push
```

Verify database tables and prisma client generation:
```bash
npx prisma generate
```

---

## Phase 4: Standalone Production Build

1. Build the Next.js application in standalone mode:
   ```bash
   npm run build
   ```

2. Prepare static assets for the standalone runner:
   Next.js standalone bundles require `.next/static` and `public/` to be served.
   ```bash
   # Copy public assets and static chunks into standalone directory
   cp -r public .next/standalone/
   cp -r .next/static .next/standalone/.next/
   ```

3. Run full host preflight to verify all artifacts are ready:
   ```bash
   npm run deploy:preflight
   ```

---

## Phase 5: Process Manager Setup (PM2 or systemd)

### Option A: PM2 (Recommended for VPS)

Create or use `ecosystem.config.cjs`:
```javascript
module.exports = {
  apps: [
    {
      name: "hami-storefront",
      script: ".next/standalone/server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1"
      },
      kill_timeout: 5000,
      listen_timeout: 8000
    }
  ]
};
```

Start the process:
```bash
pm2 start ecosystem.config.cjs
pm2 save
```

### Option B: systemd (Native Linux Service)
See `tools/deploy/hami-storefront.service` template for systemd integration.

---

## Phase 6: Reverse Proxy Configuration (Nginx)

Configure Nginx to reverse proxy traffic to `127.0.0.1:3000` with SSL and WebSocket/SSE support:

```nginx
server {
    listen 80;
    server_name hamihamrah.com www.hamihamrah.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hamihamrah.com www.hamihamrah.com;

    ssl_certificate /etc/letsencrypt/live/hamihamrah.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hamihamrah.com/privkey.pem;

    # Gzip & Brotli compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    # Cache Next.js static assets
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Proxy all other requests
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $host;
        proxy_read_timeout 60s;
    }
}
```

---

## Phase 7: Post-Cutover Health Check & Verification

Test the live endpoint locally and via domain:

```bash
# 1. Test local listener
curl -s http://127.0.0.1:3000/api/health | jq .

# Expected Output:
# {
#   "status": "healthy",
#   "service": "hami-storefront-api",
#   "version": "0.1.0",
#   "checks": {
#     "database": { "status": "connected", "latencyMs": 8 },
#     "memory": { ... }
#   }
# }

# 2. Test domain over HTTPS
curl -s https://hamihamrah.com/api/health | jq .status
# Expected: "healthy"
```

Deployment complete!

