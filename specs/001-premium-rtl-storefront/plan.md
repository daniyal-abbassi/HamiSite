# Implementation Plan: Premium Persian RTL Storefront

**Branch**: `Hami-v3` (no dedicated branch — `before_specify` hook is not configured) | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-premium-rtl-storefront/spec.md`

**Position**: This is the parent feature of the frontend initiative and it is **already partly built**.
Nothing here is greenfield. The work is a recovery: close the distance between what the spec demands and
what the running code does, with the honesty failures first because Principle I has no exception path.

---

## Summary

Five read-only audits were run across the 64 FRs and 15 success criteria, each band graded against
shipped code with `file:line` evidence. The result is not "63% done, keep going." Two findings re-order
the whole feature:

1. **The product page has never displayed a real price since the static-data seam landed.**
   `components/shop/ProductDetail.tsx:191` reads `selectedVariant.unitPrice`; the serializer that now
   backs that route (`lib/catalog.ts:166-187`) emits `price` and a nested `quoted.unitPrice` and no
   top-level `unitPrice`. So `formatToman(undefined)` hits its own NaN guard (`lib/utils.ts:11`) and
   prints the literal string «قیمت فروشگاه». Verified by reading all three files. Consequence across the
   catalog: the 105 variant-bearing products print that non-price, and the 84 priced products **without**
   variants fall to the `null` branch and print «برای استعلام قیمت تماس بگیرید» — the site tells a shopper
   to ask for a price it is actually holding. This is the moment of purchase decision, and it is
   dishonest in both directions. It survived TypeScript only because `apiGet<ProductDetail>` is an
   unchecked cast onto the pre-seam `types/store.ts` shape.
2. **The premium goal is currently carried by exactly the treatment the brief forbids.** FR-052 says
   luxury must come from composition and restraint and must NOT depend on glow, gradient or decoration.
   The shipped design is a spinning conic-gradient gold rim with three glow shadows
   (`app/globals.css:481-516`, on the hero's primary CTA and in the header), a fixed 20-point drifting
   starfield, five stacked body radial glows, a per-section alternating glow, `blur-3xl`/`blur-2xl`
   blobs, a stock white-wave section divider with a Gaussian-blur glow filter, and `backdrop-filter`
   frosted glass on every card. `tailwind.config.ts` defines five named shadows and four of them are
   `glow-*`. This is the largest single cost to the "million-dollar" perception, and it is the one the
   owner's own brief names.

Between them they explain the shape of the remaining work: **the storefront's data truth is broken at
its most important screen, and its visual language is generic-luxury rather than art-directed.** The
plan below sequences that: truth first (band 0–1), then the requirements that make it a usable shop
(band 2), then the design language (band 3), then the criteria that need a human panel (band 4).

---

## Technical Context

**Language/Version**: TypeScript 5.5.4, Node 24 (repo runs on v22.23.1 locally), ES2022+
**Primary dependencies**: Next.js **15.5.25** App Router, React 19.2.8, Tailwind CSS 3.4.19,
`zod` 3.23, `@prisma/client` 5.20 (frozen paths only), `embla-carousel-react` 8.6, `gsap` 3.15 (core
tweening only, `CardSwap`/`PillNav`), `motion` 13.2, `lenis` 1.3.26, `lucide-react`, `clsx`, `tailwind-merge`
**Storage**: shopper-visible data is **flat files** — `data/hami-products.json`,
`data/hami-categories.json`, `data/hami-brands.json`, `data/catalog-images.json`, read through
`lib/catalog.ts`. PostgreSQL via Prisma exists behind frozen `/api/*` routes for auth, cart and orders.
**Testing**: Vitest 4.1.10, `environment: "node"`, **no DOM harness** — the browser is the instrument for
anything visual (`vitest.config.ts:16` registers `tests/setup.ts` globally and that file truncates 19
tables, so even `npx vitest run tests/unit` wipes the dev DB; the owner has accepted this).
**Target platform**: mobile browser first (360px is the design target), desktop is the enhancement.
**Project type**: server-rendered storefront with a frozen commerce backend.
**Performance goals**: SC-010 — the first listing image visible within ~2s on a typical mobile
connection, page usable while later ones arrive. Currently unmeasured, and no `placeholder`/
`blurDataURL` is used anywhere.
**Constraints**: Constitution III freezes `data/`, `app/api/` and `prisma/`; cart, checkout, payment,
auth and admin must keep working unmodified. No new visual assets except the single permitted
background-isolation route (`003/FR-028…034`). `docs/inspires/` must never be installed, built or ported.
**Scale/scope**: 189 products, 32 categories (19 populated), 39 brands (~15 populated), 311 variants,
11 sections on the homepage, 11 shopper-facing routes, ~46 screens of scroll at 360px.

### Where the audits disagree, and what I concluded

FR-005 ("a section is absent rather than present-but-empty") was graded **PARTIAL** by one band and
**DONE** by another. Both readings are right about different halves: no section on a product page is
present-but-empty, so the letter holds — but the reason the specification block is empty for the 23
records with no specs is that **it renders nothing for the 166 that have them**
(`lib/catalog.ts:213` emits `specs`; no shopper component reads it; the block that does exist reads
`product.analysis`, a field the seam never produces). A pass that depends on an absent feature is not a
pass. **FR-005 is PARTIAL and its fix lives in FR-032.** Recorded here because the plan's task split
depends on that judgement.

---

## Constitution Check

*GATE: must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status at entry | Evidence |
|---|---|---|
| **I. Honest Interface** | **FAILS — no exception path** | The PDP price defect (Summary §1). `lib/catalog.ts:200`'s `available` flag is read by **no** shopper component, so 22 records the merchant cannot sell present as buyable; `components/shop/ProductDetail.tsx:94` falls back to `?? "limited"` — a positive state from an unreadable one — and `lib/serializers.ts:13-26` does the same into cart labels. «گارانتی رسمی» on every card while `lib/catalog.ts:170` hardcodes `guarantee: null`; «ضمانت اصالت ۱۰۰٪» on the PDP; «قیمتی بی‌رقیب»/«بهترین قیمت»/«همان قیمت» at one and a hundred units with no tiers in the export (`lib/catalog.ts:179`). An AI re-lit photograph presented as «فضای واقعی مجموعه» with invented signage (`components/home/ShopWindow.tsx:4-20,49-57`, `components/home/StoreExperience.tsx:41,60-62`) — FR-006 forbids store imagery outright. A fabricated email is live at `app/(main)/partners/page.tsx:67-68` while `lib/content/contact.ts` records the phone as the only verified contact fact. «۰ تومان» in the shop list view for the 5 call-for-price records (`components/shop/ProductListRow.tsx:59`). A literal «تصویر واقعی فروشگاه در انتظار افزودن» shown to shoppers (`components/home/WhyHami.tsx:12,65`). |
| **II. Persian RTL by Default** | **PASSES on direction, FAILS on numerals and typography** | FR-010 is genuinely clean: zero physical `ml-`/`mr-`/`pl-`/`pr-`/`text-left` hits and no `rtl:` compensating variants. But FR-011/SC-007 fail — 20 authored Latin-digit sites, worst being `−{off}٪` on every discounted card (`components/shop/ProductCard.tsx:186`) beside a Persian-digit price on the same card, and «01»–«04» ordinals (`components/home/TrustBar.tsx:42`) beside `toFaDigits` output on the same page. FR-057 fails on ~45 letter-spacing declarations reaching ~50 Persian strings, including `.eyebrow` at `0.08em` (`app/globals.css:611`) and `tracking-tight` on every `<h1>`/`<h2>`. FR-058: 8 occurrences of «جستجو» with no ZWNJ, up from the 3 the checklist recorded. |
| **III. Static Data Seam** | **FAILS structurally** | Browsing requires an API round-trip, which the principle forbids outright. `app/(main)/shop/page.tsx:29-31` prerenders `Suspense fallback={null}` and `components/shop/ShopClient.tsx:101` fetches `/api/products` client-side, so the served document contains **zero products**; the PDP fetches `/api/products/[slug]` (`ProductDetail.tsx:56`). Only `generateMetadata` touches `lib/catalog.ts` server-side. This breach is also the mechanism that hid the price defect: the fetch boundary is typed by an unchecked cast onto a shape the seam no longer emits. |
| **IV. Design Is Open — Luxury Is the Quality Bar** | **FAILS the quality bar at the point the bar names** | FR-052 contradicted (Summary §2). FR-049: two page-heading grammars — the homepage's pill + gradient word + hand-drawn swash versus `.section-label` numerals on every interior page, and `/login`//`register` with no page header at all — so `/cart` reads as a different project. FR-015: none of the four supplied official logo files is imported by anything; a 36px derivative monogram carries the identity and the brand name is re-typeset and hidden below `sm`. The atmosphere system is `/`-only by construction (`components/atmosphere/PageGround.tsx:47`). `aqua`, `champagne` and `brass` are all `#E5D3B3` (`tailwind.config.ts:62-121`), so accent decisions were made against a colour that does not exist. |

**Gate decision: the plan proceeds with the gate failed, and the failure is the work.** A plan that
reported a clean check against this codebase would be the fourth honesty defect in the list. Band 0 and
band 1 below exist specifically to clear Principle I and the Principle III breach before any further
visual investment, because decoration applied on top of a lying price screen makes the defect easier to
miss, not harder.

**Complexity tracking: empty.** No violation in this plan needs a new dependency, a new abstraction or a
fourth anything. Every band-0 and band-1 fix is either a one-expression change at an existing call site,
a string replacement in an existing content file, or a deletion. The single architectural item (server
rendering through the seam) removes client fetches rather than adding a layer.

---

## Gap Ledger (what the audits actually returned)

Across 64 FRs and 15 SCs: **~13 DONE, ~39 PARTIAL, ~11 CONTRADICT-SPEC, ~4 MISSING, ~5 unverifiable
today.** The distribution matters more than the count — almost nothing is *absent*, and almost everything
present is *half-done*, which is the signature of a codebase built by iteration without an acceptance
pass.

| Band | FRs | Verdict at entry |
|---|---|---|
| Truthfulness & availability | 001–008, 037–040, 053–056 | 0 done, 11 partial, 6 contradict, 1 missing |
| Discovery & listing | 020–029, 041–042 | 6 done, 7 partial, 1 missing (FR-029) |
| Product presentation | 030–036, 005, 048 | 2 done, 5 partial, 2 contradict, 1 missing (FR-035) |
| Language, numerals, type | 009–013, 057–064 | 3 done, 8 partial, 2 contradict |
| Home, brand, interaction | 014–019, 043–052 | 3 done, 9 partial, 3 contradict |

### MISSING outright (no implementation exists to improve)

- **FR-029** — no dedicated brand or category destination. `app/` has no `brands/` or `categories/`
  route; every brand and category link in the repo, including 004's rows and 005's panels, is a
  `/shop?` query string.
- **FR-035** — no related-products section anywhere. The home rails are recency and promo queries, which
  is not a relationship.
- **FR-055** — no data-currency disclosure. The export date (2026-09-09) and `updated_at` reach the DOM
  nowhere, so every price and stock label is presented as current with no basis.
- **FR-063 (half)** — no landline rule exists at all in `lib/`; `shopPhone` is `min(7).max(20)` with no
  shape check and no digit normalisation, unlike every sibling field.
- **`app/not-found.tsx` / `error.tsx`** — none exist, so the footer's three dead links (`/about`,
  `/contact`, `/my-orders`) land on Next's unstyled English framework page: no RTL, no chrome, outside
  the brand.

### The two structural fragilities to fix before a data refresh

- `lib/category-departments.ts:113-126` **throws** from the homepage render path when a hand-listed slug
  resolves to zero products. The intent is right (FR-002 forbids an empty doorway) but the effect is that
  one emptied category takes the entire homepage down for every visitor. Filter the department out and
  log it instead.
- `lib/category-departments.ts:57-66,139` embeds this snapshot's per-kind totals (134/19/10/7/7/5/3/3/1)
  and derives `showsCount` from them, so a display rule is a literal comparison against a dated export —
  the exact coupling FR-053 prohibits. The same snapshot figures are asserted verbatim in
  `tests/unit/category-departments.test.ts:39-57` and `tests/unit/product-images.test.ts:79-93`, which
  means SC-005's "re-verifiable after refresh without restating totals" is false by construction.
- `app/layout.tsx:69` ships `<script src="http://localhost:8400/live.js?token=…">` inside the root
  `<body>` on every page for every visitor. It is a design-companion artefact from a local tool, it will
  fail to resolve in production, and it delays the `load` event that `useAtmosphereGround` depends on.

---

## Sequencing

Five bands, ordered so that each one's evidence can be trusted only after the previous one lands.

**Band 0 — Stop lying (Principle I, no exception path).** The PDP price against the real serializer
shape; the `?? "limited"` and `serializers.ts` positive fallbacks; the `available` flag actually reaching
the shopper layer; «۰ تومان» in the list row; the fabricated email; the AI store photograph and the
«فضای واقعی» caption; warranty/authenticity/unrivaled-price copy that the data cannot carry; the
"content pending" placeholder. Each is one call site or one string. Nothing here is a design decision,
which is why nothing here may wait on one.

**Band 1 — Make the seam real (Principle III).** Render the catalog server-side through `lib/catalog.ts`
and delete the client fetches on `/shop`, the PDP and the home rails, so the served document contains
products; type the PDP's data at the boundary so the band-0 class of defect cannot recur silently;
introduce the as-of disclosure FR-055 asks for as part of that surface rather than as a badge later.

**Band 2 — Finish the shop (the utility that makes it a storefront).** Specifications (FR-032) and the
gallery second views with count and position (FR-031); the storage-capacity mapping, which is a data-key
mismatch and not a missing feature (0 of 311 variants carry «حافظه» while the seam maps exactly that
key); real `newest`/`featured` comparators (FR-024); obtainability narrowing (FR-022); Persian search
normalisation — ZWNJ, digits, Arabic letter variants (FR-023); applied filters visible outside the panel
and removable (FR-026); dedicated brand and category routes (FR-029); related products on a named
relationship (FR-035); the six dead doors and the three footer 404s.

**Band 3 — The design language (Principle IV).** FR-052 is the entry condition: strip the glow/decoration
load and re-carry the premium through composition, then fix the numeral and tracking failures that make
the typography read as broken Persian, then unify the two heading grammars, then put the real supplied
logo into the identity (FR-015), then rebuild what is left of the 8 filler sections against the rule that
an empty place stays empty (FR-008, FR-018), then the above-the-fold trust problem at 360 (FR-014), then
interaction states (FR-043/044/045/046) including the controls that respond visually and deliver nothing.

**Band 4 — Criteria that need people, not code.** SC-001, SC-012, SC-013, SC-011 and the refresh-replay
half of SC-015. These stay **visibly unchecked** with the missing instrument named, on the precedent 004
set with its T049: an empty box is information, a ticked one would be a fabrication.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-premium-rtl-storefront/
├── spec.md                 # 64 FRs, 15 SCs, three resolved clarifications — unchanged by this plan
├── plan.md                 # this file
├── research.md             # 11 decisions with rationale and rejected alternatives
├── data-model.md           # the real serialized shape vs the shape components still read
├── quickstart.md           # how to verify each band, in order, with the browser as the instrument
├── contracts/
│   ├── catalog-seam.md     # the response shape every shopper surface depends on
│   ├── shop-url.md         # the filter/search/sort/page URL contract (FR-027)
│   └── honest-states.md    # availability × price → the label and the action that may be shown
├── audits/                 # the five band audits this plan is built on, kept as evidence
│   ├── 01-truthfulness.md
│   ├── 02-discovery.md
│   ├── 03-product-presentation.md
│   ├── 04-language-typography.md
│   └── 05-home-and-interaction.md
└── checklists/
    └── requirements.md     # 16/16 checked before planning; re-verify band-0 items against it
```

### Source Code (the surfaces the work touches)

```text
app/
├── layout.tsx                     # band 0: remove the committed localhost live-reload script
├── not-found.tsx                  # new: the RTL 404 that does not exist today
├── (main)/
│   ├── page.tsx                   # home: hero copy, section audit, above-the-fold trust
│   ├── shop/page.tsx              # band 1: render through the seam, no client fetch
│   ├── shop/[slug]/page.tsx       # band 1: same, and notFound() instead of a 200
│   ├── partners/page.tsx          # band 0: the fabricated email
│   └── {login,register,cart,orders}/page.tsx   # band 3: one heading grammar
├── brands/[slug]/page.tsx         # new: FR-029
└── categories/[slug]/page.tsx     # new: FR-029

components/
├── shop/ProductDetail.tsx         # the price defect, specs block, variant keys
├── shop/ProductListRow.tsx        # «۰ تومان»
├── shop/ProductCard.tsx           # warranty chip, percent numeral, tracking
├── shop/{FilterSidebar,FilterSheet,ShopResults,ShopClient,ShopBanner}.tsx
├── home/*                         # filler sections, filler copy, the two carousels
└── layout/{Header,Footer,MobileDock}.tsx       # dead links, logo asset, numeral sites

lib/
├── catalog.ts                     # frozen-adjacent: read-only source of truth for the shape
├── category-departments.ts        # throw → filter; snapshot totals out
├── product-identity.ts            # price/availability state machine
├── shop-filters.ts                # search normalisation, obtainability
├── serializers.ts                 # the "limited" default that manufactures a positive state
├── validators.ts + phone.ts       # FR-062/063/064
└── content/*                      # authored Persian copy and the ordinals

data/, app/api/, prisma/           # FROZEN. Read-only. Never a place to fix a frontend problem.
```

**Structure decision**: no new directory layer and no new abstraction. Two new route directories
(FR-029) and one `not-found.tsx` are the only additions; everything else is an edit inside the existing
`app`/`components`/`lib` split. The `audits/` folder is evidence for this plan and nothing imports it.

---

## Re-check after Phase 1 design

Design artifacts written: `research.md`, `data-model.md`, `contracts/`, `quickstart.md`.

| Principle | After design | Note |
|---|---|---|
| I | Still fails, **by plan** | The design adds no new claim. `contracts/honest-states.md` makes the availability × price × action mapping a checkable contract instead of a per-component judgement, and `data-model.md` records which keys the seam actually emits, which is what let the price defect hide. Band 0 is the remediation. |
| II | Improves by construction | The numeral and tracking fixes are string- and declaration-level; `contracts/shop-url.md` keeps direction out of the URL contract entirely. |
| III | **Resolved by design** | Band 1 is the fix: server render through `lib/catalog.ts`, client fetches deleted, response shape frozen in `contracts/catalog-seam.md` so a future drift is a contract break rather than a silent `undefined`. |
| IV | Addressed, not yet provable | Band 3 cannot be judged from a document. `quickstart.md` §4 makes it a per-surface browser walk at 360 and 1280, and FR-052's strip-list is explicit so "make it plainer" is not left as a mood. |

No gate passes were claimed. No new dependency is proposed; the two candidate additions (a Persian
normalisation library, a date library) were rejected in `research.md` D6 and D7 in favour of what the
platform already provides.

---

## Complexity Tracking

> No violations requiring justification. Section intentionally empty per the template's own rule.
