# Phase 0 Research: back-office dashboard (feature 015)

Evidence-first: every decision below cites something measured in this repo or in the upstream project, and
each rejected alternative says why. Nothing here is a preference dressed as a constraint.

---

## R1 — Adopting `marmelab/shadcn-admin-kit`: vend source, never install

**Decision.** Mine the kit for component *source* under its MIT licence, keep the parts that are
presentational, strip every react-admin coupling, and restyle to this repo's tokens. Vendored files live in
`components/admin/ui/` and each opens with an attribution header naming the upstream path and the date.

**Rationale.** Read from the kit's own `registry.json` (`admin` item, `type: registry:block`) on 2026-10-01:

- 21 declared dependencies including `ra-core@^5.15.2`, `ra-i18n-polyglot`, `ra-language-english`,
  `react-router-dom@^7.1.1`, `@tanstack/react-query@^5.83.0`, `@base-ui/react`, `lodash`, `diacritic`,
  `inflection`, `query-string`, `next-themes`, `sonner`, `cmdk`, `react-dropzone`, `react-error-boundary`,
  `react-hook-form@^7.65.0`, `tw-animate-css`.
- 27 `registryDependencies` (accordion, alert, avatar, badge, breadcrumb, button, card, checkbox, command,
  drawer, dropdown-menu, input, label, navigation-menu, pagination, popover, radio-group, select, separator,
  sheet, sidebar, switch, skeleton, sonner, table, textarea, tooltip).
- The docs state the admin "requires a Data Provider… an abstraction that allows you to connect your Admin to
  any API" — i.e. it wants to own the data layer.
- npm shows the package published at `1.0.7`; the repo root `package.json` is a workspace at `0.0.0`, so the
  repo itself is a development demo, not the library.

Against this repo: Next.js **15.5.25 App Router** owns routing, so a second router (`react-router-dom@7`)
cannot be installed alongside it; the data seam is `lib/api-client.ts` against 16 existing `/api/admin/*`
routes (`notes/api-inventory.md` §1); `components/ui/` is 11 hand-written primitives with **zero Radix**
installed, so 27 registry deps would be the first Radix dependency in the project; and Constitution IV
explicitly forbids the look of "component-library demos" unless each component is justified by the brand.

**Alternatives considered.**

- *Install the kit and rebuild the admin on react-admin.* Rejected: it is a framework migration masquerading
  as a redesign — it replaces the router, the fetch layer and every page, and would leave the storefront's
  own build to absorb 21 new packages. Also unverifiable in this shared checkout without weeks of care.
- *Ignore the kit and design from scratch.* Rejected: the owner pointed at it for a reason — its admin
  ergonomics (table, list/view/edit shapes, filter and column affordances) are the thing worth taking.
- *Install only `ra-core` and use its hooks.* Rejected: `ra-core` without its provider/router is the hard
  80% of the dependency for no benefit; the parts we want are plain React.

## R2 — What the home screen can honestly show

**Decision.** Three sections plus a status mix, all from existing routes. **No stock section.**

**Rationale** (`notes/api-inventory.md`, cited to source):

| Want | Reality | So the design does this |
|---|---|---|
| Orders needing action | No date filter exists on any route; the only order filters are `userId` and `status` (`app/api/admin/orders/route.ts:13-14`). Needs-a-human = `PENDING · PROCESSING · SHIPPING` (`prisma/schema.prisma:71-79`). | Count from `reports/summary.byStatus` (already period-scoped) and list from `GET /api/admin/orders?status=PENDING&pageSize=6`. Label the window, never "today". |
| Revenue for a period | `reports/summary` hardcodes 30 days and ignores query params (`…/summary/route.ts:10`); its `totalRevenue` includes `CANCELED/FAILED/REVERSED` (line 14). | Derive the paid-only figure from `byStatus` (sum non-terminal) and label it as derived, or show the raw total with its basis printed. Never an unlabelled «درآمد». |
| Stock at risk | **Impossible**: there is no `GET /api/admin/products` — the collection route is POST-only (`app/api/admin/products/route.ts:36-71`). Nothing enumerates products or variants. | Section cut. Principle I makes an invented stock card worse than no card. |
| Newest orders | `GET /api/admin/orders` returns `OrderSummary[]` newest-first with meta `{page,pageSize,total,hasNextPage}` (`route.ts:49-54`). | Table via `apiGetWithMeta` (`lib/api-client.ts:44-59`), following that pagination convention. |

