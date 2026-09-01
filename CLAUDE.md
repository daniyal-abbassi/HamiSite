## Two apps in one repo — and two references

- **Repo root** — Next.js 14 App Router + Prisma/PostgreSQL. The API surface
  (`app/api/**`) is healthy and complete; `npm run typecheck` passes clean.
  **The storefront frontend is being built in this same app** (App Router,
  same-origin) — the `SameSite=Lax` session-cookie design requires it.
- **`docs/inspires/hami-hamrah-luxury/`** — Vite + React reference from the
  Manus app builder. **Reference only — does not build, must not be run.**
  Source of truth for the brand design (burgundy RAL 3004 + champagne,
  Vazirmatn/DM Mono). Its tRPC data layer and Manus OAuth auth do NOT match
  this backend — port the visuals, never the plumbing.
- **`docs/inspires/techBazar/`** — English Next.js 14 e-commerce template.
  **Reference only** — use its page map (shop / product / cart / checkout /
  auth / account / dashboard) for route structure.

Both live under `docs/inspires/`, which is excluded from the root
`tsconfig.json` — do not remove that exclusion, the versions are
incompatible.

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
