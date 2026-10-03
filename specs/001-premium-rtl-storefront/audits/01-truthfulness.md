# Audit 1 — Truthfulness and availability (band: FR-001…008, 037…040, 053…056)

**Date**: 2026-09-23 | **Method**: static reading of shipped code + `data/*.json`. No state mutated, no
tests run. Every path below is relative to the repository root. Verdicts per `contracts/honest-states.md`.

| FR | verdict | evidence |
|---|---|---|
| FR-001 | PARTIAL | Grid/card values trace to records (`lib/catalog.ts:138-219`, `lib/product-identity.ts:232-244`). Missing: the PDP never renders a record price — `components/shop/ProductDetail.tsx:191` reads `selectedVariant.unitPrice`, a key `lib/catalog.ts:165-188` never emits, so `formatToman(NaN)` prints «قیمت فروشگاه» for the 105 variant products and «برای استعلام قیمت تماس بگیرید» for the 84 priced products without variants (`ProductDetail.tsx:262-281`). ~12 non-record claims asserted (warranty/authenticity at `components/shop/ProductCard.tsx:192`, `ProductDetail.tsx:257`, `components/shop/ShopBanner.tsx:54`, `components/home/TrustBento.tsx:100`, `components/home/StoreExperience.tsx:89,94`, `components/layout/Footer.tsx:57,62,69`, `lib/content/home.ts:17`); three non-catalogue images (`ShopBanner.tsx:23-65`, `ShopWindow.tsx:2`); an unverified email (`app/(main)/partners/page.tsx:67-68`); description shipped as raw HTML shown as text (`lib/catalog.ts:195` → `ProductDetail.tsx:398-403`, 147 records contain tags). |
| FR-002 | CONTRADICTS SPEC | Unreadable → «تماس بگیرید» is correct (`lib/catalog.ts:100-104`). But the record's own `purchasable` signal (`:200`) is read by **no** shopper component: 16 records with `state:"limited"`, `purchasable:false` render as «موجود محدود» (`ProductCard.tsx:180`, `lib/content/shop.ts:20-25`) with a live-looking cart control (`ProductCard.tsx:221-231`), and `ProductDetail.tsx:96` treats `limited` as purchasable. `ProductDetail.tsx:94` falls back to `?? "limited"` — a positive state. |
| FR-003 | PARTIAL | Card grid guards it: `priceState()` treats `displayPrice<=0` as unavailable → «تماس بگیرید» (`lib/product-identity.ts:232-236`, `ProductCard.tsx:207-210`). Missing: the list view has no zero guard — `components/shop/ProductListRow.tsx:59` prints `formatToman(0)` = «۰ تومان» for the 5 call-for-price records, one toggle away (`ShopResults.tsx:82-100`). The PDP shows the meaningless «قیمت فروشگاه». |
| FR-004 | PARTIAL | Product level gated twice (`lib/catalog.ts:114-120` drops compare-at unless strictly higher — 57 of 172 dropped — re-checked at `lib/product-identity.ts:239-244`). Missing: the **variant** path is unguarded; `lib/catalog.ts:172` passes raw `v.compare_at_price` and `ProductDetail.tsx:192,264` is its only consumer, while 40 of 311 variants have `compare_at ≤ price` (e.g. product 40 / variant 250: 69,000,000 vs 69,000,000). Latent only because `unitPrice` is currently undefined. Percentage renders a Latin digit next to «٪» (`ProductCard.tsx:186`). |
| FR-005 | PARTIAL | Gallery renders no second view at all (`lib/product-images.ts:69-83`) → no empty affordance. Specs: emitted (`lib/catalog.ts:213`), read by **no** shopper component — the section is "absent" only because it was never built, so the 23-record clause is vacuous while FR-032's 166 go unserved. Description gated (`ProductDetail.tsx:398`) but renders raw HTML. A dead gated block reads `product.analysis`, a key the seam never emits (`ProductDetail.tsx:405`). |
| FR-006 | CONTRADICTS SPEC | Store photography rendered twice: `components/home/ShopWindow.tsx:2,49-57` and `components/home/StoreExperience.tsx:3,39-46`. `ShopWindow.tsx:4-20` documents the file as an AI re-lit derivative of the owner's photo (`shop-original → shop-ai-relight → shop.jpg`), yet it is captioned as the real store (`StoreExperience.tsx:41,60-62`) and badged "MASHHAD FLAGSHIP" (`ShopWindow.tsx:44`). Six logos under `aria-label="برندهای همکار"` (`components/home/BrandTicker.tsx:48`) where only the Redmi/TCH relationships are verified. No certificate imagery or document scans found — that half holds. |
| FR-007 | CONTRADICTS SPEC | `lib/content/contact.ts:14-19` holds only phone + hours and only `Footer.tsx:74-81` and `StoreExperience.tsx:133-139` consume it. But «info@hamihamrah.ir» is being rendered **right now** at `app/(main)/partners/page.tsx:67-68`. No street address renders; the nearest is a venue claim «مشهد • مجتمع تجاری موبایل» (`StoreExperience.tsx:98`) which is not in the verified record. |
| FR-008 | PARTIAL | Real removals exist (`TrustBlocks.tsx:8-15`, `lib/content/home.ts:187-189`, `app/(main)/page.tsx:180-182`). Violations: a proof card whose media is a «تصویر واقعی فروشگاه در انتظار افزودن» slot plus a pending-content note shown to shoppers (`components/home/WhyHami.tsx:7-14,65` + `lib/content/home.ts:221-222`); `ShopBanner.tsx:21-33` advertising «لپ‌تاپ برای کار و بازی» (no laptop kind exists) and linking to `/shop?sort=price-asc`, i.e. the whole catalog under a laptop label; three CSS-composition filler panels with pseudo-English labels (`WhyHami.tsx:16-42`). |
| FR-037 | PARTIAL | Out-of-stock has one disabled «ناموجود» (`ProductDetail.tsx:360-378`, `AddToCartButton.tsx:37-49`) but offers no alternative action. Call state: the card shows an **enabled** add-to-cart (`ProductCard.tsx:109,221-231` tests only `out_of_stock`) and the PDP shows a disabled button mislabelled «ناموجود» (`ProductDetail.tsx:375`) for a record the merchant marked "call". Limited-not-purchasable: enabled cart CTA. Not one unambiguous action per state. |
| FR-038 | PARTIAL | Holds where the code recognises the state («ناموجود» + Ban icon, no order language: `AddToCartButton.tsx:37-49`, `ProductDetail.tsx:375`). Missing: for the 22 records with `purchasable:false` that the code treats as buyable, the CTA and confirmation are order-shaped — «افزودن به سبد خرید» → «به سبد اضافه شد» / «افزوده شد» (`ProductDetail.tsx:367-377`, `AddToCartButton.tsx:80-86`). |
| FR-039 | PARTIAL | Two `tel:` links sitewide (`Footer.tsx:74-81`, `StoreExperience.tsx:133-139`). Missing: no contact action on **any** product surface — the PDP's ask-us line is text plus icon with no number and no link (`ProductDetail.tsx:277-280`); the mobile dock deliberately dropped its «تماس» tab (`MobileDock.tsx:26-30`); the footer's «تماس با ما» points at `/contact`, which has no route (`Footer.tsx:23`). Copyability: the number exists only as Persian digits («۰۹۳۳ ۱۲۱ ۴۰۰۰», `lib/content/contact.ts:16`) and there is no clipboard affordance anywhere in the repo. |
| FR-040 | CONTRADICTS SPEC | Nothing says the capability cannot be honoured. The path looks fully live: cart tab in the dock (`MobileDock.tsx:60`), header cart with count badge (`CartButton.tsx:9-31`), card and PDP CTAs, `/cart` with «خلاصه سفارش» and «ادامه و تسویه حساب» (`components/cart/CartPageClient.tsx:99-122`), `/checkout` headed «تکمیل خرید» with «پرداخت آنلاین از طریق درگاه امن انجام می‌شود» (`app/(main)/checkout/page.tsx:22-26`, `components/checkout/CheckoutClient.tsx:424`) — while `lib/catalog.ts:24-29` records that export ids do not match DB rows and those flows have never been exercised. |
| FR-053 | PARTIAL | Mostly per-record: `priceState`, `stockTypeOf`, runtime brand counts (`lib/brand-counts.ts:18-25`), computed `showsCount` (`lib/category-departments.ts:139`). Violation: `DEPARTMENT_SEED` embeds this snapshot's per-kind totals (134/19/10/7/7/5/3/3/1, `:57-66`) and `showsCount` is derived from them (`:139`), so a display rule is a literal comparison against the 2026-09-09 export. |
| FR-054 | PARTIAL | Composition is availability-agnostic in the common path (purchasable-first without hiding, `lib/catalog.ts:280-295`; labels from a map; no "5 of 189" branch anywhere). Missing: `categoryDepartments()` **throws** when a hand-listed slug resolves to zero products (`lib/category-departments.ts:118-131`), so a refresh that empties one category takes the homepage down; the filter offers «موجود» (`unlimited`) which matches 0 records (`lib/content/shop.ts:14`); rails render fixed 6-slot grids. |
| FR-055 | MISSING | No as-of/currency disclosure exists anywhere. Neither the export date nor `updated_at` (present in data, used only for sorting at `lib/catalog.ts:293`) reaches a surface. The nearest sentence is an empty-state line on one rail: «اما موجودی فروشگاه همچنان در حال به‌روزرسانی است» (`components/home/NewArrivals.tsx:135`). |
| FR-056 | PARTIAL | The seam's own fallback is correct and reasoned (unknown → `call`, `lib/catalog.ts:100-104`). Missing: two positive fallbacks downstream — `ProductDetail.tsx:94` (`?? "limited"`) and `serializeStockType`'s `default: return "limited"` (`lib/serializers.ts:13-26`), which feeds shopper-visible cart labels via `lib/cart.ts:71,81` — and the interpretation itself is wrong (`ProductDetail.tsx:96`, `ProductCard.tsx:221`), so refreshed data could not help. |
| SC-004 | CONTRADICTS SPEC | "Zero fabricated values" is false today: fabricated email; AI-altered store photo presented as the real store; warranty/authenticity/dealership assertions on 10+ surfaces; «۰ تومان» for 5 records; a real price replaced by «قیمت فروشگاه»/«تماس بگیرید» on every PDP; a laptop banner with zero laptops. |
| SC-005 | CONTRADICTS SPEC | 16 records with `purchasable:false` display as obtainable; 6 "call" records carry an enabled cart control; the PDP shows «موجود محدود» with a live CTA while simultaneously printing «حداکثر ۰ عدد در انبار موجود است» (`ProductDetail.tsx:381-385`). The "re-verifiable after refresh without restating totals" half also fails — the tests restate the totals (`tests/unit/product-images.test.ts:79,93`, `tests/unit/category-departments.test.ts:52-57`). |
| SC-011 | UNVERIFIABLE | Needs shopper-initiated phone contacts compared against what was shown. No mechanism: no `tel:` tracking, no call/feedback log, nothing tying a product view to a call. |
| SC-015 | UNVERIFIABLE | No second fixture exists — `data/hami-products.json` is the only catalog, and the tests that could detect a tolerance break assert this snapshot's numbers (`toBe(189)`, `toEqual(["347 اپل آیدی"])`, `KNOWN_SHORTFALLS`). |

