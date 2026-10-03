# Implementation Plan: Back-office dashboard — luxury, simple above all

**Branch**: `015-admin-dashboard` | **Date**: 2026-10-01 | **Spec**: [spec.md](./spec.md) · [CAPABILITY-MAP.md](./CAPABILITY-MAP.md)

**Input**: Feature specification from `specs/015-admin-dashboard/spec.md`

## Summary

Rebuild the back office's frame and its home screen — the shell every admin page wears, the shared
primitives the admin surfaces are built from, and `/admin` itself — in the storefront's own luxury
language (obsidian ground, champagne rule), with simplicity treated as a testable constraint rather than
a mood. `marmelab/shadcn-admin-kit` is mined for component *source* under MIT and restyled; its framework
(react-admin `ra-core`, `react-router-dom`, TanStack Query, DataProvider) is not adopted, because it would
replace both the router and the data layer this app already has. Orders, products, categories, brands,
users and coupons keep their behaviour and data and inherit the new frame.

## Technical Context

**Language/Version**: TypeScript 5 strict, ES2022 — Next.js **15.5.25** App Router, React **19.2.8**

**Primary Dependencies**: Tailwind CSS `^3.4.19` with the project's own token layer
(`tailwind.config.ts` 203 lines, `app/globals.css` 1,199 lines); `lucide-react` for icons; `clsx` +
`tailwind-merge` behind `cn()`; `class-variance-authority` available. **No Radix, no shadcn/ui install** —
`components.json` does not exist and `components/ui/` is 11 hand-written files (499 lines).

**Storage**: none in the client path. Admin data arrives over HTTP from `/api/admin/*`
(`admin/orders`, `admin/products`, `admin/categories`, `admin/brands`, `admin/users`, `admin/coupons`,
`admin/reports/summary`, `admin/variants/[id]/stock`, `+` the `[id]` and status/variant subroutes) through
`lib/api-client.ts` (`apiGet`, `apiGetWithMeta`, `apiPatch`, `{success,data,error}` envelope). Prisma lives
only in the routes.

**Testing**: Vitest, **node environment only — there is no DOM harness** (`npm run test:unit`; never bare
`npm test`, which truncates nineteen live tables). Browser truth is scripted Playwright run directly, one
browser at a time on `:3000`, and the measurement style already proven in
`specs/002-scroll-atmosphere/tools/surface-separation.mjs`.

**Target Platform**: Modern browsers, RTL Persian (`<html lang="fa" dir="rtl">` at `app/layout.tsx:95`),
mobile-first at **360 px**, desktop as the enhancement. Vazirmatn + DM Mono.

**Project Type**: Web application — storefront plus back office in one Next.js app.

**Performance Goals**: not asserted from this machine; the box is too weak to measure honestly. Structural
rules only — transform/opacity motion, no layout animation, no waterfall of requests where one would do.
Any timing question is measured on the LAN phone.

**Constraints**: no new runtime dependency; no change to `app/api/**`, `data/**`, `prisma/**`; no fabricated
figures; colour only from tokens; contrast ≥ 4.5:1 measured; the admin HTML stays client-gated for now
(owner's call — see Boundaries).

**Scale/Scope**: one shell, ~6 shared primitives, one home screen of four sections; **8 admin routes
inherit the frame with no per-page edits**. Existing admin surface is ~2,641 lines across
`components/admin/**`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Basis |
|---|---|---|
| **I — Truthful data** | ✅ PASS | Every figure traces to `/api/admin/*` through `lib/api-client.ts`. A section that cannot read says so; nothing renders an invented number. Untracked stock renders «تماس بگیرید». |
| **II — Persian-first** | ✅ PASS | RTL logical properties only, Persian digits and «تومان» through `formatToman`/`toFaDigits`, Jalali dates through `formatFaDate`, no letter-spacing or uppercase on Persian, Vazirmatn. The vendored `ADMIN` badge (Latin, `tracking-[0.1em]`, `AdminSidebar.tsx:59-61`) is replaced by a Persian label. |
| **III — Frozen backend and back office** | ⚠️ **AMENDMENT REQUIRED** | Current text: *"Auth, cart, checkout, payments, and the admin back office are out of scope for this revision. They MUST keep working as they are and MUST NOT be modified to unblock a frontend decision."* The owner ordered this work on 2026-10-01, which reopens **the back office UI only**. FR-002 amends the principle to record the narrowing; `app/api/**`, `data/**`, `prisma/**`, auth and payments stay frozen and this feature touches none of them. **No code lands before that amendment**, or a later agent reverts this as out of scope. |
| **IV — No generic-dashboard look** | ✅ PASS BY DESIGN, gated by proof | Explicitly the risk of this feature, since a component kit is being mined. Mitigations: token-only colour, the storefront's own ground and rule, states designed (Principle IV's equal-attention clause), and SC-008 puts a side-by-side screenshot in front of the owner rather than claiming "luxury" in prose. |

