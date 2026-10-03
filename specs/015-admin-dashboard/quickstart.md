# Quickstart: run and verify the back-office dashboard (feature 015)

Working directory: `/home/lain/lain_projects/hami-site-2/HamiSite-basic-structure`, branch `Hami-v3`.

## Prerequisites

```bash
tmux has-session -t hh-dev || ./tools/dispatch/team-up      # the tmux layer dies on every reboot
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/   # expect 200
```

The dev server is shared. **Never start a second one on port 3000**, and never restart it without saying so
on `.agent-pair/BOARD.md` — it silently invalidates another agent's in-flight measurements.

## Sign in as an admin

`/admin` is gated. The seeded dev admin's username and password are printed by the seed script itself at
`prisma/seed.ts:338` (values at `prisma/seed.ts:45-51`). Log in through the app's login form; the gate sends
a guest to `/login?next=/admin` and a non-admin to `/`.

Do not paste those credentials into any file, note, board post or report. Reference them by line number.

**Standing risk, owner-deferred 2026-10-01:** there is no `middleware.ts` in this repo. The gate runs in the
browser (`components/admin/AdminGate.tsx:15-33`), so an unauthenticated request still receives the admin
shell's HTML before being redirected. The data behind it is protected — every `/api/admin/*` route is wrapped
in `withAuth(..., { roles: [Role.ADMIN] })` (`lib/auth.ts:192-228`) — so what leaks is structure and labels,
not customer data. A server-side gate on the `/admin` prefix is the one-step fix and is deliberately not in
this feature. See `research.md` R5.

## Commands

```bash
npm run typecheck           # tsc --noEmit — must be clean
npm run test:unit           # the ONLY test command. `npm test` / bare `npx vitest` truncate 19 live tables
npm run lint
```

## Manual pass

1. `/admin` at **360 × 640** — the rail, the four sections, no horizontal overflow, nothing requiring a
   scroll up to navigate.
2. `/admin` at **1280 × 800** — same content, desktop rail.
3. `/admin/orders`, `/admin/products`, `/admin/users`, `/admin/categories`, `/admin/brands`,
   `/admin/coupons` — the new frame, no per-page damage, no console errors.
4. Force the states: block a request in the network panel (DevTools request blocking on
   `reports/summary`) and confirm that section alone shows its unreadable state with a working retry, while
   the others still render.
5. Keyboard only: tab the frame. Order follows the visual order, focus is visible, the mobile sheet opens and
   closes without a pointer.
6. `prefers-reduced-motion: reduce` — nothing animates.

## Browser automation

One browser at a time, through the mutex — two agents browsing the shared server produce false failures:

```bash
tools/dispatch/browser-gate <who> -- node .scratch/<your-probe>.mjs
```

Measurement traps already paid for (see `specs/002-scroll-atmosphere/tools/surface-separation.mjs`):
derive the scale factor from the screenshot bitmap rather than `deviceScaleFactor` (it is ignored for
screenshots); treat a transparent pixel as *unreadable*, not as black; require an opaque ancestor chain
before trusting an `elementFromPoint` hit test; and note Lenis attaches late in dev (`/(^|\s)lenis\b/`).

## Done means

`contracts/dashboard-contracts.md` C1–C5 hold, SC-002…SC-007 in `spec.md` are checked, and the screenshots
in `.scratch/015/` show the frame at both breakpoints with no overflow. SC-008 — "does it look like Hami" —
is the owner's judgement on a side-by-side, not mine.
