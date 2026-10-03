# Tasks: Back-office dashboard — luxury, simple above all (feature 015)

**Input**: `specs/015-admin-dashboard/spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/dashboard-contracts.md`, `quickstart.md`, `CAPABILITY-MAP.md`
**Generated**: 2026-10-01 from the completed plan (Phase 2 of the spec chain)
**Modules** (`CAPABILITY-MAP.md`): `shell` → `shared-primitives` → `dashboard-home`. Build order follows it.

**Tests are in scope**: `spec.md` → Engineering contract → Testing Strategy names them, and `data-model.md`
defines pure derived logic worth pinning.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: parallelizable (different files, no incomplete dependency)
- **[USx]**: maps to the spec's prioritized user stories

## Path Conventions
This repo is a single Next.js 15 app: source at the root (`app/`, `components/`, `lib/`), tests at
`tests/unit/`. No `src/`.

## Live state at generation time — read this before picking a task

Work already dispatched is reflected here rather than pretending the list is untouched. A task is only
`[X]` when the Boss verified the evidence in this checkout, not when a worker said so.

| Dispatch | Owner | State |
|---|---|---|
| `015-A` API inventory → `notes/api-inventory.md` | opencode | **landed**, 267 lines, cited to source (T002) |
| `015-C` shell: `layout.tsx`, `AdminSidebar`, `AdminPageHeader` + `design-sheet.md` | qoder | **landed**; `npm run typecheck` exit 0 verified by the Boss (T010–T012) |
| `015-C2` self-review with the design-review skills → `design-review.md` | qoder | in flight |
| `015-B` kit inventory + vendoring → `components/admin/ui/` | claude | in flight; found the blockers R7 answers (missing `checkbox`/`tooltip`/`alert`/`pagination`) |
| `015-D` sections + `ReadState` + tests | opencode | in flight |
| `015-V` browser verification | hermes | **did not run** — its model provider returns `HTTP 404: No active credentials for provider`. Re-issued under T018 to a worker holding Playwright (claude). Nothing measured yet. |

---

## Phase 1: Setup (shared ground)

