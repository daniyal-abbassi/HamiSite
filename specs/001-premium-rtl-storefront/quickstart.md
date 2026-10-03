# Quickstart: Verifying the Premium Persian RTL Storefront

**Feature**: `specs/001-premium-rtl-storefront` | **Date**: 2026-09-23
**Read with**: [plan.md](./plan.md) for the band order, [contracts/](./contracts/) for what "correct" means.

The constitution's Definition of Done requires browser confirmation — a 200 response is not a working page,
because the client chunks must load or React never hydrates. Two of the five audits below could not reach a
running server, so their visual findings rest on checked-in renders rather than fresh measurement; §0 fixes
that before anything is judged.

## 0. Prerequisites

```bash
npm run dev            # http://localhost:3000 — nothing was listening when this was written
npm run typecheck
npx vitest run tests/unit
```

**Before running any vitest command, know this**: `vitest.config.ts:16` registers `tests/setup.ts`
globally and that file truncates 19 database tables in `beforeEach`. Even `npx vitest run tests/unit`
wipes the dev database. The owner has accepted this; it is not permission to run `npm test` casually, and
any cart/checkout verification below must be done before or after a test run, not during.

Mobile is the design target. Every visual step runs at **360×800** first, then 390×844, then 768×900, then
1280×900. A desktop screenshot proves nothing about FR-014 or FR-041.

Playwright is available through the pixel-bridge install
(`PLAYWRIGHT_PATH=/home/lain/tools/pixel-bridge-mcp/node_modules/playwright`, Chromium at
`~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`); run headed on `DISPLAY=:0` for real
compositing. **Do not judge frame rates or cost on the owner's machine** — it is not a benchmark, and a
verdict drawn from it has already been withdrawn once on this project.

## 1. Owner decisions required before band 3 (one sitting)

> **ANSWERED IN FULL 2026-09-23 — see [notes/owner-decisions.md](./notes/owner-decisions.md).** This list
> is kept as the question record. Nothing in band 0 is blocked by it any more; decisions 1, 2, 4, 5 and 6
> changed what several tasks must do rather than merely permitting them, and `contracts/honest-states.md`
> and `tasks.md` were updated to match.


These are not answerable from code, and each one blocks work rather than being blocked by it.

1. **Admissible claims.** `contracts/honest-states.md` lists everything currently on screen that the data
   cannot support — warranty, 100% authenticity, «قیمتی بی‌رقیب», «بهترین قیمت», the same price at 1 and 100
   units, the partner-brand logo wall. Confirm they come out, **or** supply the merchant fact that makes
   each one admissible.
2. **Store imagery.** FR-006 forbids store photography as proof and none is coming. The AI re-lit frame
   presented as «فضای واقعی مجموعه» comes out. Confirm, or supply a real photograph.
3. **Contact facts.** A verified street address and email were promised and not yet supplied; an email is
   currently fabricated on screen. Supply, or confirm removal. Also: does «مشهد • مجتمع تجاری موبایل» count
   as a verified venue line?
4. **What replaces the purchase path.** Cart and checkout stay frozen under Principle III, but FR-040
   forbids leaving a live-looking control. Options: an honest "not sold online — call us" state; a
   reservation/quote request; a waitlist. This choice changes the PDP, `/cart` and `/checkout` copy.
5. **Atmosphere beyond the homepage.** The scroll ground runs on `/` only
   (`components/atmosphere/PageGround.tsx:47`), which is a large part of why interior pages read as a
   different brand (FR-049). Extend it, or retire the homepage treatment to something every page matches.
6. **Numerals inside merchant data.** 186 of 189 product names interleave Latin digits with Persian
   («ظرفیت 512 گیگابایت»), and SC-007 asks for no mixed numeral system on any screen. Either the data is
   corrected at source, or SC-007 is scoped to interface-authored strings. Transforming a product's own
   name to satisfy a UI rule is its own kind of dishonesty, so this one is genuinely the owner's.