**Alternative considered.** *Add a `GET /api/admin/products` with a low-stock filter.* Rejected: `app/api/**`
and `prisma/**` are frozen (Constitution III as amended by FR-002), and the plan's own rule is that a section
is cut rather than an endpoint invented. Recorded so the decision is visible, not silently dropped.

## R3 — The status machine is not enforced server-side

**Decision.** The dashboard displays status; it does not offer status changes.

**Rationale.** `app/api/admin/orders/[id]/status/route.ts:9` accepts `z.nativeEnum(OrderStatus)` with **no
transition validation**, and the terminal-cancel restock/credit side effects live in `lib/orders.ts:96-111`.
A pretty dropdown on the home screen would therefore let an operator make an illegal move that the server
happily accepts and that restocks inventory wrongly. Order actions belong to the order detail page, which is
out of this feature's scope (capability map).

**Alternative considered.** *Add quick status actions to the dashboard for speed.* Rejected on the evidence
above; if the owner wants it, it needs a server-side state machine first — which is backend, frozen.

## R4 — Where the frame lives, and what "inherits" means

**Decision.** One shell in `app/(admin)/layout.tsx` + `components/admin/AdminSidebar.tsx`; the eight routes
change nothing.

**Rationale.** The current layout is 26 lines wrapping `AuthProvider` → `AdminGate` → flex row, and the
sidebar is 125 lines that duplicate the destination list in two breakpoints (desktop rail at `:57`, mobile
strip at `:92`) — the mobile strip scrolls horizontally and pushes logout off-screen at 360px. One nav model
removes that class of bug and is what FR-008 requires.

**Alternative considered.** *Per-page headers.* Rejected: FR-008's whole point is that no admin page needs an
edit to get the new frame.

## R5 — Auth gap: proven, and deliberately not fixed here

**Decision.** Report it, do not touch it in this feature.

**Rationale.** There is **no `middleware.ts` anywhere in the repo** (verified repo-wide). `AdminGate.tsx:15-33`
redirects on the client (`/login?next=/admin` for guests, `/` for non-ADMIN), so the server renders the admin
shell to any requester and the browser bounces afterwards. The data behind it is safe — every `/api/admin/*`
route is wrapped in `withAuth(handler, {roles:[Role.ADMIN]})` (`lib/auth.ts:192-228`, 22 call sites) — so what
leaks is structure and Persian labels, not customer data. The owner chose "handle later, focus on frontend"
on 2026-10-01, so it is recorded here and in `quickstart.md` as a standing risk, not silently ignored.

**Follow-up (2026-10-08).** The owner approved server-side route protection during the admin evaluation.
`middleware.ts` validates the session cookie, expiry, account activity, and ADMIN role before the App Router
renders the admin shell or its RSC payload. Missing or expired sessions redirect to login; active non-admin
users return to the storefront. Admin API routes keep their independent role checks. The redundant
client-only `AdminGate` was removed so it no longer delays dashboard data reads.

**Alternative considered.** *Add the server gate as part of the redesign.* Rejected because it was declined;
the cheapest version is a 12-line `middleware.ts` on the `/admin` prefix, which is noted as a one-step
follow-up rather than smuggled into a frontend task.

## R6 — Mobile-first is a structural rule here, not a slogan

