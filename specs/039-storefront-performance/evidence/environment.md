# T001 — Environment and Baseline Safety Record

**Captured**: 2026-10-15 (implementation session start) · **Beads**: `HamiSite-basic-structure-eq4` (claimed)

## Starting commit and dirty paths

- Branch: `Hami-v3` · HEAD: `b1fa09ba2d1f906557d9a48b99bbd460cc6adb32` ("feat(ui): refine Persian RTL typography and pricing")
- `git status --short` at capture: only `?? specs/039-storefront-performance/` (this feature's own untracked artifacts). No other dirty paths; owner work is committed. The untracked directory is evidence, not application source.
- Dirty-diff identity for profiles: clean tree relative to HEAD except the untracked `specs/039/` evidence directory (no application-code effect).

## Server process ownership (port 3000)

- `next-server (v15.5.25)` pid **25813**, started Thu 2026-10-15 12:36:58 +0330, parent = `systemd --user` (pid 6842).
- `/proc/25813/cwd` → this checkout. It listens on `127.0.0.1:3000` (`ss -ltnp`).
- Serving mode: **production build** — HTML references content-hashed `/_next/static/chunks/*.js`; first referenced chunk fetched back HTTP 200 (no stale-build symptom from CLAUDE.md).
- Ownership: this is the owner's active production server for this checkout. It must be stopped by pid before any rebuild, per the safe lifecycle below. It was not killed during setup.

## Production build identity (baseline)

- `.next/BUILD_ID`: `SI5JalMD_PFquWP7kYRc`, written 2026-10-15 12:35:58 +0330 — build predates the server start by ~1 min; the server serves this build.
- Stack: Next.js 15.5.25, React/ReactDOM 19.2.8, TypeScript ^5.5.4, Prisma ^5.20.0. Runtime: Node **v22.17.0** (note: `package.json` declares a ^26 engines context elsewhere in the session environment; the actual server process runs under the nvm v22.17.0 install that also provides `bd`).

## Database and test safety

- `.env` → `hami_site_api` (schema `public`); `.env.test` → `hami_zarinpal_test` — separate schemas confirmed (credentials redacted). `test:unit` uses `vitest.frontend.config.ts` which intentionally omits DB-reset setup.
- **No reseed, no `db:fresh`, no `db:test:reset` against `hami_site_api` in this feature.** DB-touching suites only if pointed at the verified test schema.

## Machine conditions (measurement-relevant)

- 4 CPU cores, 7.6 GiB RAM; at capture ~6.7 GiB used, ~167 MiB free with other owner apps running (Chrome on :9222, code servers, ollama on :11434). Load interference is possible; all timing captures are serialized (single measurement stream at a time) and machine state is noted per profile in `manifest.json`.

## Safe build/restart procedure (adopted from quickstart.md; never reseeds data)

1. `git status --short` — confirm no unexpected owner edits appeared.
2. `npm run typecheck && npm run test:unit` before rebuilding.
3. Identify the port-3000 process by pid (`pgrep -af 'next-server|next dev|next start'`, `ss -ltnp | grep :3000`); kill **only** that pid.
4. `npm run build` (never while its server holds `.next`).
5. `npm run start -- --hostname 127.0.0.1 --port 3000`.
6. Verify HTML + a referenced chunk return 200, then confirm real interactivity in the browser (hydration check; HTTP 200 alone proves nothing).
7. Record new BUILD_ID in `manifest.json` as the final-run build identity; baseline and final profiles may differ only in build identity.

## Beads status

- `eq4` created + claimed for this implementation. Related open predecessors: `5be` (loading-state perf; notes say lab run was blocked), `s8o` (bounded catalog queries; partially implemented already — affects T010 equivalence checks), `abi` (homepage mobile perf diagnosis — folded into US1 measurement rather than duplicated).
- Existing typography acceptance gaps remain separate per tasks.md (not in scope here).

## 2026-10-16 00:12 — superseded by a reboot (T003)

The machine rebooted after this capture (user session up 2026-10-15 20:37 +0330). `next-server` pid
**25813 is gone**; port 3000 was unbound, and a `curl` to it returned **503 from the local proxy**, not
from Next.js — do not read that as the app being up. The server was restored per the safe lifecycle
above **without a rebuild**: new pid **12005**, same cwd, `.next/BUILD_ID` still `SI5JalMD_PFquWP7kYRc`,
source still `b1fa09ba`. Because build identity is unchanged, the baseline profile stands. Details and
the verified measurement controls are in `evidence/measurement-procedure.md`.
