# Feature Specification: Back-office dashboard — luxury, and simple above all

**Feature Branch**: `Hami-v3`

**Created**: 2026-10-01

**Status**: Draft — gated, no code written yet

**Input**: User description: "implement dashboard now - luxury - beautiful - modern and most important:
simple and to the point UX. ALSO use this repo: https://github.com/marmelab/shadcn-admin-kit"

**Companion**: `CAPABILITY-MAP.md` in this directory (modules `shell`, `shared-primitives`, `dashboard-home`).

---

## Assumptions I am making — correct me and I rewrite this section

1. **"Dashboard" means `/admin` and the frame it wears** — the home screen, the sidebar, the header, and the
   shared table/card/state components. It does **not** mean rebuilding orders, products, categories, brands
   or users: those keep their behaviour and inherit the new look.
2. **The owner's instruction lifts the freeze on the back office.** Constitution III currently says the
   admin back office "MUST NOT be modified". This feature proceeds only because you ordered it, and the
   constitution is amended in the same change (FR-002) so no later agent reverts the work as out of scope.
3. **"Use this repo" means take its components, not its framework.** MIT permits it; the install path does
   not (FR-001).
4. **The data stays where it is.** `/admin` keeps reading `/api/admin/*` through `lib/api-client.ts`. No new
   endpoint, no schema change, no seeded data.
5. **Luxury means the storefront's palette** — obsidian `#0B0204`, champagne `#E5D3B3`, oxblood — not a new
   admin theme. The back office must look like the same company's product.
6. **"Simple and to the point" is a measurable rule here, not a mood**: one job per screen, no more than
   three decisions asked of the operator at once, nothing on screen that cannot be acted on (FR-006).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — An operator sees the state of the shop in one look (Priority: P1)

A shop manager opens `/admin` on their laptop in the morning. Without clicking anything they can answer:
how many orders are waiting on me, what did we take in, what is about to run out, and which order to open
first. Each number is real, or it says so plainly. They reach an order in one tap.

**Why this priority**: this is the screen the word "dashboard" names, and the only one that has to exist for
the feature to be worth anything. Everything else in this spec makes it look right.

**Independent Test**: open `/admin` while signed in as an ADMIN and confirm the four sections carry the same
numbers as `/api/admin/reports/summary` and `/api/admin/orders` return; then open an order from the list and
confirm it is the order you clicked. No other module needs to be finished.

**Acceptance Scenarios**:

1. **Given** a signed-in ADMIN with 3 pending orders, **When** the dashboard loads, **Then** the pending
   count reads 3 and the list shows exactly those 3, each labelled with its real status.
2. **Given** the summary endpoint is slow or fails, **When** the dashboard loads, **Then** each section shows
   its own designed "could not read" state with a retry, and the page never shows a fabricated number or zero
   dressed up as real.
3. **Given** revenue in the dataset, **When** it is displayed, **Then** it reads in Persian digits with
   «تومان» and the digits are Persian throughout.
4. **Given** a product whose stock the shop does not track, **When** it appears in the risk section, **Then**
   it reads «تماس بگیرید» rather than an invented quantity (Constitution I).
5. **Given** the operator taps an order row, **When** navigation happens, **Then** they land on
   `/admin/orders/<that id>` in the same tab.

---

### User Story 2 — The frame reads as one product with the storefront (Priority: P2)

The same manager moves between the storefront they sell from and the back office they run it from, and it is
obviously one company: the same ground, the same champagne, the same type. On a 360 px phone the sidebar
becomes a bottom rail that can be operated with a thumb, and the whole shell scrolls without any sideways
drift.

**Why this priority**: without it the new home screen is a nice card floating in an old UI, and the shell is
what every other admin page inherits — the highest reach per line of code.

**Independent Test**: load any admin route — `/admin/products`, `/admin/users`, `/admin/brands` — with the
home screen untouched, and confirm the sidebar, header, spacing and palette are the new ones and that
nothing in those pages' behaviour changed.

**Acceptance Scenarios**:

1. **Given** any admin route, **When** the page renders at 360 px, **Then** there is no horizontal overflow
   and the navigation is reachable without scrolling back up.
2. **Given** the sidebar at desktop width, **When** a section is current, **Then** it is marked by more than
   colour alone (weight plus a marker) and the keyboard tab order follows the visual order.
3. **Given** RTL layout, **When** any spacing or alignment is applied, **Then** it uses logical properties
   and the layout mirrors correctly with no LTR leftovers.
