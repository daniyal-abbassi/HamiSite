# T007 — Ranked Bottleneck Findings

**Status**: baseline route and interaction captures audited on 2026-10-18. Selected changes remain subject to paired final measurement.
**Baseline**: [baseline-public.json](baseline-public.json) (40/40 valid) · **Summary**: [summary-baseline.json](summary-baseline.json) · **Method**: [measurement-procedure.md](measurement-procedure.md)
**Profile**: mobile 390×844 DSF3 · CPU 4× · 1.6 Mbps / 750 Kbps / 150 ms · build `SI5JalMD_PFquWP7kYRc` · commit `b1fa09ba`

Fields follow `data-model.md` §OptimizationFinding. State transitions are `observed → measured → selected or rejected → implemented → validated or reverted`; **static candidates remain observed until measured**.

## Interaction baseline (T006)

The capture contains 20 attempts per measurable action. Values below are p95 in milliseconds. Failed attempts are retained in the raw artifact; the sort completion p95 describes only its 12 successful attempts and is **not** a reliability pass. Quantity and partner add are explicitly unverified because the designated fixture has no eligible stock.

| Action | Valid / attempts | Feedback p95 | Completion p95 | Finding |
| --- | ---: | ---: | ---: | --- |
| Search | 20 / 20 | 1138 | 1472 | feedback late |
| Filter | 20 / 20 | 1707 | 3587 | feedback and completion late |
| Sort | 12 / 20 | 355 | 1226 | eight completions timed out |
| Navigation | 20 / 20 | 684 | 1677 | feedback late |
| Gallery | 20 / 20 | 863 | 885 | feedback late |
| Variant | 20 / 20 | 973 | 1001 | feedback late |
| Cart add | 20 / 20 | 280 | 760 | feedback late |
| Checkout shipping | 20 / 20 | unavailable | 141 | completion measured; feedback predicate absent |

Source: [baseline-interactions.json](baseline-interactions.json), profile `prof-mobile-4x-2026-10-15`, build `SI5JalMD_PFquWP7kYRcV`. SC-002 fails for every action with a measured feedback p95. The missing feedback predicate and fixture limitations remain open acceptance gaps.

## Evidence references for finding records

Baseline sample IDs are in `baseline-public.json` for F-01–F-05 and `baseline-authenticated.json` for F-06–F-07; F-08 and the interaction findings additionally reference `baseline-interactions.json` by their `action` field. Each record retains all repetitions rather than selecting a fast one. Baseline visual evidence is the matching `baseline/`, `baseline-authenticated/`, and `baseline-interactions/` screenshot set. Final sample IDs, tests, and paired visual evidence remain **pending** until the associated source change is built and captured; no finding is marked validated yet. Observed only candidates O-01/O-02 have no measured sample IDs by definition.

### Audit correction to F-01

`Reveal` initializes with `visible=true` and renders `reveal--visible` in server HTML. The prior wording below that the CSS reveal *initially* hides the first rail was too broad. The measured `0×0` first card at DOMContentLoaded is consistent with the Suspense rail still arriving; later opacity changes can affect below-fold content, but do not by themselves establish the 6.4-second cause. Treat image readiness, rail streaming, and hydration as separate candidates and measure an edit before attributing savings to reveal motion. Preserve this correction alongside the original finding rather than erasing the audit trail.

## Baseline result (SC-001 / SC-003, five fresh visits each)

These are the **corrected re-capture** (see "Instrument defect" below). Public routes:

| Route | fresh median | LCP median | CLS median | fresh KB | returning median | returning KB | SC-001 | SC-003 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| home | **6352 ms** | 1872 ms | 0.0022 | 1243 | 2785 ms | 122 | ✗ FAIL | ✓ PASS |
| shop | **3298 ms** | 2848 ms | 0 | 730 | 1621 ms | 63 | ✗ FAIL | ✓ PASS |
| category | 2468 ms | 2696 ms | **0.098** | 613 | 1358 ms | 48 | ✓ PASS | ✓ PASS (borderline) |
| product | 2115 ms | 2420 ms | 0.0016 | 641 | 1546 ms | 60 | ✓ PASS | ✓ PASS |

Authenticated routes (T005) — all three fail **both** targets:

| Route | fresh median | LCP median | CLS median | fresh KB | returning median | returning KB | SC-001 | SC-003 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cart | **4343 ms** | 4448 ms | **0.216** | 625 | 2014 ms | 36 | ✗ FAIL | ✗ FAIL |
| checkout | **4425 ms** | 4552 ms | **0.270** | 616 | 2087 ms | 35 | ✗ FAIL | ✗ FAIL |
| partner | **4268 ms** | 4416 ms | **0.585** | 615 | 1925 ms | 36 | ✗ FAIL | ✗ FAIL |