**Post-design re-check**: pending after research.md and data-model.md land. Nothing in Phase 0/1 introduces
a dependency or a new endpoint, so the gate is expected to hold — the one item that can change it is the
per-section read model in `data-model.md` if it turns out an existing route cannot supply a section, in
which case the section is cut rather than the endpoint being invented.

## Project Structure

### Documentation (this feature)

```text
specs/015-admin-dashboard/
├── plan.md              # this file
├── spec.md              # requirements + success criteria (owner-gated)
├── CAPABILITY-MAP.md    # shell · shared-primitives · dashboard-home + build order
├── research.md          # Phase 0 — kit adoption, read model, vendoring rules
├── data-model.md        # Phase 1 — section read model, ReadState, figures
├── contracts/           # Phase 1 — the component + section contracts workers build to
├── quickstart.md        # Phase 1 — how to run and verify this surface
├── notes/api-inventory.md   # existing /api/admin/* shapes, measured not assumed (opencode)
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
app/(admin)/layout.tsx              → REPLACED: the frame (AuthProvider + AdminGate + shell + main)
app/(admin)/admin/page.tsx          → unchanged route, new section composition
app/(admin)/admin/{orders,products,users,categories,brands,coupons}/**  → untouched; inherit the frame

components/admin/
├── AdminSidebar.tsx                → REPLACED: desktop rail + mobile thumb nav, one nav model
├── AdminPageHeader.tsx             → REPLACED: title, basis line, one primary action
├── AdminGate.tsx                   → untouched (client gate; server gating is out of scope by owner decision)
├── dashboard/
│   ├── DashboardClient.tsx         → REPLACED: composes sections, no data logic of its own
│   └── sections/                   → NEW: ActionNeeded · Takings · StockRisk · NewestOrders
├── states/                         → NEW: one SectionState (loading · empty · unreadable) used by all
└── ui/                             → NEW: vendored kit source, MIT header per file, ra-core props stripped

components/ui/{card,table,badge,button,skeleton,...}.tsx  → existing 11; extended only if a task says so

app/globals.css · tailwind.config.ts → the only place a new colour/radius/shadow value may be defined
```

**Structure Decision**: web-app single-project layout, unchanged. Everything new lives under
`components/admin/**` inside the two capability modules the map names, so no admin page needs a per-page
edit to receive the new frame (FR-008) and the storefront stays untouched (FR-015). Vendored kit code is
isolated in `components/admin/ui/` with an attribution header per file, which keeps the MIT obligation
mechanical and makes it obvious later what came from where.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Constitution III reopened for the back-office UI | The owner ordered a dashboard rebuild; the principle currently forbids any back-office modification, so shipping this without amending it leaves the repo self-contradicting and invites a later agent to revert the work. | Ignoring the principle was rejected: the constitution outranks all other frontend guidance (its own L182), so an unrecorded breach is worse than an amendment. The amendment narrows nothing else — API, data, Prisma, auth and payments stay frozen. |
| Vendoring ~6 kit component files instead of installing the package | The kit's registry block requires `ra-core`, `react-router-dom@7` and TanStack Query and expects a DataProvider to own data loading; a second router cannot coexist with Next App Router. | `npm install` of the kit was rejected on measured facts (FR-001), and "design from scratch" was rejected because the owner pointed at this kit for its admin ergonomics. Vendoring takes the parts and leaves the framework. |