4. **Given** `prefers-reduced-motion`, **When** the shell animates, **Then** motion is absent, not merely
   shorter.

---

### User Story 3 — The in-between states are designed, not left blank (Priority: P3)

The manager's connection stalls. Loading, empty, and failed reads each get a considered treatment in the
brand's own language — a skeleton shaped like the content that is coming, a short line naming what is
missing, a retry that works — instead of a bare spinner or an empty white box.

**Why this priority**: Principle IV already requires it in this project's own words, and it is the difference
between "luxury" and "a template with nice colours". It can ship after the two above without blocking them.

**Independent Test**: block `/api/admin/*` (return 500, then return an empty list) and screenshot each
section in each state at 360 px and 1280 px.

**Acceptance Scenarios**:

1. **Given** an empty result set, **When** the section renders, **Then** it names what is empty and what
   would fill it, in Persian, with no invented sample data.
2. **Given** a failed read, **When** the section renders, **Then** it offers a retry and the retry
   re-attempts only that section.
3. **Given** a loading section, **When** the skeleton is shown, **Then** its shape matches the loaded
   content's layout so nothing jumps when data arrives (no layout shift).

---

### Edge Cases

- **Zero orders today** — the pending section must not render an empty card column; it states the fact.
- **Very large integers** (a year of revenue) — must not wrap mid-number or break the card; Persian digits and
  grouping hold at 360 px.
- **Long product names** — truncate with the full name available, never overflow the row.
- **A section that succeeds while another fails** — partial data is shown; the failed one shows its own state.
  No all-or-nothing error page.
