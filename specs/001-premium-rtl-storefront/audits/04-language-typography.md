# Audit 4 — Language, direction, numerals, typography (band: FR-009…013, 057…064, SC-007)

**Date**: 2026-09-23 | **Method**: static reading only — no state mutated, no test executed. This band's
rules were added 2026-09-20 after an audit of the installed Persian references found them as real defects;
the question here was whether they are fixed now. Mostly they are not.

| FR | verdict | evidence |
|---|---|---|
| FR-009 | PARTIAL | `app/layout.tsx:67` — a single root `<html lang="fa" dir="rtl">`; no page or nested layout overrides it (`app/(main)/layout.tsx`, `app/(admin)/layout.tsx`); `dir="ltr"` appears only on identifier islands (`ProductCard.tsx:142`, `Footer.tsx:77`, `lib/content/partners.ts:28-46`). Missing: no `app/not-found.tsx`, `error.tsx` or `global-error.tsx` exists anywhere, so unmatched URLs and error states have no authored fa/rtl presentation. |
| FR-010 | **DONE** | Zero hits for `ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right`, `border-l/r-`, `rounded-l/r-`, `direction:`; logical utilities used instead (24 `ms-/me-/ps-/pe-`, 32 `text-start/text-end`, `border-s`/`border-e`, `start-`/`end-` insets). No `rtl:` variants and no `[dir=rtl]` compensating rule anywhere, so no per-screen override exists. This is the band's clean pass. |
| FR-011 / SC-007 | CONTRADICTS SPEC | Helpers exist and are used (`lib/utils.ts:9` `formatToman` → `toLocaleString("fa-IR")`, `:16` `toFaDigits`, ~24 `toLocaleString("fa-IR")` sites), but the same homepage shows both systems: `components/home/TrustBar.tsx:42` renders `String(index + 1).padStart(2,"0")` ("01"–"04") while `components/home/TrustBento.tsx:85` renders `toFaDigits(...)` on the same page; `ProductCard.tsx:186` renders `−{off}٪` from a raw number (`lib/product-identity.ts:239`) beside the Persian-digit price at `:213`. |
| FR-012 | PARTIAL | Descriptive labels are the norm (`ProductDetail.tsx:375` «افزودن به سبد خرید», `CheckoutClient.tsx:491` «ثبت نهایی سفارش», `FilterSidebar.tsx:230` «حذف همه فیلترها», `ShopResults.tsx:130` «تلاش دوباره»). Missing: bare generic verbs in admin — «افزودن» (`admin/products/VariantsManager.tsx:322`), «ایجاد» (`admin/brands/BrandsAdminClient.tsx:167`, `admin/categories/CategoriesAdminClient.tsx:219`) — and a bare «مشاهده» at `ShopBanner.tsx:95`. |
| FR-013 | PARTIAL | Correct: `CategoryCarousel.tsx:304-315` prev=`ChevronRight`/next=`ChevronLeft` with keyboard mapped reading-first at `:204-208` (documented `:196`) and Embla `direction:"rtl"` at `:64`; `NewArrivals.tsx:22,81`; `ShopResults.tsx:192,217`; `ui/CardSwap.tsx:169-171` flips `dirSign` on `document.documentElement.dir`; drawers slide from their own edge (`tailwind.config.ts:153-162`). Wrong: back-links point forward for an RTL reader — «بازگشت به…» paired with `ArrowLeft` at `admin/orders/OrdersAdminClient.tsx:131` and `OrderAdminDetailClient.tsx:265`. `BrandRows.tsx` uses only `ChevronDown` (`:101`), direction-neutral. |
| FR-057 | CONTRADICTS SPEC | Fixed **only** inside the two newest carousels: `app/(main)/home.css:291-307` carries an explicit "001/FR-057" comment zeroing `letter-spacing` on the Persian brand label, and `components/home/category-carousel.css:136` zeroes the Persian panel label. Everywhere else tracking persists on Persian — `app/globals.css:611` `.eyebrow { letter-spacing: 0.08em }` sits on 6 Persian eyebrows (`app/(main)/page.tsx:68`, `NewArrivals.tsx:58`, `FeaturedProducts.tsx:110`, `TrustBento.tsx:36`, `StoreExperience.tsx:18`, `B2bSection.tsx:23`); every `<h1>`/`<h2>` carries `tracking-tight` = −0.025em (`page.tsx:78`, `checkout/page.tsx:18`, `shop/page.tsx:24`, `Header.tsx:106`, `SectionHead.tsx:63,88,103,122`); positive tracking on Persian labels at `ProductDetail.tsx:297,309,321,416` and `ProductCard.tsx:135` (0.18em on the Persian brand name). |
| FR-058 | PARTIAL | «ثبت‌نام» correct at all 10 sites; zero broken «می شود»/«میشود»/«ثبت نام» forms in `app`/`components`/`lib`. Missing: the FR's own example word «جست‌وجو» never occurs — **8 shipped occurrences of «جستجو» without U+200C**, and the count *grew* since the checklist recorded 3: `Header.tsx:127,131,132`, `admin/products/ProductsAdminClient.tsx:66,67,72`, `FilterSidebar.tsx:71,72`. |
| FR-059 | PARTIAL | Register is right in functional copy (`lib/api-error-fa.ts:9-38` short, direct «شما»; `lib/content/partners.ts` labels; `PartnerForm.tsx:301-302`). Worst offenders verbatim: «بهترین قیمت برای» (`app/(main)/page.tsx:86`); «کالای اصل با گارانتی رسمی و قیمتی بی‌رقیب» (`:104-105`); «تأمین و پخش مستقیم معتبرترین برندهای … با تضمین ۱۰۰٪ اصالت» (`Footer.tsx:62`); «ویترین رسمی برندهای برتر» (`StoreExperience.tsx:92`); «ضمانت اصالت ۱۰۰٪» (`ProductDetail.tsx:257`); «انتخاب‌های بی‌نهایت.» (`BrandShowcase.tsx:50`). Padding constructions standing in for a fact: «اطلاعات لازم متناسب با درخواست شما روشن و با شما هماهنگ می‌شود» (`lib/content/home.ts:211`), «…به‌صورت شفاف مشخص می‌شود» (`:212`), «مسیر حضوری نیز … در دسترس است» (`:220`). Machine tell: `lib/api-error-fa.ts:26` returns the identical string in both branches of a ternary. |
| FR-060 | **DONE** | No transliterated actions anywhere («لاگین», «ادیت», «دیلیت», «کنسل», «سیو» = 0 hits). The three terms are distinct and correct: save «ذخیره تغییرات» (`admin/products/ProductForm.tsx:487`) / «ذخیره» (`VariantsManager.tsx:322`); sending an order «ثبت نهایی سفارش» (`CheckoutClient.tsx:491`); cancelling «انصراف» for forms (`ProductForm.tsx:490`, `CategoriesAdminClient.tsx:216`) with «لغو» reserved for the order state (`lib/content/order.ts:7` «لغو شده»). Auth vocabulary established: «ورود»/«خروج»/«ثبت‌نام» (`UserMenu.tsx:22,51`, `AdminSidebar.tsx:86`). Nearest stray: the English word "Track" inside the confirmation chip `PartnerForm.tsx:304`. |
| FR-061 | **DONE** | `lib/content/order.ts:58` `toLocaleDateString("fa-IR")`; `:65` date+time in fa-IR. Every shopper-facing date imports them (`OrderDetailClient.tsx:117,236`, `OrdersListClient.tsx:103`, `OrdersAdminClient.tsx:109`, `OrderAdminDetailClient.tsx:98,248`, `UsersAdminClient.tsx:139`, `DashboardClient.tsx:127`). No hand-rolled conversion: the only date arithmetic in `app`/`lib` is `app/api/orders/route.ts:43`, which builds an order number and is never displayed. |
| FR-062 | PARTIAL | Done: `lib/validators.ts:12-17` `toLatinDigits` maps Persian **and** Arabic digits and strips separators before every check; `:48-53` accepts `09…`, `9…`, `+989…`. Missing: the pasted `0098…` form is still rejected (no branch for it); no mobile field advertises an international form (`lib/content/partners.ts:28` and `auth/RegisterForm.tsx:205` placeholders show only «۰۹۱۲…»); and `lib/phone.ts:8-13` normalises no digits at all, so `lib/schemas/auth.ts:16` stores a Persian-digit signup untouched while `app/api/partners/route.ts:33` canonicalises to `+98…`. |
| FR-063 | PARTIAL | Done (negative half): the landline field is never run through the mobile rule — `app/api/partners/route.ts:44` is `z.string().trim().min(7).max(20)` and `PartnerForm.tsx:69` a length check only. Missing: **no fixed-line rule exists anywhere in `lib/`** (0 hits for any landline validator), so `shopPhone` has no shape validation at all and, unlike every sibling field, no `toLatinDigits` transform. |
| FR-064 | PARTIAL | Done for the partner form: `nationalCode`/`postalCode`/`legalNationalId`/`economicCode` are `z.string()` (`app/api/partners/route.ts:38-49`) so leading zeros survive; `dir="ltr"` per field (`lib/content/partners.ts:29,37,44,46`, rendered at `PartnerForm.tsx:154-161`); length in the visible placeholder («۱۰ رقم» `:29`, «۱۱ رقم» `:44`, «۱۲ رقم» `:46`) and restated in each error (`:68,75,76`). Missing: the **checkout** postal-code field meets none of the three — `components/checkout/CheckoutClient.tsx:307-311` label «کد پستی» with no length hint, no `dir="ltr"`, `inputMode="numeric"` only — and it is never validated (`app/api/orders/route.ts:21` `z.string().optional()`). |

