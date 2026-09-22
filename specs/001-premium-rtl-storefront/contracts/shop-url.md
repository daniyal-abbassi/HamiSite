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
| `category` | a category **slug**, Persian, URL-encoded | main category **or** any secondary (`:250-257`) |
| `brand` | a brand slug | AND-combines with `category` |
| `min`, `max` | integer Toman | see the absent-price rule below |
| `stock` | `unlimited` \| `limited` \| `call` \| `out_of_stock` | **does not mean obtainability** — see FR-022 gap |
| `special` | `1` | `special_offer` true; 11 records |
| `sort` | `price-asc` \| `price-desc` \| `newest` \| `special` | only the two price keys have comparators today |
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
4. **Absent price is never a price.** `priceOf()` maps missing → `0` (`:106-112`), so today any `min`
   silently deletes the 5 call-for-price records and any `max` silently admits them. After band 2 the
   filters MUST treat those 5 as "unpriced": included unless explicitly excluded, and never sorted as the
   cheapest items.
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

## Known gaps this contract does not yet close

- `sort=newest` and `sort=special` have **no comparator**: `:264` branches only on the two price keys, so
  both fall into the default block and return byte-identical lists to no sort at all, while
  `lib/content/shop.ts:4,7` still advertises them in the select. Band 2's fix is a comparator plus removing
  any label the data cannot support.
- `q` has **no Persian normalisation**: `سیستم‌عامل` → 2 results, `سیستم عامل` → 0; `۱۰۵` → 0, `105` → 2;
  `موبايل` → 0, `موبایل` → 133. See `research.md` D6.
- `stock=unlimited` («موجود») matches **0 records** (`lib/content/shop.ts:14`), so the most useful
  availability question a shopper can ask — "what can I actually buy" — is a dead control.
- Band 1's server rendering changes *who reads* these keys (the page component rather than a client hook),
  not *what they mean*. The semantics above are the invariant across that move.

## Verification

`quickstart.md` §3. The sharable-URL test is: open a filtered, paged, sorted `/shop` in one browser, paste
the same URL into a fresh context with no history, and confirm identical results and identical applied
chips.
