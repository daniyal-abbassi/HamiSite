# Research: Premium Persian RTL Storefront

**Feature**: `specs/001-premium-rtl-storefront` | **Date**: 2026-09-23
**Input to**: [plan.md](./plan.md). Each decision below resolves a question the Technical Context raised
or settles a choice the gap ledger forced. Evidence comes from the five band audits in `audits/`, all
file:line references verified by reading the files.

---

## D1 — Repair the product page against the shape the seam actually emits

**Decision**: Change `components/shop/ProductDetail.tsx` to read the fields
`lib/catalog.ts::serializeProduct` really returns — `variant.price`, `variant.compareAtPrice`,
`basePrice`/`displayPrice` at the product level — and delete the `apiGet<ProductDetail>` unchecked cast
so the boundary is typed by a declared contract rather than an assertion. Where the old
`types/store.ts` shape no longer matches, the type is corrected rather than the component kept
comfortable.

**Rationale**: The defect is not a formatting bug; it is a silent contract break. `ProductDetail.tsx:191`
reads `selectedVariant.unitPrice`, a key the serializer does not emit, and `formatToman`'s own
`Number.isFinite` guard (`lib/utils.ts:10-11`) converts that `undefined` into a plausible-looking Persian
string instead of a crash. So the page 200s, renders, and lies on 105 of 189 products — and prints "call
us for a price" on the other 84, which do have prices. An unchecked generic at the fetch boundary is the
reason TypeScript could not see it. Fixing the read without fixing the typing leaves the same failure mode
available to the next field that drifts, and `specs/001/contracts/catalog-seam.md` exists to make drift
loud.

**Alternatives considered**: (a) add `unitPrice` to the serializer as an alias — rejected, it enshrines a
second name for one value and the frozen-adjacent `app/api/*` routes already expose the current shape;
(b) make `formatToman` throw on non-finite input — rejected as the only fix, because the string it
returns is *correct* for the genuinely price-less records; the guard is load-bearing and honest, the caller
is what is wrong; (c) re-migrate the PDP to Prisma — out of the question under Constitution III.

---

## D2 — Browse server-side through the seam; delete the client round-trip

**Decision**: `/shop`, the product page and the homepage rails render their product data on the server
through `lib/catalog.ts`, and the `/api/products*` fetches that back them today are removed from the
shopper path. The API routes stay for the frozen cart/checkout/admin consumers.

**Rationale**: Principle III says browsing MUST NOT require an API round-trip, and it currently does at
every surface that matters: `app/(main)/shop/page.tsx:29-31` prerenders `Suspense fallback={null}` and
`ShopClient.tsx:101` fetches client-side, so the served document contains zero products;
`ProductDetail.tsx:56` fetches `/api/products/[slug]`. Two consequences, and the second is the one that
should decide it: an SEO-facing storefront for a real business is invisible to any crawler that does not
run JavaScript, and the fetch boundary is precisely where D1's type lie entered. Server rendering removes
both the principle breach and the class of defect that slipped through it.

**Alternatives considered**: (a) keep client fetches and add `prefetch`/`staleTime` tuning — rejected, it
optimises a breach instead of closing it; (b) incremental server components per section, leaving `/shop`
client-driven — rejected, `/shop` is the surface where FR-027's URL-reproducible filter state matters most,
so it must be the first to read search params on the server; (c) an RSC boundary with a client island only
for the grid/list toggle — accepted inside (b)'s shape where a component genuinely needs interactivity, but
not as an excuse to fetch.

**Consequence to hold**: search params become server inputs, so `app/(main)/shop/page.tsx` must accept
`searchParams` and pass them into `queryProducts`. That also makes the loading-state question (FR-046)
smaller on this surface, which is a bonus, not the reason.

---

## D3 — One availability state machine, and no positive default anywhere

