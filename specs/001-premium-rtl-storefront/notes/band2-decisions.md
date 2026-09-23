# Band 2 decisions — 001

**Feature**: `specs/001-premium-rtl-storefront` | **Phase**: 4 (T049–T068) | **Date**: 2026-09-23
**Method**: the owner's instruction for this run was to decide open questions on the spot and record them
rather than stop. Each entry below names the alternative that was rejected and what was measured, so a
later reader can disagree with the call instead of guessing at it.

---

## 1. Price bounds ignore records with no price (`lib/catalog.ts`, T051)

`minPrice`/`maxPrice` now filter a list already narrowed to `priceOf(p) > 0`.

- **Before**: `priceOf()` returns `0` for the 5 unpriced records, and `0` compares below every real
  price. A `min=1.000.000` filter therefore dropped those 5 silently, and a `max=…` filter admitted them
  as "cheap" — the same coercion produced both a false disappearance and a false appearance, which is
  `audits/02`'s FR-022 finding.
- **Rejected alternative**: keep them in and let a bound mean what it says numerically. That is what
  produced the bug, and a price filter listing a product with no price is a second-order lie.
- The unpriced records remain fully reachable with no bound applied, and `price-asc` still puts them
  last (measured: the ascending head is «اپل-آیدی», i.e. unpriced is never cheapest).
- `contracts/shop-url.md` carries the same rule so the two cannot drift.

## 2. «موجود» (`unlimited`) is gone from the availability filter; «قابل خرید» replaces it (T051, T057)

`stockOptions` is now `همه / قابل خرید / موجود محدود / ناموجود / تماس بگیرید`.

- Measured against the export: `state` counts are **162 `out_of_stock`, 21 `limited`, 6 `call`, 0
  `unlimited`**. So the old «موجود» option was a door that opened onto nothing — one of the seven dead
  doors `audits/02` lists.
- And «موجود محدود» answered a question nobody asked: 21 records match it while only **5** are actually
  sellable, because the shelf state and the merchant's `purchasable` flag disagree on 16 records. FR-022
  asks a shopper to narrow by *obtainability*, so the option that means that is now explicit and reads
  `stockType=purchasable`.
- **Rejected alternative**: keep `unlimited` and make it match `purchasable`. Two labels for one
  predicate is how the two drift apart later. `stockLabels.unlimited` stays for rendering, because a
  refreshed export may legitimately contain that state.

## 3. A category means its subtree everywhere, and the shop's tiles are the department list (T054, T056)

`/categories/<slug>`, `/shop?category=<slug>` and the number printed beside a category name all resolve
through `descendantCategoryIds()` / `categorySubtreeCounts()`.

- The first version of this decision kept the sidebar's facet *exact* and made only the destination
  recursive, on the reasoning that a facet should mean precisely what it says. That lasted until T061
  tried to use the page: the sidebar shows each root's subtree count, so an exact facet under a subtree
  number is a label of «موبایل و تبلت ۱۳۵» that returns **zero** records — the export files those products
  under brand-shaped children (`شیائومی | XIAOMI`, `آیفون استوک`) and none under the parent. A number that
  contradicts the control beside it is the same defect as an empty door, one keystroke later. The facet is
  single-select, so the double-counting worry that motivated exactness cannot arise.
- `lib/shop-category-tiles.ts` no longer scans roots at all: the shop page's tiles are
  `categoryDepartments()` rendered, so the homepage carousel and the shop row cannot grow different
  answers to «what departments does this shop have». Before that, the tile row offered `موبایل` (8
  records) beside `موبایل و تبلت` (135) as if they were separate departments, and offered
  `ارسال رایگان ویژه` — a promotion, not a department — as a category door. That duplication *is* T056.
- A tile may print a count only where `showsCount` holds, i.e. where the route is the whole kind, so no
  tile can promise 134 phones over a door that opens on 8. The rule came from 005's panels; it is now
  shared code rather than a second implementation.
- The merged vocabulary changed one panel's target: the phone department is `موبایل-و-تبلت`, not the
  `موبایل` leaf. Measured against the export, that route reaches 135 records — 134 phones plus id 311, a
  charger filed under «داریا باند» — and `آداپتور | کابل و شارژر` reaches 12, because «شارژر فندکی» is a
  child of it. Both are surplus rather than shortfall, both show no count, and both are named in
  `KNOWN_SURPLUS_KINDS` so a third one fails the suite. `contracts/shop-url.md` carries the semantics.


## 4. T059 — the carousel's double press stays, and the spec conflict is escalated rather than decided

`tasks.md` T059 asked to remove `components/home/CategoryCarousel.tsx`'s first-press
`preventDefault()`, on the grounds that 004's brand rows navigate on the first press.

- Feature 005's spec is not silent on this: **FR-010 — "Tapping a non-active panel MUST bring it to
  active position rather than navigate."** A task in 001 cannot delete a MUST in 005; that is a
  cross-feature contradiction about a control the owner already signed off on, and the owner explicitly
  endorsed 004's and 005's judgement on carousel feel.
