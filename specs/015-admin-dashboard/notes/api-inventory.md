# 015-A — Admin API surface inventory (read-only research)

Scope: every route under `app/api/admin/`, the shared envelope/pagination helpers, and the five
questions the Boss asked. All claims are cited to files actually read. No endpoint was called; this
is a source inventory, not a runtime observation.

## 0. Conventions shared by every admin route

**Role guard.** Every admin route is wrapped in `withAuth(handler, { roles: [Role.ADMIN] })`
(e.g. `app/api/admin/orders/route.ts:57`). `withAuth` resolves the httpOnly session cookie,
401s unauthenticated requests, 403s inactive accounts, and 403s any role not in the list
(`lib/auth.ts:192-228`; role check at `lib/auth.ts:213-215`). `Role` is `RETAIL | WHOLESALE |
AGENT | ADMIN` (`prisma/schema.prisma:36-41`). There is no finer-grained permission: ADMIN is
all-or-nothing.

**Envelope.** Success is `{ success: true, data, meta? }` (`ok()`, `lib/http.ts:39-41`). Failure
is `{ success: false, error: { message, code, details? } }` (`fail()`, `lib/http.ts:43-55`).
The browser client `lib/api-client.ts` unwraps this: `apiGet` returns `data` only
(`lib/api-client.ts:35-41`), `apiGetWithMeta` returns `{ data, meta }`
(`lib/api-client.ts:44-59`). Auth is cookie-based only — `credentials: "same-origin"`, no
header/token (`lib/api-client.ts:36-39`).

**Pagination.** `parsePagination` (`lib/http.ts:98-109`) reads `page` (default 1, min 1) and
`pageSize` (default 20, clamped to 1–100). Paginated routes return meta
`{ page, pageSize, total, hasNextPage }` (e.g. `app/api/admin/orders/route.ts:49-54`). There is
no `X-Total-Count` header and no nested `meta` object inside `data` — meta is a sibling of
`data` at the envelope top level.

**Prisma.** Every admin route imports `prisma` from `lib/prisma` and queries directly. There is
no repository/service layer; routes are the data access.

## 1. Route inventory

| Route | Methods | Query / Body | Returns (`data`) | Prisma |
|---|---|---|---|---|
| `/api/admin/orders` | GET | `page`, `pageSize`, `userId?`, `status?` | `OrderSummary[]` + pagination meta | yes |
| `/api/admin/orders/[id]/status` | PATCH | body `{ status, trackingCode? }` | `OrderSummary` + `{message}` | yes |
| `/api/admin/products` | POST | body = create-product fields (see §2) | `AdminProduct` + `{message}` | yes |
| `/api/admin/products/[id]` | PATCH, DELETE | body = partial product fields | `AdminProduct` / `{id}` | yes |
| `/api/admin/products/[id]/variants` | POST | body = create-variant fields | `AdminVariant` + `{message}` | yes |
| `/api/admin/products/[id]/variants/[variantId]` | PATCH, DELETE | body = partial variant fields | `AdminVariant` / `{id}` | yes |
| `/api/admin/categories` | POST | body = create-category fields | raw `Category` row + `{message}` | yes |
| `/api/admin/categories/[id]` | PATCH, DELETE | body = partial category fields | raw `Category` row / `{id}` | yes |
| `/api/admin/brands` | POST | body = create-brand fields | raw `Brand` row + `{message}` | yes |
| `/api/admin/brands/[id]` | PATCH, DELETE | body = partial brand fields | raw `Brand` row / `{id}` | yes |
| `/api/admin/users` | GET | `page`, `pageSize`, `role?` | `SafeUser[]` + pagination meta | yes |
| `/api/admin/users/[id]` | GET, PATCH | body `{ role?, isActive? }` | `SafeUser` (+ `{message}` on PATCH) | yes |
| `/api/admin/coupons` | POST | body = create-coupon fields | `AdminCoupon` + `{message}` | yes |
| `/api/admin/coupons/[id]` | PATCH, DELETE | body = partial coupon fields | `AdminCoupon` / `{id}` | yes |
| `/api/admin/reports/summary` | GET | none | `{ periodDays, totalOrders, totalRevenue, byStatus[] }` | yes |
| `/api/admin/variants/[id]/stock` | PATCH | body `{ stock, reason }` | `AdminVariant` + `{message}` | yes |

**There is no `GET /api/admin/products`** — the products collection route only has POST
(create). There is no product-list, category-list, brand-list, or coupon-list endpoint
anywhere under `app/api/admin/` (verified by `find app/api/admin -type f`: 16 route files,
listed in §1). Lists exist only for orders and users.

## 2. Per-route detail

