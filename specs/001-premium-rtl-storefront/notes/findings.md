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

One audit figure needed narrowing while walking these states: `audits/03`'s "40 variants whose compare-at
is not above their price" measures **31** under the rule the seam actually applies (`compare_at_price <= price`
with both non-zero). The 9 extra are variants whose own price is absent, where the comparison is not between
two numbers at all; the strike is dropped for them by the same helper, so the behaviour is unchanged and
only the count in that older document was looser than it looked. The `equal-compare-at` case in the table
above is record 40 at *product* level (compare-at ۶۸٬۴۵۰٬۰۰۰ above a price of ۶۸٬۰۰۰٬۰۰۰ — a real discount,
correctly shown); the variant-level version of that case is asserted by the seam's own per-variant rule in
`lib/catalog.ts:160`, not by eye, because reaching it needs a specific colour selected first.

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

### Band 2 follow-up the same day: SC-002's three ranked fixes, applied and re-measured

The owner's answer to the two asks was "apply the ranked fixes", so T059 was settled for
navigate-on-first-press, 005's FR-010 and contract A2 carry an amendment, and the three fixes landed as
one change set. Re-measured with `verification/sc002-interactions.mjs` against the **production build**,
each step asserting the navigation it claims:

| Task | Before | Now | Path |
|---|---|---|---|
| A — a Xiaomi phone | 3 | **2** | press «گوشی موبایل» → tap the first card (a Poco X7 Pro, heading read back) |
| B — cheapest power bank actually available | 4 from home, 3 from `/shop`, and the criterion is 3 | **3** | press «پاوربانک» → tap «ارزان‌ترینِ قابل خرید ۱» → tap the «پاوربانک کامتل OP18S» card at ۲٬۸۰۰٬۰۰۰ تومان |
| B′ — the same question, from the shelf | not askable | **2** | «همین حالا قابل خرید» → its «مشاهده همه» → a card |

Both tasks end on an open product page, not on "the answer is somewhere on this screen".

Two things worth keeping from how the measurement went wrong first, because both are the failure mode this
feature exists to notice:

- **A click is not a navigation.** The probe's first version counted any step where Playwright reported a
  successful click, so its own output said "task B met in 3" while its third step was still on the category
  page. Every step now waits for the URL to change and reports which one timed out.
- **A fixed sleep is a fake bound.** Against `next dev`, the phone department's 60-card route takes longer
  to compile than 2.5 seconds, so a working first press looked like a dead door — and the earlier
  "no reachable panel" reading came from hit-testing a page the probe had not scrolled, which is a broken
  instrument reporting a broken shop. Polling, plus production, plus letting the driver do the hit-testing
  fixed all three.

Also found and fixed while verifying the new shelf's copy: a destination's description sentence printed
**Latin** digits («6 محصول در دستهٔ پاور بانک.») two lines under a correct Persian count (۶). The sentence
is now one shared, tested function (`destinationDescription`) used by both routes. And `obtainableNowRail()`
is the one rail on the homepage whose heading is an availability claim, so its test pins the predicate
rather than the five records: purchasable **and** priced, cheapest first, the heading's number being the
whole set.