## Occurrence counts

**Letter-spacing on Persian — 45 declarations across 31 files** (1 CSS rule + 44 Tailwind classes),
reaching ~50 rendered strings. Most severe first: `.eyebrow` 0.08em (`app/globals.css:611`) on 6 homepage
Persian eyebrows; hero `<h1>` −0.025em (`app/(main)/page.tsx:78`) on «حامی همراه؛ بیست سال اعتماد در بازار
مشهد»; `ProductCard.tsx:135` 0.18em on the Persian brand name, repeating on all 189 cards, and `:213`
−0.02em on the Persian-digit price; `SectionHead.tsx:61,63,81,83,88,103,122` all four archetypes at
0.18–0.2em Persian eyebrows plus −0.025em `<h2>`; `ProductDetail.tsx:297,309,321,416,240,267` 0.1–0.14em on
«حافظه», «رنگ», «نوع تسویه», «برچسب‌ها:», the brand line and the price; `tracking-tight` `<h1>` on
checkout/orders/shop/cart/partner pages and `admin/AdminPageHeader.tsx:12` across 10 admin pages;
`Header.tsx:106` and `Footer.tsx:93,118` on the wordmark; `FilterSidebar.tsx:15` 0.08em on 4 headings;
`cart/CartLine.tsx:61` 0.06em; admin table headers at 0.1em (`ProductsAdminClient.tsx:103`,
`OrdersAdminClient.tsx:90`, `UsersAdminClient.tsx:115`, `StatCard.tsx:26`); Persian inside mixed strings
(`OnlineServices.tsx:54`, `PartnerForm.tsx:387`, `AccessoryUniverse.tsx:70`).

