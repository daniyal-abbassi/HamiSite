## Two apps in one repo — and two references

- **Repo root** — Next.js 15.5.25 App Router + Prisma/PostgreSQL. The API surface
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

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## docs/superpowers/

`specs/` and `plans/` are the history of how this backend was built, phase by
phase. They explain *why*. They are records, not instructions — read them before
touching an area, but the code is the source of truth.

## Dev server — the stale-build trap

Symptom: the page loads and looks right, but nothing is interactive. No button
works, no client state advances. `curl` returns 200, so the server looks fine.

Cause: a `next start` production server is still holding port 3000 from an
earlier run, and `.next` was rebuilt (or deleted) underneath it. It keeps
serving HTML that references chunk filenames which no longer exist, so every
`/_next/static/chunks/*.js` returns 400/404 and React never hydrates. A new
`npm run dev` cannot bind 3000, prints one line about falling back to 3001, and
you keep looking at the dead server on 3000.

Two things make this easy to miss:

- **`pkill -f "next start"` does not kill it.** The running process is named
  `next-server`, so that pattern never matches. Kill by pid, or match
  `next-server|next dev|next start`.
- **A 200 from `curl` proves nothing here** — the HTML renders; only the client
  bundle is broken.
- **`npm run build` walks straight into this on its own.** It rewrites `.next`,
  which is the same directory the running dev server is serving from, so a
  routine "verify it still builds" leaves the dev server on 3000 returning 500
  with no warning at all. Running a build while a dev server is up means
  restarting that dev server afterwards, every time — treat the build as
  destructive to it.

Before trusting a dev server:

```bash
pgrep -af "next-server|next dev|next start"        # expect exactly one
ss -ltnp | grep :3000                              # confirm who owns the port
grep -E "Local:|Port .* is in use" <dev-log>       # confirm no fallback port
```

Diagnose in one shot — if this 400s, the build was swapped under the server:

```bash
CHUNK=$(curl -s localhost:3000/ | grep -oP '/_next/static/chunks/[^"]+\.js' | head -1)
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000$CHUNK"
```

Recovery: kill every Next process by pid, `rm -rf .next`, then `npm run dev`.
Never `rm -rf .next` while a server is serving from it.

## If `.agent-pair/` exists, you are not the only agent here

More than one agent may be working in this checkout at the same time. The folder is git-ignored, so
`git status` will never show it — check for it directly before your first edit:

```bash
test -f .agent-pair/README.md && cat .agent-pair/README.md .agent-pair/BOARD.md
```

Four rules, all of them about not destroying someone else's work: **claim before you edit**
(`.agent-pair/locks/<path>.lock`), **never edit a file someone else has locked** (post a `REQUEST`
instead), **heartbeat every ~5 minutes**, and **never `git restore` / `git checkout --` / `git stash` /
`git add -A`** — a dirty file you did not touch belongs to another agent, so stage by explicit path.
Append to the board with `>>`; never rewrite an existing message in place, even to fix it.


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:1105d646 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/core-concepts/sync-concepts.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->