- So the behaviour is unchanged and **T059 is left unticked.** What was fixed is the comment, which
  claimed the double press was "the same semantics feature 004's brand rows established" — 004 says the
  opposite in its own file (`BrandRows.tsx`: the reference's two-tap interception "is not acceptable on a
  storefront") — and cited FR-038, which is about the wording of a non-purchasable action, not about
  panels. A false justification in a code comment is how a bad behaviour becomes permanent.
- **The ask**: the owner picks a winner for panel-press semantics. Either 005's FR-010 is amended to
  "navigate on first press, centre on swipe" (then T059 is a two-line change), or 001's T059 is
  withdrawn. The arithmetic is not the obstacle: with the double press the path *panel → panel →
  product* is still SC-002's three interactions.
- **Rejected alternative**: change it and let the checkpoint report the conflict later. That silently
  rewrites another feature's contract.

## 5. The gallery became its own component because it was breaking the desktop grid (T065)

`components/shop/ProductGallery.tsx` now owns the views, the failed-view filter and the thumbnail strip.

- The reason is not tidiness. Mounted as two siblings inside `ProductDetail`'s
  `grid gap-10 lg:grid-cols-2`, the vitrine and the strip were *separate grid items*: at `lg` the strip
  landed in column 2 beside the image and pushed the buy box down to row 2 — wrong on 133 of 189 product
  pages. One component is one grid item, which is the structure the layout assumed.
- The composition still does not depend on the remote host: view 0 is always the locally mirrored
  photograph, a view that fails is removed from the set rather than left broken, and a single-view record
  emits no dots, no strip and no counter (US3 scenarios 6–7).
- Choosing a variant no longer resets the view index. No variant in the export carries its own image, so
  the reset was decorative, and dropping it is what lets the gallery own its state.

## 6. «One interaction to a human» is chrome, not a button on every card (T068)

FR-039: contact reachable in at most one interaction **from any product**, and working where dialing is
unavailable.

- What exists now: the dock gained a `تماس` tab rendering `storeContact.phoneHref` (a real dial request,
  not the `#contact` anchor that got it deleted once), the header gained the same link from `md` up, and
  the PDP's «برای استعلام قیمت تماس بگیرید» line became a link **carrying the number**, which the audit
  found it did not have.
- `CopyPhoneButton` remains the non-dialable path, and it copies the international form
  (`+989331214000`) rather than the Persian display string, so what lands on the clipboard is dialable
  and pasteable anywhere.
- **Rejected alternative**: a call button on each `ProductCard`. 189 cards, and the shop grid becomes a
  switchboard — the card's one job is to navigate to the product.
- **Interpretation recorded**: "from any product" is read as "while that product is on screen", which a
  persistent control satisfies on every surface at once. If the owner means "on the product itself", the
  PDP satisfies that too and the cards need a second look.

## 7. A cart control needs a price (PDP, T067 adjacent)

`purchasable` on the product page is `isPurchasable(...) && unitPrice !== null`.

- Today no record is both obtainable and unpriced (measured: 0), so nothing on screen changes. The export
  refreshes — the owner has said the availability figures will be — and the failure mode without the
  guard is an add-to-cart that files a line with no price, which is FR-040's "a control that appears to
  work" in the one place it costs money. Such a record now gets the call action instead, which is the
  answer FR-037 wants for that state.
- **Rejected alternative**: leave it to the backend. The backend is frozen (Constitution III) and the
  storefront is the surface that makes the promise.

## 8. The related-products rail is silent when it has nothing real to say (T063)

`components/shop/RelatedProducts.tsx` is a server component mounted by `app/(main)/shop/[slug]/page.tsx`,
reading `relatedProducts()` — same brand first, then same category, each ranked obtainable → special
offer → recency.

- FR-035 forbids "an arbitrary sample of the catalog presented as a recommendation", so the predicate is
  named in the seam and the component adds no judgement of its own. When the record has neither a brand
  nor a category sibling the section renders nothing at all rather than a heading over an empty frame
  (FR-005).
- The ranking deliberately puts obtainable records first: a rail of six "ناموجود" cards under a product
  the shopper cannot buy is a dead end twice over.

## 9. Search normalisation lives in `lib/persian.ts`, applied at the seam (T049)

T049 named `lib/shop-filters.ts`; the fold is its own module and runs where the haystack is.

- `lib/shop-filters.ts` only resolves a brand/category **slug** to an id — the product-name search
  happens in `queryProducts()` at `lib/catalog.ts:281`, which is therefore where `persianIncludes()` is
  called. Splitting the fold across the two files is how they stop agreeing, so both sides of every
  comparison go through `foldPersian()`.
- Measured pairs (needle → matches, before → after): `سیستم‌عامل`/`سیستم عامل` 2 → 2 both ways,
  `۱۰۵`/`105` 0 → 2 both ways, `موبايل`/`موبایل` 0 → 133 both ways.
- **One clause of T049 was not implemented: `Intl.Collator("fa")` ordering.** No surface in this shop
  orders by name — the sort options are `newest / price-asc / price-desc / special` — so a Persian
  collation comparator would never run, and adding one would mean adding a sort the spec does not ask
  for. Recorded here rather than quietly dropped; it becomes real work the day an A–Z option appears.
- No dependency added (research D6): four character classes and one Unicode normal form.


---

## What this band does not claim

The sparsest-record walk (T067's 13 states), the SC-002 interaction count (T061) and the 360/768/1440
overflow measurement (T060) are recorded in `findings.md` with their instrument, and only for what was
actually driven in a browser. Nothing in band 2 is asserted from reading the code, and no performance or
frame-rate claim appears anywhere — the owner's machine is not a benchmark.
