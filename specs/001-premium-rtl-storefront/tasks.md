# Tasks: Premium Persian RTL Storefront

**Input**: `specs/001-premium-rtl-storefront/` — plan.md, spec.md, research.md (D1–D11), data-model.md,
contracts/ (catalog-seam, honest-states, shop-url), quickstart.md, audits/01…05

**Execution order**: the five bands from `plan.md`, not the five user stories. The band order is the point
of this plan — Principle I has no exception path, so nothing visual or structural is worth doing before
the honesty gate clears, and nothing in band 2+ can be *verified* until the seam is real in band 1. Each
task still carries its `[USn]` label so story-level traceability survives.

**Tests**: included where the plan demands them. The honest-interface band has **zero** test coverage today
(`audits/01`), which is how every violation below reached passing CI.

**⚠ Database hazard**: `vitest.config.ts:16` registers `tests/setup.ts` globally and it calls `resetDb()`
in `beforeEach`, so even `npx vitest run tests/unit` truncates 19 tables. Owner has accepted this. Do all
cart/checkout browser verification before or after a test run, never between.

**⚠ Frozen**: `data/`, `app/api/`, `prisma/` are read-only under Constitution III. `lib/catalog.ts` is ours
and may change. Auth, cart, checkout, payment and admin MUST NOT be modified to unblock a frontend
decision — band 0 changes what those surfaces *claim*, never how they work.

---

## Phase 1: Setup — decisions and a baseline

**Purpose**: nothing downstream can be executed cleanly without the owner's eight answers and a set of
before-images.

- [x] T001 Remove the committed live-reload script from `app/layout.tsx:69` — `<script
  src="http://localhost:8400/live.js?token=…">` sits inside the root `<body>` on every page for every
  visitor, fails to resolve in production, and delays the `load` event that
  `components/atmosphere/useAtmosphereGround.ts:102` depends on. Delete the
  `<!-- impeccable-live-start -->`/`-end` markers and their script tag.
- [x] T002 Capture before-images for the 13 surfaces listed in `quickstart.md` §4 into
  `specs/001-premium-rtl-storefront/baseline/` at 360×800 and 1280×900. **Done 2026-09-23** — §4 lists twelve surfaces, not thirteen; all twelve captured at both widths by `verification/capture-baseline.mjs`, with a manifest of page height, mounted sections, the decoration census and the fold positions `audits/05` had to estimate. `audits/05` had to compute
  fold positions from 002's 2026-09-22 captures because nothing was listening on :3000 — re-measure
  against a live server before band 3 relies on any position claim.
- [x] T003 **DONE 2026-09-23** — all eight answers recorded in
  `specs/001-premium-rtl-storefront/notes/owner-decisions.md`: (1) only the warranty was confirmed, as
  «گارانتی ۱۸ ماهه شرکتی», and every other claim in that question came out; (2) the AI store photograph is
  removed everywhere; (3) the fabricated email and the venue line are removed until supplied; (4) browsing
  and the cart stay, the purchase claim is replaced by tap-to-call plus a copyable number; (5) the scroll
  ground **extends to every shopper page**; (6) SC-007 is scoped to interface-authored strings, merchant
  product text renders as written; (7) no human panel — band 4 stays visibly unmeasured; (8) no date for
  the refreshed export, so band 0 tests against today's snapshot while the refresh-tolerance work
  continues. **Nothing in band 0 is decision-blocked any more.** in `quickstart.md` §1 in one sitting, and record the answers
  in `specs/001-premium-rtl-storefront/notes/owner-decisions.md`: (1) which trust claims come out vs which
  get a supplied fact, (2) the AI store photograph, (3) address/email supply, (4) what replaces the
  purchase path, (5) whether the atmosphere extends past `/`, (6) whether SC-007 reaches merchant-authored
  product names, (7) the human panel, (8) the data refresh. **T018, T019, T020, T030, T052 and every band-3
  task that touches trust copy depend on this.** An unanswered claim stays out of the interface.
- [x] T004 Create `specs/001-premium-rtl-storefront/notes/findings.md` as the running record for this
  feature, with one section per band, so verification is written down as it happens rather than
  reconstructed at the end.

**Checkpoint**: server up, baseline stored, decisions recorded or their absence explicitly noted as
"claim stays out".

---

## Phase 2: Band 0 — Truthfulness (Constitution I gate, no exception path)

**Purpose**: make every rendered claim traceable to a record or to `lib/content/contact.ts`.
**Serves**: US1 (trust), US3 (inspect honestly), US4 (act honestly). **Blocks**: all later bands.

### Tests, written first so they fail

- [x] T005 [P] [US3] Seam-shape guard in `tests/unit/catalog-seam-shape.test.ts`: for every record from
  `lib/catalog.ts`, assert that each field `components/shop/ProductDetail.tsx` reads actually exists on the
  serialized product and on each variant. Quote `contracts/catalog-seam.md`: "A consumer MUST read a field
  listed above, and MUST NOT invent a name for a concept it needs." This is the test that would have caught
  the price defect.
- [x] T006 [P] [US4] Obtainability guard in `tests/unit/obtainability.test.ts`: no record with
  `purchasable === false` may resolve to an obtainable label or an enabled cart control, and no record whose
  `stockType` is `call` or `out_of_stock` may resolve to either. Assert against the real export, and per
  `contracts/honest-states.md`: "unknown, unreadable, empty, or newly-seen availability ⇒ «تماس بگیرید»".
- [x] T007 [P] [US3] Price-state guard in `tests/unit/price-state.test.ts`: `priceOf() === 0` renders no
  numeral and no bare currency word on any surface, and a discount requires strictly
  `compareAtPrice > price` at **both** product and variant level — quote FR-004: "A discount MUST be
  displayed only where the previous price is strictly higher than the current price."
- [x] T008 [P] [US1] Admissible-claim guard in `tests/unit/admissible-claims.test.ts`: assert the DOM
  string sources contain no warranty, authenticity-percentage, "unrivaled/best price", partner-brand,
  street-address or email claim beyond the four facts FR-006 permits and the phone in
  `lib/content/contact.ts`. Encode the forbidden list verbatim from `contracts/honest-states.md`.

### The price defect, and the reads that hid it

- [x] T009 [US3] Fix the unit-price read in `components/shop/ProductDetail.tsx:191` — replace
  `selectedVariant.unitPrice` with the field `lib/catalog.ts:171` actually emits (`variant.price`), falling
  back to `product.displayPrice` (`lib/catalog.ts:216`) so the 84 variant-less **priced** products stop
  printing «برای استعلام قیمت تماس بگیرید». Verify against `data/hami-products.json` for one variant
  product, one variant-less product and one unpriced product.
- [x] T010 [US3] Repair the discount block at `components/shop/ProductDetail.tsx:262-281`: compare the real
  variant price so `compareAtPrice > unitPrice` can be true, and confirm a genuine per-variant discount
  (e.g. ۱۱۵,۰۰۰,۰۰۰ vs ۵۲,۳۰۰,۰۰۰) renders as a comparison, per FR-034: "the discount treatment MUST be
  legible as a comparison rather than decoration."
- [x] T011 [US3] Move the compare-at gate into the seam at `lib/catalog.ts:172` so variants cannot emit a
  non-greater `compareAtPrice` — 40 of 311 currently do, and `audits/01` records the product-level gate at
  `:114-120` as the only enforcement.
- [x] T012 [US3] Delete the dead bulk-tier branch: `selectedVariant?.matchedTier` at
  `components/shop/ProductDetail.tsx:193-194` and its UI, given `lib/catalog.ts:185` always emits
  `matchedTier: null` and `:179` documents that the export has no B2B tiers.
- [x] T013 [US3] Remove the dead `product.analysis` block at `components/shop/ProductDetail.tsx:405-411`;
  the serializer emits no such field, so it reads as a section that silently never appears.
- [x] T014 [US3] Switch the description render at `components/shop/ProductDetail.tsx:398-403` from
  `product.description` (raw `description_html`, `lib/catalog.ts:195`) to `product.descriptionText`
  (`:196`). 147 records currently show literal `<p>` tags and `&zwnj;` to shoppers.
