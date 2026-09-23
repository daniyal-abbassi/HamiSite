# Findings — 001

**Feature**: `specs/001-premium-rtl-storefront` | **Method**: every claim below is measured or read, with the
instrument named. Anything inferred says so.

---

## Band 0 — truthfulness (2026-09-23)

**Instruments**: `npx vitest run tests/unit` (170 tests, 18 files, all passing), `npx tsc --noEmit` (clean),
`npm run build` (clean), and headed Chromium at 1280×800 and 360×800 against `next dev`. No frame-rate or
performance claim is made anywhere in this file — the owner's machine is not a benchmark.

### The price defect is fixed, per record class

Read from the live page after the change, not from the code:

| Record class | Before (`audits/03`) | Now |
|---|---|---|
| Variant + priced (Poco X7 Pro) | «قیمت فروشگاه» | **۱۱۵٬۰۰۰٬۰۰۰ تومان** with «۱۱۵٬۴۵۰٬۰۰۰» struck above it |
| No variants, priced (iPhone 16 Pro استوک) | «برای استعلام قیمت تماس بگیرید» | **۱٬۵۰۰٬۰۰۰ تومان** |
| No price at all (Galaxy Buds3 Pro) | «قیمت فروشگاه» | «برای استعلام قیمت تماس بگیرید» + «تماس برای اطلاع از موجودی» — no numeral, no zero |
| Imageless service record (اپل آیدی) | «قیمت فروشگاه» | **۵۰٬۰۰۰ تومان** |

The discount that had never rendered now does, which is the other half of FR-034: the compare-at gate
`compareAtPrice > unitPrice` could never be true against `undefined`.

**One bug the guard tests found that no audit had named**: `formatToman(null)` printed «۰ تومان».
`Number(null)` is `0`, which is finite, so only `undefined` reached the NaN guard — meaning the formatter
itself could emit the exact string FR-003 forbids, for any caller passing null. Fixed in `lib/utils.ts`
with the reasoning written there. `price-state.test.ts` pins it. This is the strongest argument in the
feature for writing the guards before the fixes.

### Availability: the merchant's field finally reaches the UI

`isPurchasable()` in `lib/product-identity.ts` now requires **both** `available === true` **and** an
interpretable obtainable state. The second condition is not decoration: FR-056 requires a state the site has
never seen to fall back to contact rather than to a positive claim, and reading `available` alone would let
a future `stockType: "pre-order"` through as buyable. `obtainability.test.ts` asserts both directions.

Positive defaults removed at all three sites: `ProductDetail.tsx` `?? "limited"` → `?? "call"`;
`lib/serializers.ts` `default: return "limited"` → `"call"`; and `product?.stock`, a key the seam never
emitted, is gone from the quantity line, which is what printed «حداکثر ۰ عدد» beside a live button.

### Verified gone from the rendered page

`document.body.innerText` and element scans at 1280 and 360 confirm: no AI re-lit store photograph anywhere
(`img[src*="shop"], img[src*="store"]` → none), no `MASHHAD FLAGSHIP`/`SHOWROOM` badge, no «تصویر واقعی
فروشگاه در انتظار افزودن», no «گارانتی رسمی», no «ضمانت اصالت», no «تضمین ۱۰۰٪», no «قیمتی بی‌رقیب», no
«بهترین قیمت», no «انتخاب‌های بی‌نهایت», no `برندهای همکار`, no `@hamihamrah`, no «۰ تومان» as a standalone
price on any card, list row or product page. The verified warranty renders on every product page, every
card and the footer, from one module.

### The 404

`/about` (one of three dead footer links) previously rendered Next's framework page. It now returns **HTTP
404** with the real storefront shell — header, footer, mobile dock, Persian, `lang=fa dir=rtl`, no page
errors — and an unknown product slug 404s too, which it previously did not (`page.tsx` never called
`notFound()`).