**ZWNJ defects — 8 occurrences in 3 files**, all the same word «جستجو» (`Header.tsx:127,131,132`;
`ProductsAdminClient.tsx:66,67,72`; `FilterSidebar.tsx:71,72`). Correct «جست‌وجو»: 0 occurrences. Two broken
forms also sit in `data/hami-products.json:33297-33298` (merchant description text), surfaced verbatim by
`ProductDetail.tsx:402`.

**Latin digits reaching the DOM — 20 authored interface sites.** `ProductCard.tsx:186` `−{off}٪` on every
discounted card; `TrustBar.tsx:42` ordinals vs `TrustBento.tsx:85` `toFaDigits` on one page; home ordinals
from content (`lib/content/home.ts:180-182,190-193,200,263-265` → `B2bSection.tsx:95`,
`AccessoryUniverse.tsx:48`, `OnlineServices.tsx:32`, `StoreExperience.tsx:74` — 11 Latin "01"-style tokens
where `categoryMosaic:58-63` and `lib/content/partners.ts:11-13` use Persian); `ShopBanner.tsx:24,29`
eyebrows "SHOP / 02", "SHOP / 03" rendered at `:92` beside «۰۰۱» at `:44`;
`PartnerForm.tsx:94-96` `${n} بایت/کیلوبایت/مگابایت` at `:209` for all four upload fields;
`FilterSidebar.tsx:157,170` `type="number"` price inputs; admin numeric inputs
(`ProductForm.tsx:403`, `VariantsManager.tsx:286`, `CouponsAdminClient.tsx:100-104`) and a raw
`variant.id` in an `aria-label` (`VariantsManager.tsx:226`); order identifiers `ORD-YYYYMMDD-####`
(`app/api/orders/route.ts:42-46`) displayed Latin at `OrderDetailClient.tsx:117` and
`OrdersAdminClient.tsx:105`.