### GET /api/admin/orders — `app/api/admin/orders/route.ts:8-58`
- Query: `page`, `pageSize` (via `parsePagination`, line 12); `userId` (positive int, else 400,
  lines 16-22); `status` (validated against `OrderStatus` enum, else 400, lines 24-31).
- Response `data`: array of `serializeOrderSummary` (`lib/orders.ts:36-77`):
  ```
  {
    id: number, orderNumber: string,
    status: OrderStatus,            // prisma/schema.prisma:71-79
    paymentStatus: PaymentStatus,    // prisma/schema.prisma:59-66
    paymentMethod: string | null,
    customer: { id, username, role, phoneNumber },
    shipping: { methodName: string|null, shippingPrice: number, trackingCode: string|null },
    totals: { subtotal, discountAmount, taxAmount, totalAmount },   // all numbers (Decimal→number)
    createdAt: ISO string, updatedAt: ISO string,
    items: [{ id, productId, variantId, productName, variantName, quantity, price, discountAmount, lineTotal }],
    payments: [{ id, transactionNumber, amount, method, status, createdAt }]
  }
  ```
- Meta: `{ page, pageSize, total, hasNextPage }` (lines 49-54). Ordered by `createdAt desc`
  (line 42). Prisma: `count` + `findMany` with `orderListInclude()` (`lib/orders.ts:4-32`).

### PATCH /api/admin/orders/[id]/status — `app/api/admin/orders/[id]/status/route.ts:21-56`
- Body: `{ status: OrderStatus, trackingCode?: string }` (schema lines 8-11). Any enum value
  is accepted — the route does **not** validate allowed transitions.
- Side effects in a transaction: `applyOrderStatusTransition` (`lib/orders.ts:84-126`)
  restocks `LIMITED` variants and reverses 60-day wholesale credit when an order moves into
  `CANCELED | FAILED | REVERSED` (`TERMINAL_CANCEL_STATUSES`, `lib/orders.ts:82`).
- Response: single `OrderSummary` + `{ message: "Order status updated" }` (line 52).

### POST /api/admin/products — `app/api/admin/products/route.ts:36-71`
- Body (schema lines 9-34): `name` (req), `slug` (req, unique → 409), `price` (req, ≥0),
  plus optional `englishName, description, analysis, mainCategoryId, brandId, isDigital,
  compareAtPrice, specialOffer, specialOfferEnd (ISO datetime), costPerItem, batchSize,
  available, showPrice, hasVariants, stock (int ≥0), stockType (enum), minOrderQuantity,
  maxOrderQuantity, guarantee, seoTitle, seoDescription`.
- Response: `serializeAdminProduct` (`lib/serializers.ts:35-42`) — the full `Product` row
  spread, with `price`, `compareAtPrice`, `costPerItem` converted from Decimal to number
  (`toNumber`, `lib/serializers.ts:3-11`). `Product` fields per `prisma/schema.prisma:289-329`
  (includes `stock: Int`, `stockType: StockType`, `available`, `hasVariants`). Dates serialize
  as ISO strings via `NextResponse.json`.

### PATCH/DELETE /api/admin/products/[id] — `app/api/admin/products/[id]/route.ts`
- PATCH (lines 47-91): body is the same schema `.partial()` with "at least one field"
  (lines 9-37); slug uniqueness re-checked (63-68); returns `AdminProduct` + `{message}`.
- DELETE (lines 93-116): returns `{ id }` + `{message}`; records product history first.

### POST /api/admin/products/[id]/variants — `app/api/admin/products/[id]/variants/route.ts:31-69`
- Body (schema lines 9-21): `price` (req, ≥0); optional `color, storage, guarantee,
  compareAtPrice, stock (int ≥0), stockType, barcode, productIdentifier, isDefault, imageId`.
- Setting `isDefault: true` clears other defaults in a transaction (lines 46-54); also sets
  product `hasVariants: true` (line 52).
- Response: `serializeAdminVariant` (`lib/serializers.ts:44-50`) — full `ProductVariant` row
  with `price`/`compareAtPrice` as numbers. Variant fields per `prisma/schema.prisma:387-408`
  (includes `stock: Int`, `stockType: StockType`).

### PATCH/DELETE /api/admin/products/[id]/variants/[variantId] — `app/api/admin/products/[id]/variants/[variantId]/route.ts`
- PATCH (lines 42-79): partial variant schema (lines 9-24); ownership enforced — variant's
  `productId` must match the path `id`, else 404 (`loadOwnedVariant`, lines 34-40).
- DELETE (lines 81-104): returns `{ id: variantId }` + `{message}`.