Worth knowing for whoever reads this after: `app/(main)/not-found.tsx` is **not** consulted for `/about`. An
unmatched URL belongs to no route group, so the first attempt appeared to work in the file tree and rendered
chrome-less anyway. The shipped version is `app/not-found.tsx` composing `AuthProvider`/`CartProvider`/
`Header`/`Footer`/`MobileDock` itself — duplication of `app/(main)/layout.tsx` on one screen, accepted over
a brand-less error page.

### Not browser-verified, and why

- **`/cart` and `/checkout` copy.** Both changed in source (`tsc` + `build` clean) and both remove the
  payment-gateway promise FR-040 and the spec's Out-of-Scope clause forbid. They redirect to `/login`
  without a session, so I could not read the rendered strings. Aggravating factor: the unit suite truncates
  19 tables on every run, so any account that existed is gone — verified separately, this needs an account
  created *after* a test run. **Treat these two as source-verified only.**
- **`isPurchasable` against a refreshed export.** `obtainability.test.ts` covers every record in today's
  snapshot; FR-056's promise is about a data shape nobody has yet. T102's synthetic replay is the real test.
- **P3/P2 re-check timing.** One late script run showed the out-of-stock record with no price and no CTA;
  the same slug had shown `۱٬۵۰۰٬۰۰۰ تومان` and the contact CTA on the run that polled for hydration. That
  was my script not waiting, not a regression — recorded because the weaker measurement is the one that
  would have been quoted.

### What band 0 deliberately did not touch

Cart, checkout, payment and admin logic (Constitution III). `types/store.ts` still describes the pre-seam
shape because `components/admin/products/ProductForm.tsx` reads it; the shopper path now imports the real
one (`CatalogProduct`) instead, so the drift is a compile error there and the back office is untouched.
The wholesale payment-term selector on the product page also stays: it changes a request, and the spec puts
bulk pricing out of scope, so removing it would be a behaviour change in frozen territory.

### Still open inside band 0

**T026** — FR-059's padding constructions survive at `lib/content/home.ts:211,212` («…روشن و با شما هماهنگ
می‌شود», «…به‌صورت شفاف مشخص می‌شود»); the superlatives are gone, the bureaucratic filler is not.
**T033** — the three CSS-composition filler panels at `components/home/WhyHami.tsx:16-42` remain (band 3's
T089 rebuilds or removes the section wholesale). **T002** — the 13-surface baseline is not captured; two
screenshots exist at `/tmp/band0-*.png`, which is not a baseline.


---

## Band 1 — the seam (2026-09-23)

Full record in [`seam.md`](./seam.md). Instruments: `curl` against served bytes, headed Chromium at
1280×900, `tsc --noEmit`, 170 unit tests, `npm run build`. All four clean.

**Constitution III's breach is closed and it is measurable, not asserted**: the served HTML of `/shop`,
of `?brand=شیائومی` and of the homepage each contain 24 product links where they previously contained
**none**; the product page's price is in the served bytes; an unknown slug is a real 404. Browsing no
longer round-trips through `/api/products*` on any shopper surface — the API routes stay for the frozen
cart/checkout/admin consumers.

**The one deviation from the task list, recorded rather than buried.** T042 said to correct
`types/store.ts`; that type is shared with `components/admin/products/ProductForm.tsx`, which reads
`analysis`, `isDigital` and `variant.unitPrice` from it, and the back office is frozen. So the *shopper*
boundary was retyped to the seam's real output instead and the admin file untouched. The obligation
(declared, not asserted) is met and demonstrated: the phantom read now produces `TS2339`. The admin form
still carries the same class of latent defect and is out of scope for 001 — this is the second time in this
feature an audit claim has needed narrowing against what the file actually shares, so it is written here
rather than discovered by the next person.

**Measured and corrected in flight**: I initially wrote that the seam-shape test would also fail on a
deliberate phantom read. It did not — it inspects what the seam emits, not what a component asks for.
The type checker is the guard for the read. The note in `seam.md` states the split instead of the tidier
version I first put down.