Band 2's checks after all of this: `tsc --noEmit` clean, **205 unit tests / 21 files** passing, `npm run
build` clean, the 20-page × 3-width overflow sweep still fitting with the clip disabled, and the press
contract passing in production.

---

## Band 3 — the design language (2026-09-23, in progress)

Re-captured after this band's edits with `verification/capture-baseline.mjs --tag after`, so every number
below is from the same instrument reading the same twelve surfaces at two widths, against
`manifest-before.json`.

### The strip is measured, and it holds across all 24 captures

`shinyEdge`, `gradText`, `starfield`, `blur3xl`, `blur2xl`, `ping`, `textStroke` and `backdropElements` are
**0 at every width of every surface**. On the homepage at 360 that is 2 shiny edges → 0, 7 gradient-text
elements → 0, 40 elements under a `backdrop-filter` → 0. Two survive: one element with a class containing
`beam` and one with `glow`, both named rather than painted — the sweep counts substrings, and the honest
reading of a count of 1 is "check it", not "it is fine" and not "it is a regression". The page is 1,136px
shorter at 360 (17,520 → 16,384).

Rendered Persian letter-spacing is 0 on the homepage, the product page, and every interior surface. It is
**1 on `/shop` and `/shop/[brand]`**, at both widths, and it is `SHOP / ۰۳` at
`components/shop/ShopBanner.tsx:29` (`tracking-[0.1em]`). Left as-is deliberately: FR-057 forbids tracking
because it pulls *joining strokes* apart, and there is nothing to join in a Latin word followed by two
digits. The unit guard in `tests/unit/persian-typography.test.ts` scopes itself to Persian letters for the
same reason, which is why it reports clean and this line exists — the exempted case should be written down,
not inferred from a green suite.

### T093 — a thumb is not a screen width

Moving the 44px block from `@media (max-width: 767px)` to `@media (pointer: coarse)` was the recorded task;
measuring it found the defect was wider than the block. With the rules keyed to width, a phone held in
landscape (844px) got desktop controls, and three components carried `min-h-11 … md:min-h-0` pairs that
re-introduced the same error per-element. `a[class*="inline-flex"]` also never matched the footer and trust
links, which are `flex`, so widening that selector is what actually caught them.

Measured in a coarse-pointer context at 844×390 and 360×800, counting each control's **effective** hit area
(its box widened by any pseudo-element hit area it declares, and by the card behind it for the whole-card
links): **0 elements under 24px and 0 icon controls under 44px at both sizes**, where the homepage at 390px
had measured 78 sub-44 interactive elements before the band. At 1280 with a fine pointer the rules are
confirmed *off* — `min-width: 0` on the brand grid, `min-height: auto` on buttons — which is the point: a
mouse does not need them and every prose link on the site would otherwise have become 44px tall.
`.lux-card:hover { transform: none }` moved to `@media (hover: none)` on the same reasoning: the bug it
prevents is a tap leaving the card lifted, and that happens on a wide phone too.

### The scroll ground was invisible, and the suite could not see it (T112)

The owner's complaint — *"the same colour all along"* — is correct at the pixel level. Sampled in the
gutter down the live homepage: `#1D0308 → #150105 → #110104 → #0E0103 → #0C0002 → #0B0003 → #0B0104`, i.e.
the back half of a 16,384px page moves three units in one channel. The authored legs were ΔE 9.8 / 4.6 /
2.6, all four stages inside one hue. The suite passed because it asserted that luminance was *monotone* and
never asked whether the change reached an eye. Two causes: stages with no amplitude, and `opacity: .5` on
the layer blending every leg with a body canvas that only varies `#100306 → #0A0205` — an alpha that existed
to negotiate with a glow field band 3's T073 had already deleted.

Replaced with a six-stop tour (`#3A0C12 → #2A0713 → #1A0A16 → #0E1122 → #320B0A → #160406`), layer at full
opacity. Re-measured with `verification/ground-travel.mjs`, which reads gutter **pixels** rather than the
authored function for exactly the reason above: 13 distinct tones at 13 positions, legs summing ΔE 68.2
against an endpoint distance of 20.0 (3.4× — the shipped palette measured 17.0 against 16.9, which is a
slide), worst text contrast 5.59:1 across the 500-step unit sweep. The travel is in hue and chroma; `Y`
stays 0.0027–0.0121, inside `LEGIBILITY_BAND`, because lightness is the one axis a dark ground cannot spend.