## Contradictions, most severe first

1. **No product page shows its price.** `ProductDetail.tsx:191` reads a key the serializer never emits
   (`lib/catalog.ts:165-188` emits `price` and nested `quoted.unitPrice`); `apiGet<ProductDetail>` is an
   unchecked cast, so TypeScript could not see it. Result: «قیمت فروشگاه» for 105 records and «برای استعلام
   قیمت تماس بگیرید» for 84 records that hold prices. The moment of decision, dishonest in both directions.
2. **Store photography, altered, presented as the real store** — forbidden outright by FR-006, and the
   file's own comment documents the AI re-light pass (`ShopWindow.tsx:4-20`, `StoreExperience.tsx:39-46`).
3. **A fabricated email is live** (`app/(main)/partners/page.tsx:67-68`) against a contact module that names
   the phone as the repo's only verified fact.
4. **22 records the merchant cannot sell present as buyable**, because `available` is dropped at the seam
   and never read (`lib/catalog.ts:200`).
5. **The frozen purchase path presents as available** with no disclosure, at every step (FR-040).
6. **Warranty and 100%-authenticity claims on every card, the PDP, the footer and a banner**, plus six
   partner logos — none in FR-006's four facts, and the catalog has no guarantee field at all
   (`lib/catalog.ts:170` hardcodes `guarantee: null`).
