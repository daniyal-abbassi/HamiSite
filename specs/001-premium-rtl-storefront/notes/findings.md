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