**Decision.** Design at 360px: content column, bottom thumb rail, no horizontally scrolling nav, and no
horizontal page overflow at any breakpoint.

**Rationale.** The owner's standing rule ("ALWAYS MOBILE FIRST") plus the measured defect above. The admin's
data is table-shaped, which is exactly where 360px breaks: at that width a table must become a stacked row
list, not a smaller table.

**Alternative considered.** *Desktop layout with a mobile collapse.* Rejected: it is what exists today and it
is what fails at 360px.

## R7 — A missing primitive is built in `components/admin/ui/`, never borrowed into `components/ui/`

**Decision.** Where the kit expects a primitive this repo does not have, we hand-build the admin's version
inside `components/admin/ui/`. Nothing is added to `components/ui/`, and Radix is not introduced.

**Rationale.** Found while the vendoring ran: the kit's `data-table.tsx` needs `checkbox`, `tooltip` and
`alert`, and its `list-pagination.tsx` needs a `pagination` primitive — none of which exist here
(`components/ui/` is 11 hand-written files, zero Radix anywhere in the repo). `components/ui/*` is also
another agent's declared territory in `.agent-pair/README.md`'s who-is-who table, so editing it would need a
REQUEST and could stall the feature. Keeping admin parts in the admin's own directory means no cross-agent
lock, no new dependency, and a place where a later reader can see exactly which pieces came from the kit and
which we wrote.

**Alternatives considered.**

- *Add the missing primitives to `components/ui/` in shadcn style.* Rejected: touches a held lane, and it
  starts a Radix dependency the project has deliberately avoided so far.
- *Vendor the kit's own copies of those primitives.* Rejected: they pull `@radix-ui/react-*` with them.
- *Skip the table and use plain lists everywhere.* Rejected: an admin list without column affordances is a
  regression for orders and products, and the kit's value was precisely its table ergonomics.

## R8 — What the kit actually yielded, and what that does to scope

**Decision (2026-10-01, after `notes/kit-inventory.md`).** The kit is a **pattern source, not a parts bin**.
Of its 83 files, six are free of `ra-core` and only **one is worth taking** — `spinner.tsx`, now vendored at
`components/admin/ui/spinner.tsx` with its MIT header. The other five pure files are a demo splash carrying
their brand, a deprecated one-line div, an empty context, a hook that needs the ra-coupled provider, and a
toggle blocked on a primitive we lack.

The three files this feature was pointed at — **`data-table.tsx` (516 lines), `list-pagination.tsx` (265),
`sidebar.tsx` (722) — are all `ra-coupled`** and cannot be vendored at any sane cost: the table alone carries
fourteen react-admin contexts that would be deleted, not ported. So the capability map's `shared-primitives`
module was rebuilt from our own tokens instead (`Alert`, `Checkbox`, `Tooltip`, `Pagination` +
`pagination-range.ts`), which is what R7 predicted and what actually happened.

**Consequence, stated so nobody rediscovers it.** A declarative data table for the orders and products lists
is worth building (~150 lines against our own `components/ui/table.tsx`, taking the kit's `Col`-children
column shape and its saved-rank idea) — but it is **not part of feature 015**: the home screen renders a
list, not a table, and 015's scope is the frame, the sections and the states. It is recorded here as the next
feature's first task rather than being smuggled into this one.

**Open defect this finding exposed.** The five new primitives are **imported by nothing** (verified by grep,
2026-10-01), while three admin pages still use the older, untested `components/admin/Pagination.tsx`. Built
and unwired is dead code the day it lands — see T043 in `tasks.md`, which either wires them in or they come
back out.

## Open risk for Phase 1

`app/globals.css` (1,199 lines) and `tailwind.config.ts` (203 lines) are shared with the storefront and with
other agents' in-flight work. Token additions are append-only; if two agents edit these files at once the
second must rebase by hand, not overwrite. Delegation was posted on `.agent-pair/BOARD.md` rather than
assuming the files were free.
