# Contracts: back-office dashboard (feature 015)

Three contracts. Anything that violates them is a defect, not a style choice.

---

## C1 — Section contract (what every dashboard section implements)

```ts
type ReadState = "loading" | "real" | "empty" | "unreadable";

type SectionProps<T> = {
  state: ReadState;
  data: T | null;              // null unless state === "real"
  basis: string;               // what the operator sees as the window/source, e.g. «۳۰ روز اخیر»
  onRetry?: () => void;        // required when state can be "unreadable"
};
```

Rules:

1. A section renders **one of four shapes and nothing else.** No fifth "sort of worked" state.
2. `state !== "real"` ⇒ no number, no chart, no row. `empty` and `unreadable` are different messages;
   `unreadable` must offer `onRetry` and retry only itself.
3. `basis` is rendered by the section, not assumed by the page. A figure with no printed basis fails FR-003b.
4. The skeleton shape mirrors the loaded layout (row count and card height), so nothing jumps when data
   arrives — FR-010, no layout shift.
5. Sections are independent fetch units. One failing section must not blank its siblings (this is the defect
   in the current `Promise.all` + single `failed` flag, `DashboardClient.tsx:28-36`).
6. Persian output only: `toFaDigits` for numerals, `formatToman` for money, `formatFaDate` for dates
   (`lib/utils.ts`, `lib/content/order.ts`).

The four sections and their sources:

| Section | Source | Derived value (see `data-model.md`) |
|---|---|---|
| Needs action | `reports/summary.byStatus` + `orders?status=PENDING&pageSize=6` | `needsAction` |
| Takings | `reports/summary` | `paidRevenue`, `avgPaidOrder` |
| Order volume | `reports/summary` | `totalOrders` with its basis printed |
| Newest orders | `GET /api/admin/orders?pageSize=6` via `apiGetWithMeta` | none — raw rows |

## C2 — Vendored-primitive contract (`components/admin/ui/`)

1. Every file begins with the attribution header naming the upstream path and the date, and the modification
   made. No exceptions — this is how the MIT obligation stays discharged as the files drift.
2. Imports resolve only to: `react`, `lucide-react`, `clsx`, `tailwind-merge`, `@/lib/utils`, files under
   `components/admin/ui/`, and `next/link`. **No `ra-core`, no `react-admin`, no `react-router-dom`,
   no `@tanstack/react-query`, no `@radix-ui/*`, no package we do not already have.**
3. Data arrives as props. If upstream used a react-admin hook (`useList`, `useRecordContext`,
   `useDataProvider`), the prop replaces it: `items`, `total`, `page`, `pageSize`, `onPageChange`.
4. Styling uses this repo's tokens only (C4). Upstream class names that reference colours we do not define
   (`bg-background/60` is fine, `bg-primary/10` against a different scale is not) are rewritten, not kept.
5. A primitive we lack is **built here** in `components/admin/ui/`, never added to `components/ui/`
   (another agent's territory) and never pulled from Radix.
6. `npm run typecheck` clean, or the file is not vendored.

## C3 — Shell contract (what the frame guarantees to the eight routes)

1. One destination list (`DESTINATIONS`) feeds every breakpoint. A route may not appear on desktop and be
   missing on mobile, or the reverse.
2. Current-page indication is **never colour alone**: a marker and/or weight changes too, and
   `aria-current="page"` is set.
3. At 360px: no horizontal document overflow, and the primary navigation is reachable without scrolling the
   page.
4. The frame renders `children` inside a content column that pages may not need to re-wrap.
5. `AdminGate` and `AuthProvider` behave exactly as before — this feature changes no auth logic (R5).

## C4 — Token contract

- Colour, radius, shadow, spacing, duration: only names that exist in `tailwind.config.ts` /
  `app/globals.css`. **Zero hex or `rgb()` literals** in admin components (FR-007, SC-003).
- A genuinely missing value is **appended** to the token file — never inlined, never a redefinition of an
  existing token, never a reorder (these files are shared with the storefront and other in-flight work).
- Text contrast ≥ 4.5:1 (≥ 3:1 large), non-text edges ≥ 3:1, measured not assumed (FR-011).

## C5 — Honesty contract (Principle I, no exception path)

- Every figure traces to a route listed in `notes/api-inventory.md`.
- A value that no endpoint returns is **not displayed** — the section is cut instead. (This is what happened
  to the stock-risk card: no `GET /api/admin/products` exists, `products/route.ts:36-71`.)
- A derived value says it is derived. `paidRevenue` is not labelled the same way `totalRevenue` is.
- No fabricated name, number, date or image in any loading, empty or error state.