**FR-055 landed as one mechanism**, not a badge: `catalogGeneratedAt()` reads the export's own
`generated_at` and `components/shop/DataCurrencyNote.tsx` renders it through
`Intl.DateTimeFormat("fa-IR")` — a Persian (Jalali) date with no hand-rolled calendar, per FR-061 — on the
shop header and the product page's price block.

**Refresh tolerance is now structural rather than hopeful**: `categoryDepartments()` drops and logs instead
of throwing from the homepage render path, `kindTotal` is counted from the export at request time, and the
two drift tests no longer restate `189`, `9`, `[8, 134]` or `["347 اپل آیدی"]` — they derive the same
properties from the same file the seam reads. SC-005's "re-verifiable without restating the totals" is now
true of the tests that grade it.

**Known-inert after this band, and not papered over**: `serializeProduct` emits no `updatedAt`, so the
homepage's «تازه‌ها» heading is still not a recency feed and the two featured tabs still resolve to
identical lists. `lib/home-rails.ts` says so in its own comment. T050 (band 2) owns the comparator.

---

## Band 2 — finishing the shop (2026-09-23)

**Instruments**: `npx vitest run tests/unit` (**192 tests, 19 files, all passing**), `npx tsc --noEmit`
(clean), `npm run build` (clean) and a **production** boot (`next start -p 3100`) curled route by route,
plus headless Chromium at 360/390/768/1280/1440 driven against `next dev`. Every number below was read
off a served page or the export; anything inferred says so. No timing or frame-rate claim appears.

### Principle III still holds in the built output, not just in dev

| Route | product links in the **served HTML** | status |
|---|---|---|
| `/` | 24 | 200 |
| `/shop` | 24 | 200 |
| `/shop?q=شیائومی` | 24 | 200 |
| `/categories/موبایل-و-تبلت` | 120 (60 products × 2 anchors) | 200 |
| `/brands/اپل` | 98 | 200 |
| `/shop/اپل-آیدی` | 0 — no rail, and the breadcrumb is `/categories/…` now | 200 |
| `/no-such-page` | — | **404** |

No `NaN` and no standalone «۰ تومان» anywhere in that output. The zero-price grep that first looked like
a hit was matching `…۰۰۰ تومان` inside real figures; the precise pattern returns nothing, which is
recorded because the sloppy version of the check would have been reported as a pass by accident.

### Two horizontal-overflow defects found by removing the clip, not by trusting it (T060)

`app/globals.css` sets `overflow-x: hidden` on `body`, so a document-level measurement cannot distinguish
composition from clipping. Forcing it to `visible` in the browser and re-measuring found two genuine ones,
both mine from this band:

1. **The gallery's thumbnail strip** was a flex row that never wrapped: 22 thumbs measured **1626px** in a
   360px viewport, 30 thumbs 2202px, and it broke the same way at 768 and 1440 because the desktop column
   is narrower than the row. Fixed by wrapping (`ProductGallery.tsx`), not by scrolling.
2. **The hero's second line** carried `md:whitespace-nowrap`, and at 768px the lead-in plus the widest
   rotating word is 930px of RTL text inside a 576px box — the document reached **929px against a 768
   viewport** and only the clip hid it. Moved to `lg:`; the widest line is now measured to fit at
   360/390/768/1024/1100/1280/1440.

After both fixes, **20 page × width measurements** (`/`, `/shop`, two product pages, a category, a brand,
`/cart`, `/partners` at 360/768/1440) report `document.scrollWidth == viewport` with the clip disabled.
Deliberately off-viewport content (005's carousel panels, the brand ticker, `product-rail` children inside
their own scroller) is excluded by checking each element's ancestor chain for a scroll container, and that
exclusion is the one place this section asks the reader to trust the instrument rather than the number.

### The availability answer is now two questions, told apart on screen (T051, T067)

`quickstart.md` §2's classes were driven one page each at 360px, reading the buy box rather than the
document (an unscoped first pass mistook a related-products card's strike for the product's own):