**Decision**: The mapping from a record to (label, action) is owned by
`lib/product-identity.ts` plus the serializer's `stockType`, and is written down as
`contracts/honest-states.md`. Every fallback in the chain resolves to `call` («تماس بگیرید»), never to a
positive state. `lib/catalog.ts:200`'s `available` flag reaches the shopper layer for the first time.

**Rationale**: Three separate mechanisms currently manufacture a positive state out of nothing:
`ProductDetail.tsx:94` (`?? "limited"`), `lib/serializers.ts:13-26` (`default: return "limited"`, which
then feeds cart labels through `lib/cart.ts:71,81`), and `purchasable = stockType !== "out_of_stock" &&
stockType !== "call"` at `ProductDetail.tsx:96` — which makes `limited` purchasable, so the 16 records the
export marks `state: "limited"` **and** `purchasable: false` present as buyable. FR-002 and FR-056 both
name this exact failure, and FR-056 is explicit that refreshed data must not be able to introduce a false
claim by omission. A default that guesses "available" is that omission.

**Alternatives considered**: (a) keep the fallbacks and add a validation pass over the catalog — rejected,
a fallback is a runtime decision and a build-time check does not cover an unrecognised future string;
(b) treat `limited` as purchasable-with-a-quantity-cap, which is what the code implicitly does — rejected,
because `purchasable` is the merchant's own field and overriding it is precisely the invention Principle I
forbids; (c) hide non-obtainable products — rejected by the spec's own Assumptions ("availability is
communicated, not hidden").

---

## D4 — `categoryDepartments`: drop and log instead of throwing, and derive the counts

**Decision**: Replace the `throw` at `lib/category-departments.ts:113-126` with a filtered-out department
plus a server-side warning, and replace the embedded `kindTotal` literals at `:57-66` (and the
`showsCount: total === seed.kindTotal` rule at `:139`) with a value computed at request time.

**Rationale**: The throw was the right instinct — 004's destination-resolution fix established that a
mistyped slug must never silently render the whole catalog — but its blast radius is wrong. The function
runs on the homepage render path for every visitor, so one category emptied by a data refresh takes the
entire homepage down. And `showsCount` derived against a hand-typed 2026-09-09 total is exactly the
snapshot coupling FR-053 prohibits: after a refresh it will suppress counts that should show, or show ones
that should not. FR-054's whole point is that the composition survives 5-obtainable to mostly-obtainable
without a code change.

**Alternatives considered**: (a) keep throwing and add an error boundary around the section — rejected; an
error boundary that catches a homepage section on every request is a crash with extra steps; (b) keep the
literals and re-derive them on each export refresh — rejected, it makes a merchandising rule depend on a
human remembering to regenerate a constant; (c) drop the counts entirely — rejected, FR-028 requires
counts, and the honest version (computed reachable count, plus a stated subset relationship where the
route is narrower than the kind) is already available at `:137`.

**Also in scope**: the snapshot figures asserted verbatim in
`tests/unit/category-departments.test.ts:39-57` and `tests/unit/product-images.test.ts:79-93`
(`toBe(189)`, `toEqual(["347 اپل آیدی"])`, `[8,134]`) restate the totals that SC-005 promises are
re-verifiable *without* restating. Those assertions become property-style ("no department resolves empty",
"exactly the records with no local image get the placeholder"), which is what makes the test a guard
rather than a snapshot.

---

## D5 — Unsupported claims are deleted, not softened

**Decision**: Every trust statement outside the four verified facts is removed rather than reworded, and
the AI re-lit store photograph comes out of the interface entirely. The permitted set is: twenty years of
trading history, the Mashhad physical store, certified Redmi dealership via Radman Paj, official TCH
regional representation. Gone: «گارانتی رسمی» and «ضمانت اصالت ۱۰۰٪» (the serializer hardcodes
`guarantee: null` at `lib/catalog.ts:170`), «قیمتی بی‌رقیب» and «بهترین قیمت» (FR-017's forbidden
unspecificable comparative), «همان قیمت» at one and a hundred units (no tiers exist, `lib/catalog.ts:179`),
«انتخاب‌های بی‌نهایت», the six-logo «برندهای همکار» wall, the «فضای واقعی مجموعه» caption over an altered
image, the «لپ‌تاپ برای کار و بازی» banner (the catalog holds no laptop kind and the banner links to an
unfiltered sort), and the fabricated email at `app/(main)/partners/page.tsx:67-68`.