7. **«۰ تومان»** in the shop's list view for the five call-for-price records (`ProductListRow.tsx:59`).
8. **Description renders HTML source** as visible text for 147 records.
9. **A laptop doorway and three non-catalogue images** on the shop's first screen.
10. **Recorded specifications are never displayed** — 166 records have them, no component reads `specs`.
11. **«تصویر واقعی فروشگاه در انتظار افزودن»** shown to shoppers, on a page that already uses a store photo twice.
12. Dead footer routes `/about`, `/contact`, `/my-orders` (`Footer.tsx:22,23,31`).

## The placeholder directive vs Principle I

The owner's 2026-09-22 directive is satisfiable and the collision should be owned rather than reconciled.
`resolveProductImage` (`lib/product-images.ts:69-83`) drops `/brand/placeholder-product.webp` into the
exact slot the product's own photograph occupies, same size, `alt={product.name}`
(`ProductCard.tsx:120-127`, `ProductDetail.tsx:228-235`), so nothing on screen marks the absence — the
shopper cannot tell that record 347 has no image. It is *not* a fabricated product claim: one identical
brand-owned tile, never a guess, and it correctly refuses the slow remote hotlink (pinned at
`tests/unit/product-images.test.ts:35-41`). But "missing data MUST stay visibly missing" is not met by any
mechanism in the build. That is a conflict between the constitution and an owner directive, not a code
defect.