- **Signed in as a non-ADMIN** — the existing redirect behaviour is preserved exactly (it is not this
  feature's to change; see Open Question 3).
- **Session expires mid-view** — the operator is returned to login with the admin path preserved, not left on
  a half-rendered dashboard.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — The kit at `marmelab/shadcn-admin-kit` is adopted as **vendored source, not an installed
  dependency**. Evidence for the choice, measured 2026-10-01 from the project's own `registry.json`: its
  `admin` block (`type: registry:block`) requires `ra-core@^5.15.2`, `ra-i18n-polyglot`,
  `ra-language-english`, `react-router-dom@^7.1.1`, `@tanstack/react-query@^5.83.0`, `@base-ui/react`,
  `lodash`, `diacritic`, `inflection`, `query-string`, `next-themes`, `sonner`, `cmdk`, `react-dropzone`,
  `react-error-boundary`, `react-hook-form@^7.65.0`, `tw-animate-css`, plus 27 shadcn primitives — and it
  expects a react-admin **DataProvider** to own the data layer, which in this repo is `lib/api-client.ts`
  against `/api/admin/*`. `react-router-dom` cannot run inside Next.js App Router. Vendored files carry the
  upstream MIT licence notice and the source path in a header comment; ra-core-coupled props
  (`useList`, `useRecordContext`, `useDataProvider`) are removed at the point of copying, not stubbed.
- **FR-002** — `.specify/memory/constitution.md` Principle III is amended in this change to record that the
  back office was reopened by owner instruction on 2026-10-01 and to state what stays frozen
  (`data/`, `app/api/`, `prisma/`, checkout, payments). Without this the feature is out of scope by the
  project's own written rule and will be reverted by a later agent.
- **FR-003** — `/admin` presents, in one screen: orders needing action, revenue for a stated period, the
  status mix, and the most recent orders. Each section names its own period or basis on screen.
  *(Amended 2026-10-01 after `notes/api-inventory.md`: a "stock at risk" section was cut — no admin route
  enumerates products or variants, so it could only have been invented. The plan's rule holds: the section
  is cut rather than an endpoint being created.)*
- **FR-003b** — Revenue MUST carry its honest basis. `/api/admin/reports/summary` returns a hardcoded 30-day
  window whose `totalRevenue` sums **every** order including `CANCELED`, `FAILED` and `REVERSED`
  (`app/api/admin/reports/summary/route.ts:10,14`). The dashboard MUST either state that basis on the card or
  derive the figure from `byStatus` excluding the terminal-cancel statuses and label it as derived. It MUST NOT
  print a number under «درآمد» that silently includes cancelled orders — Principle I has no exception path.
- **FR-004** — Every figure comes from `/api/admin/*` through the existing `lib/api-client.ts` seam. No
  component computes a number from a guess, and no section renders a value the API did not return.
- **FR-005** — Money is displayed in Persian digits with «تومان»; all numerals on the surface are Persian;
  Jalali date labels where a date is shown. No letter-spacing and no uppercase anywhere (Persian type rule).
- **FR-006** — Simplicity as a constraint, not a feeling: the home screen asks the operator no more than
  three things at once; every visible control either does something or is removed; no decorative metric,
  sparkline, or card that carries no information.
- **FR-007** — Colour, radius, shadow, spacing and duration come from existing tokens in
  `tailwind.config.ts` / `app/globals.css`. Zero raw hex or rgb literals in the new components. If a needed
  token does not exist, it is added to the token file, not inlined.
- **FR-008** — The shell is built once and inherited: `app/(admin)/layout.tsx` and `AdminSidebar` are
  replaced, all eight admin routes pick up the new frame with no per-page edits.
- **FR-009** — Mobile-first: designed at 360 px and enhanced upward. Verified at 360 px and 1280 px with no
  horizontal overflow at either.
- **FR-010** — Loading, empty and error states are specified and rendered for each dashboard section
  (Principle IV's equal-attention rule), with no layout shift when data lands.
- **FR-011** — Text contrast ≥ 4.5:1 (≥ 3:1 for large text) against its own background in every state,
  measured, not assumed; interactive edges ≥ 3:1 (WCAG 1.4.11).
- **FR-012** — Keyboard-operable throughout: every row/control reachable in visual order, a visible focus
  treatment, and the mobile nav usable without a pointer.
- **FR-013** — Motion is brand-consistent and restrained: transform/opacity only, nothing that animates
  layout, and fully absent under `prefers-reduced-motion`.
- **FR-014** — No new runtime dependency is installed (see FR-001 and Boundaries). `package.json`
  dependencies are unchanged by this feature unless the owner approves an addition.
- **FR-015** — The storefront (`app/(main)`, `components/home`, `components/shop`, `components/atmosphere`)
  is not touched. This feature lives in `app/(admin)`, `components/admin`, `components/ui` and the token file.

### Key Entities

- **Summary figure** — a labelled value with its basis: `{ label, value, unit, period, state }` where state is
  `real | empty | unreadable`. Nothing renders without a state.
- **Action-needed order** — `{ id, status, customer, total, placedAt }` as returned by `/api/admin/orders`;
  the row links to `/admin/orders/[id]`.
- **Stock risk item** — `{ name, stock, verdict }` where verdict may be «تماس بگیرید» when the catalogue does
  not track it.
- **Shell destination** — the existing sidebar routes, unchanged in path and permission, plus their labels.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — An operator who has never used the new screen identifies the number of orders needing action
  within one look at `/admin`, with no click. Verified by opening the page and reading the counter against
  the API response.
- **SC-002** — Zero new runtime dependencies: `git diff main -- package.json` shows no added dependency.
- **SC-003** — Zero raw colour literals in the new and replaced files (`grep` for `#[0-9a-fA-F]{3,8}` and
  `rgba(` returns nothing outside the token definitions).
- **SC-004** — All eight admin routes render with the new shell and no page-level regression: typecheck and
  `npm run test:unit` pass, and each route returns 200.
- **SC-005** — At 360 px and 1280 px, screenshots of the dashboard show no horizontal overflow, and every
  text pairing meets the FR-011 contrast ratio, measured by the same script method already used for
  `specs/002-scroll-atmosphere/tools/surface-separation.mjs`.
- **SC-006** — Every dashboard section has a designed loading, empty and error rendering, each
  screenshot-verified; no section can render a blank box.
- **SC-007** — `npm run typecheck` clean and `npm run test:unit` clean (never bare `npm test` — it truncates
  nineteen live tables).
- **SC-008** — The page still looks like Hami and not like a component-library demo: judged against
  Principle IV by side-by-side screenshots at 360 px of the storefront and the dashboard. *(Qualitative, so it
  is the owner's call, not mine — it is listed as an ask.)*
- **SC-009** — No perceptual performance claim is made from this machine; it cannot measure smoothness or
  load honestly. Timing, if wanted, is measured on the LAN phone.

---

## Adopting the kit — what is taken and what is dropped

Taken from `src/components/admin/*` (MIT, header attribution, ra-core props removed): the **data-table**
behaviour and column model, the **sidebar** shell structure, filter/pagination affordances, and the discipline
of the List/Show/Edit page shapes.

Dropped: react-admin's `ra-core`, `DataProvider`, its i18n and polyglot language packs, `react-router-dom`
(and its router), TanStack Query, `next-themes` (the app is dark by brand, not by user toggle), `sonner`/
`cmdk`/`react-dropzone` unless a specific need appears, and the 27-primitive install sweep. Our own
`components/ui/*` (11 files, hand-written, zero Radix) stay the base; anything we vendor is restyled to
Hami tokens before it is used.

---

## Engineering contract *(the six areas the spec workflow requires)*

### Commands

```
Dev (already running in tmux hh-dev on :3000):  npm run dev -- -H 0.0.0.0
Typecheck:                                       npm run typecheck
Unit tests (NEVER bare npm test):                npm run test:unit
Lint:                                            npm run lint
```

### Project Structure

```
app/(admin)/layout.tsx        → the shell (replaced)
app/(admin)/admin/**          → routes, unchanged paths
components/admin/**           → admin surfaces; new dashboard sections live here
components/admin/ui/**        → vendored kit pieces, attribution header in each file
components/ui/**              → existing 11 primitives; extended, not replaced
lib/api-client.ts             → the only data seam
app/globals.css, tailwind.config.ts → tokens; new tokens go here only
specs/015-admin-dashboard/**  → this spec, the map, plan, tasks
```

### Code Style

One real shape beats three paragraphs. Server-prism, client-interaction:

```tsx
// components/admin/dashboard/sections/ActionNeeded.tsx
"use client";

export function ActionNeeded({ orders, state }: { orders: AdminOrder[]; state: ReadState }) {
  if (state !== "real") return <SectionState state={state} onRetry={retry} />;
  if (orders.length === 0) return <SectionEmpty label="امروز سفارشی در انتظار شما نیست" />;
  return (
    <AdminCard title="نیاز به اقدام" basis="۷ روز گذشته">
      {orders.map((o) => <OrderRow key={o.id} order={o} />)}
    </AdminCard>
  );
}
```

Conventions that hold: `State` is passed explicitly, never inferred from an empty array; Persian strings are
written in Persian with no transliteration; logical CSS properties only (`ps-`/`pe-`/`ms-`/`me-`); numerals go
through the existing `toFaDigits` helper; no `any`, no non-null assertions to satisfy a type the data does not
have.

### Testing Strategy

- **Unit (Vitest, node environment — there is no DOM harness here)**: pure logic only — the read-state
  reducer, period math, numeral/currency formatting. `tests/unit/*.test.ts`, run with `npm run test:unit`.
- **Browser (scripted Playwright through `tools/dispatch/browser-gate`, one browser at a time on `:3000`)**:
  overflow at 360 px, keyboard order, contrast measurement, and the three states per section, screenshotted to
  `.scratch/`.
- **Contract**: each section's rendered number compared to the raw `/api/admin/*` JSON it came from.

### Boundaries

- **Always**: typecheck and `npm run test:unit` before reporting done; claim a `.agent-pair/locks/` entry per
  file before editing it; re-read `git status --short` before staging; stage explicit paths only.
- **Ask first**: any new dependency (kit or otherwise); any change to `app/api/**`, `data/**`, `prisma/**`;
  server-side auth gating (Open Question 3); any edit to the constitution beyond FR-002's amendment; commit or
  push.
- **Never**: `npm test` or bare `npx vitest` (wipes nineteen tables); `git restore`/`checkout --`/`stash`/
  `add -A` in this shared worktree; delete another agent's lock (move it to `.agent-pair/released/`); touch
  `docs/inspires/`; fabricate a figure to fill a card; start a second dev server on `:3000`.

---

## Open Questions — three, in plain words

1. **How far does "dashboard" reach?** My reading: the home screen plus the frame everything wears, and the
   other admin pages only inherit the new look. Say the word if you want orders or products rebuilt too.
2. **Do you accept the kit as parts, not as an install?** Installing it means taking react-admin and a second
   router, which breaks Next.js and rewrites how admin gets its data. My plan takes its components and drops
   its framework.
3. **The back office is open to anyone right now at the HTML level.** No `middleware.ts` exists;
   `AdminGate` redirects on the client, so the admin page structure and labels are served to any visitor
   before the redirect. Fixing it means adding server-side gating — that touches auth, so I am asking, not
   assuming.

## Decisions I made so this can move (recorded, not silent)

- Kit = vendored source under MIT with attribution (FR-001), driven by the measured dependency list above.
- The constitution freeze is amended rather than ignored (FR-002).
- No new runtime dependency (FR-014).
- No perf claim from this machine (SC-009); LAN phone for anything time-shaped.
- Home screen is capped at four sections and three asks (FR-006) — "simple and to the point" made testable.