7. **The human panel.** SC-001, SC-012 and SC-013 need at least 10 people. 002 and 004 both ended with the
   owner declining to assemble one, and the precedent is that the box stays visibly empty. Confirm the
   same treatment here, or schedule one panel covering 001/002/004 together (§5).
8. **Data refresh.** A refreshed availability export is an explicit dependency of the availability story,
   not an assumption. Timing changes nothing about band 0–2, and everything about SC-015.

## 2. Band 0 — truthfulness. Run this first, and re-run it after every later band.

Open one product in each class and confirm against the raw export in `data/hami-products.json`:

| Case | How to find one | Must show |
|---|---|---|
| Variant product with a price | any of the 105 with `variants.length > 0` | the real number, Persian digits, no «قیمت فروشگاه» |
| Priced product **without** variants | any of the 84 | its own price, not «برای استعلام قیمت تماس بگیرید» |
| Call-for-price | any of the 5 with no price | ask-us with a reachable number; never `۰ تومان` in the list row |
| `state: "limited"` + `purchasable: false` | one of the 16 | «تماس بگیرید», no live cart control |
| `purchasable: true` | one of the 5 today | obtainable label and a real action |
| Genuinely discounted | `compareAtPrice > displayPrice` | strike + percentage, and the percentage in Persian digits |
| Equal-or-lower compare-at | one of the 40 affected variants | no strike, no badge |
| No specifications | one of the 23 | block absent, page reads as finished |
| Has specifications | one of the 166 | block **present** and scannable |
| One image | 56 records | no dots, no thumbnails, no counter |
| Multiple views | 133 records | count and current position, degrading to the local view |
| No image at all | id 347 «اپل آیدی» | the brand placeholder, and a decision about whether the absence is marked |
| Long name | longest in the export | no clipping in a card, a row, a heading or the tab title |
| Unknown slug | `/shop/<nonsense>` | an honest unavailable state **and a 404 status**, not a 200 |

Then the copy sweep, which is grep-driven rather than visual:

```bash
grep -rn "گارانتی\|اصالت\|بی‌رقیب\|بهترین قیمت\|همان قیمت\|بی‌نهایت\|برندهای همکار\|@hamihamrah" app components lib
grep -rn "در انتظار\|به‌زودی\|pending" app components lib/content
grep -rn "unitPrice\|matchedTier\|product.analysis" components        # the drift class from D1
```

**Expected after band 0**: every surviving hit is traceable to a record field or to the four admissible
trust facts, and no placeholder-apology text reaches a shopper.

## 3. Band 1–2 — the seam and the shop

**Seam.** `curl -s localhost:3000/shop | grep -c 'href="/shop/'` must be non-zero against the **served
HTML**, not the hydrated DOM — that is the whole of Principle III in one command, and it is currently zero
because the page prerenders `Suspense fallback={null}`. Same check on a product page and on the homepage
rails. Then confirm the client fetches are gone from the shopper path.

**URL contract** (`contracts/shop-url.md`). In one browser: filter brand + category + price + offer + sort
+ page 2, then reload, then copy the URL into a fresh context with no history, then `history.back()` twice.
Every step reproduces exactly. Then the FR-026 half: close the filter panel on a phone and confirm each
applied filter is still visible and removable.

**Discovery.** Verify each of these against the export counts, not against the UI's own claims:

```bash
# search normalisation (FR-023) — each pair must return the same count
q=سیستم‌عامل  vs  q=سیستم عامل
q=۱۰۵          vs  q=105
q=موبايل        vs  q=موبایل
```

Sorting: `sort=newest` and `sort=featured` must return lists that differ from each other and from the
default, or the options come out of the control (FR-024). The 5 unpriced records must land last under both
`price-asc` and `price-desc`. Availability: a shopper must be able to ask "what can I actually buy" and get
the 5 (later, whatever the refreshed number is) rather than the 21 that merely say «موجود محدود».

