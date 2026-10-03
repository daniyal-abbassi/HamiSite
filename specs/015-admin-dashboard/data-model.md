# Phase 1 Data Model: back-office dashboard (feature 015)

No new tables, no schema change, no new endpoint. This is a **read model**: what each dashboard section needs,
where it comes from, and what it may honestly say. Field names are quoted from
`notes/api-inventory.md`, which cites them to source.

---

## Envelope and fetch conventions (shared, not invented)

| Concern | Convention | Source |
|---|---|---|
| Success | `{ success: true, data, meta? }` | `lib/http.ts:39-41` |
| Failure | `{ success: false, error: { message, code, details? } }` | `lib/http.ts:43-55` |
| Read | `apiGet(path) → data`, `apiGetWithMeta(path) → { data, meta }` | `lib/api-client.ts:35-59` |
| Pagination | query `page` (≥1, default 1), `pageSize` (1–100, default 20); `meta = { page, pageSize, total, hasNextPage }` | `lib/http.ts:98-109`, `app/api/admin/orders/route.ts:49-54` |
| Auth | httpOnly session cookie, `credentials: "same-origin"`; role guard inside each route (`withAuth(…, {roles:[Role.ADMIN]})`) | `lib/api-client.ts:36-39`, `lib/auth.ts:192-228` |

The dashboard reads. It never writes: no PATCH, no POST, no status change (see R3 in `research.md`).

## `ReadState` — the one type every section shares

```ts
type ReadState = "loading" | "real" | "empty" | "unreadable";
```

- `loading` — the request is in flight. Renders a skeleton **shaped like the content that will arrive**.
- `real` — data arrived and is non-empty.
- `empty` — data arrived and legitimately contains nothing. A different message and a different affordance
  from `unreadable`; conflating them is the common failure this rule exists to stop.
- `unreadable` — the request failed or is not authorised. Names the failure and offers a retry that
  re-attempts **only this section**.

Invariant: **no section may render a number while its state is not `real`.** A section that cannot read never
shows `0`, because `0` is a claim about the shop that the API did not make (Principle I).

Sections fail alone. One failed request must not blank the page, which is what the current
`Promise.all` + single `failed` flag does (`components/admin/dashboard/DashboardClient.tsx:28-36`).

## Entity: `StatusRow` (from `reports/summary`)

`{ status: OrderStatus, orderCount: number, revenue: number }`, with
`OrderStatus = PENDING | PROCESSING | SHIPPING | COMPLETED | CANCELED | FAILED | REVERSED`
(`prisma/schema.prisma:71-79`).

The summary route returns `{ periodDays: 30, totalOrders, totalRevenue, byStatus: StatusRow[] }` and reads no
query params; the 30-day window is hardcoded (`app/api/admin/reports/summary/route.ts:10`).

### Derived figures — pure, unit-tested, and each one labelled on screen

| Derived value | Formula over `StatusRow[]` | Why it is not just `totalRevenue` |
|---|---|---|
| `needsAction` | `sum(orderCount)` over `PENDING + PROCESSING + SHIPPING` | Those three are the states a human moves an order through. Terminal-cancel statuses are not work. |
| `paidRevenue` | `sum(revenue)` over every status **except** `CANCELED, FAILED, REVERSED` | `totalRevenue` includes cancelled orders (`route.ts:14` filters only on `createdAt`). Showing it as «درآمد» would be a false statement — FR-003b. |
| `orderVolume` | `totalOrders`, labelled "همه سفارش‌ها شامل لغوشده" | Kept as-is but with its basis printed, because it is honest once labelled. |
| `avgPaidOrder` | `paidRevenue / (orderCount sum over non-terminal)`, rounded | Replaces the current `totalRevenue / totalOrders`, whose denominator counts cancelled orders. |

The terminal set is taken from the code's own `TERMINAL_CANCEL_STATUSES` (`lib/orders.ts:82`), not invented
here, so the dashboard and the restock logic agree on which statuses mean "reversed".

## Entity: `OrderSummary` (newest orders table)

From `GET /api/admin/orders?pageSize=6` (newest first). Fields used: `id`, `orderNumber`, `status`,
`paymentStatus`, `createdAt`, `customer?.username`, `totals.totalAmount` (`lib/orders.ts:41`,
`types/store.ts`). Row links to `/admin/orders/{id}` — same tab, existing route.

Not available and therefore **not shown**: a "today" filter (no date param exists on the route — R2), and any
per-order action (R3).

## Cut entity: `StockRiskItem`

The spec originally promised a "running low" section. **There is no way to enumerate products or variants**
— `/api/admin/products` is POST-only (`app/api/admin/products/route.ts:36-71`) and every other product route
needs an id it already has. The data exists in the schema (`Product.stock`/`stockType`,
`ProductVariant.stock`/`stockType` at `prisma/schema.prisma:327-328,401-402`) but is unreachable without a new
route, and `app/api/**` and `prisma/**` are frozen. The section is cut (FR-003 amendment). If the owner later
reopens the backend, the read model for it is: products where `stockType` is a tracked kind and `stock ≤ n`.

## Navigation model

One list, `DESTINATIONS`, in `components/admin/AdminSidebar.tsx:26`, consumed by the desktop rail, the mobile
thumb rail and the sheet. Seven destinations today: dashboard, orders, products, users, categories, brands,
coupons. The mobile rail shows the four the operator uses most plus a sheet for the rest (a bottom nav with
seven slots is unusable); **no destination may exist on one breakpoint and not the other** (FR-008).

## Primitive ownership — where a missing part is built

The kit's `data-table.tsx` needs `checkbox`, `tooltip`, `alert`; its `list-pagination.tsx` needs a
`pagination` primitive; several need `dropdown-menu`/`popover`/`sheet`. This repo has 11 hand-written
primitives in `components/ui/` and **no Radix**, and `components/ui/*` belongs to the storefront, not to
this feature.

Decision (recorded as R7 in `research.md`): anything the admin needs that we do not have is written in
**`components/admin/ui/`**, hand-built in our own style, never in `components/ui/` and never via Radix. The
admin surface's primitives are thus versioned with the admin surface, and no storefront owner's file is
touched.
