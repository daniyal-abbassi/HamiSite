# shadcn-admin-kit — inventory and vendoring decision

**Date**: 2026-10-01 | **Task**: 015-B | **Upstream**: `marmelab/shadcn-admin-kit` @ `main`
(`id: 976731507`, MIT) | **Method**: tarball of `refs/heads/main` fetched to `/tmp`, every
`src/components/admin/*` file read in full.

## Headline

The kit is **not a component library we can vendor**. It is a set of ~83 React files that assume
react-admin's `ra-core` is the ambient runtime — record context, resource context, list context,
i18n, navigation, store, data fetching. Of 83 non-test source files, exactly **6** import no
`ra-core` at all, and of those 6, **3 are non-empty components** (one more is a deprecated
one-liner, two are a theme context that needs a provider we don't have, and one is the barrel).

**The three files the brief asks about — data table, pagination, sidebar — are all `ra-coupled`
and none is vendorable.** Their value is structural, not textual: `data-table.tsx` is 516 lines
of which the ra-core contexts are the load-bearing part. That is recorded below with the exact
coupling per file.

This is the expected outcome, not a failure. The brief's premise — that there is a
presentation-only subset worth copying — turned out to hold for one file.

## Classification buckets

| Bucket | Count | Meaning |
|---|---|---|
| `pure` | 6 | imports only React + `lucide-react` + `cn`/cva + primitives we have |
| `ra-coupled` | 68 | imports `ra-core` / `react-router-dom` / `@tanstack/react-query`, or uses `useList` / `useRecordContext` / `useDataProvider` / `useStore` / `useNavigate` / `useTranslate` |
| `needs-decision` | 9 | coupled only through a thin prop or a single hook replaceable by an explicit prop — coupling named per row |
| **total source** | **83** | |
| (test files) | 21 | `*.spec.tsx` — not vendored, upstream's own vitest suite |
| (barrel) | 1 | `index.ts` |

Raw file list: <https://github.com/marmelab/shadcn-admin-kit/tree/main/src/components/admin>
Per-file source: `https://raw.githubusercontent.com/marmelab/shadcn-admin-kit/main/src/components/admin/<file>`

---

## `pure` — 6 files, no `ra-core` import

| File | LOC | Imports | Verdict |
|---|---|---|---|
| [`spinner.tsx`](https://raw.githubusercontent.com/marmelab/shadcn-admin-kit/main/src/components/admin/spinner.tsx) | 39 | `@/lib/utils`, `cva`, `lucide-react` | **VENDORED** → `components/admin/ui/spinner.tsx` |
| [`ready.tsx`](https://raw.githubusercontent.com/marmelab/shadcn-admin-kit/main/src/components/admin/ready.tsx) | 45 | `lucide-react` only | not vendored — it is upstream's demo splash ("Welcome to shadcn-admin-kit", links to *their* docs/GitHub). It would be a foreign brand on our admin. |
| [`simple-show-layout.tsx`](https://raw.githubusercontent.com/marmelab/shadcn-admin-kit/main/src/components/admin/simple-show-layout.tsx) | 7 | `react` type only | not vendored — deprecated upstream (`@deprecated Use a simple div`), and a `flex flex-col gap-4` div is not worth a file. |
| [`theme-context.ts`](https://raw.githubusercontent.com/marmelab/shadcn-admin-kit/main/src/components/admin/theme-context.ts) | 12 | `react` only | not vendored — a `createContext` with no provider. Useless alone. |
| [`use-theme.ts`](https://raw.githubusercontent.com/marmelab/shadcn-admin-kit/main/src/components/admin/use-theme.ts) | 9 | `react` only | not vendored — consumes the above; both are dead weight without `theme-provider.tsx`, which *is* ra-coupled. |
| [`theme-mode-toggle.tsx`](https://raw.githubusercontent.com/marmelab/shadcn-admin-kit/main/src/components/admin/theme-mode-toggle.tsx) | 51 | `lucide-react`, `@/components/ui/button`, **`@/components/ui/dropdown-menu`**, `cn`, `useTheme` | **BLOCKED** — needs `dropdown-menu`, which we do not have. |

## `ra-coupled` — 68 files

Grouped by what they couple to. "Missing primitive" rows are *also* ra-coupled; listed because
the brief asks for the blocked list, and because several are otherwise attractive.

### Coupled to data / record context (the DataProvider layer we are replacing)

`array-field.tsx` · `reference-array-field.tsx` · `reference-many-field.tsx` ·
`single-field-list.tsx` · `reference-many-count.tsx` · `reference-field.tsx` ·
`record-field.tsx` · `file-field.tsx` · `image-field.tsx` · `boolean-field.tsx` ·
`date-field.tsx` · `number-field.tsx` · `badge-field.tsx` · `email-field.tsx` ·
`url-field.tsx` · `select-field.tsx` · `text-field.tsx` · `count.tsx` ·
`export-button.tsx` · `reference-input.tsx` · `reference-array-input.tsx`

All read records through `useFieldValue` / `useListContext` / `useGetList` / `useReferenceManyFieldController`.
No data layer, no fields.

### Coupled to form state (`react-hook-form` via `useInput`)

`form.tsx` · `simple-form.tsx` · `simple-form-iterator.tsx` · `text-input.tsx` ·
`number-input.tsx` · `date-input.tsx` · `date-time-input.tsx` · `select-input.tsx` ·
`boolean-input.tsx` · `array-input.tsx` · `text-array-input.tsx` · `file-input.tsx` ·
`radio-button-group-input.tsx` · `autocomplete-input.tsx` · `autocomplete-array-input.tsx` ·
`input-helper-text.tsx` · `search-input.tsx`

`useInput` is the react-admin `<Input>` contract (`source`, `choices`, validation, record
context). We do not run react-hook-form. `search-input.tsx` and `file-input.tsx` additionally
need `react-hook-form` / `react-dropzone` as *packages* — both outside the brief's no-install rule.

### Coupled to navigation / routing (`LinkBase`, `useNavigate`, `useCreatePath`)

`list.tsx` · `create.tsx` · `edit.tsx` · `show.tsx` · `create-button.tsx` · `edit-button.tsx` ·
`show-button.tsx` · `delete-button.tsx` · `cancel-button.tsx` · `bulk-delete-button.tsx` ·
`bulk-export-button.tsx` · `bulk-actions-toolbar.tsx` · `authentication.tsx` ·
`export-button.tsx` · `error.tsx` · `admin.tsx`

`LinkBase`/`useNavigate` are react-router's router. The brief's rule 4 (swap to `next/link`)
would in principle handle the link, but each of these also needs `useCreatePath` to *build* a
route from a resource name — a react-admin `Resource` registry concept we do not have. The
rewrite is not mechanical.

### Coupled to the app shell / auth / layout

`layout.tsx` · `app-sidebar.tsx` · `user-menu.tsx` · `locales-menu-button.tsx` ·
`breadcrumb.tsx` · `login-page.tsx` · `not-found.tsx` · `notification.tsx` ·
`theme-provider.tsx` · `loading.tsx` · `admin.tsx`

### The guessers — dynamically resolve their own imports from `dataProvider`

`list-guesser.tsx` · `edit-guesser.tsx` · `show-guesser.tsx` · `guesser-empty.tsx`

These call `dataProvider.getList()` at runtime to discover field shapes, then dynamically
`import()` the matching input component. `dataProvider` is the react-admin object we are
replacing with `lib/api-client.ts`. Not vendorable by any prop change.

---

## `needs-decision` — 9 files

Coupled only through a thin prop or a single hook that an explicit prop could replace.

| File | LOC | The coupling, in one line |
|---|---|---|
| [`list-pagination.tsx`](https://raw.githubusercontent.com/marmelab/shadcn-admin-kit/main/src/components/admin/list-pagination.tsx) | 265 | Reads 8 pagination fields from one hook, `useListPaginationContext()` — a plain `{page, perPage, total, setPage, setPerPage, hasNextPage, hasPreviousPage}` prop would replace it entirely. **Blocked in practice:** needs `@/components/ui/pagination` (130 lines upstream, we have none). |
| [`data-table.tsx`](https://raw.githubusercontent.com/marmelab/shadcn-admin-kit/main/src/components/admin/data-table.tsx) | 516 | 14 ra-core imports across 9 data-table contexts + `useNavigate` + `useStore`. Not a thin coupling — this is a rewrite. |
| [`columns-button.tsx`](https://raw.githubusercontent.com/marmelab/shadcn-admin-kit/main/src/components/admin/columns-button.tsx) | 355 | Column show/hide is state in `useStore`; `useDataTableColumnFilterContext` supplies the list. Needs `popover` + `tooltip` + the `diacritic` package (for Persian label folding). |
| [`sort-button.tsx`](https://raw.githubusercontent.com/marmelab/shadcn-admin-kit/main/src/components/admin/sort-button.tsx) | 162 | Reads `useListSortContext()` — a `{sort, setSort}` prop replaces it. Needs `dropdown-menu` + `tooltip`. |
| [`field-toggle.tsx`](https://raw.githubusercontent.com/marmelab/shadcn-admin-kit/main/src/components/admin/field-toggle.tsx) | 164 | Uses only `FieldTitle` + `useResourceContext()` — both are label rendering, replaceable by passing a `label: ReactNode`. Native-DOM drag reorder, no framework state. Would vendor cleanly. |
| [`saved-queries.tsx`](https://raw.githubusercontent.com/marmelab/shadcn-admin-kit/main/src/components/admin/saved-queries.tsx) | 175 | Uses `useListContext()` + `useSavedQueries()`; persistence is `lodash/isEqual` over a context value. Needs `label` primitive. |
| [`toggle-filter-button.tsx`](https://raw.githubusercontent.com/marmelab/shadcn-admin-kit/main/src/components/admin/toggle-filter-button.tsx) | 92 | Reads filter state from `useFilterContext`; the `lodash/matches` logic is presentational. |
| [`filter-form.tsx`](https://raw.githubusercontent.com/marmelab/shadcn-admin-kit/main/src/components/admin/filter-form.tsx) | 244 | Renders filter inputs from `useFilterContext` + `useListContext`; needs `query-string` + `dropdown-menu`. |
| [`input-helper-text.tsx`](https://raw.githubusercontent.com/marmelab/shadcn-admin-kit/main/src/components/admin/input-helper-text.tsx) | 22 | Only `useTranslate()` for a validation message — the string could be passed in. Coupled to `form.tsx` upstream. |

---

## Blocked on a missing primitive

`components/ui/` here is 11 hand-written files (499 lines): `badge, button, card, dialog,
flip-words, input, select, skeleton, switch, table, textarea`. The kit references 25 primitives.
Missing: **`accordion, alert, avatar, breadcrumb, checkbox, command, drawer, dropdown-menu,
label, pagination, popover, radio-group, separator, sidebar, tooltip`**.

| Blocked file(s) | Missing primitive | Would also need |
|---|---|---|
| `theme-mode-toggle.tsx` | `dropdown-menu` | a theme provider |
| `list-pagination.tsx` | `pagination` | — |
| `columns-button.tsx`, `sort-button.tsx`, `filter-form.tsx`, `locales-menu-button.tsx` | `dropdown-menu`, `tooltip`, `popover` | — |
| `icon-button-with-tooltip.tsx` | `tooltip` | — |
| `breadcrumb.tsx` | `breadcrumb`, `separator`, `drawer` | `useIsMobile` hook |
| `confirm.tsx`, `saved-queries.tsx` | `dialog` (we have one, different API), `label` | — |
| `error.tsx` | `accordion` | `react-error-boundary` package |
| `data-table.tsx` | `checkbox`, `tooltip`, `alert` | the 14 ra-core imports |
| `app-sidebar.tsx` | `sidebar` (722 lines upstream) | the 8 ra-core imports |
| `notification.tsx` | — | `sonner` package |
| `user-menu.tsx` | `avatar`, `dropdown-menu` | `useAuthProvider` |
| `boolean-field.tsx`, `simple-form-iterator.tsx` | `tooltip` | — |
| `array-input.tsx`, `radio-button-group-input.tsx`, `saved-queries.tsx` | `label` | — |
| `autocomplete-input.tsx` | `popover`, `command`, `@base-ui/react` package | — |
| `autocomplete-array-input.tsx` | `command`, `cmdk` package | — |

Note `tooltip` and `checkbox` are the cheapest to unblock (66 and 29 lines upstream) and they
gate the two highest-value files, `data-table.tsx` and `columns-button.tsx`. `pagination` is 130
lines and gates `list-pagination.tsx`. `sidebar` at 722 lines is not worth it — we already have
a working `components/admin/AdminSidebar.tsx` (170 lines) built for our routes.

---

## Value per line — the three files asked about

**None of the three is vendorable.** Ranked by what they are actually worth *if rewritten*:

1. **`data-table.tsx` (516 lines)** — highest value, highest cost. The good part is its shape:
   `DataTable.Col` children describe columns declaratively, `reorderChildren` applies a saved
   rank array, and the head/cell split keeps sorting in the header. That structure is worth
   rebuilding against our own `Table/THead/TBody/TR/TH/TD` (~40 lines of our own code) with
   `page`/`sort`/`selectedIds` as props. The 14 ra-core contexts would all be deleted, not
   ported. **Recommendation: rebuild, ~150 lines, do not vendor.**

2. **`list-pagination.tsx` (265 lines)** — the page-range math (boundary/sibling counts,
   the two ellipsis branches) is the reusable part and is framework-free. Our existing
   `components/admin/Pagination.tsx` (28 lines, prev/next only, no page numbers, no rows-per-page)
   is the thing to replace. Blocked today on the `pagination` primitive — but that primitive is
   130 lines of unstyled anchors and we could write the numbered-page list directly into our own
   component instead. **Recommendation: port the range math, drop the primitive.**

3. **Sidebar structure** — `app-sidebar.tsx` is 165 lines but 8 of them are ra-core hooks
   (`useResourceDefinitions`, `useCanAccess`, `useCreatePath`, `useMatch`, `LinkBase`,
   `useGetResourceLabel`, `useHasDashboard`, `useTranslate`) — it is *entirely* a resource
   registry rendered as a nav. There is nothing to copy: the visible part is
   `SidebarMenu > SidebarMenuItem > SidebarMenuButton`, which is what our `AdminSidebar.tsx`
   already does against `usePathname`. **Recommendation: do not touch. We already have it.**

List/filter affordances (`columns-button` + `sort-button` + `search-input` + `filter-form`,
883 lines) are all either ra-coupled or blocked on `dropdown-menu`/`popover`/`tooltip`/`command`,
and `search-input` additionally wants `react-hook-form`. **Not worth it** — our
`lib/shop-query.ts` and `lib/listing-view.ts` already own filter state, and re-plumbing them
through react-admin shapes would cost more than it returns.

---

## What landed

`components/admin/ui/spinner.tsx` — one file, 39 lines of source plus a 5-line attribution
header. Imports repointed from `@/lib/utils` (unchanged — the path alias already resolves) and
`class-variance-authority` / `lucide-react` (both already in `package.json`). No ra-core coupling
to remove, because there was none. Not restyled — the `text-primary` / `size-*` classes are
still upstream's shadcn defaults, deliberately, per the brief (restyling is 015-C).

Verified: `npm run typecheck` clean, both before and after the file landed.

### Not vendored, and why, in one line each

- `ready.tsx` — upstream's own branded demo splash; would import a foreign brand into our admin.
- `simple-show-layout.tsx` — deprecated upstream; a `flex flex-col gap-4` div.
- `theme-context.ts` / `use-theme.ts` — a context and its consumer with no provider; dead alone.
- `theme-mode-toggle.tsx` — needs `dropdown-menu`.
- The other 77 source files — ra-coupled, per the table above.