`home` fresh is tight (6231–6371 ms, 140 ms spread) so its median is stable. `shop` is not
(3058–3567 ms, 509 ms spread) — its 2996 → 3298 ms move between captures is discussed under
run-to-run variance below. **home, shop, cart, checkout and partner additionally owe ≥ 20% relative
improvement**, not merely the 2500 ms absolute target.


## The decomposition that reorders the plan

A single number cannot say where 6.4 s goes, so each route was decomposed with `verification/diagnose-route.mjs` (milestones + bytes actually transferred before content-ready) and a DOM-state probe. Three runs per condition:

| Route / visit | TTFB | document ends | first card laid out | principal image decoded | interactivity |
| --- | --- | --- | --- | --- | --- |
| home / fresh | 424–493 ms | ~2.0–2.5 s | ~3.0–4.4 s | **~7.5 s** | ~6.4 s |
| home / returning | 72–127 ms | ~1.1 s | ~2.6–4.5 s | == card laid out (images cached) | 1.8–5.1 s |
| shop / fresh | 39–56 ms | ~0.7 s | ~2.4–3.0 s | ~3.3–3.6 s | 3.8–5.0 s |

**The server is not the problem on the critical path.** Shop's time-to-first-byte is 39–56 ms and its document is complete at 0.7 s, yet its product grid — which *is* in the server HTML (12 `article.product-card` elements, confirmed by fetching the HTML directly) — only becomes usable at 2.4–3.0 s. Home is worse: TTFB ~450 ms and a document that streams for ~2 s, but its first real card is only laid out at ~3.0–4.4 s, and on a warm cache with **0 KB of JS transferred** it still takes ~4 s.

The DOM probe shows why. At DOMContentLoaded home has **24 cards in the DOM but the first one measures `0×0`**, with 45 `animate-pulse` skeletons still on the page; moments later it has real dimensions but `opacity: 0` from `.reveal` (`app/(main)/home.css:63`), transitioning to `opacity: 1` over 0.85 s. So principal content exists in the markup and is withheld from being *usable* by client-side layout, reveal choreography and hydration — not by a slow query.

Independently, **React error #418 (hydration text mismatch) is thrown on home (3× in the probe) and was recorded by the baseline's own in-page error listener in 10/10 product samples (15 occurrences)**. A mismatch makes React discard the server markup for that subtree and regenerate it on the client, which is exactly the kind of cost that shows up as "the HTML was there but nothing was usable for seconds".

## Findings

### F-01 — Home principal content is gated by client-side layout/reveal, not by the server
- **Affected routes**: home (worst), shop
- **Measured cost and source**: home returning **2827 ms** median with only **124 KB** transferred and **0 KB** of JS over the wire; first card `0×0` at DCL, then `opacity: 0` for a 0.85 s transition. Shop: grid present in server HTML at 0.7 s, usable at 2.4–3.0 s.
- **Hypothesis**: `.reveal` (opacity/transform, plus `setVisible(false)` after mount for below-fold content) and hydration together withhold already-rendered content.
- **Candidate file locations**: `components/home/Reveal.tsx`, `app/(main)/home.css:63-71`, `app/(main)/page.tsx`
- **Relevant skill rule**: `vercel-react-best-practices` (as named in spec.md) — principal content should be rendered usable rather than withheld behind client effects.
- **Chosen change or rejection reason**: **not yet selected** — this is a *design* surface (the spec protects the premium Persian design and motion), so it needs the owner's visual decision (T027) before any edit. Recorded rather than silently actioned.
- **Semantic guard**: no removal of motion/imagery without owner sign-off; principal content must stay in the server HTML.
- **Status**: **measured**

