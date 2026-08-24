## Two apps in one repo

- **Repo root** — Next.js 14 App Router (API routes only) + Prisma/PostgreSQL.
  Healthy. `npm run typecheck` passes clean.
- **`hami-hamrah-luxury/`** — a Vite + React storefront exported from the Manus
  app builder. **It does not build.** Its data layer is tRPC against a `server/`
  directory that is not in this repo; this backend serves REST and has no tRPC
  router. Rewiring it is the next phase. It is excluded from the root
  `tsconfig.json` and has its own — do not "fix" that exclusion, the two apps
  have incompatible TypeScript and React versions.

`docs/api/auth.md` is the API contract to build the frontend against. It is
pinned by tests, so it cannot silently go stale. Note its §2 warning: the
frontend must be served **same-origin**, because `SameSite=Lax` is the only CSRF
defense in the design. Its §7 is an open production blocker.

## Database — the parts that will bite

- No Prisma migration baseline. Use `db:push`, not `prisma migrate`. `db:reset`
  is disabled on purpose.
- `db:seed` destroys B2B pricing tiers, carts, and product history attached to
  legacy-imported products on every re-run. Don't reflexively reseed.
- `.env` and `.env.test` must point at different schemas, or a test run wipes
  your dev data.

## graphify

There is a knowledge graph at `graphify-out/`.

- For codebase questions, run `graphify query "<question>"` first when
  `graphify-out/graph.json` exists. `graphify path "<A>" "<B>"` for
  relationships, `graphify explain "<concept>"` for focused concepts. These
  return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw
  grep output.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review, or
  when query/path/explain do not surface enough context.
- It is **generated, and it lies when stale.** Run `graphify update .` after any
  structural change (AST-only, no API cost).

## docs/superpowers/

`specs/` and `plans/` are the history of how this backend was built, phase by
phase. They explain *why*. They are records, not instructions — read them before
touching an area, but the code is the source of truth.