**New finding, not yet fixed: the ground does not reach everywhere it should.** The same script reports the
authored tone arriving at the gutter unpainted at **9 of 13 positions**. At 25%, 42% and 58% the gutter
shows `#110003`/`#0e070f`/`#10060d` where the layer holds `#220915`/`#130e1d`/`#180f1b` — a section painting
its own opaque background over the ground — and at 8% the left and right gutters disagree. The arc is now
strong enough that this is the limiting factor on how much of it a shopper sees, so it belongs with T083's
extension rather than being filed as decoration.

### A fold measurement that was wrong, and the instrument that made it wrong

An earlier paragraph in this section claimed the hero's trust row landed at y=916 and that FR-014 was
therefore unmet at 360. **It was wrong, and the reason is worth keeping**: `capture-baseline.mjs` defines
`trustTextRow` as the first childless element matching `/گارانتی|ضمانت/`, which is the **warranty line at the
bottom of the shop-window panel**, not the hero's trust row. Re-measured element by element at 360×800:

```
eyebrow 120 · h1 167 · lead 309 · actions 429 · trust row 501–540 · shop window begins 572
```

Everything FR-014 asks for — positioning, one trust signal, one obvious next action without scrolling — is
above the fold, and the first merchandise is at y=1,640 (down from 2,016). T085 stays open on the stock
half of that sentence, not the trust half. Two lessons: a probe that matches on *text* rather than on
identity reports whatever happens to contain the word, and a number copied between instruments has to
carry its definition with it — the `533–572` figure in the scratch notes was the same row, measured
correctly, and I disbelieved it because a different script said 916.

### The shop photograph returns, and the two files are not the same room (T114)

`public/store/` holds five files and only two of them are the merchant's camera. Compared pixel for pixel:
`shop-upright.jpg` (3000×4000, the owner's shot with the EXIF rotation applied) shows a counter stacked with
roughly fifteen phone cartons, a PS5 box, two plants and dome cameras on a matte tiled floor. The AI steps
after it remove **all of that** and stand four phones in a row under wall spotlights, add a lit strip under
the counter and a mirror-polished floor. So `shop.jpg`, the file that used to sit in the hero, is not a
re-grade of the shop — it is a different shop. That is the whole of the Principle I objection, and it is why
the reinstated frame points at `shop-upright.jpg`.

What came back and what did not: the photograph, the «HAMI HAMRAH / MASHHAD» line and «فروشگاه حضوری در
مشهد» — all things that are true of the room. `MASHHAD FLAGSHIP`, `SHOWROOM` and the street address stayed
out (the badges were UI text laid over the frame; the address is decision 3's, and a photo of a premises is
where an invented one reads hardest as fact). The «SAMSUNG» and «ACCESSORIES» lightboxes are fixtures,
visible in the original file, and the earlier note calling them invented was wrong.

Measured after the change, at 360×800: eyebrow 120, h1 167, lead 309, actions 429, trust row 501–540,
**photograph begins at 572** — so the frame is above the fold on a phone, which is the only place it can do
its work. Page height 16,384 → 16,547 (+163px, the panel growing from a 400px text block to 563px), first
product card 1,640 → 1,804. At 1280 the hero column is now tall enough that `obtainable-now` no longer
peeks into the first viewport, which `manifest-after.json` records as `aboveFold=[top]` where the previous
capture had two sections. Decoration counts are unchanged at 0 across all 24 captures — the caption scrim is
one linear gradient over an image, not a second light source.

Asset weights: `shop-hero.jpg` 1200×1600 at 136KB and `shop-hero@2x.jpg` at 212KB, both generated with the
repo's own `sharp` (progressive, mozjpeg). The 2.63MB source stays in the tree as provenance and is never
fetched by a browser.

One consequence for the ground: `ground-travel.mjs` now reports the authored tone reaching the gutter at
**8 of 13** positions where it reported 9 — the panel is full-bleed on a phone and opaque, so it covers a
strip of ground it used to let through. That is the photograph doing its job and T115 getting slightly
harder, not a regression to undo.