**Data inheritance, recorded not proposed for edit.** `data/hami-products.json`: 186 of 189 product `name`s,
148 `specs` and 153 `description_text` interleave Latin digits with Persian («ظرفیت 512 گیگابایت»,
«گارانتی ۱۸ ماهه» style). The interface renders them verbatim at `ProductCard.tsx:152,158,163` and
`ProductDetail.tsx:244,402`, so **no product surface can satisfy SC-007** while `lib/catalog.ts` passes the
strings through untransformed — and transforming a product's own name to satisfy a UI rule is its own
 dishonesty. Escalated as decision 6 in `../quickstart.md` §1. See `research.md` D7.

## Exempt (judged acceptable, with the reason)

`ui/CardSwap.tsx:83,308` and `layout/PillNav.tsx:272` `left-1/2` paired with `-translate-x-1/2` —
symmetric centring, identical in both directions. `home.css:506,515` and `globals.css:876,1138,450`
`right:12%`, `left:50%`, `left:0` — decorative beam, centred glow, star-field origin, 44px hit-area
pseudo-element; no reading-order content. `globals.css:1068-1075` `padding-left/right:
env(safe-area-inset-*)` — safe-area insets are physically defined, no logical equivalent exists.
Latin-only decorative labels (`ShopWindow.tsx:44,88`, `WhyHami.tsx:11,21,29,36,38,62`,
`TrustBento.tsx:80,96,108`, `TrustBlocks.tsx:22`, `StoreExperience.tsx:58,88,105,124`,
`BrandShowcase.tsx:46`, `OnlineServices.tsx:33,35`, `ProductListRow.tsx:31`, `ProductDetail.tsx:223`,
`page.tsx:153`, admin order details, `BrandMarks.tsx:59`) — exempt by FR-057's own Latin clause.
`home.css:433,449` tracking on content that is Latin-only per `WhyHami.tsx:16-41` and `aria-hidden`.
`globals.css:849`, `home.css:251`, `globals.css:240,646` `linear-gradient(to left,…)` — symmetric hairlines.
`ProductCard.tsx:143` `dir="ltr"` + 0.06em on a Latin model code ("Poco X7 Pro") — a deliberate LTR island.
`dir="ltr"` phone/contact islands (`Footer.tsx:77`, `StoreExperience.tsx:136`, `partners/page.tsx:67`) —
required bidi containment. `lib/content/order.ts:5-19` status phrases — standard spaced forms, not ZWNJ
cases. `ui/card.tsx:26` and `ui/table.tsx:46` tracking — those primitives have **no importers**, so neither
reaches the DOM. `(B2B)`/`(B2C)` in metadata and copy — established sector acronyms, not numeral claims.

## Tested

**Pinned**: FR-062 partially (`tests/unit/validators.test.ts:12-19,41-46` — Persian/Arabic normalisation,
`09`/`9`/`+989`; `tests/unit/auth.test.ts:66-69` — `normalizeIranianMobile`, Latin digits only); FR-064
partially (`validators.test.ts:22-71` — national-code checksum including all-same-digit rejection, postal
10, legal 11, economic 12, Persian-digit input); FR-011 in exactly one place
(`tests/unit/brand-reachability.test.ts:44` asserts a `countLabel` equals a `toLocaleString("fa-IR")`
string); FR-058 orthography incidentally at `brand-reachability.test.ts:38`.

**No test at all**: FR-009, FR-010, FR-012, FR-013, FR-057, FR-059, FR-060, FR-061, FR-063 (there is no
landline rule to test), the site-wide SC-007 numeral claim, the checkout postal-code field, and the `0098`
mobile form.
