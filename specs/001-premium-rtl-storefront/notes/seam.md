# The seam — band 1

**Task**: `tasks.md` T043 | **Date**: 2026-09-23 | **Instrument**: `curl` against `next dev` on
`localhost:3000`, read against the **served bytes** — not the hydrated DOM. That distinction is the whole
point of the check.

## What was broken

Constitution III: *"Browsing MUST NOT require a database connection or an API round-trip."* Every shopper
surface breached it. `app/(main)/shop/page.tsx` accepted no `searchParams` at all, prerendered
`<Suspense fallback={null}>`, and `ShopClient` fetched `/api/products`, `/api/categories` and `/api/brands`
in effects after hydration. The product page fetched `/api/products/[slug]`. Both homepage rails fetched.
The served HTML for a listing of 189 products contained **zero** products.

That is also the boundary where the price defect had hidden: the fetch was typed
`apiGet<ProductDetail>` against a shape the seam had already changed, so TypeScript had nothing to check
(`research.md` D1).

## What changed

| File | Now |
|---|---|
| `lib/shop-query.ts` | new — `buildShopView(searchParams)` resolves filters and queries the seam on the server |
| `lib/home-rails.ts` | new — the two homepage rails' queries, same parameters, server-side |
| `lib/catalog.ts` | `countProductsByKind()` and `catalogGeneratedAt()` exported; variant compare-at gated |
| `app/(main)/shop/page.tsx` | async, reads `searchParams`, passes a `ShopView` down |
| `components/shop/ShopClient.tsx` | no effects, no fetches — tiles, sheet and results only |
| `app/(main)/shop/[slug]/page.tsx` | reads the product through the seam, `notFound()` when absent |
| `components/shop/ProductDetail.tsx` | takes the record as a prop; no fetch, no loading state, no payment-term refetch |
| `app/(main)/page.tsx` | async, hands both rails their products |
| `components/home/FeaturedProducts.tsx`, `NewArrivals.tsx` | props, not fetches; the unreachable skeleton and error branches removed |

## The evidence

```text
/shop                       -> product links in served HTML: 24   (was 0)
/shop?brand=شیائومی         -> product links in served HTML: 24   (was 0)
/                           -> product links in served HTML: 24   (was 0)
/shop/<real product>        -> «تومان» in served HTML: 2, «قیمت فروشگاه»: 0
/shop/<unknown slug>        -> HTTP 404 (was 200 with a client-rendered "not found")
as-of disclosure            -> «به تاریخ …» present in the served product page
```

Browser pass, headed Chromium 1280×900, no page errors on any surface:

- hydration intact — 12 cards and «۱۸۹ محصول» after the server render, `lenis` still on `<html>` (the
  002 easing survived the restructure untouched);
- `?brand=شیائومی` → «۳۰ محصول», chip `aria-pressed="true"`, so the URL contract still drives results now
  that a server component reads it;
- `?brand=شیائومی&category=هدفون-…` → «۰ محصول» — AND semantics preserved, honestly empty;
- «حذف همه فیلترها» → URL cleared, «۱۸۹ محصول» restored;
- `End` key scrolls the document, i.e. nothing captured the keyboard through the new render path.

## One check that misreported, recorded rather than deleted

The first pass clicked «حذف همه فیلترها» with `force: true` on an element matched by `button:has-text(…)`
and concluded clear-all was broken. It was not: the locator had matched a non-visible instance and the
forced click reached no handler. Re-run against the visible control, it works. The lesson is about the
instrument — a forced click on a hidden element produces a confident false negative, and "the code looked
fine" is not what made it pass the second time.

## Contract test against a deliberately wrong field name — measured, and one half of it is not what I expected

I reverted `ProductDetail.tsx` to the exact broken read (`selectedVariant.unitPrice`) and ran both guards
against it, then restored the file.

- **`tsc --noEmit` fails, precisely:**
  `ProductDetail.tsx(175,50): error TS2339: Property 'unitPrice' does not exist on type '{ … price: number;
  compareAtPrice: number | null; … quoted: { … } }'`. The declared type is what catches the defect, which
  is the whole of T042: removing the `apiGet<ProductDetail>` cast is what gave TypeScript something to
  check.
- **`tests/unit/catalog-seam-shape.test.ts` still passed (4/4), and that is correct, not a gap.** It asserts
  what the seam *emits* — including that no variant carries a phantom `unitPrice` alias. A component
  reading a key that does not exist is invisible to a test that only inspects the data. The runtime guard
  for the emitted contract is valuable on its own terms (it catches a rename, a dropped field, or someone
  re-adding the alias to make a bad read "work"); the read is the type checker's job.

Stated plainly because the tempting summary was "the test catches it too", and it does not.

## What band 1 fixed on the way, and what it did not

**Fixed**: `lib/category-departments.ts` no longer throws when a slug stops resolving or a category empties
— it drops that panel and logs. The intent (004's no-dead-doors rule) is unchanged; the blast radius was
wrong, because the function runs on the homepage render path for every visitor and one emptied category
would have taken the whole page down. `kindTotal` is now counted from the export at request time via
`countProductsByKind()`, and `showsCount` derives from that, so no display rule compares against a number
typed on 2026-09-09 (FR-053). Both drift tests (`category-departments.test.ts`, `product-images.test.ts`)
stopped restating `189`/`9`/`[8,134]`/`["347 اپل آیدی"]` and now derive the same properties from the export
— which is what makes SC-005 re-verifiable after a refresh instead of needing an edit.

**Not fixed, and not pretend-fixed**: `lib/home-rails.ts` states plainly that «تازه‌ها» is still not a
recency feed — `serializeProduct` emits no `updatedAt`, so there is nothing to sort on this side of the
seam, and the default order leads with purchasable items. T050 in band 2 owns that comparator. Inventing a
date field to make the label true here would have been the same class of error band 0 exists to remove.
The two featured tabs also still return identical lists for the same reason.