- [X] T001 Amend Constitution III so this feature is in scope, recording what stays frozen, and bump 1.1.0 → 1.2.0 with the footer date in `.specify/memory/constitution.md` — **FR-002 gate: no code lands before this** (done 2026-10-01; owner approval still required before it is committed, per that file's amendment procedure step 4)
- [X] T002 Inventory every `/api/admin/*` route — method, params, envelope, pagination meta, role guard — and answer the five read-model questions with `file:line` citations in `specs/015-admin-dashboard/notes/api-inventory.md` (opencode, landed)
- [X] T003 [P] Classify every file in the kit's `src/components/admin/` as `pure` / `ra-coupled` / `needs-decision`, name the coupling on each, and record the three highest-value parts in `specs/015-admin-dashboard/notes/kit-inventory.md`
  - **evidence**: landed by claude — `notes/kit-inventory.md`, 205 lines, 83 files classified.
- [X] T004 Read `contracts/dashboard-contracts.md` C1–C5 and `data-model.md` before writing any component; the contracts are pass/fail, not advice
  - **evidence**: held: section code cites C1/C5 and data-model line numbers in its own comments.

## Phase 2: Foundational (blocking prerequisites)

**Invariant for this whole phase:** *"no section may render a number while its state is not `real`"*
(`data-model.md` → ReadState). Everything below carries it.

- [X] T005 Land the shell so every route inherits one frame: replace the admin layout and sidebar and the page header in `app/(admin)/layout.tsx`, `components/admin/AdminSidebar.tsx`, `components/admin/AdminPageHeader.tsx`, with the single `DESTINATIONS` model at `AdminSidebar.tsx:26` feeding desktop rail + mobile thumb rail + sheet (qoder, landed; typecheck exit 0)
- [X] T006 [P] Vendor the `pure` subset from T003 into `components/admin/ui/` with an MIT attribution header per file naming the upstream path and date, react-admin hooks replaced by explicit props, and imports limited to the C2 allow-list — run `npm run typecheck`; **delete any file that does not compile cleanly** rather than leaving it in the tree
  - **evidence**: 1 file of 83 was vendorable (`spinner.tsx` → `components/admin/ui/spinner.tsx`); see R8.
- [X] T007 [P] Hand-build the primitives the kit expects and this repo lacks — `checkbox`, `tooltip`, `alert`, `pagination` (and `sheet` if the table's column menu needs it) — in `components/admin/ui/`, in this repo's token vocabulary. **R7: never in `components/ui/` (another agent's lane) and never via Radix**
- [X] T008 Implement the `ReadState` reducer (`"loading" | "real" | "empty" | "unreadable"`) and the per-request fetch hook in `components/admin/dashboard/useSection.ts`, replacing the current single-`failed` `Promise.all` at `components/admin/dashboard/DashboardClient.tsx:28-36` so one failed read cannot blank the page
  - **evidence**: `useSection.ts` + `sections/readState.ts` landed; the old Promise.all/single-failed flag is gone.
- [X] T009 Implement the shared four-shape state component in `components/admin/states/SectionState.tsx` — a skeleton *shaped like the arriving content* (no layout shift), an `empty` message naming what is missing, and an `unreadable` message with a retry that re-attempts only that section; reuse `components/admin/EmptyState.tsx` and `components/ui/skeleton.tsx` where they already fit

## Phase 3: User Story 1 — An operator sees the state of the shop in one look (Priority: P1) 🎯 MVP

**Goal**: `/admin` answers, without a click: what needs action, what we took in, how many orders, what is
newest. **Independent test**: open `/admin` signed in as ADMIN and reconcile every figure against the raw
`/api/admin/reports/summary` and `/api/admin/orders` JSON; then click one order row and confirm you land on
that order.

### Implementation for User Story 1

- [X] T013 [P] [US1] Build **Needs action** in `components/admin/dashboard/sections/ActionNeeded.tsx`: `needsAction` = *"sum(orderCount) over `PENDING + PROCESSING + SHIPPING`"* (`data-model.md`), plus the first six rows from `GET /api/admin/orders?status=PENDING&pageSize=6`, each a same-tab link to `/admin/orders/{id}`
  - **evidence**: `sections/NeedsActionSection.tsx`.
- [X] T014 [P] [US1] Build **Takings** in `components/admin/dashboard/sections/Takings.tsx`: `paidRevenue` = *"sum(revenue) over every status **except** `CANCELED, FAILED, REVERSED`"* with the terminal set taken from `lib/orders.ts:82` (not re-invented here), and `avgPaidOrder` beside it — **FR-003b: this card may not present `totalRevenue` under «درآمد», because that figure includes cancelled orders** (`app/api/admin/reports/summary/route.ts:10,14`)
  - **evidence**: `sections/TakingsSection.tsx`.
- [X] T015 [P] [US1] Build **Order volume** in `components/admin/dashboard/sections/OrderVolume.tsx`: `totalOrders` printed with its basis stated on the card — *"همه سفارش‌ها شامل لغوشده"* — because a true number with a misleading label is still a false statement (Principle I)
- [X] T016 [P] [US1] Build **Newest orders** in `components/admin/dashboard/sections/NewestOrders.tsx` via `apiGetWithMeta` (`lib/api-client.ts:44-59`), following `{ page, pageSize, total, hasNextPage }` (`lib/http.ts:98-109`)
  - **evidence**: `sections/NewestOrdersSection.tsx`.
- [X] T017 [US1] Compose the four sections in `components/admin/dashboard/DashboardClient.tsx` — composition only: no fetch logic, no inline arithmetic — rendering the window label from the API's own `periodDays` value rather than hardcoding "۳۰ روز", formatted with `toFaDigits`
- [X] T019 [US1] **Cut, do not invent**: confirm no stock / low-inventory card exists anywhere in the home screen. There is no `GET /api/admin/products` (`app/api/admin/products/route.ts:36-71` is POST-only) so nothing can enumerate stock; the section was removed from FR-003 rather than filled with a fabricated figure
  - **evidence**: verified by grep 2026-10-01: no stock card anywhere in `components/admin/dashboard/`.
- [X] T020 [US1] Confirm no status-change control anywhere on `/admin`: the PATCH accepts `z.nativeEnum(OrderStatus)` with **no transition validation** (`app/api/admin/orders/[id]/status/route.ts:9`) while cancellation restocks and reverses credit (`lib/orders.ts:96-111`), so the home screen displays status and never offers to move it (`research.md` R3)
  - **evidence**: verified by grep 2026-10-01: the sections emit `next/link` hrefs only — no apiPatch, no status write.

### Tests for User Story 1 (pure logic — Vitest is node-only, there is no DOM harness here)

- [X] T021 [P] [US1] `tests/unit/admin-dashboard-derive.test.ts` — pin every formula quoted above against fixture `byStatus` arrays, including all-terminal, empty `byStatus`, and an unknown status value; the test names quote `data-model.md`
- [X] T022 [P] [US1] `tests/unit/admin-dashboard-state.test.ts` — rows → `real`, no rows → `empty`, HTTP error → `unreadable`, non-ADMIN 403 → `unreadable`; assert `empty` and `unreadable` are never conflated and that no `0` can render in either
- [X] T023 [US1] Verify: `npm run test:unit` (never bare `npm test` or `npx vitest` — `tests/setup.ts` truncates nineteen live tables)

## Phase 4: User Story 2 — The frame reads as one product with the storefront (Priority: P2)

**Goal**: one company, both surfaces; operable with a thumb at 360px.
**Independent test**: load `/admin/products`, `/admin/users`, `/admin/brands` — the frame is new, the page
behaviour is untouched, no per-page edit was needed (FR-008).

### Implementation for User Story 2

- [X] T010 [US2] Replace the desktop rail and the mobile strip with one nav model in `components/admin/AdminSidebar.tsx` — the old code duplicated the destination list at `:57` and `:92`, and the mobile strip scrolled horizontally with logout pushed off-screen (qoder, landed)
- [X] T011 [US2] Rebuild the page header in `components/admin/AdminPageHeader.tsx`: title, one basis line, at most one primary action (qoder, landed — 42 changed lines)
- [X] T012 [US2] Replace the uppercase Latin `ADMIN` chip and its `tracking-[0.1em]` with a Persian label, per Principle II's rule that Latin must never be the only route to a control (qoder, landed; recorded in `design-sheet.md` §1, including the palette the design skill recommended and why it was rejected)
- [ ] T024 [US2] Verify in a browser, logged in: at **360 × 640** `document.documentElement.scrollWidth === 360` with the primary navigation reachable without scrolling the page, and at **1280 × 800** likewise (FR-009, SC-005)
- [ ] T025 [US2] Verify the active item changes by **weight and a marker, not colour alone**, with `aria-current="page"` set, and that keyboard order follows visual order with a visible focus treatment (FR-012)
- [ ] T026 [US2] Verify RTL correctness: every spacing/alignment uses logical properties (`ps-`/`pe-`/`ms-`/`me-`), the marker sits on the start side, and no computed `padding-left`/`left` leftover appears (Principle II)
- [ ] T027 [US2] Verify `prefers-reduced-motion: reduce` removes the frame's motion entirely, not merely shortens it (FR-013)

## Phase 5: User Story 3 — The in-between states are designed, not left blank (Priority: P3)

**Goal**: loading, empty and failed reads get the brand's attention (Principle IV's equal-attention clause).
**Independent test**: block `reports/summary` in the network panel and screenshot each state at 360 and 1280.

### Implementation for User Story 3

- [ ] T028 [US3] Wire `SectionState` into all four sections so each renders its own loading / empty / unreadable shape (T009, T013–T016)
- [ ] T029 [US3] Verify the skeleton mirrors the loaded layout so nothing shifts when data arrives (FR-010, SC-006)
- [ ] T030 [US3] Verify the retry re-attempts only its own section and that sibling sections keep their data
- [ ] T031 [US3] Verify no empty state contains a fabricated name, figure, date or image (Principle I has no exception path)

## Phase 6: Polish and cross-cutting

- [ ] T032 [P] Measure text contrast for every pairing visible on `/admin` at 360 and 1280: ≥ 4.5:1 body, ≥ 3:1 large, ≥ 3:1 non-text edges (FR-011, SC-005). Reuse the method and the hard-won corrections in `specs/002-scroll-atmosphere/tools/surface-separation.mjs` — scale factor from the screenshot bitmap, transparent pixel = unreadable, opaque ancestor chain before trusting a hit test
- [X] T033 [P] Enforce SC-003 mechanically: grep the new and replaced admin files for `#[0-9a-fA-F]{3,8}` and `rgba(` and remove every hit outside token definitions (FR-007)
  - **evidence**: verified by grep 2026-10-01: zero hex/rgb literals in dashboard, states, ui and (admin) layout.
- [ ] T034 [P] Reconcile the kit's data-table with the C2 allow-list once T006/T007 land: no `ra-core`, no `react-router-dom`, no `@tanstack/react-query`, no `@radix-ui/*`, no package this repo does not already have
- [X] T035 [P] Confirm SC-002 mechanically: `git diff` shows no added dependency in `package.json` (FR-014)
  - **evidence**: `git diff package.json package-lock.json` → empty. No dependency added..
- [X] T036 Run `npm run typecheck` and `npm run test:unit`; both must pass (SC-007)
  - **evidence**: `npm run typecheck` exit 0 and 377 unit tests pass (measured 2026-10-01).
- [ ] T037 [P] Smoke all eight admin routes for HTTP 200 and zero console errors after the shell swap, including one real `/admin/orders/<id>` (SC-004)
- [ ] T038 Re-issue the browser verification to a worker that actually has Playwright (claude — `enabledMcpjsonServers` lists it), through the mutex: `tools/dispatch/browser-gate <who> -- node <script>`. **hermes could not run it**: `HTTP 404: No active credentials for provider` on `fable-5.1`. Do not mark this done until a measurement exists
- [ ] T039 Put the side-by-side to the owner: storefront screenshot and dashboard screenshot at 360px, for the SC-008 "does it look like Hami, not a template" judgement — that call is theirs, not mine (Constitution IV)
- [ ] T040 Sweep the admin surface for dead code the audit already flagged: `components/admin/coupons/CouponsAdminClient.tsx` is imported nowhere (`specs/CODEBASE-AUDIT-2026-09-28.md:29`) — move it aside or wire it, do not leave it rotting silently
- [ ] T041 Record the deferred server-side gate as a standing risk with its one-step fix (a `middleware.ts` on the `/admin` prefix; there is none anywhere today, `AdminGate.tsx:15-33` redirects client-side after the HTML is served) — owner chose "handle later" on 2026-10-01, so it is written down, not forgotten (`research.md` R5)
- [ ] T042 Release every lock this feature took by **moving** it to `.agent-pair/released/`, never deleting, and post the completion note on `BOARD.md`

- [ ] T043 **Wire the five new primitives in, or take them back out** — as of 2026-10-01
  `components/admin/ui/{Pagination,Tooltip,Alert,Checkbox,spinner}` are imported by **nothing**, while
  `components/admin/{orders,products,users}` still use the older untested
  `components/admin/Pagination.tsx`. Either adopt the tested one in those three list pages (its
  `pagination-range.ts` already has unit coverage) and use `Alert` inside `SectionState`, or delete the
  unwired files. Dead code at birth is the failure this project's own audit keeps finding
  (`specs/CODEBASE-AUDIT-2026-09-28.md:29`), and `research.md` R8 records how it happened.
  **Remaining scope after T043a: only the `Alert`-inside-`SectionState` half.**
- [x] T043a Retire `components/admin/Pagination.tsx`, adopt the tested `components/admin/ui/Pagination.tsx`
  in `OrdersAdminClient`, `ProductsAdminClient`, `UsersAdminClient` — done 2026-10-01 by worker qoder;
  `{ page, pageSize, total, hasNextPage }` contract kept verbatim at all three call sites, old file deleted,
  `grep -rn "admin/Pagination" components/` empty, typecheck + `npm run test:unit` clean (the pagination half of T043)
- [ ] T044 Defer the declarative data table to the next feature — ~150 lines against our own
  `components/ui/table.tsx`, taking the kit's `Col`-children column shape (see `research.md` R8). It is not
  part of 015: the home screen renders a list, not a table.

## Dependencies and execution order

```
Phase 1: T001 ──► T002 ──► T003            (T001 gates ALL code; T003 needs nothing)
Phase 2: T005 (landed) ──► T006, T007 (parallel) ──► T008 ──► T009
Phase 3 (US1, MVP): T008 ──► T013, T014, T015, T016 (all parallel) ──► T017 ──► T021, T022 (parallel) ──► T023
             invariants checked at the end: T019, T020
Phase 4 (US2): T010–T012 landed ──► T024, T025, T026, T027 (parallel, all browser-measured)
Phase 5 (US3): T009 + T013–T016 ──► T028 ──► T029, T030, T031
Phase 6:       everything above ──► T032–T038 ──► T039 ──► T040, T041, T042
```

**Single-writer rule**: one agent may hold `specs/015-admin-dashboard/tasks.md` at a time — this file. Agents
tick their own boxes and never rewrite a line they do not own.

## Parallel opportunities

- T003 with T002; T006 with T007 (different files, same lane)
- T013/T014/T015/T016 are four independent sections — one per agent if wanted
- T021 with T022; T024/T025/T026/T027 are one browser pass, not four
- T032/T033/T034/T035 are independent checks

## Parallel example — User Story 1

```bash
tasks: T013 (ActionNeeded.tsx), T014 (Takings.tsx), T015 (OrderVolume.tsx), T016 (NewestOrders.tsx)
# then serially: T017 (DashboardClient composition) → T021 + T022 (tests) → T023 (npm run test:unit)
```

## MVP scope (delivers value on its own)

**Phase 1 + Phase 2 + Phase 3 = User Story 1.** The shell (T005, landed) plus the four honest sections and
their state handling. A shop manager can open `/admin` and act on the day. Phases 4–5 refine and prove what
is already usable; Phase 6 is the gate that calls it done.

## Implementation notes

- Never `npm test`, never bare `npx vitest` — `tests/setup.ts` is in `setupFiles` and `resetDb()` truncates
  nineteen live tables. `npm run test:unit` only.
- `tailwind.config.ts` and `app/globals.css` are shared with the storefront: **append token definitions
  only**, never reorder, never restyle an existing rule, never remove anything. Two agents editing them
  corrupt each other.
- Frozen: `app/api/**`, `data/**`, `prisma/**`, `docs/inspires/**`, and all of
  `app/(main)`/`components/home|shop|atmosphere`. No new dependency, ever, without the owner.
- Persian first: `toFaDigits`, `formatToman` (`lib/utils.ts`), `formatFaDate`/`orderStatusLabels`
  (`lib/content/order.ts`); no letter-spacing, no uppercase.
- Shared worktree: claim a lock per file, never `git add -A`, never `restore`/`checkout --`/`stash`/`reset`,
  never delete another agent's lock — release means move to `.agent-pair/released/`.
- One browser at a time on `:3000`, always through `tools/dispatch/browser-gate`.
- No performance or smoothness claim may be made from this machine; timing is measured on the LAN phone.