**Rationale**: The tempting middle path is rewording — "carefully sourced", "competitive pricing" — and it
is the wrong one, because Principle I is about what the data supports, not about how confidently the
sentence is phrased. A softened superlative is still a claim with no measurement behind it, and FR-059
names that construction specifically. On the photograph: FR-006 forbids store imagery outright and the
file's own header comment (`components/home/ShopWindow.tsx:4-20`) documents the AI re-light pass on the
owner's original — so what is on screen is not the shop, presented as the shop, which is the most
expensive kind of dishonesty available to a 20-year in-person reputation. The owner has separately ruled
that AI imagery must never represent merchandise or business facts.

**Alternatives considered**: (a) keep the photograph and re-caption it as an artistic rendering — rejected;
it is the largest image above the fold at 1280px, and a caption cannot make an invented storefront read
as specificity; (b) keep warranty language because the physical shop does give warranties — rejected on
evidence: nothing in the export carries a guarantee field, so the UI cannot say which products have it,
which is exactly FR-001's "must come from a catalog record or a merchant-verified fact"; (c) ask the
merchant to verify each claim — the right long-term move and a separate conversation, which is why
`quickstart.md` §1 includes a verification list the owner can answer in one sitting. An unanswered claim
stays out of the interface.

---

## D6 — Persian search normalisation with platform primitives, not a library

**Decision**: Fold in `lib/shop-filters.ts` before matching: NFKC-normalise, map Arabic-variant letters
(`ي`→`ی`, `ك`→`ک`), strip ZWNJ (U+200C) from both the query and the haystack, and convert Persian and
Arabic digits to Latin. Ordering uses `Intl.Collator("fa")` rather than `<`.

**Rationale**: Measured against the live export: `سیستم‌عامل` → 2 results but `سیستم عامل` → 0; `۱۰۵` → 0
but `105` → 2; `موبايل` → 0 but `موبایل` → 133. That last pair is the one that matters, because the
storefront is Persian-first and the keyboard a shopper actually has produces both forms. The `۱۰۵` case is
worse than a gap: FR-011 *forces* the interface to display Persian digits, so the site shows a product
name in a form its own search cannot match. And no library is warranted — the folding is four character
classes and one Unicode form, and `lib/validators.ts:12-17` already does exactly this for phone input,
which is the in-repo precedent.

**Alternatives considered**: (a) `normalize-persian` or a similar package — rejected on merit, not cost:
the required subset is 15 lines and a dependency would hide which rules apply; (b) Postgres full-text with
a Persian text-search config — out of scope under III; (c) store a pre-normalised search field in
`data/*.json` — rejected, `data/` is frozen and it would make the export the wrong place to fix a UI rule.

---

## D7 — Keep dates and numerals on `Intl`, and fix the sites that bypass it

**Decision**: FR-061 is already satisfied and stays as is. FR-011/SC-007 are fixed at the 20 authored
call sites that bypass the locale, not by adding a formatting layer.

**Rationale**: Every shopper-facing date already routes through `toLocaleDateString("fa-IR")` in
`lib/content/order.ts:58,65`, and the only date arithmetic in the app builds an order number and is never
displayed. That is the correct architecture and the spec is explicit that hand-rolled Persian-calendar
conversion is prohibited, because the calendar's leap rules do not follow an arithmetic cycle. The numeral
problem is the opposite shape: helpers exist and are used in ~24 places, and the failures are individual
sites that reach the DOM unconverted — `−{off}٪` at `components/shop/ProductCard.tsx:186` beside a Persian
price on the same card, `String(index+1).padStart(2,"0")` at `components/home/TrustBar.tsx:42` beside
`toFaDigits` output on the same page. A new abstraction over two working helpers would be a way of not
fixing 20 call sites.