- [x] T015 [US2] Add the missing price guard to the list view at `components/shop/ProductListRow.tsx:59-64`:
  it calls `formatToman(displayPrice)` with no `priceState()` check, so the 5 unpriced records print «۰
  تومان» — the exact rendering FR-003 forbids.

### Manufactured positives

- [x] T016 [US4] Change the availability fallback at `components/shop/ProductDetail.tsx:94` from
  `?? "limited"` to `?? "call"`, per `contracts/honest-states.md`: "Every fallback in the chain resolves to
  `call`… never to a positive state."
- [x] T017 [US4] Change `serializeStockType`'s `default: return "limited"` in `lib/serializers.ts:13-26` to
  the contact fallback, and note the reach: it feeds shopper-visible cart labels through `lib/cart.ts:71,81`.
- [x] T018 [US4] Make the product page consume the merchant's own signal: derive the purchasable test at
  `components/shop/ProductDetail.tsx:96` from `product.available` (`lib/catalog.ts:200`) instead of
  `stockType !== "out_of_stock" && stockType !== "call"`, which currently makes all 16
  `limited`+`purchasable:false` records buyable. Label wording is fixed by decisions 1 and 4 («تماس بگیرید» plus tap-to-call); the
  gate itself needs no decision.
- [x] T019 [US4] Gate the card's cart control in `components/shop/ProductCard.tsx:109,221-231` on the same
  `available` flag — it tests only `out_of_stock` today, which is why 22 unsellable records carry a live
  «افزودن به سبد خرید» (FR-002, FR-037).
- [x] T020 [US4] Give each availability state one unambiguous action per FR-037: an out-of-stock product
  must offer the contact route, not only a disabled «ناموجود»
  (`components/shop/ProductDetail.tsx:360-378`, `components/shop/AddToCartButton.tsx:37-49`), and a
  `call`-state record must not show an order-shaped CTA at all (FR-038).
- [x] T021 [US4] Fix the contradictory quantity line at `components/shop/ProductDetail.tsx:381-385`, which
  prints «حداکثر ۰ عدد در انبار موجود است» while offering the buy button.

### Claims that have no fact behind them

- [x] T022 [US3] **Changed by decision 1, not deleted.** Source the warranty once and render it
  everywhere: add «گارانتی ۱۸ ماهه شرکتی» as a verified merchant fact in the facts module beside
  `lib/content/contact.ts` (not in JSX), and have `components/shop/ProductCard.tsx:191-193` and
  `components/shop/ProductDetail.tsx:256-258` read it from there. The current «گارانتی رسمی» wording still
  goes — it named no provider and no period. Do NOT make `lib/catalog.ts:170`'s `guarantee` field look
  per-product: the export holds no guarantee data, so this is a storefront-wide fact and must not read as
  record data. See `notes/owner-decisions.md` §1.
- [x] T023 [P] [US3] Remove «ضمانت اصالت ۱۰۰٪» from `components/shop/ProductDetail.tsx:256-258` — the owner
  was offered the chance to confirm it in decision 1 and did not, so FR-001 applies
  (`notes/owner-decisions.md` §1).
- [x] T024 [P] [US1] Remove «تضمین ۱۰۰٪ اصالت» and the accompanying authorization phrasing from
  `components/layout/Footer.tsx:57,62,69`, leaving only the four FR-006 facts.
- [x] T025 [P] [US1] Rewrite the hero claims at `app/(main)/page.tsx:86,103-106,108-109`: «بهترین قیمت
  برای», «قیمتی بی‌رقیب» and «همان قیمت منصفانه» at one and a hundred units all fail FR-017 and FR-059.
  State the price-leadership position without an unspecificable comparative, and drop the quantity-1-and-100
  equivalence entirely.
- [ ] T026 [P] [US1] Remove «انتخاب‌های بی‌نهایت» from `components/home/BrandShowcase.tsx:50` and audit the
  remaining home copy in `lib/content/home.ts:12-18,211,212,220` for the same pattern — FR-059 bans
  "superlatives with no measurement behind them" and the padding constructions named in `audits/04`.
- [x] T027 [P] [US1] Re-label or reduce the six-logo wall so it no longer asserts partnership it does not
  have: `components/home/BrandTicker.tsx:48` `aria-label="برندهای همکار"`, per FR-006 (only the Redmi and
  TCH relationships are verified).
- [x] T028 [US1] Delete the fabricated email at `app/(main)/partners/page.tsx:67-68`. FR-007: "Until each is
  actually supplied and confirmed it MUST NOT appear anywhere in the interface, including as an obviously
  placeholder value."
- [x] T029 [US1] Remove or substantiate the venue line «مشهد • مجتمع تجاری موبایل» at
  `components/home/StoreExperience.tsx:98` — it is not in `lib/content/contact.ts`, which names the phone as
  the repo's only verified contact fact.
- [x] T030 [US1] **Decision 2: removed everywhere.** Take the AI re-lit store photograph out of its trust role: `components/home/ShopWindow.tsx`
  (lines 4–20 document the re-light derivation) and `components/home/StoreExperience.tsx:41,60-62` caption it
  «فضای واقعی مجموعه» and badge it `MASHHAD FLAGSHIP`. FR-006 forbids store imagery outright and research D5
  decides it comes out. The slot stays **empty** rather than filled with something nearby — FR-008 and
  `notes/owner-decisions.md` §2. This also retires the radial "light thrown onto the wall" at
  `ShopWindow.tsx:25-35`, which decorates an image that is leaving.
- [x] T031 [P] [US1] Delete the «تصویر واقعی فروشگاه در انتظار افزودن» placeholder and its `mediaNote`
  apology from `components/home/WhyHami.tsx:12,65` and `lib/content/home.ts:221-222` — FR-008: a place with
  nothing true to say stays empty; it does not advertise the gap.
- [x] T032 [P] [US2] Remove the «لپ‌تاپ برای کار و بازی» banner from `components/shop/ShopBanner.tsx:21-33`
  (the catalog holds no laptop kind, and it links to `/shop?sort=price-asc` — the whole catalog under a
  laptop label) and audit the other two non-catalogue images at `:23-65` against FR-001.
- [ ] T033 [US1] Remove the three CSS-composition filler panels with pseudo-English labels at
  `components/home/WhyHami.tsx:16-42` and their styles at `app/(main)/home.css:433,449` (FR-008).

### FR-040: capability honesty, and the 404 that is not

- [x] T034 [US4] **Wording fixed by decision 4: "call us instead."** Browsing and the cart stay; the
  purchase claim goes. State plainly where a purchase capability cannot be honoured and remove controls that
  merely appear to work: `app/(main)/checkout/page.tsx:22-26` and `components/checkout/CheckoutClient.tsx:424`
  («پرداخت آنلاین از طریق درگاه امن انجام می‌شود»), `components/cart/CartPageClient.tsx:99-122` («ادامه و
  تسویه حساب»). **Do not change cart/checkout logic** — Constitution III freezes it. Copy and affordance
  only. Put tap-to-call plus a copy-the-number control where a buy button stood (lands with T068), per
  `notes/owner-decisions.md` §4.
- [x] T035 [US3] Make an unknown product slug return a real 404: `app/(main)/shop/[slug]/page.tsx` never
  calls `notFound()`, so a missing product currently serves HTTP 200 (US3 scenario 9 and SC-014).
- [x] T036 [P] [US3] Create `app/not-found.tsx` with the storefront chrome, RTL, Persian copy and a route
  back to `/shop` — none exists today, so the footer's dead links currently land on Next's unstyled English
  page.
- [x] T037 [US3] Separate the two failure states in `components/shop/ProductDetail.tsx:66-68,168-186`: the
  same `catch` labels a network failure «محصول پیدا نشد», which is a false statement about the catalog.
  FR-046 requires loading, empty, error and success to be distinct.