## Snapshot coupling

`lib/category-departments.ts:57-66` (`kindTotal` literals), `:118-131` (throw on empty), `:139`
(`showsCount` derived from a literal); `lib/content/home.ts:48-55` (6 category slugs), `:147-162`
(9-brand wall), `:12-18` (5 fixed ticker claims), `:189-194` (4 accessory rows) — hand-authored lists,
resolution guarded by tests but membership snapshot-chosen; `lib/content/shop.ts:14` (`unlimited` matching
0 of 189); `tests/unit/category-departments.test.ts:39-42,52-57`; `tests/unit/product-images.test.ts:79-80,93`;
`tests/unit/brand-resolution.test.ts:159`. Snapshot figures asserted **in prose** where they will silently
rot: `lib/catalog.ts:8,240,284`, `lib/product-images.ts:8`, `lib/shop-filters.ts:7`,
`components/shop/ShopResults.tsx:172`, `app/api/brands/route.ts:9`, `lib/category-departments.ts:11-13`.
No hard-coded "5 purchasable", ratio or threshold exists in component logic — that part of FR-053 is clean.

**Seam note**: shopper browsing is JSON-backed but client-fetched through `/api/*`
(`ProductDetail.tsx:56`, `ShopClient.tsx:39,46,101`, `FeaturedProducts.tsx:83`, `NewArrivals.tsx:30`);
only `generateMetadata` reads `lib/catalog.ts` server-side (`app/(main)/shop/[slug]/page.tsx:9`). No DB is
touched, but Principle III's "must not need an API round-trip" is not met. See `research.md` D2.

## Test coverage

Pinned today: image resolution and the placeholder; brand/category href resolution against the real export
including "no dead doors" (`tests/unit/brand-resolution.test.ts`); stocked root tiles
(`tests/unit/shop-category-tiles.test.ts`); department derivation and label hygiene; brand-row
reachability; validator rules (the FR-062/063/064 band).

**No test exists** for FR-001, 002, 003, 004, 005, 006, 007, 008, 037, 038, 039, 040, 055, 056, SC-004 or
SC-005. The entire honest-interface band is unenforced, and every contradiction above passes CI today.

*Reviewer note recorded by the auditor and honoured*: the suite was deliberately not run, because
`vitest.config.ts:16` registers `tests/setup.ts` globally and that file calls `resetDb()` in
`beforeEach` — so even `npx vitest run tests/unit` truncates the dev database. All test evidence above is
read from source.