### POST /api/admin/categories — `app/api/admin/categories/route.ts:23-54`
- Body (schema lines 7-21): `name`, `slug` (req, unique → 409); optional `description,
  parentId, imageUrl, imageAlt, iconUrl, seoTitle, seoDescription, available,
  categoriesMenuShow, topMenuSeparateShow, order`. `level` is computed from parent (lines 39-46).
- Response: the raw Prisma `Category` row (not a custom serializer) + `{message}`.

### PATCH/DELETE /api/admin/categories/[id] — `app/api/admin/categories/[id]/route.ts`
- PATCH (lines 34-77): partial schema (lines 7-24); `parentId: null` resets `level` to 0
  (lines 58-69).
- DELETE (lines 79-99): 409 if the category has children (lines 88-91); else `{id}` + `{message}`.

### POST /api/admin/brands — `app/api/admin/brands/route.ts:19-44`
- Body (schema lines 7-17): `name`, `slug` (req); duplicate name **or** slug → 409 (lines 30-36);
  optional `imageUrl, imageAlt, iconUrl, seoTitle, seoDescription, isActive, order`.
- Response: raw `Brand` row + `{message}`.

### PATCH/DELETE /api/admin/brands/[id] — `app/api/admin/brands/[id]/route.ts`
- PATCH (lines 30-72): partial schema (lines 7-20); name/slug conflict re-checked (47-64).
- DELETE (lines 74-89): `{id}` + `{message}`.

### GET /api/admin/users — `app/api/admin/users/route.ts:7-44`
- Query: `page`, `pageSize`, `role?` (validated against `Role` enum, lines 12-21).
- Response `data`: `sanitizeUser[]` (`lib/auth.ts:43-66`):
  `{ id, role, username, email, firstName, lastName, phoneNumber, phoneVerified, nationalNumber,
  city, shopName, businessLicenseNumber, businessVerified, creditLimit (number),
  creditUsed (number), agentId, isActive, receiveNewsletters, createdAt (ISO), updatedAt (ISO) }`.
  `passwordHash` is stripped. Meta: `{ page, pageSize, total, hasNextPage }` (lines 35-40).

### GET/PATCH /api/admin/users/[id] — `app/api/admin/users/[id]/route.ts`
- GET (lines 23-35): single `SafeUser`.
- PATCH (lines 37-62): body `{ role?, isActive? }` (schema lines 7-13); an admin cannot change
  their own role or deactivate themselves (lines 47-49). Returns `SafeUser` + `{message}`.

### POST /api/admin/coupons — `app/api/admin/coupons/route.ts:37-68`
- Body (schema lines 8-26): `name`, `code` (req, unique → 409), `type` (CouponType enum:
  `PERCENT_BASED | AMOUNT_BASED | SHIPPING_PRICE`, `prisma/schema.prisma:82-86`); optional
  `amount, usageLimitPerCoupon, usageLimitPerUser, startDate, endDate (ISO datetime),
  maxDiscountAmount, minCartPrice, minSuccessfulOrderCount, onlyFirstOrder, paymentMethods
  (string[]), isActive, productIds[], categoryIds[], brandIds[]` (relations connected on create,
  lines 53-62).
- Response: `serializeAdminCoupon` (lines 28-35) — full `Coupon` row with `amount`,
  `maxDiscountAmount`, `minCartPrice` as numbers. `Coupon` fields per
  `prisma/schema.prisma:657-687`.

### PATCH/DELETE /api/admin/coupons/[id] — `app/api/admin/coupons/[id]/route.ts`
- PATCH (lines 45-85): partial schema (lines 8-26); code uniqueness re-checked (60-68); returns
  `AdminCoupon` + `{message}`.
- DELETE (lines 87-102): `{id}` + `{message}`.

### GET /api/admin/reports/summary — `app/api/admin/reports/summary/route.ts:7-32`
- No query params, no body. The 30-day window is **hardcoded** (line 10:
  `Date.now() - 30 * 24 * 60 * 60 * 1000`).
- Response `data` (line 28):
  ```
  {
    periodDays: 30,
    totalOrders: number,      // count of ALL orders in window, every status
    totalRevenue: number,     // sum of totalAmount over ALL orders in window
    byStatus: [{ status: OrderStatus, orderCount: number, revenue: number }]
  }
  ```
- The `groupBy` filters only on `createdAt >= thirtyDaysAgo` (line 14) — canceled, failed and
  reversed orders are **included** in both `totalOrders` and `totalRevenue`.

### PATCH /api/admin/variants/[id]/stock — `app/api/admin/variants/[id]/stock/route.ts:22-56`
- Body (schema lines 9-12): `{ stock: int ≥ 0, reason: string (min 1) }`. Sets absolute stock
  (not a delta). Records product history (lines 42-50).
