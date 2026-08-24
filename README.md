# Mixin E-Commerce API

Next.js (App Router, API routes only) + Prisma/PostgreSQL backend for a B2C
retail storefront that also serves B2B wholesale/agent partners (mobile phone
distribution). See
`docs/superpowers/specs/2026-08-12-backend-completion-design.md` for what was
explicitly out of scope when the backend was built.

## The frontend

`hami-hamrah-luxury/` holds a Persian-language Vite + React storefront. It is a
**migration in progress and does not build yet.** It arrived as an export from
the Manus app builder with its `server/`, `shared/` and `client/public/`
directories stripped out, which means:

- Its data layer is **tRPC** against a server that is not in this repo. This
  backend serves **REST**, has no tRPC router, and none is planned. Rewiring the
  frontend to the REST API is the next phase of work.
- Its auth is a Manus OAuth portal flow. This backend uses an httpOnly session
  cookie. `docs/api/auth.md` is the contract to build against — it is pinned by
  tests, so it cannot silently go stale.
- All 22 of its media assets are missing. See
  `hami-hamrah-luxury/client/public/manus-storage/MISSING-ASSETS.md`.
- It is **excluded from this project's `tsconfig.json`** and has its own. Running
  `npm run typecheck` at the root checks the backend only, by design — the two
  apps have incompatible TypeScript and React versions.

Still load-bearing and deliberately left broken until the rewire: `main.tsx`,
`client/src/const.ts`, `client/src/lib/trpc.ts`, and the `trpc.*` calls in
`Home.tsx` / `ProductDetail.tsx`.

## Setup

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL at minimum
cp .env.example .env.test   # point DATABASE_URL at a *different* schema, e.g. ?schema=test
npm run db:push             # applies prisma/schema.prisma (no migration baseline — see below)
npm run db:seed
npm run dev
```

`.env` and `.env.test` must point at different schemas/databases — the test
suite resets its schema on every run (`db:test:reset`), and pointing both at
the same one means test runs silently wipe your dev data.

## Database

- **No Prisma migration baseline.** `prisma/migrations/` only has a
  session-table migration; schema changes are applied via `npm run db:push`,
  not `prisma migrate`. `npm run db:reset` is deliberately disabled for this
  reason (would drop everything and only recreate that one table) — use
  `npm run db:fresh` instead.
- **`npm run db:seed`** populates two independent things every run:
  1. A small set of synthetic demo accounts/brands/categories/coupons
     (upserted, safe to re-run) — see the console banner it prints for demo
     login credentials.
  2. Real catalog/customer/order data imported live from the legacy shop API
     this project replaces (`prisma/legacy-import/*`) — **this part is only
     partially safe to re-run.** Top-level records (categories, brands,
     products, users, orders) upsert cleanly, but each product's
     images/variants and each order's items are deleted and recreated with
     new ids on every run. Because `ProductVariant` cascade-deletes
     `PriceTier`, `CartItem`, and `ProductHistory` rows, **re-running
     `db:seed` destroys any B2B pricing tiers, carts, or audit history
     attached to imported products** — the script warns loudly when this
     happens, but it happens. See
     `docs/superpowers/specs/2026-08-13-legacy-data-import-design.md` for the
     full design rationale.
  - The legacy-import phase needs `actuall_old_webSite_api_token.txt` in the
    repo root (gitignored, not included — ask whoever ran this import last
    for a copy, or set `API_TOKEN=`/`WEBSITE_URL=` yourself if you have
    legacy-shop credentials). If it's missing, `db:seed` logs a warning and
    skips straight to just the synthetic demo data — it doesn't fail the run.
  - Imported legacy customers all share one fixed dev-only password
    (printed in the post-seed banner); their real legacy passwords are never
    exposed by the API and aren't imported.

## Testing

```bash
npm test          # runs once
npm run test:watch
```

Tests run against `.env.test`'s database/schema via `dotenv-cli`, resetting
that schema first (`db:test:reset`) — never against your dev database.

**Gotcha:** there's commonly a global `dotenv` CLI (Python) that shadows this
project's `dotenv-cli` npm package if you invoke `dotenv` directly from a
shell. Always go through `npm test` / `npm run <script>` rather than calling
`dotenv -e ...` yourself.

## Typecheck

```bash
npm run typecheck
```

## Project layout

- `app/api/**/route.ts` — the API surface (public storefront + `/api/admin/*`
  back-office routes, all `Role.ADMIN`-gated).
- `lib/` — shared request/response helpers, auth, pricing engine.
- `prisma/schema.prisma` — the data model; field names/enums are aligned with
  `oldWebsite-openapi.json` (the legacy shop's own OpenAPI doc) wherever an equivalent
  resource exists.
- `prisma/legacy-import/` — the legacy-data-import pipeline `db:seed` uses
  (HTTP client + one pure-mapper module per resource).
- `docs/superpowers/specs/` and `docs/superpowers/plans/` — design specs and
  the implementation plans that built this backend, phase by phase. Worth
  reading before touching a given area — they document *why*, not just what.
- `tests/` — integration tests against a real (test-schema) Postgres
  database, not mocks.
- `hami-hamrah-luxury/` — the frontend, mid-migration (see above).