**Checkpoint — the gate: MET 2026-09-23, with three items left open on purpose.** All four guard tests pass
alongside the existing suite (170 tests, 18 files), `tsc --noEmit` and `npm run build` are both clean, and
the price fix is confirmed per record class in a browser rather than inferred from source — evidence in
`notes/findings.md`. Still open: **T026** (FR-059's bureaucratic padding at `lib/content/home.ts:211,212`
survives — the superlatives went, the filler did not), **T033** (the three CSS-composition filler panels are
band 3's to rebuild), **T002** (no 13-surface baseline). `/cart` and `/checkout` copy is source-verified
only: both routes demand a session, and the unit suite wipes the accounts that would provide one.

---

## Phase 3: Band 1 — The seam (Constitution III)

**Purpose**: browsing stops requiring an API round-trip, and the shape drift that caused the price defect
becomes impossible to repeat silently. **Serves**: US2, US3. **Blocks**: band 2.

- [x] T038 [US2] Render `/shop` on the server through `lib/catalog.ts::queryProducts`: accept
  `searchParams` in `app/(main)/shop/page.tsx:13` (it accepts none today), pass them to the seam, and remove
  the `Suspense fallback={null}` at `:29-31` that makes the served document contain zero products.
- [x] T039 [US2] Delete the client catalog fetches that T038 supersedes in `components/shop/ShopClient.tsx:39-52,101`,
  keeping only the state that must remain client-side. Preserve every rule in
  `contracts/shop-url.md` — the keys and their semantics are unchanged, only who reads them moves.
- [x] T040 [US3] Do the same for the product page: `app/(main)/shop/[slug]/page.tsx` reads through the seam
  server-side (it already does so for `generateMetadata` at `:9`) and `components/shop/ProductDetail.tsx:56`
  stops fetching `/api/products/[slug]`.
- [x] T041 [P] [US1] Server-render the two homepage rails: `components/home/FeaturedProducts.tsx:83` and
  `components/home/NewArrivals.tsx:30` currently fetch client-side.
- [x] T042 [US3] **Done by a different route than written, on purpose.** The task said "correct
  `types/store.ts:58-95`" — that type is also read by `components/admin/products/ProductForm.tsx:132,162,250`
  (it consumes `analysis`, `isDigital`, `variant.unitPrice`, `matchedTier`), and the back office must not be
  modified under Constitution III. So instead the shopper boundary was retyped:
  `components/shop/ProductDetail.tsx` now imports `CatalogProduct` (`ReturnType<typeof serializeProduct>`)
  and the `apiGet<ProductDetail>` cast is gone from the shopper path. The obligation — "Transport typing
  MUST be declared, not asserted" — is met and **measured**: reintroducing `selectedVariant.unitPrice`
  produces `TS2339` against the real emitted shape. `types/store.ts` is left as the admin's private shape
  and band 2 should not touch it. See `notes/seam.md`.
- [x] T043 [US3] Assert the breach is closed and record the method in
  `specs/001-premium-rtl-storefront/notes/seam.md`: `curl -s localhost:3000/shop | grep -c 'href="/shop/'`
  must be non-zero against the **served HTML**, for `/shop`, a product page, and the home rails.
- [x] T044 [US4] Implement FR-055's data-currency disclosure as one mechanism fed from the seam —
  `quickstart.md` §1 decision 8 may change the wording, not the obligation. FR-055: "the storefront MUST make
  the currency of that information discoverable, so a shopper is not left to assume a figure from a snapshot
  of unstated age is current. The form is a design decision; the obligation is not." Nothing today renders
  the export date or `updated_at`, which `lib/catalog.ts:293` uses for sorting only.
- [x] T045 [P] [US4] Replace the homepage-crash path: `lib/category-departments.ts:118-131` **throws** when
  a hand-listed slug resolves to zero products, from the render path every visitor hits. Drop the department
  and log it, keeping 004's no-dead-door intent.
- [x] T046 [P] [US4] Remove the snapshot coupling in `lib/category-departments.ts`: the `kindTotal` literals at `:57-66` and
  the `showsCount: total === seed.kindTotal` rule at `:139` in `lib/category-departments.ts`, deriving both at request time. FR-053 forbids
  embedding "the current counts, ratios, or thresholds of this snapshot".
- [x] T047 [P] [US4] Rewrite the assertions that restate snapshot totals so SC-005 becomes re-verifiable
  after a refresh: `tests/unit/category-departments.test.ts:39-42,52-57` (`toBe(9)`, `toBe(189)`,
  `[8,134]`) and `tests/unit/product-images.test.ts:79-80,93` (`toEqual(["347 اپل آیدی"])`) become
  property-style assertions.
- [x] T048 [US1] Resolve the placeholder-vs-Principle-I collision as a written decision, not a silence:
  `lib/product-images.ts:69-83` fills the exact slot a product's own photograph occupies with
  `alt={product.name}` (`ProductCard.tsx:120-127`, `ProductDetail.tsx:228-235`), so record 347's missing
  image is not visibly missing. Either mark the absence or record the owner's waiver in
  `specs/001-premium-rtl-storefront/notes/owner-decisions.md`.

**Checkpoint: MET 2026-09-23 — evidence in `notes/seam.md`.** Served HTML now contains 24 product links on
`/shop`, on `?brand=`, and on the homepage (all were **0**); the product page carries its price in the
served bytes; an unknown slug returns HTTP 404; `tsc`, the 170-test unit suite and `npm run build` are all
clean; the browser pass confirms hydration, the URL filter contract (`?brand=` → «۳۰ محصول», AND
semantics, clear-all) and that `lenis` easing and keyboard scrolling still work. The phantom-field
experiment is recorded with its honest split: **`tsc` catches the bad read, the data-side contract test
cannot** — it pins what the seam emits, which is a different and still useful job.

---

## Phase 4: Band 2 — Finish the shop

**Purpose**: the utility that makes this a storefront rather than a brochure. **Serves**: US2 (P2) and US3
(P3) — each independently testable at the checkpoint.

### Discovery (US2)

- [x] T049 [P] [US2] Add Persian search normalisation in `lib/shop-filters.ts` before matching: NFKC, map
  `ي`→`ی` and `ك`→`ک`, strip U+200C from query and haystack, fold Persian/Arabic digits to Latin, order with
  `Intl.Collator("fa")`. Measured failures (`audits/02`): `سیستم‌عامل`→2 vs `سیستم عامل`→0, `۱۰۵`→0 vs
  `105`→2, `موبايل`→0 vs `موبایل`→133. No new dependency — research D6.
- [x] T050 [P] [US2] Implement the missing comparators in `lib/catalog.ts:264-295` for `newest` and
  `featured`, or delete those options from `lib/content/shop.ts:4,7`. Today `:264` branches only on the two
  price keys, so both return byte-identical lists to no sort at all. Preserve the verified zero-price rule:
  the 5 unpriced records must stay at positions 184–188 in **both** price directions.
- [x] T051 [P] [US2] Make availability narrowing answer the question a shopper is actually asking
  (`lib/catalog.ts:258`, `lib/content/shop.ts:12-18`): «موجود» (`unlimited`) matches 0 records and
  «موجود محدود» returns 21 of which only 5 are purchasable. FR-022 must let a shopper narrow to
  obtainability. Same change fixes the `min`/`max` asymmetry where `priceOf()`'s 0-coercion silently
  deletes or admits the 5 unpriced records (`audits/02` FR-022).
- [x] T052 [US2] Surface applied filters as removable chips outside the filter panel, with a working
  clear-all reachable on phone: `FilterSidebar.tsx:223-233` already clears, but `audits/02` measured **zero**
  elements outside `<aside>` carrying the active label at 360px while the panel is `hidden lg:block` /
  a closed sheet (`FilterSheet.tsx:83-107`). FR-026.
- [x] T053 [US2] Replace the undifferentiated entry lists in `components/shop/FilterSidebar.tsx:47,115` —
  blind `slice(0,8)` of root categories (3 empty) and `slice(0,12)` of brands — with the curated, counted,
  non-empty selection FR-028 demands, and add counts to `components/shop/CategoryTiles.tsx:29-50`, which
  currently renders names only.
- [x] T054 [P] [US2] Create `app/(main)/brands/[slug]/page.tsx` and
  `app/(main)/categories/[slug]/page.tsx` as real destinations per research D10 — FR-029: "MUST be able to
  reach the products of a given brand and of a given category from a dedicated place, not only through a
  filter." Neither exists; `/brands` and `/categories` both 404 today.
- [x] T055 [US2] Point 004's brand rows (`lib/content/home.ts:165,168`) and 005's category panels
  (`lib/category-departments.ts:133`) at the new routes instead of `/shop?` query strings.
- [x] T056 [P] [US2] Merge the three competing category vocabularies — 005's kind-departments in
  `lib/category-departments.ts`, the shop filter's root categories in `components/shop/FilterSidebar.tsx:47`, and
  `components/shop/CategoryTiles.tsx` — so «موبایل» (8), «گوشی موبایل» and «موبایل و تبلت» (0) stop
  being three doors onto three different subsets of one 134-record department.
- [x] T057 [P] [US2] Fix the seven dead doors listed in `audits/02`: `components/layout/Footer.tsx:22`
  (`/about`), `:23` (`/contact`), `:31` (`/my-orders`, real route is `/orders`), three empty category chips
  from `FilterSidebar.tsx:47`, and the `stock=unlimited` option from `lib/content/shop.ts:14`. SC-014.
- [x] T058 [P] [US2] Restore account parity on phone: `UserMenu` is `hidden … md:flex` at
  `components/layout/Header.tsx:137`, so a signed-in phone shopper can reach `/orders` but can never sign
  out (FR-042). Decide between surfacing it and reviving the complete-but-unimported
  `components/layout/MobileNav.tsx`.
- [x] T059 [US2] Remove the double-press tax on the categories carousel — **settled by the owner on
  2026-09-23 in favour of this task.** `components/home/CategoryCarousel.tsx:260-268` called
  `preventDefault()` on the first press of any non-active panel, contradicting 004's ruling that a card
  navigates on first press (`components/home/BrandRows.tsx:16-21`, 004 C24) and costing SC-002 an extra
  interaction per door. 005's FR-010 mandated the opposite and said so in a MUST, so the conflict was
  escalated (the reasoning is kept in `notes/band2-decisions.md` §4) and the owner resolved it: 005's
  FR-010 and contract A2 are amended — its own contract X3 had contradicted them since they were written —
  the carousel now carries no click handler at all, and `verification/panel-press-navigates.mjs` measures
  one press navigating. Centring stays available through swipe, wheel, drag, arrow keys and the direction
  buttons; calling `goTo()` from the press is specifically avoided, because Embla reads a track scroll
  inside the click as a drag and swallows the navigation.

- [x] T060 [P] [US2] Prove FR-041/SC-008 as composition rather than clipping: `app/globals.css:132`
  `overflow-x: hidden` on `body` is what currently makes the 360px measurement pass. Find the element that
  overflows and fix its layout; then re-measure at 360/768/1440.
- [x] T061 [US2] Re-verify SC-002 with the interaction count recorded in
  `specs/001-premium-rtl-storefront/notes/discovery.md` for "a Xiaomi phone" and "the cheapest power bank
  that is actually available" — both must land in ≤3 interactions, and the second is unreachable while
  `brand+category` returns 0.

### Product presentation (US3)

- [x] T062 [US3] Build the specifications block in `components/shop/ProductDetail.tsx` reading
  `product.specs` (`lib/catalog.ts:213`), scannable per FR-032 and absent when the array is empty (FR-005).
  166 records carry specs and no component reads them; 23 carry none and must show no empty frame.
- [x] T063 [P] [US3] Add the real-relationship rail FR-035 requires in
  `components/shop/RelatedProducts.tsx`, mounted by `app/(main)/shop/[slug]/page.tsx:22-29`: same brand or
  same category, selected by a named predicate — "MUST NOT be an arbitrary sample of the catalog presented
  as a recommendation". No related-products section exists anywhere (`audits/03`).
- [x] T064 [US3] Find the actual variant option keys in `data/hami-products.json` and map them correctly at
  `lib/catalog.ts:169` — the «حافظه» lookup matches 0 of 311 variants, so storage capacities never appear
  while FR-033 promises colours **and** capacities. Include record 347's دامنه/سرور/نوع keys in the survey.
- [x] T065 [US3] Implement the gallery in `components/shop/ProductGallery.tsx`, replacing the single
  `<Image>` block at `components/shop/ProductDetail.tsx:221-235` and sourcing views through
  `lib/product-images.ts`: FR-031 and US3 scenarios 6–7 require when more than one view is
  genuinely available, show count and current position; when there is one, emit no dots, no thumbnails, no
  affordance. The 56 records without a second view must be indistinguishable in polish from the 133 with
  one, and the composition MUST NOT depend on the remote host — so extra views are offered, never required.
- [x] T066 [US3] Fix the PDP's variant-selection feedback so choosing a colour changes something readable
  (price and stock line) at `components/shop/ProductDetail.tsx:293-318`; US3 scenario 4 requires the chosen
  option to be unambiguous **and** its consequences visible.
- [x] T067 [P] [US3] Make the "obtain but not today" case honest across FR-054: verify the composition for
  one product in each of the 13 states listed in `quickstart.md` §2, including the sparsest record (id 347,
  no image, no brand, no specs, 18 unmapped variants) and the richest.
- [x] T068 [US4] Implement FR-039 properly: a contact action reachable within one interaction from **any**
  product — none exists on a product surface today (`ProductDetail.tsx:277-280` is text plus an icon with no
  number and no link; `MobileDock.tsx:26-30` dropped its «تماس» tab) — and a copyable number for devices
  that cannot dial. The number exists only as Persian digits at `lib/content/contact.ts:16` and no clipboard
  affordance exists anywhere in the repo.

**Checkpoint — band 2 run 2026-09-23, then closed the same day. All 20 tasks done: T059 was left open as a
cross-feature conflict for the owner, who settled it for navigate-on-first-press, and the three ranked
SC-002 fixes in `notes/discovery.md` were applied with it (005's FR-010 amended, a composite
«ارزان‌ترینِ قابل خرید» control on both destinations, and the homepage's «همین حالا قابل خرید» shelf).
SC-002 now measures **met** on both tasks — 2 and 3 interactions — against the production build.**

*Measured*, in a browser or against the served HTML, with the instrument named in
`notes/findings.md#band-2`: the six availability classes of `quickstart.md` §2 at 360px; the related rail
present on 13 walked records and absent on «اپل آیدی»; the gallery emitting a strip and a counter only on
multi-view records; the search folds on the three pairs `audits/02` measured broken; `?stock=purchasable`
returning ۵ محصول; the four sort orders producing four distinct lists with the five unpriced records last
in both price directions; two genuine horizontal overflows (1626px thumb row, 929px hero at 768) found
with the body clip disabled and then re-measured to fit at 360/390/768/1024/1100/1280/1440; the dock's
dial tab at 56×48 across six items on a 360px bar; SC-002 counted interaction by interaction in
`notes/discovery.md`, where task B was reported as **not met** and is now met at 3 interactions.

*Asserted by test* rather than looked at: the subtree/facet agreement, the related-products relationship
predicate, the obtainable-first ranking, and the count-shown-only-when-honest rule — 18 new cases across
`tests/unit/band2-seams.test.ts`, `shop-category-tiles.test.ts` and `category-departments.test.ts`.
`192 tests / 19 files` green, `tsc --noEmit` clean, `npm run build` clean, and the built bundle booted
with `next start` to confirm the product links are in the served HTML.

*Not verified*: the 40-second half of SC-002 (hardware rule), anything requiring the human panel (band 4),
and the checkout path under the new `variantSoldOut` gate — the storefront no longer offers a zero-stock
variant, but the API would still accept it if asked, and the back end is frozen by Constitution III.

---

## Phase 5: Band 3 — The design language (Constitution IV)

**Purpose**: carry the premium the way the brief says to — composition, hierarchy, proportion, restraint —
after removing the decoration that currently stands in for it. **Serves**: US1 (P1) and US5 (P5).
Depends on T003 for decisions 1, 2, 5.

### FR-052: strip first, then re-earn

- [x] T069 [US1] Remove `.shiny-edge` (the 8s infinite conic-gradient gold rim with three glow shadows at
  `app/globals.css:481-516`) from the hero's secondary CTA (`app/(main)/page.tsx:118`) and the header
  (`components/layout/Header.tsx:144`). FR-052: premium "MUST NOT depend on decorative excess, glow, or
  visual noise."
- [x] T070 [P] [US5] Delete `components/home/ModernWhiteWave.tsx` and its mount — a stock page-builder
  divider with four gradients, a `feGaussianBlur` glow filter and dashed "specular crests"
  (`:18-99`), and the element least belonging to this brand world.
- [x] T071 [P] [US1] Remove the decorative blur blobs: `blur-3xl` champagne at
  `components/home/BrandShowcase.tsx:24`, the `blur-2xl` wash plus `.beam`/`.glow` ellipse at
  `app/(main)/home.css:503-522`, and the hover-only radial red wash at
  `components/home/TrustBento.tsx:70-74`.
- [x] T072 [P] [US5] Retire `.grad` gradient-shimmer text (`app/globals.css:623-629`, used at
  `app/(main)/page.tsx:88,112`) and the `animate-ping` hero dot (`:70`); choose one accent treatment for
  emphasis and apply it uniformly, which is the single binding visual rule in Constitution IV.
- [x] T073 [P] [US5] Reduce the ground's work to what the content cannot: the five stacked body radial
  glows (`app/globals.css:137-142`), the `body::before` glow layer (`:145-154`), the per-section
  alternating radial glow and third-section darkening band (`:186-224`), the fixed blurred top scrim
  (`:426-436`), and the 20-point drifting starfield (`:440-473`) — which is also why the page runs
  16,566px at 360px for 11 sections. Coordinate with `components/atmosphere/PageGround.tsx` so the scroll
  ground and the removed layers are one decision, not two partial ones, and with owner decision 5.
- [x] T074 [P] [US5] Replace the site-wide `backdrop-filter: blur(20-22px)` frosted-glass card treatment
  (`app/globals.css:342-379`) and the 15vw `-webkit-text-stroke` footer wordmark
  (`components/layout/Footer.tsx:117-121`, hidden from assistive tech and carrying no information).
- [x] T075 [US1] Re-compose the hero in `app/(main)/page.tsx:56-161` and the section headers in
  `components/home/SectionHead.tsx` (styles in `app/(main)/home.css`) to carry the premium after the strip —
  this is the substantive design task, not a cleanup: deliberate hierarchy, proportion and whitespace per
  Constitution IV, judged in the browser at 360 before 1280.

### Typography and numerals (Constitution II, the parts that fail)

- [x] T076 [P] [US5] Zero the tracking on Persian text — 45 declarations in 31 files reach ~50 Persian
  strings (`audits/04`). Start with the highest-traffic: `.eyebrow` `letter-spacing: 0.08em`
  (`app/globals.css:611`) on 6 homepage eyebrows, `tracking-tight` on every `<h1>`/`<h2>`
  (`app/(main)/page.tsx:78`, `shop/page.tsx:24`, `checkout/page.tsx:18`, `components/home/SectionHead.tsx:61-122`,
  `components/layout/Header.tsx:106`), `components/shop/ProductCard.tsx:135` (0.18em on the Persian brand
  name, repeating on all 189 cards) and `components/shop/ProductDetail.tsx:240,267,297,309,321,416`.
  FR-057: "Tracking breaks letter joining in Persian script." Apply the existing precedent at
  `app/(main)/home.css:291-307`; leave Latin-only decorative labels alone, which FR-057 exempts.
- [x] T077 [P] [US5] Insert the ZWNJ in the 8 «جستجو» occurrences: `components/layout/Header.tsx:127,131,132`,
  `components/admin/products/ProductsAdminClient.tsx:66,67,72`,
  `components/shop/FilterSidebar.tsx:71,72`. FR-058. Note the count *grew* from the 3 the checklist
  recorded, which is the argument for T084.
- [ ] T078 [US5] Convert the 20 authored Latin-digit sites to Persian numerals, per FR-011/SC-007: worst is
  `−{off}٪` at `components/shop/ProductCard.tsx:186` (a raw number beside a Persian-digit price on the same
  card), then `components/home/TrustBar.tsx:42` ordinals beside `toFaDigits` output on the same page, the
  `lib/content/home.ts:180-265` ordinal fields, `components/shop/ShopBanner.tsx:24,29`,
  `components/partners/PartnerForm.tsx:94-96`, and `components/shop/FilterSidebar.tsx:157,170` number
  inputs. Use the existing `formatToman`/`toFaDigits`; research D7 rejects a new layer.
- [x] T079 **Resolved by decision 6.** SC-007 is scoped to interface-authored strings: 186 of 189 product names and 148
  spec sets interleave Latin digits with Persian in `data/hami-products.json`, which is frozen. Either the
  merchant corrects the source, or SC-007 is scoped to interface-authored strings. Merchant product text renders **exactly as written** — including `512` inside a Persian name — because
  `data/` is frozen and converting it would make the screen disagree with the shop's own wording. `spec.md`
  SC-007 is NOT amended; the narrowing is recorded in `notes/owner-decisions.md` §6 and reported as
  met-with-stated-scope, never as "zero mixed screens". T078 is now the whole of the numeral work.
- [x] T080 [P] [US5] Fix the validator band: accept the pasted `0098…` form and normalise digits in
  `lib/phone.ts:8-13` (FR-062); add the landline rule that does not exist anywhere in `lib/` and apply it to
  `shopPhone`, currently `min(7).max(20)` with no shape check (`app/api/partners/route.ts:44`) (FR-063);
  give the checkout postal-code field at `components/checkout/CheckoutClient.tsx:307-311` its length hint,
  `dir="ltr"` and validation, matching the partner form which already does all three (FR-064).
- [x] T081 [P] [US5] Correct the two RTL-direction back-links that point forward for a Persian reader:
  `components/admin/orders/OrdersAdminClient.tsx:131` and `OrderAdminDetailClient.tsx:265` pair «بازگشت به…»
  with `ArrowLeft` (FR-013).

### Identity and coherence (US5)

- [x] T082 [US1] Put a supplied official logo file into the header identity: the four assets in `public/`
  (`HamiHamrah(حامی همراه)-Logo.png`, `طرح اصلی لوگو-انگلیسی.png`, `قسمت-فارسی-لوگو.png`,
  `قسمت-فارسی-لوگو-رنگ-برعکس.png`) are imported by nothing, while `components/layout/Header.tsx:11,100-105`
  renders a 1254×1254 derivative at 36px and re-typesets the name behind `hidden … sm:block`
  (`:106-108`) — so at 360/390 there is no readable identity. FR-015 and the Assumption that the official
  files are "used as supplied, not redrawn". Depends on T003 decision 1 only if the supplied files prove
  unusable, in which case amend FR-015 per research D9.
- [ ] T083 [US5] **Depends on T073 — strip first, then extend (decision 5).** Unify the page-heading grammar: the homepage's pill + gradient word + swash versus
  `.section-label` numerals on every interior page (`app/(main)/shop/page.tsx:19-27`, `cart/page.tsx:13-21`,
  `orders/page.tsx:14-21`, `partners/page.tsx:15-23`), and give `/login` and `/register` real page headers
  (both are currently a bare centred card, `login/page.tsx:11-18`). Fix the decorative numeral sequence
  while there: ۰۰۱ appears on both /shop and /cart. FR-049. Then open the atmosphere to every shopper page:
  remove the `pathname === "/"` gate at `components/atmosphere/PageGround.tsx:47` so `/shop`, the product
  page, `/cart`, `/orders` and `/partners` inherit the scroll ground — the owner chose "extend it to all
  pages" (`notes/owner-decisions.md` §5). Order matters: extending before T073 strips would multiply the
  glow field across six surfaces instead of one.
- [x] T084 [P] [US5] Add the guard tests in `tests/unit/persian-typography.test.ts` that stop the
  typographic band regressing: a unit pass over the
  authored string sources asserting zero non-zero `letter-spacing` on Persian literals, ZWNJ presence in the
  words FR-058 names, and no Latin digits in interface-authored strings. `audits/04` found zero coverage for
  FR-057/058/011 and the «جستجو» count grew from 3 to 8 since the last check.
- [ ] T085 [US1] Rebuild the above-the-fold in `app/(main)/page.tsx:68-139` at 360×800 so FR-014's
  "without requiring the shopper to scroll" is actually true: `audits/05` places the trust row at y≈845 (below the fold at 800, partly behind
  the dock at 900) and the store proof as a stacking second child. Re-measure against T002's baseline, not
  the computed estimate.
- [ ] T086 [P] [US1] Fix the header collapse at 360px: `components/layout/Header.tsx:142-148` keeps
  «شروع همکاری» visible on phone (`h-12 px-8`, ~174 of 336px), squeezing the search field to a ~58px empty
  pill, and duplicating the hero's CTA in the same screen.
- [x] T087 [P] [US1] Fix the rotating headline word — illegible for ~460ms of every 2.8s, with the existing
  baseline capture showing two to three words superimposed (`components/ui/flip-words.tsx`, used at
  `app/(main)/page.tsx:86-90`). Reduced-motion already settles it; the default state must read.
- [ ] T088 [P] [US5] Reconcile the undeclared design-system pin with FR-051 and Constitution IV:
  `tailwind.config.ts:62-121` hard-codes `#640211`/`#E5D3B3`, six radii and five named shadows of which four
  are `glow-*`, and `:124-136` carries a comment saying "Arbitrary durations outside this scale are not
  allowed". Also `aqua`, `champagne` and `brass` are all `#E5D3B3` (`:68-82`) while `app/layout.tsx:46-48`
  describes "muted antique aqua … not the previous champagne-yellow" — intent and token disagree, and half
  the accent decisions were made against a colour that does not exist.
- [ ] T089 [US1] Rebuild or remove the eight authored-filler homepage sections per FR-018 and FR-008
  (`audits/05` section table): `B2bSection` (whose step 03 promises a panel
  `components/home/B2bSection.tsx:51-55` says does not exist), `AccessoryUniverse` (a CSS gradient plus three
  strings), `OnlineServices`, `TrustBento`/`WhyHamiProofs`, `FinalConversion`. The mounted section count may
  legitimately fall; a section with nothing true to say comes out.
- [x] T090 [P] [US5] Delete the dead code the audits surfaced so it stops being mistaken for available
  options: unmounted `TrustBar`, `MobileNav`, `ui/CardSwap.tsx`, and the orphan `categoryMosaic` /
  `brandWall` / `tickerItems` / `customerContentNote` data in `lib/content/home.ts`.
  **The task's premise was half wrong, and the wrong half was the part that would have cost something.**
  `categoryMosaic`, `brandWall` and `customerContentNote` are all live — mounted through
  `ShopBanner`/`StoreExperience` and read by `lib/shop-category-tiles.ts`. Deleting them as "orphan data"
  would have removed working homepage furniture. Deleted: `TrustBar` (its slot is now
  `components/home/MobileQuickRoutes.tsx`), `MobileNav`, `ui/CardSwap.tsx`, `ModernWhiteWave`, and
  `tickerItems` — which was genuinely unreachable, and was the only animated marquee left after T072.

### Interaction quality (US5)

- [x] T091 [P] [US5] Fix the five controls that respond visually and deliver nothing: the inert
  «تلاش دوباره» at `components/home/FeaturedProducts.tsx:177` (`setTab(tab)` with the same value — the
  error state's primary action does nothing), the link labelled «تلاش دوباره» pointing at the current page
  (`components/shop/ShopResults.tsx:129-133`), «اطلاعات فروشگاه» anchoring to its own section
  (`components/home/StoreExperience.tsx:140`), and the expand chevrons on brand rows with no story
  (`components/home/BrandRows.tsx:84-102`, revealing a fixed-height empty band). FR-043: an element "MUST NOT
  be operable in a state where it cannot respond".
- [ ] T092 [P] [US5] Complete the state treatment set on the primitives: `ui/button.tsx:7-24` declares no
  `focus-visible` of its own and relies on the zero-specificity `:where()` global at
  `app/globals.css:165-168`; `summary` is missing from that selector list while present in the tap-highlight
  list at `:1050`, so the three homepage FAQ controls lose the brand ring; add `active:`/pressed to the
  hand-rolled pills (`FeaturedProducts.tsx:118`, `NewArrivals.tsx:67`, `AccessoryUniverse.tsx:72`); and give
  a disabled control a reason (`ui/button.tsx:7` `disabled:pointer-events-none` silences it entirely).
  FR-043, FR-044.
- [x] T093 [US5] Add the missing 44px floor above `md`: the patch at `app/globals.css:1127-1166` is
  mobile-only and matches class substrings, so `Header.tsx:133` search (`md:h-9`), `ShopResults.tsx:74` sort
  select, `ui/button.tsx:28` `sm:h-9`, `FeaturedProducts.tsx:146` tabs (~32px) and
  `AccessoryUniverse.tsx:72` (~34px) all stay undersized, and anything sized by inline `style` escapes it
  (FR-045).
  **Resolved differently than worded, 2026-09-23.** The task asked for the 44px floor to be extended
  "above `md`". Done, but the axis was wrong rather than the range: the rules exist because of a thumb, so
  the block moved to `@media (pointer: coarse)` rather than being widened, which also fixes the landscape
  phone (844px wide) and leaves every fine-pointer surface its compact controls. The class-substring
  matching was kept and one selector widened (`a[class*="flex"]`), because three components carried
  `min-h-11 … md:min-h-0` pairs that re-tied the same thumb rule to a width breakpoint. Controls sized by
  inline `style` still escape it — none exist in the purchase path today, and the next one that appears
  needs the size on the element, not in the stylesheet. Measured: `notes/findings.md`.

- [x] T094 [P] [US5] Fix the async-state jumps FR-046 names: `FeaturedProducts.tsx:102` gates skeletons on
  `isLoading && products === null` so a tab switch keeps stale cards with no busy affordance and then swaps,
  jumping the section; `NewArrivals` reserves 4 skeletons against a 6-item result;
  `components/layout/CartButton.tsx:19` renders the badge only when `itemCount > 0`, reflowing the header on
  the first add; `components/shop/AddToCartButton.tsx:63-65` swallows every non-auth failure silently.
  **Done 2026-09-24 (T-P2), but three of the four defects were already gone or never existed.** Items 1 and 2
  describe the pre-band-1 loading model: `FeaturedProducts` has no `isLoading` and `NewArrivals`' `products`
  and `error` are `useState` with no setter, so both skeleton branches were unreachable — deleted, with the
  never-referenced `ProductSkeletonCard` and unread `activeBadge`. Item 3 is **false**: the badge is
  `position: absolute` inside a `relative` button, and mounting it moved the header 78→78 at 360 and 90→90 at
  1280, siblings and document height unchanged to 0.01px. Item 4 was real and understated — a failed add now
  says its reason in Persian via a `role="alert"` chip keyed on `error.code`, card height invariant at
  392.06px/567.6px. Evidence: `notes/parallel-agent-decisions.md` §"three of the four named defects".
  **Follow-up this task surfaced, not fixed here:** `text-destructive` on white measures 3.66:1, and the idiom
  appears in twelve files — the ones inside `.product-card` fail AA.
- [x] T095 [US5] Complete the tab semantics at `components/home/FeaturedProducts.tsx:135-160`: `role="tab"`
  and `tablist` with no `aria-controls`, no `tabpanel` and no arrow-key handling — two tab stops that behave
  as buttons (FR-044, FR-047's "no information available only through interaction pattern").
  **Pattern finished 2026-09-24 (T-P3)**, verified off the DOM: roving tabindex (one stop), `ArrowLeft`
  advances per FR-028/K2, `Home`/`End`, `aria-controls` → `#featured-panel`, panel `aria-labelledby` the
  selected tab and focusable with a real ring. **But the task's premise was wrong about which half matters:**
  the two tabs render the *same six records in the same order*, because both rails filter
  `specialOffer: true` and `sort: "special"`'s first comparator key is therefore always equal — it falls
  through to `updated_at`, which is `sort: "newest"` (`lib/home-rails.ts:31-40`, `lib/catalog.ts:324-331`).
  A control advertising a distinction it cannot deliver is a Constitution I question, not an ARIA one, so it
  is reported rather than fixed here: either `special` gets a comparator that means «ویژه» (discount depth),
  which also changes `/shop?sort=special`, or the tablist goes. See
  `notes/parallel-agent-findings.md` §"The defect under the defect".
- [x] T096 [P] [US5] **Closed as verified-not-a-defect, 2026-09-24 — the flash is not in the
g  current code.** See `notes/findings.md`. Original task text:
  Fix the `Reveal` flash: `components/home/Reveal.tsx:26-37` SSR-paints below-fold
  content, hides it in an effect, then reveals it on intersection — a visible flash-then-vanish on a slow
  connection, the inverse of a loading state (FR-046, FR-048's reserve-space intent).
- [x] T097 [P] [US2] Fix the checkout order inversion: `components/checkout/CheckoutClient.tsx:441` applies
  `order-first` on mobile so the summary sits visually above controls that come later in the DOM, breaking
  FR-044's "keyboard order MUST follow visual order".

### The ground, judged on screen after the strip (owner follow-up, 2026-09-23)

The owner's verdict on band 3 part 1+2 was "great, but still not luxurious", and the specific complaint
that turned into work here was that the page background is **one colour all the way down**. It was true,
measured at the gutter pixel: `#1D0308 → #150105 → #110104 → #0E0103 → #0C0002 → #0B0003 → #0B0104` across
16,384px, so the whole back half of the page moves three units in one channel. Owner explicitly rejected a
light theme — the ask is *travel within the dark palette*, not white.

- [x] T112 [US1] Give the scroll ground real travel. `lib/atmosphere/progression.ts` moves from the
  four-stop descent to a six-stop tour — `#3A0C12` arrival → `#2A0713` goods → `#1A0A16` shelves →
  `#0E1122` ink at the trade chapter → `#320B0A` ember at the store → `#160406` close — every leg ≥ ΔE 9,
  no stage within ΔE 6 of the one two places along, worst text contrast 5.59:1 across the 500-step sweep,
  all tones inside `LEGIBILITY_BAND`. Travel is carried by hue and chroma because lightness is the one
  axis a dark ground cannot spend freely. `components/atmosphere/page-ground.css` goes from the draft
  `opacity: .5` to 1 — the blend was halving every leg before it reached a pixel, and the glow field it
  was negotiating with was deleted by T073. The direction assertion in
  `tests/unit/atmosphere-progression.test.ts` is replaced by the four guards above (it had been proving
  monotone luminance, which the invisible palette passed). Recorded as 002 Amendment Record #4 against
  FR-001, FR-003 and the "Coherence beats variety" assumption.
- [ ] T113 [US1] First-load choreography for `/shop`. The surface has **zero** entrance motion today —
  `app/(main)/shop/page.tsx` and `components/shop/ShopResults.tsx` contain no `Reveal`, no `animate-*`, no
  transition — so the listing arrives all at once while the homepage reveals in stages. Three beats:
  header and search settle, banner lines, then the grid in a ~50ms stagger capped at six items. Hard
  constraints, each of which has already been paid for once in this feature: CSS-only with no JS gate (band
  2 made the listing server-rendered so a crawler and a slow connection see 24 products in the document —
  an entrance that hides content until hydration throws that away), `prefers-reduced-motion` returns the
  finished state immediately (FR-047), and the first text paint is never delayed.
- [x] T114 [US1] The store photograph returns to `components/home/ShopWindow.tsx`, per the owner on
  2026-09-23, reversing decision 2. Use the merchant's own file (`public/store/shop-upright.jpg`,
  orientation-corrected only), not `shop.jpg`, which is an AI re-lit derivative of it; and do not re-add the
  "MASHHAD FLAGSHIP" / "SHOWROOM" badges or the invented brand lightboxes that were on the old frame.
  Principle I still forbids the image standing for something the shop does not have.

- [ ] T116 [US1] **Light chapters — the owner's live ask (2026-09-24).** *"the background shifting and
  transform is not my taste - is wayyy too boring - use white somewhere."* The tonal tour (T112) is not
  enough on its own: the page needs real light against the dark, the way `palatemcp.com` alternates opaque
  per-section bands (`#0B0B0D → #F7F5EE → #E2553D → #1A1512 → #E9E2D2`, measured at eleven scroll positions
  with its `body` constant at `rgb(30,17,17)`). Two paper chapters, dark → paper → dark → paper → dark,
  hero and closing CTA staying dark. Specified in full — mechanism, hazards, contrast numbers, acceptance —
  in `notes/parallel-agent-plan.md` §6, and assigned to the second agent working this checkout.

- [ ] T117 [US1] **`--signal` / `text-destructive` fails on every light surface, and the pair just built
  light surfaces.** `#E4573F` measures **3.66:1 on `#ffffff`** and **3.25:1 on the T116 paper `#f4f1ea`** —
  under AA's 4.5:1 for body text — and the `bg-destructive/10` wash behind it measures **1.13:1** against the
  same ground, so the "error" chip is nearly invisible on white while being loud on the dark canvas where it
  was designed. 37 usages across the components; most sit on the dark canvas and are fine (5.60:1), which is
  exactly why nobody noticed until the paper chapters landed. The partner worked around it inside
  `AddToCartButton` with a solid `#8E1B10` chip and white text (9.07:1) rather than touching the palette.
  Fix it at the token layer with T088, not per-component: a light-surface variant of `--destructive` and
  `--signal`, scoped the same way `.band-paper` scopes `--foreground`. Acceptance: every text token at ≥ 4.5:1
  against white, `#f4f1ea` and the dark canvas, measured across the sweep, not asserted.

- [ ] T115 [US1] Make the ground reach the pixels it owns. `verification/ground-travel.mjs` reports the
  authored tone arriving at the gutter unpainted at only **9 of 13** scroll positions: at 25%, 42% and 58%
  the gutter shows `#110003` / `#0e070f` / `#10060d` where `lib/atmosphere/progression.ts` holds
  `#220915` / `#130e1d` / `#180f1b`, i.e. a section painting its own opaque background over the ground, and
  at 8% the left and right gutters disagree. Now that the arc has amplitude this is the limiting factor on
  how much of it a shopper sees, so it belongs with T083's extension to the interior pages rather than as
  decoration work.

**Checkpoint**: the `quickstart.md` §4 walk at 360 and 1280, per surface, against T002's baseline. Band 3's
honest end-state is "built, walked, screenshotted, awaiting the panel" — not "done" (research D11).

---

## Phase 6: Band 4 — Criteria that need people (agents must not fill these)

**Purpose**: record what the code cannot prove. **Every task here stays visibly unchecked** with the missing
instrument named, on the precedent 004's T049 set and the owner endorsed: an empty box is information, a
ticked one is a fabrication.

- [ ] T098 [US1] **CLOSED UNMEASURED by decision 7 — do not fill this box.** SC-001 — 10 shoppers new to the business, five seconds on the first screen, at least 8
  state unprompted that Hami Hamrah is an established trustworthy retailer and 6 name a specific reason.
  Write the protocol and the result to `specs/001-premium-rtl-storefront/notes/panel-sc001.md`; `audits/05`
  confirms no record, transcript or rating exists anywhere.
- [ ] T099 [US1] **CLOSED UNMEASURED by decision 7.** SC-012 — side-by-side against a well-regarded global technology brand's site: 7 of 10 rate
  Hami Hamrah equally or more polished, mean ≥ 4/5 on "does this feel like a premium, intentional brand".
  Write the comparison protocol and result to
  `specs/001-premium-rtl-storefront/notes/panel-sc012.md`. No comparison has ever been run.
- [ ] T100 [US3] **CLOSED UNMEASURED by decision 7.** SC-013 — fewer than 10% of tested shoppers reach a product they wanted and leave because
  they cannot tell how to proceed. Record the test script and results in
  `specs/001-premium-rtl-storefront/notes/panel-sc013.md`. No instrumentation exists. The nearest code
  signal is negative and is recorded in `audits/05`.
- [ ] T101 [US4] **CLOSED UNMEASURED by decision 7.** SC-011 — in at least 9 of 10 phone enquiries, what the site said matched what the shopkeeper
  said about price and availability. Log the requirement and whatever the merchant records in
  `specs/001-premium-rtl-storefront/notes/enquiries-sc011.md`; there is no `tel:` tracking or enquiry log of
  any kind.
- [ ] T102 [US4] SC-015 refresh tolerance — build a synthetic predominantly-obtainable version of the export
  and replay the storefront against it, asserting no layout, wording rule or merchandising threshold changes
  and no section is left empty or overfull. The fixture does not exist; `data/` is frozen so it lives in
  `specs/001-premium-rtl-storefront/fixtures/`. T046/T047 are prerequisites.
- [ ] T103 [US2] SC-006 — render all 189 products and all 32 categories without breakage, clipped text or a
  populated-looking empty section. A scripted sweep is possible and is the one criterion in this phase an
  agent CAN build; write the harness and the result to
  `specs/001-premium-rtl-storefront/notes/render-sweep.md`.
- [ ] T104 [US2] SC-010 — first listing image visible within ~2s on a typical mobile connection; record the
  run and its method in `specs/001-premium-rtl-storefront/notes/sc010-lcp.md`. Needs real network measurement on hardware that means something, **not** the owner's PC; `audits/03` notes the remote
  host is not even wired in today, so the number depends on the local mirror.

**Note on T098–T102**: if the owner declines a panel again, as for 002 and 004, these stay exactly as
written and unchecked. Do not substitute a screenshot, an agent's judgement, or a "reviewed by reviewer"
line.

---

## Phase 7: Polish and cross-cutting

- [ ] T105 [P] Contract tests per contract, if not already satisfied by T005–T008:
  `tests/unit/contracts-catalog-seam.test.ts`, `tests/unit/contracts-honest-states.test.ts`,
  `tests/unit/contracts-shop-url.test.ts` — each asserting the normative tables in
  `contracts/`, especially the eight "MUST survive the rework" rules in `contracts/shop-url.md`.
- [ ] T106 [P] Write `specs/001-premium-rtl-storefront/notes/coherence.md`: what 001 now shares with 002
  (the atmosphere decision, T073/T083), 004 (the navigate-on-first-press rule, T059) and 005 (the category
  vocabulary, T056), and where 001 deliberately overrides each.
- [ ] T107 Confirm Constitution III compliance end-to-end: no file under `data/`, `app/api/` or `prisma/` was
  modified — `git diff --stat main -- data app/api prisma` must be empty.
- [ ] T108 Run `npm run typecheck` and `npx vitest run tests/unit` clean, remembering the DB-wipe hazard in
  the header, and record both in `notes/findings.md`.
- [ ] T109 Walk `quickstart.md` §1–§6 in order and write the results to
  `specs/001-premium-rtl-storefront/notes/validation.md`, marking each claim as measured, computed, or
  unmeasured — no inherited confidence.
- [ ] T110 Update the knowledge graph with `graphify update .` per `CLAUDE.md`, scoped to app source and docs.
- [ ] T111 [P] Housekeeping the audits surfaced: `app/api/orders/route.ts:42-46` renders order ids in Latin
  digits to shoppers; `lib/api-error-fa.ts:26` returns the identical string from both branches of a ternary;
  the 31 orphaned techBazar PNGs and the two unreferenced category images (`public/images/categories/home.png`,
  `tv.png`) remain the owner's call.

---

## Dependencies and execution order

### Band gates, in order

- **Phase 1 (T001–T004)** — no dependencies. T003 gates the trust-copy and design decisions in band 0 and all
  of band 3.
- **Phase 2 / band 0 (T005–T037)** — the Principle I gate. **Blocks every later phase.** Write T005–T008
  first and watch them fail; they encode the requirements, so the implementation tasks are done when those
  four go green.
- **Phase 3 / band 1 (T038–T048)** — depends on band 0's checkpoint. T042 must land with T038–T041 or the
  shape drift that caused the price defect stays possible. T046/T047 unblock T102.
- **Phase 4 / band 2 (T049–T068)** — depends on band 1 (a server-rendered surface is where the comparators,
  normalisation and new routes belong). US2 tasks (T049–T061) and US3 tasks (T062–T068) are independent of
  each other.
- **Phase 5 / band 3 (T069–T097)** — depends on band 0 for trust copy and on T003 decisions 1, 2 and 5.
  T069–T075 must precede T075/T085 composition work: do not recompose over layers still scheduled for
  deletion.
- **Phase 6 / band 4 (T098–T104)** — after bands 0–3, since a panel is worthless against a page that
  misprices.
- **Phase 7 (T105–T111)** — after each band, as its verification step; T107–T109 at the end.

### Within the phases

Tests before implementation (T005–T008 before T009+). Seam before consumers of the seam. Removal before
replacement — deleting a glow layer or a filler section precedes any new composition that might fill the
same space, so the void is judged rather than papered.

### Parallel opportunities

- T005–T008 (four independent test files) and T022–T033 (one file each, all deletions) are the largest
  parallel block in the feature.
- After band 1: US2 (T049–T061) and US3 (T062–T068) run in parallel; after band 3's strip phase, T076–T097
  parallelise by file.

### Nothing is decision-blocked any more

T003 was answered in full on 2026-09-23 (`notes/owner-decisions.md`), which cleared T018, T022–T030, T034,
T073/T083 and T079. Two items stay open for reasons that are not decisions: **T048** (the
placeholder-vs-Principle-I collision was never put to the owner; band 1 only) and **T082** (blocked only if
the four official logo files prove unusable at 36px, which is found out by doing it). T098–T101 are
closed-as-unmeasured, not blocked. T073 now gates T083's extension step.

---

## Parallel examples

```bash
# Band 0's test block — four independent files, write all first and let them fail:
Task: "Seam-shape guard in tests/unit/catalog-seam-shape.test.ts"
Task: "Obtainability guard in tests/unit/obtainability.test.ts"
Task: "Price-state guard in tests/unit/price-state.test.ts"
Task: "Admissible-claim guard in tests/unit/admissible-claims.test.ts"

# Band 0's deletion block — one file each, no shared edits:
Task: "Remove «گارانتی رسمی» from components/shop/ProductCard.tsx:191-193"
Task: "Remove «ضمانت اصالت ۱۰۰٪» from components/shop/ProductDetail.tsx:256-258"
Task: "Delete the fabricated email at app/(main)/partners/page.tsx:67-68"
Task: "Delete the 'photo pending' placeholder in components/home/WhyHami.tsx:12,65"

# Band 2 after band 1 — US2 and US3 do not touch each other's files:
Task: "Persian search normalisation in lib/shop-filters.ts"
Task: "Specifications block in components/shop/ProductDetail.tsx"
```

---

## Implementation strategy

### MVP increment (band 0 alone)

Phases 1–2 are a shippable, demonstrably valuable increment: the store stops misstating prices,
availability, warranty and identity. Nothing else changes visually. For a business whose entire position is
a 20-year in-person reputation, that is the increment with the highest value density in the feature, and it
is the one that unblocks honest measurement of everything after it.

### Then, in order

1. Band 0 → **stop and verify** with the four guard tests plus the `quickstart.md` §2 state-by-state walk.
2. Band 1 → verify by `curl` that products are in the served HTML (T043).
3. Band 2's US2 half → the finding task (T061) becomes possible; then the US3 half → a product page reads as
   finished and honest.
4. Band 3's strip phase (T069–T074) → look at what is left before designing anything new.
5. Band 3's composition, identity and interaction tasks.
6. Band 4 → schedule the panel once, for 001+002+004 together.

Each band is deliverable and re-verifiable on its own; none of them needs a later band to be worth shipping.

### Standing rules for whoever executes

- **Quote the requirement in the commit**, not the ticket number. Several rules here (FR-004's strict
  inequality, FR-024's sort-to-end in both directions) failed previously because an implementer paraphrased
  them.
- **Do not soften a claim into compliance.** Rewriting «قیمتی بی‌رقیب» as "competitive pricing" keeps the
  violation and adds vagueness. Delete it, or supply the fact (research D5).
- **Never fill a band-4 box**, and never fill 002's T047 or 004's T049 retroactively.
- **Behaviour in a browser is evidence; frame rate on the owner's machine is not.** One performance verdict in
  this project has already been withdrawn for exactly that reason.
- Commit after each task or each tight group; `notes/findings.md` records verification as it happens.

---

## Notes

- [P] = different files, no dependency on an incomplete task.
- Story labels: US1 first impression/trust (P1), US2 find the product (P2), US3 inspect and trust what is
  shown (P3), US4 act on availability honestly (P4), US5 one coherent brand across surfaces (P5).
- Band → phase: band 0 = Phase 2, band 1 = Phase 3, band 2 = Phase 4, band 3 = Phase 5, band 4 = Phase 6.
- Every file:line above came from `audits/01…05` and was verified by reading the file. If a line has moved
  by the time a task is picked up, re-derive it — do not trust the number, trust the claim it evidences.
- 111 tasks. Total per band: setup 4, band 0 = 33, band 1 = 11, band 2 = 20, band 3 = 29, band 4 = 7,
  polish 7.
