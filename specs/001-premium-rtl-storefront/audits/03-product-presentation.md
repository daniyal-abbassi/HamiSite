# Audit 3 — Product presentation (band: FR-030…036, 005, 048, US3, SC-006/010)

**Date**: 2026-09-23 | **Method**: static reading of the shipped components and `data/*.json`. No state
mutated, no tests run.

**The load-bearing defect that drives most verdicts.** `components/shop/ProductDetail.tsx` is written
against the *old Prisma* response shape (`ProductVariantDetail.unitPrice`, `matchedTier`, top-level
`analysis`/`stock`/`isDigital` — `types/store.ts:58-95`), but `/api/products/[slug]` now returns
`lib/catalog.ts::serializeProduct` output (`app/api/products/[slug]/route.ts:8-11`). That serializer emits
`variant.price` and nested `quoted.unitPrice`, no top-level `unitPrice`, no `matchedTier`, no `analysis`.
So `unitPrice = selectedVariant.unitPrice` is `undefined` (`ProductDetail.tsx:191`) →
`formatToman(undefined * qty)` → `Number.isFinite(NaN)` false → the string «قیمت فروشگاه»
(`lib/utils.ts:9-13`). Measured across the catalog: 105 variant products show «قیمت فروشگاه»; the 84
variant-less products, which are all *priced*, fall to the `unitPrice === null` branch and show "call us";
the 5 no-price products (all of which have variants) also show «قیمت فروشگاه».

| FR | verdict | evidence |
|---|---|---|
| FR-030 | PARTIAL | The grid card satisfies all five fields: image `ProductCard.tsx:118-127`, brand `:138`, name `:150-159`, price/«تماس بگیرید» via `priceState` `:202-218`, availability `:180`; the listing default uses the card (`ShopResults.tsx:176-179`). But `ProductListRow.tsx:64` renders `formatToman(displayPrice)` with **no `priceState` guard**, so the 5 no-price records print «۰ تومان» — a price the record does not have. |
| FR-031 | PARTIAL | Only one image is ever rendered (`ProductDetail.tsx:228-235`), resolved **local-only** by `lib/product-images.ts:69-83`, so it genuinely does not depend on the slow remote views and the 56 vs 133 records are treated identically — but the 133 records' extra genuine photographs are never surfaced at all, there is no view-switching UI, and the mandatory "count and current position evident when more than one is shown" clause has no implementation to satisfy. Editorial/premium quality is a Principle IV judgement and not provable statically. |
| FR-032 | CONTRADICTS SPEC | Specifications are never presented: the serializer emits `specs` name/value pairs (`lib/catalog.ts:213`) for 166 records, `ProductDetail.tsx` has no specs block and instead renders `product.analysis` (`:405-411`), a field the catalog never produces → permanently absent. Description renders as **raw HTML markup** — `description_html` (`lib/catalog.ts:195`) shown escaped in `<p>{product.description}</p>` with `whitespace-pre-line` (`:398-402`), so shoppers literally see `<p>…</p>` and `&zwnj;`. The clean `descriptionText` (`:196`) is ignored. |
| FR-033 | PARTIAL | Colour chips render and are functional state for 104/105 variant products (`ProductDetail.tsx:84-87,293-318`, selection via `pickByColor` `:116-123`). **Storage capacities never appear site-wide**: 0 of 311 variants carry a «حافظه» option key, yet `lib/catalog.ts:169` maps exactly that key, so `storages` is always empty. Selecting a colour changes the chip highlight and the stock-limit line (`:352,381-385`) but changes **no readable price** (the price block is broken). Product 347 «اپل آیدی» has 18 variants keyed دامنه/سرور/نوع, so colours and storages are both empty — no selector despite real options existing. |
| FR-034 | CONTRADICTS SPEC | The intended treatment is present (price at `text-3xl font-black` `:267`; struck compare gated on `compareAtPrice > unitPrice` `:264-266`) but `unitPrice` is `undefined`, so the most prominent element after identity is a non-price string, and `number > undefined` is always false so a real discount (e.g. ۱۱۵,۰۰۰,۰۰۰ vs ۵۲,۳۰۰,۰۰۰ per-variant) is never legible. |
| FR-035 | **MISSING** | No related-products section exists on the product page (`app/(main)/shop/[slug]/page.tsx:22-29` mounts only `<ProductDetail>`; the component ends at the sticky bar `ProductDetail.tsx:428-462` with no rail). Home rails are `sort=newest`/`specialOffer` queries (`FeaturedProducts.tsx:73-83`, `NewArrivals.tsx:30`) — recency and promo feeds, not relationship-based recommendations. |
| FR-036 | PARTIAL | No crash for sparse or rich records and absent-field layout holds; but because the price block is broken for **every** record, "renders acceptably" fails universally — the richest priced phone and the imageless service record both show a non-price string. |
| FR-005 | DONE (vacuous in part) | No present-but-empty frames on product surfaces: description gated (`:398`), analysis gated (`:405`), tags gated (`:414`), gallery simply not built so nothing empty. Caveat: "specifications absent" is satisfied only because the specs feature is missing, not because of an empty guard — so the 23-record clause is met while FR-032's 166 are unserved. |
| FR-048 | DONE | Space is reserved without any `placeholder`/`onError`: card `.lux-stage { aspect-ratio: 1 }` (`app/globals.css:915-920`) plus intrinsic `<Image width height>` (`ProductCard.tsx:118-127`); detail `aspect-square` container with `fill` (`ProductDetail.tsx:221-235`); row fixed `w-40` plus intrinsic (`ProductListRow.tsx:11-25`). Because `resolveProductImage` always yields a local file that exists on disk (188 mirrored JPEGs) or the existing `/brand/placeholder-product.webp`, an image cannot fail over the network; the 1 imageless record resolves to the placeholder. |
| US3 #1 | FAIL (detail) / PASS (card) | Card: `formatToman(displayPrice)` plus `٪` only via `discountPercent` when compare is strictly higher (`ProductCard.tsx:202-218`, `lib/product-identity.ts:232-244`). Detail: shows «قیمت فروشگاه», and its gate `compareAtPrice > unitPrice` is always false so genuine discounts never render. |
| US3 #2 | PASS | No false struck price anywhere — every path requires `compareAtPrice > displayPrice`; the detail page never strikes only because its gate is never true. |
| US3 #3 | FAIL | Card reads «تماس بگیرید» correctly. List row shows «۰ تومان» (`ProductListRow.tsx:64`) and the detail page shows «قیمت فروشگاه», so on two of three surfaces no-price does not read as "ask us". |
| US3 #4 | PARTIAL | Chosen colour is unambiguous (`aria-pressed` + highlight, `:134-151,300`) but the storage half never exists and selecting produces no visible price change. |
| US3 #5 | PASS | Specification area absent for no-spec records and the layout reads as finished — though absent for the 166 that have specs too. |
| US3 #6 | FAIL | There is no way to move through multiple views; the 133 multi-photo products show one image with no count or position. |
| US3 #7 | PASS | Single- and multi-image products look identical: no thumbnail row, no dots, no gallery affordance is ever emitted. |
| US3 #8 | PASS (by construction) | No `onError`/`placeholder` handling exists, but every src is a local file or the on-disk placeholder and layout is reserved by `aspect-ratio`, so a picture cannot collapse a frame or show a broken icon. |
| US3 #9 | PASS (with conflation) | Missing slug → API 404 (`app/api/products/[slug]/route.ts:11`); the client catch renders «محصول پیدا نشد» with a retry and a «بازگشت به فروشگاه» link (`ProductDetail.tsx:66-68,168-186`). Caveat: the same `catch` labels **network** failures "product not found", and the page itself returns HTTP 200. |
| SC-006 | PARTIAL / UNVERIFIABLE | Layout holds and no section is presented as populated-while-empty on the card path; long names are `line-clamp-2` (`ProductCard.tsx:156`). No automated render-all sweep exists for the 189 products / 32 categories. The broken price string is the one place a value is rendered that the data does not support. |
| SC-010 | UNVERIFIABLE | No LCP or performance test exists in `tests/`. Listing images load client-side after `/api/products` resolves (`ShopClient.tsx:101`). Remote-host images are effectively **not wired** — `next.config.mjs` allowlists `hamihamrah-shop.com` but `resolveProductImage` returns local paths only (`lib/product-images.ts:78-82`), so the ~2s goal rests on the local mirror, untested. |