**Consequence that must be stated rather than fixed**: `data/hami-products.json` interleaves Latin digits
with Persian inside product names (186 of 189) and specifications ("ظرفیت 512 گیگابایت"), and the seam
passes those strings through. SC-007's "no screen mixes numeral systems" is therefore **not achievable
without either editing frozen merchant data or transforming displayed product text** — and transforming a
product's own name to satisfy a UI rule is its own kind of dishonesty. This is recorded as a scoping
decision for the owner in `quickstart.md` §1, with the two live options.

---

## D8 — Strip the decoration load before adding any visual investment

**Decision**: Band 3 starts by removing the specific glow/gradient/blur mechanisms the audit enumerated,
and only then re-earns the premium through composition. The list is explicit so "make it plainer" is not a
mood: `.shiny-edge` (a spinning conic-gradient rim with three glow shadows, on the hero's secondary CTA
and in the header), the fixed drifting starfield, the five stacked body radial glows plus the
`body::before` layer, the per-section alternating radial glow and the third-section darkening band, the
blurred top scrim, `backdrop-filter` frosted glass on every card, `.grad` shimmer text on one word per
heading, the `animate-ping` hero dot, `BrandShowcase`'s `blur-3xl` blob, and `ModernWhiteWave` in its
entirety.

**Rationale**: FR-052 and Constitution IV both forbid premium-by-decoration, and the owner's original
brief says the same in its own words: "Do not interpret 'luxury' as excessive decoration, gradients,
glowing effects, visual noise." The current design is that interpretation. Two second-order reasons to do
it first: every one of those layers is a paint or composite cost on the exact surfaces whose performance
FR-009/FR-014 care about, and the 002 atmosphere work already learned that the ground's glow field sits
*z above* the content it was supposed to sit behind, which is why FR-005's gate could not be met at all.

**Alternatives considered**: (a) reduce opacities — rejected, it leaves the vocabulary and the vocabulary
is the problem; (b) rebuild the identity from scratch — allowed by Principle IV and the honest fallback if
the strip leaves nothing composed, but it is not the first move; (c) keep it because it tests well with
the owner so far — the record does not support that: the owner's own verdict on 004's section was "simple,
boring, not styled and mis-placed", which is what generic-luxury looks like from the inside.

