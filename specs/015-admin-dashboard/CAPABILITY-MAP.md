# Capability Map: Hami Hamrah back-office dashboard

**Created**: 2026-10-01 · **Feature**: `specs/015-admin-dashboard` · **Owner decision pending on 3 items (see the spec's Open Questions)**

The request — "implement the dashboard, luxury/beautiful/modern, simple UX, use shadcn-admin-kit" — bundles
three capabilities that ship and are verified separately. They are listed here so each later artifact can
name the module it belongs to instead of re-litigating scope.

| Module id | Responsibility | Depends on | In scope? |
|---|---|---|---|
| `shell` | The frame every admin page wears: sidebar rail, page header, mobile nav, theming hooks | — | **Yes** |
| `shared-primitives` | The vendored table / card / badge / state components the admin surfaces are built from | `shell` | **Yes** |
| `dashboard-home` | `/admin` itself: what needs action today, revenue, stock risk, newest orders | `shell`, `shared-primitives` | **Yes** |
| `orders-crud` | `/admin/orders` list + detail behaviour and data | `shared-primitives` | No — inherits the new shell, logic untouched |
| `catalog-crud` | `/admin/products`, `/categories`, `/brands` forms and lists | `shared-primitives` | No — same |
| `coupons` | `/admin/coupons` — today a stub that says "not ready" | `shared-primitives` | No — stays a stub |

**Build order**: `shell` → `shared-primitives` → `dashboard-home`.

Each module is usable without the next: the shell alone already changes every admin page, and the home
screen alone is a demonstrable product.

**Interfaces between modules** live in the provider's spec, not here: `shared-primitives` exposes the
component list and its styling contract; `dashboard-home` consumes `/api/admin/*` through the existing
`lib/api-client.ts` seam, unchanged.

## The one decision that shapes all three

`https://github.com/marmelab/shadcn-admin-kit` is **MIT-licensed and used as a source of parts, not
installed as a dependency** — see FR-001 and `spec.md` → "Adopting the kit" for the measured reason
(its `admin` registry block pulls `ra-core@^5.15.2`, `react-router-dom@^7.1.1`, `@tanstack/react-query`,
`lodash`, `next-themes`, `sonner`, `cmdk`, `react-dropzone` and 27 shadcn primitives, and expects a
react-admin DataProvider to own the data layer this repo already has in `lib/api-client.ts`).