**Dead doors.** Walk all 9 category destinations, all 6 brand rows, all shop tiles and every filter chip;
none may reach a zero-product listing. Then every link in the header, footer, dock, cards and CTAs must
resolve (SC-014). The seven known misses today: `/about`, `/contact`, `/my-orders`, three empty category
chips, and `stock=unlimited`.

**New routes (D10).** `/brands/[slug]` and `/categories/[slug]` serve a headed, counted, curated
destination — not the filter panel wearing a URL.

## 4. Band 3 — the design language

Per surface, at 360 and 1280, screenshot to `specs/001-premium-rtl-storefront/baseline/`:

```text
/  /shop  /shop?brand=<populated>  /shop/<variant product>  /shop/<no-image product>
/cart  /checkout  /login  /register  /orders  /partners  /<nonsense>
```

Checks, in the order `research.md` D8 sets them out:

1. **Decoration removed.** `.shiny-edge`, the starfield, the five body glows, the per-section glow, the
   blurred scrim, `backdrop-filter` glass on every card, `.grad` shimmer text, the `animate-ping` dot, the
   `blur-3xl`/`blur-2xl` blobs, `ModernWhiteWave`. What remains must carry the premium by composition.
2. **Typographic integrity.** No Persian string renders with non-zero letter-spacing; «جست‌وجو» carries its
   ZWNJ; every numeral on every screen is Persian, including percentages and ordinals.
3. **One identity.** The four official logo files, or the amended decision; one page-heading grammar across
   home and interior pages; `/login` and `/register` get real page headers.
4. **Above the fold at 360×800.** Positioning **and** one trust signal **and** one obvious next action, with
   no scroll — FR-014 currently fails this on the owner's own target width because the trust row paints at
   y≈845 and the store image is a stacking second child.
5. **Interaction states.** Tab one surface with the keyboard only: focus visible on every control including
   `<summary>`, order matching visual order in RTL, no control operable while inert, 44px targets at `md`
   and up (the existing patch is mobile-only and matches class substrings, so anything sized by inline
   style escapes it).
6. **Motion and states.** Reduced-motion pass: content identical, no information available only through
   animation — and check the rotating hero word, which is illegible for ~460ms of every 2.8s and was caught
   mid-crossfade in the existing baseline. Loading/empty/error: no jump when content lands; the cart badge
   must not reflow the header on first add.
7. **FR-018 filler sweep.** Each of the 8 authored-filler homepage sections is either rebuilt on real data
   or removed; the count of mounted sections may legitimately fall.

Then the honest self-question the constitution asks: does this read as a brand someone paid for, or as a
template with a colour scheme. If the answer is uncomfortable, the band is not finished.

## 5. Band 4 — criteria that need people

Record-only, never agent-filled. SC-001 (10 new shoppers, five seconds, unprompted recall), SC-012
(side-by-side against a global technology brand, 7 of 10 equally-or-more polished, mean ≥ 4 of 5),
SC-013 (fewer than 10% abandon at a product for want of a next step), SC-011 (what the site said matched
what the shopkeeper said, in 9 of 10 phone contacts). SC-015 needs a synthetic predominantly-obtainable
export replayed through the seam with assertions that no section goes empty or overfull — the fixture does
not exist yet.

Each stays **visibly unchecked** in `tasks.md` with the missing instrument named, per 004's T049 precedent
and `research.md` D11. A panel run covering 001, 002 and 004 together is one event rather than three, and
that is the version worth scheduling.

## 6. Regression floor

`npm run typecheck`, `npx vitest run tests/unit`, the §2 copy greps, and a 360/1280 walk of `/`, `/shop`
and one product page. Run after every band, because band 0's rules are the ones a later visual change is
most likely to reintroduce — a reworded superlative and a decorative glow both look like progress.