| Record | price | cart control | what else |
|---|---|---|---|
| 5 Poco X7 Pro (`limited`, purchasable) | ۱۱۵٬۰۰۰٬۰۰۰ | live, «افزودن به سبد» | «حداکثر ۱ عدد در انبار موجود است.» |
| 40 Galaxy A36 (`limited`, **not** purchasable) | ۶۸٬۰۰۰٬۰۰۰ | none; «تماس برای اطلاع از موجودی» + copy | no variant notice (correct: no colour of it is sellable) |
| 15 Redmi Note 14 Pro (no price) | «برای استعلام قیمت تماس بگیرید» **with the number, as a link** | none | sticky bar «تماس بگیرید» |
| 246 Iphone 16 Pro (single view) | ۱٬۵۰۰٬۰۰۰ | none | no dots, no strip, no counter |
| 347 اپل آیدی (no image, no brand, no specs) | ۵۰٬۰۰۰ | none | «بدون تصویر محصول», **no related rail** |
| 138 TCH HD1 (longest name) | ۴٬۲۰۰٬۰۰۰ | none | 24 spec rows, no clipping, page fits at 360 |

Two defects surfaced by that walk and fixed here:

- **A sold-out colour stayed buyable.** Product 5's variants are سبز `stock 1`, مشکی `0`, زرد `0`; picking
  مشکی changed the price to ۱۰۸٬۳۰۰٬۰۰۰ and left a live add-to-cart over a quantity the export says is
  zero. Records 5 and 309 are the only two in the catalogue where a purchasable product has a zero-stock
  variant, and in both the *default* variant is stocked, so this was invisible until something was clicked.
  The control now yields to the call action with a readable reason (`variantSoldOut`), gated on `limited`
  so an untracked zero cannot be read as an emptiness claim.
- **The discount badge printed Latin digits** (`−2٪`) while FR-011 requires Persian. Now `−۲٪`. Measured on
  the page, not in the source.

### Related products, gallery, options (T063, T064, T065)

The rail renders on 13 of 14 walked records (8 cards each) and disappears entirely on 347 «اپل آیدی», the
one record whose category holds no sibling — FR-035's predicate in the seam, FR-005's empty frame absent.
Variant options come from the export's own keys (`رنگ`, and `دامنه`/`سرور`/`نوع` on 347's 18 variants), so
347 now has a selector where it had none, and the invented «حافظه» lookup is gone. Choosing a colour changes
the price and the stock line, which is T066's whole requirement, and no longer resets the gallery index
because no variant in the export carries its own image.

### The category vocabulary is one list now (T056), and it moved a panel's target

`lib/shop-category-tiles.ts` no longer scans roots: the shop page's tiles, the sidebar facet and 005's
carousel are all `categoryDepartments()`. Consequences measured against the export:

- the phone department is `موبایل و تبلت` (**135** reachable) rather than the `موبایل` leaf (**8**) that
  sat beside it on the shop page as a second phone door;
- `ارسال رایگان ویژه`, a promotion, is no longer offered as a category;
- the facet is subtree too, because its own label counts the subtree — an exact filter under a «۱۳۵» label
  returns nothing (see `notes/band2-decisions.md` §3 for the reversal and `contracts/shop-url.md` for the
  rule);
- two departments now *exceed* their kind rather than falling short — `موبایل و تبلت` holds one charger
  (id 311, filed under «داریا باند») and `آداپتور | کابل و شارژر` holds the three car chargers beneath it.
  Both print no count, and `KNOWN_SURPLUS_KINDS` makes a third one a failing test.

### SC-002 (T061)

Task A «a Xiaomi phone»: **3 interactions** by the department door, **2** by search — met.
Task B «the cheapest power bank that is actually available»: **4** from the homepage, **3** from `/shop`,
against a criterion of three — **not met**, and the arithmetic of why is in `notes/discovery.md` with the
three ways to close it, ranked. Before this band the task was not drivable at all.