**Open sub-decision (owner's, not mine)**: the scroll-driven atmosphere ground is mounted only on `/`
(`components/atmosphere/PageGround.tsx:47`), which is a large part of why every interior page reads as a
different project (FR-049). Either it extends to the shopper surfaces or the homepage treatment is retired
to something every page can match. That is a taste call about the brand and it is written into
`quickstart.md` §1.

---

## D9 — The official logo assets get used, or the requirement is retired honestly

**Decision**: FR-015 is met by putting a supplied official logo file into the header identity. If the
owner judges the four supplied files unusable at 36px, the requirement is amended to name the mark that
will be used instead, rather than left silently unmet.

**Rationale**: `public/` holds four pre-existing official assets — `HamiHamrah(حامی همراه)-Logo.png`,
`طرح اصلی لوگو-انگلیسی.png`, `قسمت-فارسی-لوگو.png`, `قسمت-فارسی-لوگو-رنگ-برعکس.png` — and **nothing
imports any of them**. `components/layout/Header.tsx:11,100-105` renders `public/brand/hami-mark.png`, a
1254×1254 wine-on-white derivative, at `size-9` (36px), and re-typesets the brand name in Estedad at
`Header.tsx:106-108` behind `hidden … sm:block`. So at 360px and 390px — the widths the owner designs for
— the header carries a glyph and no readable identity, and the brief's "existing official logo files are
the identity source, used as supplied, not redrawn" (Assumptions) is unmet twice over: not used, and
redrawn.

**Alternatives considered**: (a) add a redrawn SVG wordmark — rejected by the same Assumption; (b) widen
the 36px mark — does not fix an unreadable derivative; (c) accept the current monogram and amend FR-015 —
legitimate, but it has to be an owned decision in the Amendment Record rather than a requirement that stays
falsely ticked.

---

## D10 — Dedicated brand and category routes, not more query strings

**Decision**: Add `app/(main)/brands/[slug]/page.tsx` and `app/(main)/categories/[slug]/page.tsx` as real
destinations, with the existing `/shop?brand=` and `/shop?category=` links redirected or replaced to point
at them.

**Rationale**: FR-029 asks for "a dedicated place, not only through a filter", and today there is no such
place anywhere in the repo — every one of 004's six brand rows and 005's nine category panels is a query
string. That is not only a missed requirement: it is why the two features each grew their own vocabulary.
`/shop?category=موبایل` holds 8 products while the kind it stands for holds 134, so three different doors
(«موبایل», «گوشی موبایل», «موبایل و تبلت») lead a shopper to three different subsets of one department —
which is FR-028's "undifferentiated list" defect wearing a curated label.

**Alternatives considered**: (a) keep query-string destinations and call the filter panel the dedicated
place — rejected: the panel is `hidden lg:block` / a closed sheet on phone, i.e. not a destination on the
primary device; (b) merge 004's and 005's vocabularies into one taxonomy file without adding routes —
better than nothing and worth doing either way, but it does not satisfy "dedicated place", and a route is
where a category gets the curation FR-028 means (intro copy, subcategory listing, count) which a query
string cannot host; (c) retitle panels to hide the subset problem — rejected as exactly the kind of
wording change D5 refuses.

---

## D11 — Human-panel criteria stay visibly empty, with the instrument named

**Decision**: SC-001, SC-011, SC-012 and SC-013 are left unmeasured with the missing instrument written
down, and no agent fills any panel table.

**Rationale**: 004 set the precedent and the owner endorsed it twice on this project: for 004's T049 the
owner declined to assemble reviewers, and the ruling was that the task stays visibly unchecked and nobody
fills the table on their behalf. A ticked box that stands for "10 shoppers judged this premium" when no
shopper judged anything is a fabricated value, and fabricating is the one thing the constitution has no
exception path for — this feature would be dishonest about its own acceptance criteria, which is a poor
way to measure whether it stopped being dishonest elsewhere.

**Consequence**: `Definition of Done` in the constitution includes "feels intentionally art-directed and
premium", and the only instruments for that are SC-001 and SC-012. So the honest end-state of band 3 is
"built, walked, screenshotted, awaiting the panel", not "done". `quickstart.md` §5 states what a panel run
requires so the owner can schedule it as one event covering 002, 004 and 001 together.

---

## Decisions deliberately not taken here

- **Whether the purchase path may look live.** Constitution III freezes cart/checkout and FR-040 requires
  an honest unavailable state, while the current build renders «پرداخت آنلاین از طریق درگاه امن». The
  *requirement* is unambiguous, so band 0 disarms the affordance. What replaces it — a waitlist, a store
  reservation, a plain "not online" note with the phone number — is a business decision, listed in
  `quickstart.md` §1.
- **Whether to refresh the availability export.** FR-053…FR-056 and SC-015 exist precisely so a refresh
  changes what is shown rather than how it is built, but the refresh itself is the merchant's and is
  recorded as an external dependency.
- **Whether 003 ships.** It is parked on the finding that 77% of its source photographs are marketing
  composites rather than isolated products. Its curated-hero recommendation touches FR-031 and is noted in
  `quickstart.md` §3, not assumed here.