- Response: `AdminVariant` + `{message}`.

## 3. The five questions

### Q1 — "Orders needing action today"?

**Not from an existing endpoint.** No admin route accepts a date filter of any kind; the only
order filters are `userId` and `status` (`app/api/admin/orders/route.ts:13-14`). The closest
thing that exists is:

```
GET /api/admin/orders?status=PENDING&page=1&pageSize=20
```

(`status` validated at `app/api/admin/orders/route.ts:24-31`). That returns **all** pending
orders ever placed, newest first — not today's. A dashboard that must show "needs action today"
cannot derive it from any current endpoint without client-side date filtering of a full list,
and there is no `createdAt`-range query to make that cheap.

### Q2 — Revenue and order counts for a period?

**Yes, but the period is not configurable.** `GET /api/admin/reports/summary` returns
`{ periodDays: 30, totalOrders, totalRevenue, byStatus: [{ status, orderCount, revenue }] }`
(`app/api/admin/reports/summary/route.ts:28`). The 30-day window is hardcoded
(`app/api/admin/reports/summary/route.ts:10`) — the route reads no query params at all, so
"this week" or "this month" cannot be requested. Two further caveats: revenue is the sum of
`totalAmount` over **all** orders in the window regardless of status (the `groupBy` `where`
clause filters only on `createdAt`, line 14), so canceled/failed/reversed orders count toward
both `totalOrders` and `totalRevenue`; and `byStatus` gives per-status breakdowns the totals
already include.

### Q3 — Stock / low-inventory information?

**Not without a new endpoint.** There is no `GET /api/admin/products` (the collection route is
POST-only, `app/api/admin/products/route.ts:36-71`), so no endpoint returns a product list to
scan for low stock. The data exists in the schema — `Product.stock` / `Product.stockType`
(`prisma/schema.prisma:327-328`) and `ProductVariant.stock` / `ProductVariant.stockType`
(`prisma/schema.prisma:401-402`), and `serializeAdminProduct` / `serializeAdminVariant` expose
them (`lib/serializers.ts:35-50`) — but the only routes that return product or variant shapes
operate on a single known id (PATCH/DELETE by id, variant create under a known product, stock
adjustment on a known variant). Nothing enumerates products or variants, so "show me what is
low" is impossible against the current surface.

### Q4 — Pagination and total-count conventions?

Query params `page` (default 1) and `pageSize` (default 20, max 100), parsed by
`parsePagination` (`lib/http.ts:98-109`). The total travels in the envelope's `meta` as
`{ page, pageSize, total, hasNextPage }` — a sibling of `data`, not a header and not nested in
the payload (e.g. `app/api/admin/orders/route.ts:49-54`,
`app/api/admin/users/route.ts:35-40`). The dashboard should read it via
`apiGetWithMeta` (`lib/api-client.ts:44-59`), which returns `{ data, meta }`. Only the two GET
list routes (orders, users) are paginated; every other route returns a single object or a
fixed-shape summary.

### Q5 — Order status values, and which mean "a human has to do something"?

`OrderStatus` (`prisma/schema.prisma:71-79`):

```
PENDING · PROCESSING · SHIPPING · COMPLETED · CANCELED · FAILED · REVERSED
```

- **Needs a human:** `PENDING` (placed, not yet processed), `PROCESSING` (being prepared),
  `SHIPPING` (in transit — the status route accepts a `trackingCode` alongside the status,
  `app/api/admin/orders/[id]/status/route.ts:10`, so this is the state where dispatch info is
  captured).
- **Terminal / no action:** `COMPLETED` (done), and `CANCELED | FAILED | REVERSED` — the
  `TERMINAL_CANCEL_STATUSES` (`lib/orders.ts:82`), whose transitions trigger restock and
  credit reversal (`lib/orders.ts:96-111`).
- The status PATCH accepts **any** enum value with no transition validation
  (`z.nativeEnum(OrderStatus)`, `app/api/admin/orders/[id]/status/route.ts:9`) — the server
  does not enforce a state machine, so the dashboard cannot rely on it to reject illegal moves.
- Related: `PaymentStatus` is `INITIATED | SENT | COMPLETED | FAILED | REVERSED | EDITED`
  (`prisma/schema.prisma:59-66`), returned as `paymentStatus` on every order summary
  (`lib/orders.ts:41`).

## 4. Files read

`app/api/admin/**` (16 route files, full tree listed in §1) · `lib/api-client.ts` ·
`lib/orders.ts` · `lib/http.ts` · `lib/serializers.ts` · `lib/auth.ts` (`withAuth` +
`sanitizeUser`) · `types/api.ts` · `types/store.ts` · `prisma/schema.prisma` (enums + models).