### F-02 — A fresh home visit transfers ~1.2 MB before a card is usable, mostly JS and images
- **Affected routes**: home (1242 KB), shop (730 KB)
- **Measured cost and source**: bytes completing before content-ready on home fresh: **~1.2 MB total — 400 KB JavaScript, ~525 KB across 15–17 image requests**, 112 KB document, 43 KB CSS, 57 KB font. At 1.6 Mbps that is ~6 s of bandwidth, which is why fresh ≈ 6.4 s while warm ≈ 2.8 s.
- **Hypothesis**: too many bytes — chiefly JS and rail/decorative imagery — are demanded before the first product card can paint.
- **Candidate file locations**: `app/(main)/page.tsx` (rail image delivery), `components/home/HomeRailSkeleton.tsx`, `components/shop/ProductGallery.tsx`
- **Relevant skill rule**: `vercel-react-best-practices` — reduce client JS and defer non-critical image work.
- **Chosen change or rejection reason**: **selected for T011** in its image/loading-space part (T011's file list already covers exactly these); the JS portion needs the owner's scope decision because it is not covered by T008–T012.
- **Semantic guard**: preserve primary imagery and existing responsive assets; no placeholder imagery.
- **Status**: **measured → selected (T011 portion)**

### F-03 — React #418 hydration mismatch forces client regeneration on product (all samples) and home
- **Affected routes**: product (15 occurrences in 10/10 samples), home (3 in probe)
- **Measured cost and source**: in-page error listener during the T004 capture and the DOM probe; error code #418 (server/client text mismatch).
- **Hypothesis**: a client component renders text that differs from the server's (typical culprits: number/date formatting such as `toFaDigits`, or time/locale-dependent output), so React discards and regenerates that subtree after hydration.
- **Candidate file locations**: not yet localised — needs a dev-mode (non-minified) reproduction to name the component. Suspects: price/digit formatting paths feeding `article.product-card`, and any component reading `Date`/`Math.random` during render.
- **Relevant skill rule**: `vercel-react-best-practices` — SSR/CSR output must match; keep render output deterministic.
- **Chosen change or rejection reason**: **selected as the first thing to localise** — a mismatch is a defect with no design trade-off, and it plausibly contributes to F-01.
- **Semantic guard**: fix the source of the mismatch; do not suppress with `suppressHydrationWarning` unless the value is genuinely time-dependent and cosmetic.
- **Status**: **measured**

### F-04 — Home's server render and streamed rails cost ~1.4 s more than shop's
- **Affected routes**: home
- **Measured cost and source**: home TTFB 424–493 ms vs shop 39–56 ms (≈10×); home document streams to ~2.0–2.5 s vs shop 0.7 s. This is real server cost, but it is the **third** largest contributor to home's 6.4 s.
- **Hypothesis**: the homepage's `Suspense`-wrapped rails each resolve their own catalogue reads, so later boundaries land late in the stream (`lib/home-rails-db.ts` is also suspected of broad reads).
- **Candidate file locations**: `lib/home-rails-db.ts`, `lib/catalog-db.ts`, `app/(main)/page.tsx`
- **Relevant skill rule**: `vercel-react-best-practices` — avoid request waterfalls; select only needed fields.
- **Chosen change or rejection reason**: **selected for T010**, which already targets exactly these files and requires equivalence cases (selected IDs, variant eligibility, discount ordering, ties, totals, missing prices) before any limit reduction.
- **Semantic guard**: no slicing candidates before valid winners are determined; identical product sets and ordering.
- **Status**: **measured → selected (T010)**

### F-05 — Category layout stability sits on the SC-003 threshold
- **Affected routes**: category
- **Measured cost and source**: CLS median **0.098** on all five fresh visits against a 0.1 limit — it passes, but with no margin, and its LCP median (2696 ms) exceeds its content-ready median (2458 ms).
- **Hypothesis**: a late-arriving element (filter/count/label or image space) shifts layout after first paint.
- **Candidate file locations**: category listing components, `components/shop/ProductCard.tsx` image sizing
- **Relevant skill rule**: `vercel-react-best-practices` — reserve space for late content.
- **Chosen change or rejection reason**: **selected for T011**, which covers loading-space defects.
- **Semantic guard**: no clipping or cropping changes to preserve the shift budget.
- **Status**: **measured → selected (T011)**

### F-06 — Authenticated routes have no principal content in the server HTML at all
- **Affected routes**: cart, checkout, partner-bundles
- **Measured cost and source**: fresh medians **cart 4343 ms / checkout 4425 ms / partner 4268 ms** against a TTFB of only **24–32 ms**. Fetching the same URLs with a valid session returns **0 `.toman-price` elements, 0 `<article>` elements, 5 skeleton markers** for cart and checkout. On a warm cache the routes still take ~2 s with only **35–36 KB** transferred.
- **Hypothesis**: these are client shells (`CartPageClient`, `CheckoutClient`, `PartnerBundlesClient`) that render nothing usable until hydration finishes *and* a follow-up `fetch` to `/api/cart` or the bundles endpoint returns. The critical path is HTML → JS → hydrate → API round trip → paint, i.e. a request waterfall that no amount of server speed can shorten.
- **Candidate file locations**: `components/cart/CartPageClient.tsx`, `components/checkout/CheckoutClient.tsx`, `components/partners/bundles/PartnerBundlesClient.tsx`, and whatever route handlers they call after hydration.
- **Relevant skill rule**: `vercel-react-best-practices` — fetch on the server rather than in a post-hydration client waterfall; avoid request waterfalls.
- **Chosen change or rejection reason**: **measured, not yet selected** — this is the same shape of defect as F-01 (content withheld behind the client) but on routes the task list never names. Fixing it means moving reads to the server for authenticated pages, which is a real design change and needs the owner's scope decision, exactly as F-01 does.
- **Semantic guard**: the designated contents must still render identically (same lines, amounts, and totals) — verified by the numeric predicate, not by a screenshot.
- **Status**: **measured**

### F-07 — CLS on authenticated routes is the worst in the campaign, and fails SC-003 outright
- **Affected routes**: cart **0.216**, checkout **0.270**, partner **0.585**
- **Measured cost and source**: median CLS over five fresh visits, against a 0.1 limit. By comparison every public route is ≤ 0.098. The values are stable across repetitions (cart 0.2155–0.216, checkout 0.2697–0.270) and are *not* the instrument artifact described below — the fix was in place for this capture.
- **Hypothesis**: the shell-then-swap render of F-06. The page paints a skeleton/short state first and then replaces it with a full cart/order/bundle layout, so the largest shift happens after first paint. Partner is worst because its content block is the tallest.
- **Candidate file locations**: same components as F-06, plus their skeleton/loading states.
- **Relevant skill rule**: `vercel-react-best-practices` — reserve space for late content; avoid layout shifts.
- **Chosen change or rejection reason**: **measured → selected in principle (T011's loading-space remit)**, but the durable fix is the same server-render change as F-06; a skeleton-only patch would reduce CLS without reducing the 4.4 s, which would be optimising the metric rather than the experience. Recorded for the owner's decision alongside F-06.
- **Semantic guard**: no clipping or crop changes; the settled layout must be identical to today's.
- **Status**: **measured**

### F-08 — The shop view toggle is a dead control on mobile
- **Affected routes**: shop, **mobile 390px only** (the desktop equivalent works)
- **Measured cost and source**: at 390×844, clicking `نمایش فهرستی` (list view) fires its handler — the router really does fetch `/shop?view=list&_rsc=…` — but **the navigation never commits**: the URL is still `/shop` after 2.5 s, after 12 s, and after 20 s. At 1280×800 the *same* control commits in **625 ms**. The server renders `/shop?view=list` in **62 ms** (247 KB), so this is not server slowness. Reproduced three times at 390px, both with and without CPU/network throttling applied.
- **Hypothesis**: the handler and router are fine (the RSC request proves it); the *resulting tree* for the `view` parameter never resolves during client navigation, so the transition is never committed. Consistent with a Suspense boundary in the list-view tree that suspends indefinitely client-side.
- **What is *not* broken**: sort (`?sort=price-asc`) and the brand filter both commit on mobile — **1418 ms** and **3158 ms** — so this is specific to the `view` parameter's tree, not to `ShopResultControls`' shared `update()` function.
- **Candidate file locations**: `components/shop/ShopResultControls.tsx` (the control), `components/shop/ShopResults.tsx` / `CatalogListing.tsx` (the list-view tree).
- **Relevant skill rule**: `vercel-react-best-practices` — client navigation must not depend on a boundary that can suspend forever.
- **Chosen change or rejection reason**: **measured, not selected** — it is a functional defect rather than a loading cost, so it does not belong to T008–T012. It belongs to US2 (T018: "resolve regressions and keep failed SC-002 results open").
- **Semantic guard**: the list view must render the same products in the same order as the grid view.
- **Status**: **measured**

### O-02 — The header cart badge was seen reporting a count ahead of the server (observed once)
- **Affected routes**: any route with the header badge, authenticated
- **Measured cost and source**: during a T006 cart sample the badge read **"سبد خرید، ۳ کالا"** while `GET /api/cart` returned **2 items**. Seen **once**; not reproduced deliberately, so it is recorded as observed rather than measured.
- **Hypothesis**: the badge renders from an optimistic/cached cart value before the server state resolves. If real, it is a correctness concern (a user seeing a phantom third item), not a timing one.
- **Candidate file locations**: `components/providers/CartProvider.tsx`, the header cart control.
- **Chosen change or rejection reason**: **held at observed** — one occurrence is not enough to act on, and T021/T019 (US3 correctness) are the right place to reproduce it.
- **Semantic guard**: the badge must reflect the server-confirmed cart.
- **Status**: **observed**

### O-01 — Duplicated product reads on the product page (T008) — **observed, not yet measured**
- **Affected routes**: product
- **Measured cost and source**: none yet. Product is the *fastest* public route (2110 ms fresh, SC-001 PASS), so nothing currently evidences this as a bottleneck.
- **Hypothesis**: `generateMetadata` and the page body both resolve the same product, so the read happens twice.
- **Candidate file locations**: `app/(main)/shop/[slug]/page.tsx`, `lib/catalog-db.ts`
- **Chosen change or rejection reason**: **held at observed** — T008's own wording gates it on "when confirmed"; the current product numbers do not confirm it as a top cost. It may still be worth doing for server efficiency, but it is not selected on performance grounds yet.
- **Status**: **observed**

### O-02 — Overlapping/sequenced reads on the product page (T009) — **observed, not yet measured**
- **Affected routes**: product
- **Measured cost and source**: none yet; same reasoning as O-01.
- **Candidate file locations**: `app/(main)/shop/[slug]/page.tsx`, `lib/shop-query-db.ts`
- **Chosen change or rejection reason**: **held at observed**.
- **Status**: **observed**

## Instrument defect found and corrected (affects the first capture only)

The first T004 capture reported **inflated CLS on every `returning` sample**: `home returning` read
0.0011, 0.0021, 0.0032, 0.0042, 0.0053 — exactly 1×–5× of 0.0011. The runner called
`page.addInitScript(INIT)` once per repetition; Playwright accumulates init scripts, so repetition *n*
ran *n* layout-shift observers all pushing into the same array.

`fresh` samples were unaffected (new page each), so no SC-001 verdict was ever at risk, and the inflated
returning values were all ≤ 0.005 — an order of magnitude below the 0.1 limit — so no SC-003 verdict
changed either. Both runners are fixed (`preparePage()` registers the init script and network listeners
once per page), both baselines were **re-run in full**, and the contaminated files are kept in
`evidence/archive/*.CLS-CONTAMINATED-2026-10-16.json` rather than deleted. Details in
[measurement-procedure.md](measurement-procedure.md).

## Run-to-run variance (recorded, not smoothed)

`shop fresh` moved **2996 → 3298 ms** between the two captures while `home`, `category` and `product`
moved by <1%; 1-minute machine load was 0.59 in the first and 1.7–2.3 in the second. Since five routes
owe a **≥20% relative improvement**, a 10% swing consumes a real part of the margin being claimed: the
final capture must run at a load level comparable to its baseline, and per-sample `machine_load` is
recorded for that check.

## What this means for the plan's ordering

The plan's summary anticipated server read duplication, rail reads and optional client code in that order. Measurement does not support that order: the server answers in 24–500 ms and shop's grid is already in the HTML at 0.7 s, while **the dominant, repeatable cost is client-side** (F-01) and, on fresh visits, **byte volume dominated by JS and rail imagery** (F-02), with a hydration mismatch compounding both (F-03). The authenticated routes make the point in its purest form: their server HTML contains **no principal content whatsoever** (F-06), so no server-side optimisation can move their 4.3–4.4 s. The server-side candidates (F-04) are real but third.

Nothing is reverted or re-scoped here: F-02/F-04/F-05 map onto existing tasks T011/T010/T011. **F-01, F-03, F-06 and F-07 have no home in T008–T012** — F-01 touches protected motion/design, and F-06/F-07 require moving authenticated reads to the server — so all four need an explicit owner decision before implementation. T008/T009 stay `observed` rather than being forced, per "rejections recorded with evidence rather than forcing unnecessary refactors".

## Status

- **T004 public baseline**: complete and re-captured with the corrected instrument (40/40 valid).
- **T005 authenticated baseline**: complete (30/30 valid) — [baseline-authenticated.json](baseline-authenticated.json),
  [summary-baseline-authenticated.json](summary-baseline-authenticated.json),
  [access-limitations.md](access-limitations.md).
- **T006 interaction samples**: captured and audited (160 attempts plus two explicitly unverified actions). Sort has eight retained failures; checkout feedback remains unmeasured.
- **T007 ranking**: home fresh transfer, authenticated post-hydration fetch/CLS, home rail streaming and public interaction feedback are the selected investigation order. Product reader duplication remains observed until query counts confirm it.