## Sparsest record

`id 347`, slug `اپل-آیدی` («Apple ID»), `kind: service`, category خدمات آنلاین — the single record with **no
image at all** (`images: []`, no `primary_image`, absent from `data/catalog-images.json`). Its page renders:
the placeholder in the vitrine (`lib/product-images.ts:82,28`); brand line «—» (`ProductDetail.tsx:241`,
`brand: null`); price block «قیمت فروشگاه» — **not** its real ۵۰٬۰۰۰ Toman and not "call us", because its 18
variants make `selectedVariant` non-null while `unitPrice` is undefined (`:191,262-268`); **no** variant
selector, because its options use دامنه/سرور/نوع keys (`:84-92,293`); no specs (0, and the block does not
exist); description present but as raw markup (`:402`); «ناموجود» dot with a disabled CTA (`:247-250,375`);
no tags row. It does not crash, but it misrepresents price and denies access to its 18 real options.
Worst adjacent case: the 84 **variant-less but priced** products (e.g. `id 368` at ۳۸۵٬۰۰۰ Toman) all
wrongly hit the «برای استعلام قیمت تماس بگیرید» branch.

## Affordances that lie

- Colour chips imply a working selector, but choosing one changes no readable price and there is never a
  storage row even though FR-033 promises capacity choice (`ProductDetail.tsx:293-318`).
- The price block showing «قیمت فروشگاه» implies a price exists or is loading when none is being computed.
- «گارانتی رسمی» on every card (`ProductCard.tsx:191-193`) while the serializer hardcodes `guarantee: null`
  (`lib/catalog.ts:170`).
- «ضمانت اصالت ۱۰۰٪» on every product page (`ProductDetail.tsx:256-258`).
- Quantity stepper and «افزودن به سبد خرید» (`:336-378`) present a real add-to-cart flow while
  `lib/catalog.ts:23-29` documents that export ids will not match DB rows.

## Image pipeline

`resolveProductImage(product)` (`lib/product-images.ts:69-83`): from `product.images` it takes the first
`isDefault && url.startsWith("/")`, else any local `url`, else `PRODUCT_PLACEHOLDER`. The only local URLs
come from `serializeProduct` (`lib/catalog.ts:138-162`), which promotes the mirrored primary from
`data/catalog-images.json` (188 entries → `/images/catalog/<id>.jpg`) to index 0 and leaves secondary
gallery entries on their remote origin URLs — which `resolveProductImage` then rejects as non-local. Net:
188 records render their one mirrored JPEG, 1 renders the placeholder, and the slow remote views
(5.8–7.5s, allowlisted in `next.config.mjs`) are never resolved or rendered anywhere. Render sites: card
intrinsic 720×720, row intrinsic 320×320 in fixed `w-40`, detail `fill` + `priority` in `aspect-square`;
no `placeholder`/`blurDataURL`/`onError` on any of them.
