# Contract: Shop URL State

**Owner**: `/shop` and the surfaces linking into it | **Date**: 2026-09-23
**Requirements served**: FR-020, FR-021, FR-022, FR-023, FR-024, FR-025, FR-026, FR-027, SC-002

This one documents a requirement that **already passes**, so that band 1 and band 2 do not break the thing
that works. FR-027 is the rare DONE in the ledger: every filter, search, sort and page key lives in the
query string — written by `components/shop/FilterSidebar.tsx:39-45` and `ShopResults.tsx:44-59`, read back
by `ShopClient.tsx:32-34,86-99` from `useSearchParams` only. Verified live on 2026-09-23: filtering by
brand, reloading, paging, and `history.back()` all restore the exact state, and the URL is shareable as a
result set.

## Keys

| Key | Values | Semantics |
|---|---|---|
| `q` | free text, Persian | substring match on `name`, `english_name`, `slug` (`lib/catalog.ts:244-249`) |
| `category` | a category **slug**, Persian, URL-encoded | that category **or anything filed below it**, by `parent_id`. Amended in band 2: see the destination rules below. |
| `brand` | a brand slug | AND-combines with `category` |
| `min`, `max` | integer Toman | see the absent-price rule below |
| `stock` | `purchasable` \| `limited` \| `call` \| `out_of_stock` | `purchasable` is obtainability (the merchant's flag); the other three are shelf states |
| `special` | `1` | `special_offer` true; 11 records |
| `sort` | `price-asc` \| `price-desc` \| `newest` \| `special` | all four have comparators since band 2 (T050); validated by `resolveSortKey()`, so an unknown key is no sort rather than a cast |
| `page` | integer, **omitted at 1** | `:297-304` |

## Rules that MUST survive the rework

1. **The URL is the only state.** No cookie, no `localStorage`, no reducer holds filter state. Adding a
   client-side store for filters would break FR-027 while looking identical in a browser session.
2. **AND semantics across dimensions, OR within one.** `?brand=شیائومی&category=موبایل` narrows; it never
   unions. (`:250-257` — verified, though that particular pair returns 0, which is a taxonomy problem in
   FR-028, not a filter bug.)
3. **A slug that resolves to nothing MUST say so.** `lib/shop-filters.ts:48-61` refuses to silently drop an
   unresolvable slug and `ShopClient.tsx:70-82` surfaces it. This is 004's destination-resolution precedent
   and MUST NOT regress into "no results" or, worse, the whole catalog.
4. **Absent price is never a price.** `priceOf()` maps missing → `0` (`:106-112`). **Amended during band
   2 (2026-09-23):** when a `min` or `max` bound is present, unpriced records are **excluded**. The draft
   said "included unless explicitly excluded", which does not survive contact with a URL a shopper shares —
   an "up to ۵ میلیون" list holding items of unknown price misstates its own bounds. What MUST hold, and
   now does: an unpriced record is never admitted to a numeric range, never sorted as the cheapest item
   (rule 5), and never displayed as «۰» or a bare currency word (FR-003).

5. **Zero-price sorts to the end in both directions** (FR-024). `:264-277` short-circuits `pa<=0`/`pb<=0`
   *before* applying the direction, verified over all 189 rows: the 5 unpriced records land at positions
   184–188 under `price-asc` **and** `price-desc`. Preserve that ordering exactly.
6. **Default ordering is obtainability-first without hiding anything** (FR-025). `:287-294` orders
   purchasable → offer → `updated_at`, and `:240-243` deliberately refuses to use availability as a
   default *filter*. Do not "fix" the 184 unobtainable results by filtering them out.
7. **`page` resets when any other key changes** (`ShopResults.tsx:52-59` does this for `sort`). A filter
   change that leaves the shopper on page 4 of a result set that no longer has 4 pages reads as a broken
   filter.
8. **Applied filters stay visible after the panel closes** (FR-026). Today they do not: on phone the panel
   is a closed sheet and the applied state is a single digit badge — zero elements outside `<aside>` carry
   the active label at 360px. The URL must remain the truth while the chips become the visible layer.

## The gaps band 2 was written to close, and how each now reads

- **Resolved in band 2** (T050): `sort=newest` and `sort=special` had no comparator and returned the
  default order byte for byte. `newest` is `updated_at` descending; `special` is offers-first then recency.
  `updated_at` is the only recency signal the export carries, and there is no popularity or
  curated-placement field anywhere, so no option may claim «محبوب‌ترین».
- **Resolved in band 2** (T049, `research.md` D6): `q` now folds ZWNJ, Persian and Arabic digits and the
  Arabic letter variants (`ي`→`ی`, `ك`→`ک`) on both sides of the comparison, so the measured pairs
  `سیستم‌عامل`/`سیستم عامل`, `۱۰۵`/`105` and `موبايل`/`موبایل` return equal results. No new dependency.

- **Resolved in band 2** (T051): `stock=unlimited` («موجود») matched **0 records**, so the most useful
  availability question was a dead control. `stock=purchasable` («قابل خرید») now reads the merchant's
  own `purchasable` flag, and `unlimited` is *removed* from the option list rather than kept: an option
  that matches nothing today will match something arbitrary the moment the export starts emitting it.
  The four remaining `stock` values are shelf states, and a shelf state is not obtainability — 16 records
  read «موجود محدود» while saying they cannot be sold.
- Band 1's server rendering changes *who reads* these keys (the page component rather than a client hook),
  not *what they mean*. The semantics above are the invariant across that move.

## Contract B — the dedicated destinations (`/categories/<slug>`, `/brands/<slug>`)

FR-029 asked for "a dedicated place, not only through a filter"; T054 created the two routes and T055
repointed every homepage door at them. Their URL surface is deliberately smaller than `/shop`'s.

| Key | Values | Absent means |
|---|---|---|
| `sort` | the `sortOptions` keys, validated against the list in `resolveSortKey()` — an unrecognised value is no sort, never a cast | default order |
| `obtainable` | `1` | the whole destination |

Rules:

- **A category is its subtree, in both places.** `/categories/<slug>` and `/shop?category=<slug>` both
  resolve through `descendantCategoryIds()`, and the number printed beside the name comes from
  `categorySubtreeCounts()`. Band 2 first kept the facet exact, on the reasoning that a filter should mean
  exactly what it says; that was wrong here, because the sidebar's number *is* the doorway's number, so an
  exact filter under a subtree count renders «موبایل و تبلت ۱۳۵» and returns nothing — the export files
  those records under brand-shaped children rather than under the parent. The facet is single-select, so
  the double counting that made exact matching attractive cannot occur. Guarded by
  `tests/unit/band2-seams.test.ts`, which asserts the two surfaces return the same total.
- **A destination's existence is decided by what it covers, not by what a control leaves on screen.**
  `total === 0` against the covered set is a 404 (FR-028's "empty door"); `?obtainable=1` returning
  nothing is an empty state with a link back to the whole destination, because "nothing buyable today" is
  an answer the shopper needs and not a missing page.
- **No pagination parameter.** These pages list what the seam resolves in one pass; a destination that
  grew past that is a different decision, and a dead `page=2` link is exactly the class of defect this
  contract exists to prevent.
- Every control is a link, so the same test as contract A applies: paste the URL into a fresh context and
  the view is identical.

## Verification

`quickstart.md` §3. The sharable-URL test is: open a filtered, paged, sorted `/shop` in one browser, paste
the same URL into a fresh context with no history, and confirm identical results and identical applied
chips.
