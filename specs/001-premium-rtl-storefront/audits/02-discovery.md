# Audit 2 — Catalog discovery (band: FR-020…029, 041…042, SC-002/008/014)

**Date**: 2026-09-23 | **Method**: static reading plus live HTTP GETs against the then-running dev server on
`localhost:3000` and measured rendered results at 360/768/1440. "Measured" below means measured.

| FR | verdict | evidence |
|---|---|---|
| FR-020 | DONE | `lib/catalog.ts:297-304` slices 189 by page/pageSize and returns `total`; `components/shop/ShopResults.tsx:66` renders it. Measured at 1440: toolbar «۱۸۹ محصول», 12 cards, page nav ۱–۵. ⚠ Delivered through a client fetch to `/api/products` (`ShopClient.tsx:101`), not through the seam directly: `app/(main)/shop/page.tsx:29-31` prerenders `Suspense fallback={null}`, so the served document contains zero products and browsing does require an API round-trip (Principle III breach, not an FR-020 gap). |
| FR-021 | DONE | `lib/catalog.ts:250-257` filters `brandId` and `categoryId` (main **or** secondary category) independently, so both together AND-combine; `components/shop/FilterSidebar.tsx:89-94,122-126` writes both without clearing either. Measured: `?brand=شیائومی` → «۳۰ محصول»; `?brand=شیائومی&category=موبایل` → 0 (correct AND semantics, but see FR-028 for the taxonomy cause). Slug→id resolution never silently drops (`lib/shop-filters.ts:48-61`, surfaced at `ShopClient.tsx:70-82`). |
| FR-022 | PARTIAL | Price range and on-offer are real (`lib/catalog.ts:258-261`, `FilterSidebar.tsx:207-220`; measured `special=1` → 11 records). Missing: availability narrowing is by `stockType`, not obtainability (`lib/catalog.ts:258`, `lib/content/shop.ts:12-18`) — «موجود» (`unlimited`) matches **0** records, a dead control, and «موجود محدود» returns 21 of which only 5 are purchasable. A shopper can never ask "what can actually be bought". Side effect of `priceOf()` treating no-price as 0 (`:106-112`): any `min` silently deletes the 5 call-for-price rows, any `max` silently admits them (measured `min=100000` → 183). |
| FR-023 | PARTIAL | Persian name search works by substring (`lib/catalog.ts:244-249`): measured `شیائومی`→30, `هدفون`→9, `redmi`→20, `airpods`→3. Missing: **no Persian normalisation at all** — ZWNJ not folded (`سیستم‌عامل`→2 vs `سیستم عامل`→0); Persian digits not folded (`۱۰۵`→0 vs `105`→2, while FR-011 *forces* the UI to display ۱۰۵); Arabic ي/ك not folded (`موبايل`→0 vs `موبایل`→133). No `Intl.Collator` or `normalize()` in the search path; `normalizeSlug` strips punctuation for slugs only, never for `q`. |
| FR-024 | PARTIAL | The zero-price rule is genuinely correct in **both** directions: `lib/catalog.ts:264-277` short-circuits `pa<=0`/`pb<=0` before applying `dir`. Measured over all 189 rows: the 5 unpriced records occupy positions 184-188 under `price-asc` **and** `price-desc`. Missing: `newest` and `featured` have **no comparator** — `:264` branches only on the two price keys, so everything else falls into the default buyable-first block (`:279-295`) and `sort=newest`/`sort=special` return the identical list to no sort (measured: same first 3 records in all three), while `lib/content/shop.ts:4,7` still advertises them. |
| FR-025 | DONE | `lib/catalog.ts:287-294` orders purchasable → offer → `updated_at`, and `:240-243` deliberately refuses availability as a default filter. Measured: `?pageSize=7` returns exactly the 5 `available=true` records first, then `out_of_stock`, with `total` still 189 and the UI reading «۱۸۹ محصول». |
| FR-026 | PARTIAL | Clear-all works (`FilterSidebar.tsx:223-233` deletes all 7 keys; measured «۳۰»→«۱۸۹ محصول»). Missing: no applied-filter control outside the panel — measured at 360 with a brand active, **zero** elements outside `<aside>` carry the active label, and the panel is `hidden lg:block` / a closed sheet on phone (`FilterSheet.tsx:83-107`) where the applied state is a single digit badge. Price range appears only as raw `<input>` values (`:157-177`). |
| FR-027 | DONE | Every key lives in the query string — written by `FilterSidebar.tsx:39-45` and `ShopResults.tsx:44-59` via `router.push`, read by `ShopClient.tsx:32-34,86-99` from `useSearchParams` only. Measured: click brand → `?brand=%D8%B4%DB%8C%D8%A7%D8%A6%D9%88%D9%85%DB%8C`; reload → still «۳۰ محصول» with the chip `aria-pressed=true`; `page=2` then `history.back()` → page 1 restored with the filter intact. Only the grid/list toggle is React state (`ShopResults.tsx:39`) and is not filter state. |
| FR-028 | PARTIAL | Curated + counted **on the homepage only**: `components/home/BrandRows.tsx:82` prints per-brand counts from `lib/brand-counts.ts` (6 rows, all resolving, asserted by `tests/unit/brand-reachability.test.ts`); `CategoryCarousel.tsx:286-288` prints a count on 6 of 9 departments and stays silent where the route is a subset (`lib/category-departments.ts:137`); both refuse empty doors (`:121-126` throws, `lib/shop-category-tiles.ts:21-27` filters). Missing: the shop page's own entry points are the undifferentiated list the spec warns about — `FilterSidebar.tsx:47` is a blind `slice(0,8)` of roots (3 empty) and `:115` a blind `slice(0,12)` of brands, and **no chip or tile anywhere carries a count** (`CategoryTiles.tsx:29-50` renders the name only). A second, incompatible category vocabulary runs beside 005's: «موبایل» (8) / «گوشی موبایل» / «موبایل و تبلت» (0) are three doors for one department. |
| FR-029 | **MISSING** | No dedicated route exists. `find app -type d` yields only `(main)/shop`, `(main)/shop/[slug]`, `(main)/{cart,checkout,login,register,orders,order/[id],partners}` — no `brands/`, no `categories/`. Measured HTTP: `/brands` 404, `/brands/xiaomi` 404, `/categories` 404, `/category` 404. Every brand and category destination in the repo, including 004's rows and 005's panels, is a query-string filter (`lib/content/home.ts:165`, `lib/category-departments.ts:133`) — precisely "only through a filter". |
| FR-041 | PARTIAL | Measured clean on the two discovery surfaces at 360×800, 768×900 and 1440×900 (unfiltered, `?brand=`, `page=2`, filter sheet open): `documentElement.scrollWidth == clientWidth` in every case, and with `body{overflow-x:hidden}` temporarily neutralised the only element crossing the edge is a decorative `span.pointer-events-none.-start-16` already inside an `overflow-hidden` ancestor; `scrollTo(200,0)` leaves `scrollX=0`. Missing: the guarantee is partly a **clip**, not a composition (`app/globals.css:132`), and the remaining surfaces (product page at 360, ordering states) were not measured while the FR binds every surface. |
| FR-042 | PARTIAL | Chrome mounts once for the buying path (`app/(main)/layout.tsx:30,38`) and destinations match: measured at 360 the dock carries `/`, `/shop`, `/cart`, `/partners`, `/login|/orders` (`MobileDock.tsx:55-68`) while desktop nav items are `/`, `/shop`, `/partners` (`Header.tsx:15-17,111-112`), and header search + cart exist at both widths. Missing: `UserMenu` — the only shopper-facing sign-out — is `hidden … md:flex` (`Header.tsx:137`), so a signed-in phone shopper reaches `/orders` but can never log out; `components/layout/MobileNav.tsx` is a complete slide-over nav that no file imports. |
| SC-002 | DONE | "a Xiaomi phone" measured from the rendered homepage document: **1 interaction** — `BrandRows.tsx:73` row link → `/shop?brand=شیائومی` → «۳۰ محصول». Worst legitimate path is at the limit: dock «فروشگاه» → sheet trigger → brand chip = 3. ⚠ Two caveats survive the pass: `CategoryCarousel.tsx:260-268` `preventDefault()`s the first press on any non-active panel, so every category door costs 2 presses (and contradicts 004's own ruling recorded at `BrandRows.tsx:16-21`); and the narrower goal "Xiaomi **phones**" is unreachable — `brand+category=موبایل` returns 0. |
| SC-008 | DONE | Measured at 360/768/1440 on `/shop`, filtered, paged, with the open sheet (panel exactly 360px wide, `right:360`) and on `/`: no unclipped element crosses the edge and `scrollX` cannot leave 0. Same "method is a clip" caveat as FR-041. |
| SC-014 | PARTIAL | Every catalog door that ships resolves: all 9 `categoryDepartments` hrefs, 6 `BrandRows` hrefs, 6 shop tiles and 12 brand chips resolved to real ids with >0 products; `listBrands` emits only `product_count>0` (`lib/catalog.ts:318-322`); 18 breadcrumb slugs from product pages all resolve to populated categories. Missing: the footer, rendered on **every** page, ships 3 links to routes that do not exist, and one of the 5 availability options in the same filter panel leads to an empty listing. |

## Routes that exist (shopper-facing)

`/` 200 · `/shop` 200 · `/shop/[slug]` 200 — **note**: an unknown slug returns **200**, not 404;
`app/(main)/shop/[slug]/page.tsx` never calls `notFound()`, and the message comes from
`components/shop/ProductDetail.tsx:168-187`, which conflates "not found" with "fetch failed".
`/cart` · `/checkout` · `/login` · `/register` · `/orders` · `/order/[id]` · `/partners`.

Absent: `/brands`, `/brands/[slug]`, `/categories`, `/category/[slug]`, `/about`, `/contact`,
`/my-orders`, `/search`, `/account`, `/blog`. **No `app/not-found.tsx` exists**, so unknown URLs render
Next's stock page with no storefront chrome. Admin lives under `app/(admin)/admin/*`.

## Dead doors (7)

| where | destination | result |
|---|---|---|
| `components/layout/Footer.tsx:22` | `/about` | 404, on every page |
| `components/layout/Footer.tsx:23` | `/contact` | 404, on every page |
| `components/layout/Footer.tsx:31` | `/my-orders` | 404 — the real route is `/orders` |
| `components/shop/FilterSidebar.tsx:47` (`slice(0,8)`, no stock guard) | `?category=موبایل-و-تبلت` | 0 products |
| same line | «لوازم جانبی» | 0 products |
| same line | «لوازم جانبی لپ تاپ» | 0 products |
| `lib/content/shop.ts:14` + `FilterSidebar.tsx:198-202` | `stock=unlimited` («موجود») | 0 products |

Near-misses that misrepresent rather than empty: `ShopBanner.tsx:57` «مشاهده موبایلها», the
`CategoryCarousel` phone panel and `CategoryTiles` «موبایل» all land on **8 of 134** phones
(`lib/category-departments.ts:60` — `kindTotal` 134 vs `reachableCount` 8). Two of the 15 populated brands
(`ترانیو-tranyoo`, `COMTEL`) are unreachable from any UI because of `FilterSidebar.tsx:115`'s `slice(0,12)`,
and 11 populated categories are unreachable *as categories*, including `آیفون-استوک` at 45 records
(reachable only via brand `اپل`). `lib/content/home.ts:57-64` (`categoryMosaic`) and `:147-162`
(`brandWall`) are orphan data — no mounted component reads them.

## State location

- URL query string: `category`, `brand`, `q`, `min`, `max`, `stock`, `special` (written at
  `FilterSidebar.tsx:39-45`, read at `ShopClient.tsx:32-34,86-96`); `sort` (`ShopResults.tsx:52-59`);
  `page` (`:44-50`, omitted at 1).
- Server owns none of it: `app/(main)/shop/page.tsx:13` accepts no `searchParams`, so first paint is
  `Suspense fallback={null}` and the whole state is reconstructed client-side after `/api/categories` and
  `/api/brands` resolve (`ShopClient.tsx:39-52`).
- React state only: grid/list toggle (`ShopResults.tsx:39`), filter-sheet open (`FilterSheet.tsx:52`),
  brand-row emphasis (`BrandRows.tsx:29`), carousel index (`CategoryCarousel.tsx:240`) — none of them
  filter state, so FR-027 is unaffected.
- Nowhere: no cookie, no `localStorage`, no reducer. Nothing survives outside the URL, which is why
  FR-027 passes.
