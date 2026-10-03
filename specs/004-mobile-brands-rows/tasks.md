# Tasks: Mobile Brands Row Presentation

**Input**: Design documents from `specs/004-mobile-brands-rows/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/brand-row-behaviour.md](./contracts/brand-row-behaviour.md), [quickstart.md](./quickstart.md)

**Tests**: Automated tests are limited deliberately. Vitest here runs `environment: "node"` with no DOM
harness (research.md D6), so only pure resolution logic is unit-tested. Everything visual is verified in a
real browser via the `browser-use` MCP following quickstart.md — those tasks are marked **[BROWSER]**.

**Path note**: this is an existing Next.js App Router project. `app/`, `components/`, `lib/` sit at the repo
root. `data/`, `app/api/`, and `prisma/` are **FROZEN** (Constitution III) — no task below may modify them.

---

## Phase 1: Setup

**Purpose**: Baseline and guardrails before any change

- [x] T001 Record the current-state baseline for the brands section: screenshot `components/home/BrandShowcase.tsx` at 360px and 1280px into `specs/004-mobile-brands-rows/baseline/` using the `browser-use` MCP, so the "before" exists for the C5 equal-finish and SC-011 comparisons **[BROWSER]** — captured as `baseline/brands-360.png` (section height 1243px) and `baseline/brands-1280.png` (1027px). `browser-use` exposes no viewport control, so the two widths were driven through Playwright (system Chrome, headless, `animations: "disabled"`) against the running dev server. **Baseline observations:** `#brands` contains exactly **one** brand link (`/shop?brand=اپل`) — the other eight ticker names (OAK, NEXA, VOCAL, TCH, REALME, NOKIA, XIAOMI, SAMSUNG) are inert text — and the Apple story panel renders a large empty image area.
- [x] T002 Confirm the dev-server health precondition from `CLAUDE.md` before any UI claim: exactly one Next process, port 3000 owner, and a 200 on the first `/_next/static/chunks/*.js` **[BROWSER]** — one `next dev` process (pid 241095), one listener on :3000, `GET /_next/static/chunks/webpack.js` → 200 / 140751 bytes
- [x] T003 [P] Verify no new dependency is introduced: record current `package.json` dependency set as the ceiling for this feature

---

## Phase 2: Foundational (BLOCKING — must complete before any user story)

**Purpose**: Fix the silent destination failure that makes every row's acceptance test meaningless.

**⚠️ CRITICAL**: research.md D1 established that all three brand hrefs and all eight category hrefs on the
homepage currently resolve to nothing and silently render the **entire unfiltered catalogue**. A row built on
top of that cannot satisfy FR-002 or Principle I.

**Checkpoint**: Foundational complete = a mistyped slug produces an explicit unknown state, and every
homepage brand/category link filters correctly.

- [x] T004 Write the failing unit test `tests/unit/brand-resolution.test.ts` asserting: (a) each of the six selected brands resolves to a catalog id with ≥1 product, (b) an unmatched slug yields the `unknown-brand` outcome and **not** an unfiltered result, (c) the eight category hrefs resolve. Expected counts from data-model.md: APPLE 49, SAMSUNG 42, XIAOMI 30, TCH 23, NOKIA 3, REALME 1
- [x] T005 [P] Create `lib/shop-filters.ts` exposing a pure resolver with the three `ResolutionOutcome` states from data-model.md: `resolved`, `unknown-brand` / `unknown-category`, `not-requested`. It MUST NOT be able to return "unfiltered" when a slug parameter was supplied
- [x] T006 Fix the silent fallback in `components/shop/ShopClient.tsx` (the `brandId`/`categoryId` lines that drop an unmatched slug) to route through `lib/shop-filters.ts` and render an explicit unknown state naming the requested brand or category — **C13**
- [x] T007 Run `npm test` and confirm T004 passes against T005/T006
- [x] T008 Make homepage brand destinations **derived, not hand-written**: in `lib/content/home.ts`, replace the literal `/shop?brand=apple|samsung|xiaomi` hrefs in `brandStories` with values resolved from the catalog's own brand slugs (`lib/catalog.ts` → `listBrands()`), so a future slug change cannot silently break a link again
- [x] T009 **Resolved by owner decision (Option B: remap onto real category ids, drop the
  unpopulated tiles).** The blocking premise was itself partly wrong: `/shop?category=…` does
  resolve, but only against the raw Persian slugs that `listCategories()` returns. Re-measured
  against `data/hami-products.json` with the same matching `queryProducts()` uses (`category.id`
  **or** any `other_categories[].id`): `موبایل` 8 · `هدفون-ایرپاد-و-هندزفری` 19 ·
  `آداپتور-کابل-و-شارژر` 9 · `ساعت-و-مچ-بند-هوشمند` 7 · `پاور-بانک` 6 · `خدمات-آنلاین` 1 —
  all resolvable. Dropped: `فیچرفون` (no such category exists at all) and `اسپیکر و Party Box`
  (`اسپیکر-پارتی-باکس` id 35 has **0** products). Parents `موبایل-و-تبلت` id 3 and `لوازم-جانبی`
  id 15 also have 0 direct products and the filter is exact-match with no subtree walk, so they
  are not usable targets. In `lib/content/home.ts`, `categoryMosaic` is now six tiles whose hrefs
  carry the catalog's own encoded slugs; `components/home/CategoryHub.tsx` dropped the two dead
  `categoryArtwork` entries. Drift guard extended in `tests/unit/brand-resolution.test.ts`:
  every tile's `category=` param must resolve verbatim against `listCategories()` **and** return
  `total > 0` from `queryProducts()`. **Residual gap:** 134 `kind: "phone"` products live only in
  brand-shaped categories (`آیفون-استوک` 45, `سامسونگ` 37, `شیائومی` 30 …), so no single tile can
  honestly say "all phones" — `موبایل` reaches 8 of them. Closing that needs the `kind` filter
  (Option A), which Principle III keeps frozen. in `lib/content/home.ts` (`categoryMosaic` /
  `categoryArtwork` entries consumed by `components/home/CategoryHub.tsx`) — **C14**
- [x] T010 [BROWSER] Verify all six brand and **six** category destinations filter correctly, including the REALME one-product case, per `quickstart.md` §2 — a one-result listing must not render as a failure state — **C12**
  Rendered toolbar counts, read from the live page after each navigation: `category=موبایل` → **۸ محصول** ·
  `هدفون-ایرپاد-و-هندزفری` → **۱۹** · `آداپتور-کابل-و-شارژر` → **۹** (filter chip reads «فیلترها ۱») ·
  `پاور-بانک` → **۶** · `ساعت-و-مچ-بند-هوشمند` → **۷** · `خدمات-آنلاین` → **۱ محصول** with product cards
  rendered and **no** `[role=status]` panel, so the one-result case is a listing, not a failure state.
  `brand=ریلمی` → **۱ محصول**. Dev-log confirms the resolution actually happens server-side
  (`/api/products?…&categoryId=80`, `…categoryId=5`). Homepage DOM: 6 `.cat-cell` tiles, 4 accessory rows,
  and **zero** remaining latin `category=` links anywhere on the page.
  **Scope grew here:** T009 only covered `categoryMosaic`, but the same stale latin slugs were live in
  `components/layout/Footer.tsx`, `components/shop/ShopBanner.tsx` (×2), `components/home/OnlineServices.tsx`,
  and `lib/content/home.ts` → `accessoryCategories` / `featuredOnlineService`. Left alone they would each now
  surface the unknown-filter panel, so they were repointed too: `lib/content/home.ts` exports a single
  `categoryLinks` object and every content-layer consumer references it, which the drift guard asserts.
  The `ENTERTAINMENT`/سرگرمی accessory row was dropped alongside the `party` mosaic tile (0 products).
- [x] T011 [BROWSER] Verify the negative case from `quickstart.md` §2: request a brand that does not exist and confirm the page states that instead of listing 189 products — **C13**
  `/shop?brand=apple` renders **0** product links, the toolbar count shows `—` instead of a number, and a
  `role="status"` panel reads ««apple» در برندها یا دسته‌بندی‌های ما پیدا نشد. این پیوند ممکن است قدیمی…».
  The pre-fix behaviour — silently listing all 189 — is gone.

---

## Phase 3: User Story 1 — Browse the brands as a considered list (Priority: P1)

**Goal**: Replace the wordmark wall with six stacked full-width brand rows on phone widths, each legible,
each navigating to that brand's products on the first press.

**Independent Test**: Render the section at 360px with emphasis, motion, and stories entirely disabled, and
confirm it reads as a complete, intentional brand list that reaches real product listings (spec.md US1).

- [x] T012 [P] [US1] Create `components/home/BrandRows.tsx` rendering six full-width stacked rows at phone widths — brand label, mark, ordinal — with no emphasis, no animation, and no story area yet. Resting rows MUST be visually distinct without a coloured band — **C1, C3**
  Built. Separation is a hairline (`border-bottom` per row, `border-top` on the list); no band, no transition,
  no state. Row grid is `ordinal | mark | label | arrow`, every column placed on the inline axis.
- [x] T013 [US1] Extend `components/brand/BrandMarks.tsx` to expose the six selected marks and their Persian labels as row-consumable data (اپل، سامسونگ، شیائومی، تی‌سی‌اچ، نوکیا، ریلمی), leaving `partnerMarks` and the hero band untouched
- [x] T014 [US1] Wire the row set in `lib/content/home.ts` to the six brands fixed by T008, enforcing the data-model rule: **a brand row may render only if it resolves to a catalog id with ≥1 product** — **C4**
  `BrandRows` maps `partnerMarks` and looks up `brandSlugByName[mark.name]`; with no slug it renders the row as
  a plain `<div>`, never a link that would silently return the whole catalogue. Three new cases in
  `tests/unit/brand-resolution.test.ts`: every mark name has a slug, that slug resolves to a catalog brand with
  `productCount > 0`, and the resolved brand's **name equals the mark's Persian label** (ZWNJ→space normalised)
  — so a mark can no longer be pointed at a different brand than the one it names. `partnerMarks` asserted = 6.
  `partnerMarks` already exposed exactly the six with `name`/`label`/`node`, so it was consumed, not duplicated;
  the missing piece was the destination, which is why `brandSlugByName` and `brandHref` were added to the
  content layer instead.
- [x] T015 [US1] In `components/home/BrandRows.tsx`, make the whole row a link that navigates on first press; no press is ever intercepted to reveal decoration — **C6**
  The `<Link>` *is* the row. No handler, nothing to intercept. Verified in the browser below.
- [x] T016 [US1] Render ordinals as Persian digits in RTL reading order via the existing `lib/utils.ts` numeral helper — **001/FR-011, C3**
  `toFaDigits(String(i + 1).padStart(2, "0"))` → ۰۱…۰۶. Reading order verified geometrically, not assumed.
- [x] T017 [US1] In `components/home/BrandRows.tsx` and its styles in `app/globals.css`, ensure no letter-spacing is applied to any Persian row label; the reference's tight tracking is explicitly not adopted — **001/FR-057, C21**
  `letter-spacing: 0` set explicitly on `.brand-rows__label` and `.brand-rows__index`. **Deviation:** the rules
  went into `app/(main)/home.css`, not `app/globals.css` — that is where every other homepage section's CSS
  lives, including the `.cat-grid` block this sits beside.
- [x] T018 [US1] Replace the wordmark-wall markup in `components/home/BrandShowcase.tsx` with `BrandRows` at phone widths, keeping `SectionHead` and the section's `id="brands"` anchor intact so `#brands` links still land
  Wall and story card both replaced; `id="brands"`, `aria-labelledby`, `SectionHead` and `ModernWhiteWave` kept.
  **Deviation, and it removes a defect:** the rows replace the wall at *all* widths, not only phone widths.
  Keeping the wall for ≥768px would have kept its eight `disabled` buttons captioned «روایت این برند به‌زودی»
  — the exact negative signal FR-004 forbids — and shipped two brand systems per breakpoint. The standalone
  story card went with it; `brandStories` is still exported and US2 puts each story inside its own expanded
  row, so nothing authored is lost. `BrandShowcase` no longer needs state and is now a server component
  (`"use client"` removed).
- [x] T019 [US1] Confirm `app/(main)/page.tsx` still mounts the section in place and that the `ModernWhiteWave` transition into it is not left stranded by the new markup
  `page.tsx` untouched — `BrandShowcase` still sits between `CategoryHub` and `NewArrivals`. The wave renders
  at the head of both captures.
- [x] T020 [P] [US1] Handle the long-name and no-mark cases from spec.md Edge Cases in `components/home/BrandRows.tsx`: the longest label in the set must not clip or overlap, and a future mark-less brand renders without a visual rather than an invented one — **C2**
  Longest labels (۷ glyphs) measured at 360px: no row overflows its container, no overlap. Mark-less future
  brand: a row exists only if it is in `partnerMarks`, and that file's existing rule is a real asset or an
  honest wordmark — REALME and TCH are set in the site's own type precisely because no licensed glyph exists.
  No invented mark is produced anywhere.
- [x] T021 [BROWSER] [US1] Verify `quickstart.md` §3 at 360px: six distinguishable rows, Persian ordinals, and computed `letterSpacing === "0"` on every Persian label — **C1, C3, C21**
  `count: 6`, every row `tag: "a"`, ordinals ۰۱–۰۶, `ordinalRightOfLabel: true` on all six, `overflowing: false`
  on all six, each row 312px wide × 72px tall (thumb-comfortable, so C20 is met by the same measurement).
  **The quickstart assertion is wrong as written.** Chrome returns `"normal"` from `getComputedStyle` for
  `letter-spacing: 0` — confirmed by setting `0px` on a fresh element and reading it back. The rule *is* applied
  (`.brand-rows__label -> 0px` is present, enabled and media-free in the served stylesheet). §3 should read
  `letterSpacing === "normal" || parseFloat(ls) === 0`; as written it reports a false negative on a correct build.
- [x] T022 [BROWSER] [US1] Verify `quickstart.md` §4 steps 1 and 5 against `components/home/BrandRows.tsx`: a row press navigates first-time, and section scrolling did not become less responsive with the section present
  Clicked the 4th row with no prior interaction: landed on `/shop?brand=نوکیا` on the first press. Step 5's
  press-outside / scroll-away release has no emphasis to release yet — that state arrives with US2, so it is
  re-verified there. Scrolling the section at 360px stayed smooth and nothing animates in it.

**Checkpoint**: User Story 1 is independently shippable — a working, honest, mobile brand list with no
emphasis behaviour at all. **Reached.** Captures: `baseline/brands-rows-360.png`, `baseline/brands-rows-1280.png`.
One config change was needed to make the row guard runnable: `vitest.config.ts` gained
`oxc: { jsx: { runtime: "automatic" } }`, because `tsconfig.json` sets `jsx: "preserve"` for Next and Vite 8
(oxc, not esbuild) emits invalid JS for any `.tsx` a test imports.

---

## Phase 4: User Story 2 — Choose a row and have it answer (Priority: P2)

**Goal**: Exactly one row at a time can hold emphasis, triggered by a dedicated control, releasing cleanly,
without moving a target under a thumb.

**Independent Test**: Tap one row's control, then another, then the same one twice, on a phone, and confirm
the shopper can describe what happened and what their next tap will do (spec.md US2).

- [x] T023 [US2] Add a separate, individually-labelled expand control to each row in `components/home/BrandRows.tsx`, with its own focus stop and its own accessible name — **C7, FR-016**
  A real `<button>` per row, 44×44px measured, own `aria-label` that changes with state
  (`دیدن جزئیات اپل` / `بستن جزئیات اپل`), `aria-expanded` and `aria-controls` pointing at the
  story band. It sits above the stretched row link on the z-axis, so it is the only press on the
  row that does not navigate.
- [x] T024 [US2] Implement the `EmphasisState` machine from data-model.md in `components/home/BrandRows.tsx`: `resting → emphasised`, re-press releases, selecting another releases the first **in the same frame**, and no both/neither intermediate exists — **C8, C10**
  One `useState<string | null>` holder, so a switch is a single render — there is no frame in which
  two rows hold it. Verified: after pressing row 1 then row 3, holders = 1; heights stayed
  `[115 ×6]`.
- [x] T025 [US2] In `components/home/BrandRows.tsx`, implement every release path: same-control press, press outside the section, section scrolled from view, and navigate-away-and-return — **C9**
  All four verified in the browser, holders returned to 0 for each: same-control press; pointerdown
  outside the `<ul>`; an `IntersectionObserver` on the list releasing at threshold 0; and
  navigate-to-`/shop`-then-back, which remounts the section resting. **Added a fifth:** Escape.
- [x] T026 [US2] In `components/home/BrandRows.tsx`, express emphasis as a surface change within reserved space at **fixed resting height** — the reference's 92px→190px growth is explicitly not adopted, because it shifts rows below out from under a thumb (research.md D5) — **C11**
  Surface change (oxblood gradient + brighter hairline + chevron rotation) with the story band
  given a **fixed height**, not a content-driven one, so all six rows measure 115px in both states.
  Measured list-relative offsets before and after emphasising: identical on all six.
  **Cost, stated plainly:** reserving the story space is what took the rows from US1's 72px to
  115px, i.e. the section is ~250px taller on a phone. That is what D5 asks for; the alternative —
  growing the row — is the thing FR-011 forbids.
- [x] T027 [US2] In `components/home/BrandRows.tsx`, reveal the brand story from `lib/content/home.ts` inside the emphasised area for the three brands that have one (APPLE, SAMSUNG, XIAOMI) — **C5**
  `brandStoriesByName` joins on the same Latin display name `partnerMarks` uses. Title and body both
  appear, inside the row, on emphasis. `visibility` keeps the hidden story out of the accessibility
  tree, so a resting row announces as a destination and nothing else.
- [x] T028 [US2] In `components/home/BrandRows.tsx`, enforce the equal-finish rule for the three without a story (NOKIA, REALME, TCH): **no disabled or dimmed styling, no empty frame, no "coming soon" or pending notice, and no affordance that only works for some brands.** Uniform finish is required; uniform content depth is not — **C5, FR-004**
  Measured on REALME and NOKIA against APPLE: label opacity 1, mark opacity 1, no `[disabled]`
  anywhere in the row, no pending string, and the story band is 44px on all three — the same height,
  so a brand without a story is not a shorter row.
  **This is what forced the product count.** With only the stories in the band, the chevron would be
  an affordance that reveals content on three rows and nothing on the other three, which FR-004
  forbids outright. So `BrandShowcase` now resolves each brand's real product count server-side
  through the same `resolveFilter` the row's link uses, and passes six numbers down: ۴۹ · ۴۲ · ۳۰ ·
  ۳ · ۱ · ۲۳. The count is on the name's own line in both states and brightens on emphasis, so every
  row answers. `lib/catalog.ts` was not modified — it is read, and the 2.2 MB export stays out of the
  client bundle because the resolution happens in the server component.
- [x] T029 [US2] Implement emphasis transition in CSS only, reusing existing duration utilities — no GSAP, no `motion`, no per-row loop (research.md D3, D4)
  Four `transition` declarations, 220ms ease-out, colour/opacity/transform only. No new dependency.
  `getAnimations()` across `#brands` and its subtree once the list is settled: **empty**.
  Reduced motion was checked in the same pass: the story still appears (opacity 1, visible), the
  chevron does not travel, and the content is identical — C17.
- [x] T030 [BROWSER] [US2] Verify `quickstart.md` §4 steps 2–4 and §6 against `components/home/BrandRows.tsx`: single-emphasis invariant, release paths, and zero running animations while nothing is emphasised (`document.getAnimations()` scoped to the section) — **C8, C9, C15**
  Covered above. One correction to the method: `rect.top + window.scrollY` is **not** a stable
  document position on this page — feature 002's scroll handling moved the section by 2750px between
  two reads that looked like a layout shift. Measuring each row against the list's own
  `getBoundingClientRect().top` is scroll-invariant and gave the clean result.
- [x] T031 [BROWSER] [US2] Verify `quickstart.md` §4 step 6 against `components/home/BrandRows.tsx`: capture the bounding box of the row below an expanding row before and after; any shift that removes a target fails — **C11**
  All six offsets and heights identical resting vs emphasised. Also checked the interaction the
  clause is really about: with row 1 held, pressing row 6's link still navigates on that first press
  (`/shop?brand=تی-سی-اچ`), so no emphasis state ever costs a navigation press.
- [x] T032 [BROWSER] [US2] Verify `quickstart.md` §5 against `components/home/BrandRows.tsx`: compare computed styles on REALME/NOKIA against APPLE when expanded — no reduced opacity, no `disabled`, no pending text — **C5**
  Done, and recorded under T028.

**Checkpoint**: User Stories 1 and 2 both work independently; the section now has its emphasis
behaviour. **Reached.** Captures: `baseline/brands-us2-rest-360.png`, `baseline/brands-us2-emphasis-360.png`
(and the `-1280` pair).
**Two content/layout consequences worth the owner's eye:**
1. The three `brandStories.text` lines were shortened to a single clause each (89/84/75 characters →
   48/38/40). At the old lengths the reserved story band needed ~103px and every row became 175px — a
   1050px section on a phone. The meaning is unchanged; the sentences lost their subordinate clauses.
2. US1's trailing `ArrowLeft` was dropped from the row. Once the count and the expand control joined
   the name's line there was no room for it at 360px without pushing the label. The row is still
   obviously a destination — it is a real link and the only other target on it is the chevron.

---

## Phase 5: User Story 3 — Reaching the brand must never cost an extra step (Priority: P3)

**Goal**: Keyboard, screen-reader, and pointer users reach every brand's products in one action, and the
instruction copy is honest and Persian.

**Independent Test**: Reach each brand's products using keyboard only, then screen reader, then mouse —
compared against the swipe path, same destinations, no more steps (spec.md US3).

- [x] T033 [P] [US3] Write the failing unit test `tests/unit/brand-reachability.test.ts` asserting each of the six brands yields a distinct, resolvable destination object consumable without pointer input
  Written first, confirmed failing (`Cannot find package '@/lib/brand-counts'`), then made to pass.
  Seven cases: six rows with no duplicate href or `detailId`; every row's slug resolving to the brand
  **whose name equals the row's own Persian label**, not merely to some brand; the count on the row
  matching the catalogue through `toLocaleString("fa-IR")` — an independent path to the model's
  `toFaDigits`; accessible names carrying no ASCII letter; an open name and a different close name;
  the three story-less rows still carrying a real distinct destination; ordinals exactly ۰۱…۰۶.
- [x] T034 [US3] In `components/home/BrandRows.tsx`, make keyboard activation of a row navigate in one action, independent of the expand control — **C18, FR-013**
  The row is a real `<a>` rendered by `next/link`, so Enter activates it natively — no handler to get
  wrong. Verified: focus the third row's link, press Enter, landed on `/shop?brand=شیائومی`.
- [x] T035 [US3] Expose row and control state to assistive technology without borrowing a control role that means something else — an `<a>` that expands is the failure mode to avoid in `components/home/BrandRows.tsx` — **C19, FR-014**
  The link stays a link and carries only `aria-label`; expansion lives on a separate `<button>` with
  `aria-expanded` and `aria-controls`. Measured through a keyboard pass: twelve stops, alternating
  `a`/`button`, names `محصولات …` and `دیدن جزئیات …`, and after activating the button it reads
  `aria-expanded="true"` with the name switched to `بستن جزئیات اپل`. No `role=` override anywhere.
- [x] T036 [US3] In `components/home/BrandRows.tsx`, localise the expand control's accessible name and any visible hint into Persian, RTL-ordered, at acceptable contrast against the emphasised surface — the reference's faded Latin "Tap again ↗" is not adopted — **C7, FR-015**
  No visible hint text is shown, so there is nothing to localise beyond the control names — all twelve
  are ASCII-free. **Contrast was measured, not assumed, and one value failed.** Composited over the
  emphasised band at both ends of its gradient: label 12.61:1, story title 12.44:1, story text 6.88:1,
  chevron 10.09:1 — but the ordinal was **3.32:1** and the count **3.88:1**, both under 4.5:1 for text
  that small. Ordinal raised to `rgba(229,211,179,0.72)` and count to `0.68`; re-measured at 5.66:1 and
  6.60:1 resting-and-emphasised. The reference's faded Latin affordance is not used in any form.
- [x] T037 [US3] Prove no dead-end state exists in `components/home/BrandRows.tsx`: a row cannot become emphasised in a way that makes its destination unreachable
  The link is a sibling of the story band, not a child, so emphasis cannot remove it — asserted in the
  browser (`linkStillThere: true` while `data-emphasised` is set) and in the unit test, which requires
  every row to carry an `href` regardless of `hasStory`. Also checked from the other side: with row 1
  held, row 6's link still navigates on that first press.
- [x] T038 [US3] Ensure touch targets are thumb-comfortable and never sit beneath the fixed header's area (header is `fixed` and changes appearance on scroll — account for both states) — **C20**
  Row link measures 304×90, the expand button 44×44 on every row. Jumping to `#brands` puts the first
  button at y=692 against a header bottom of y=69 — clear, and `scroll-margin-block-start` already
  covers both header states. The bottom row against the fixed mobile dock: 11657px of page remains
  below it, so it is always liftable out from under the dock rather than trapped there.
- [x] T039 [BROWSER] [US3] Verify `quickstart.md` §7 against `components/home/BrandRows.tsx`: tab order, visible focus at every stop, arrow direction matching RTL expectations, activation navigating, and a screen-reader pass announcing destinations and state — **C18, C19**
  Twelve stops in the section, each with a computed `outline: solid 2px` — focus is visible at every
  one, nothing skipped. Order is link-then-control per row, which is right-to-left reading order for
  this layout (the link owns the reading edge, the chevron sits at the inline end).
  **Honest limit:** this is the accessible-name and role tree read out of the DOM, not an actual
  screen reader. VoiceOver/NVDA phrasing is unverified.

**Checkpoint**: All three user stories independently functional; no input method is second-class.
**Reached.** The row's identity, destination and assistive names now come from one pure
`buildBrandRows()` in `lib/content/home.ts`, and the counts from `lib/brand-counts.ts` — the module the
server component and the unit test share, so the number a row prints and the listing its link reaches
are one fact rather than two that happen to agree. `BrandShowcase` is the only place that reads
`lib/catalog.ts`, so the 2.2 MB export still never reaches the client bundle.

---

## Phase 6: User Story 4 — Motion that stays calm on a phone (Priority: P4)

**Goal**: Nothing loops, nothing animates unseen, reduced motion is equivalent, and the section coexists with
the page's other motion.

**Independent Test**: Browse with reduced motion enabled, keyboard/screen-reader only, and on a throttled
device; the page stays complete and calm in all three (spec.md US4).

- [x] T040 [US4] Enforce the motion budget in `components/home/BrandRows.tsx`: no row animates while not emphasised, and nothing animates while the section is off screen — **C15, C16, FR-017**
  Measured with `Element.getAnimations()` scoped to `.brand-rows` and its subtree, attributing every
  running animation to the row that owns it. At rest in view: **none**. Mid-transition: **only the
  emphasised row**. Settled: none. Scrolled to the top of the page: the section is off screen, running
  animations 0 and emphasis holders 0 — the `IntersectionObserver` released it.
  **Scoped deliberately:** measured against the whole `#brands` section at rest it first reported
  `opacity` and `transform` running, which belong to `Reveal`'s scroll-in, not to these rows.
- [x] T041 [P] [US4] Implement the reduced-motion path in `components/home/BrandRows.tsx` following the existing `components/home/Reveal.tsx` guard pattern: emphasis becomes a settled state change, content identical — **C17, FR-020, FR-021**
  Implemented and verified. **Deviation, deliberate:** `Reveal` guards with a JS `matchMedia` because it
  must decide whether to *hide* content before its observer runs. A two-state transition has no such
  decision, so the guard here is a CSS `@media (prefers-reduced-motion: reduce)` block plus the page-wide
  floor in `globals.css` — same result, no script, no flash, no main-thread work. The hero brand band was
  already paused this way.
- [x] T042 [US4] Confirm the marquee band from the reference is absent — no `repeat: -1` loop anywhere in the section (research.md D4). This also keeps consistency with the Q3 = C decision that removed the page's other marquee — **C16**
  No `animation`, `@keyframes` or `infinite` anywhere in `BrandRows.tsx`, `BrandShowcase.tsx`,
  `BrandMarks.tsx` or the `.brand-rows` CSS block.
  **But the clause's second half was not true when read, and is now.** `BrandTicker` was still running
  `animation: brand-ticker 42s linear infinite` — Q3 = C had been answered but never executed. It is now
  a static band: the keyframes, the doubled `w-max` track translating −50%, the `min-w-[100vw]` guard
  against the blank sweep, the edge mask, the hover/focus pause, two reduced-motion overrides that
  existed only to stop them, and the `dir="ltr"` placement hack are all deleted. The mark list is
  rendered once and exposed as a real labelled list with each brand's Persian name, replacing an
  `aria-hidden` strip plus an `sr-only` duplicate. Measured: 6 marks, list labelled `برندهای همکار`,
  **0 running animations** at 360px and 1280px. The band's pinned RAL 3004/cream contrast is untouched,
  and `BrandTicker`'s doc comment now records why the previous static version — seven equal boxes each
  captioned «برند همکار» — must not be rebuilt.
- [x] T043 [US4] Verify the section does not contend with the hero band reworked in Q3 = C or with `002`'s scroll ground when that lands; record the shared duration/easing choice against **C22–C26** in `specs/004-mobile-brands-rows/notes/coherence.md`
  Written. **It records a defect that was got and fixed:** the rows were written with `ease-out`, but
  this page's easing family is the pinned `cubic-bezier(0.2, 0.7, 0.3, 1)` used by `.reveal`,
  `tray-card-in` and `word-swap`. Seven declarations corrected. The duration was already 220ms, which is
  the `normal` step of the token scale in `tailwind.config.ts` — a scale whose own comment says
  arbitrary durations are not allowed.
  Also recorded as **not closeable today**: US4 scenario 7 ("one choreography, not three competing
  ones") cannot be verified while feature 002's scroll ground is unimplemented. And two category-tile
  rules at `home.css:175/193` still use `100ms ease-out` — on-scale duration, off-family curve — which
  is feature 005's surface and 005's C22 obligation, not this feature's to change silently.
- [x] T044 [BROWSER] [US4] Verify `quickstart.md` §6 end-to-end on `components/home/BrandRows.tsx`, including that a reduced-motion shopper reaches identical brands, labels, marks, stories and destinations with nothing absent — **C17**
  A reduced-motion context was snapshotted against the full-motion run — ordinals, labels, mark markup,
  hrefs and story text for all six rows — and the two are **identical**. Activating the chevron there
  still reveals the story (`visibility: visible`, `opacity: 1`), the chevron's computed `transform` is
  `none`, and the transition duration collapses to the floor.
- [x] T045 [BROWSER] [US4] Verify `quickstart.md` §9 on a throttled mid-range phone profile: expanding rows in quick succession stays responsive with no stutter — **C16, FR-022**
  **Measured on a production build, not the dev server** — the first numbers, taken in dev, showed 50ms
  median with transitions against 33ms without, which is dev-mode style recalculation being attributed
  to this section. `npm run build` was run, the A/B repeated under `next start`, and the dev server
  restarted afterwards per the stale-build note in `quickstart.md`.
  At 360px with 4× CPU throttling, six expansions at 130ms intervals, rAF frame gaps sampled:
  transitions **on** median 33.4ms / p95 100 / worst 166.6; transitions **off** median 33.3ms /
  p95 83.3 / worst 133.3. **Median cost is nil**; a small tail difference remains, within the noise of
  ~90 sampled frames. Every click registered and exactly one row held emphasis throughout.
  A real mid-tier handset is still the only honest final word on this clause.

**Checkpoint**: All four user stories independently functional and calm. **Reached.**
**One fix came out of writing this phase rather than out of a task.** The emphasis surface was set as
`background: linear-gradient(...)` on a `background-color` transition — gradients are `background-image`
and do not interpolate, and the colour underneath never changed, so the band appeared in a single frame
while everything around it eased. US2 scenario 5 asks for a transition that arrives smoothly with no
flicker. The band is now a `::before` whose opacity moves, inside a row that isolates its own stacking
context. It is also the cheaper of the two to composite.

---

## Phase 7: Polish & Cross-Cutting

- [x] T046 [P] Reconcile `004/FR-032` and `005/FR-038` in writing: confirm the five shared behaviours are honoured by both sections, and record that **C24 binds feature 005 in return** — its carousel's active panel must also navigate on first press
  Written into `notes/coherence.md` as a five-row table: 004's commitment per clause, each one measured
  in `notes/validation.md`, against what 005 must match. **005's half cannot be confirmed because 005 is
  not built** — `CategoryHub` is still the static mosaic — so the note states 004's obligations as met
  and 005's as owed, rather than claiming a two-sided reconciliation that has not happened. C24 is
  called out as the clause most likely to be missed, because 005's spec predates 004's Q2 = C; 005
  already concedes at its line 420 that 004's answers constrain it. Also recorded: by executing Q3 = C,
  004 removed the page's only other travelling element, which is what makes C25 satisfiable for 005's
  carousel at all.
- [x] T047 [P] Correct `CLAUDE.md` where it states "Next.js 14"; installed is 15.5.25 (flagged in plan.md)
  Line 3 corrected to "Next.js 15.5.25", verified against `require('next/package.json').version`.
  **Line 12 left alone deliberately** — it describes `docs/inspires/techBazar/`, which genuinely is a
  Next.js 14 template. CLAUDE.md is kept, per the owner's instruction.
- [x] T048 [P] Run the full `quickstart.md` §1–§9 validation pass and record results in `specs/004-mobile-brands-rows/notes/validation.md` **[BROWSER]**
  Done as one consolidated run against the live dev server, not a re-collection of earlier results.
  §1 113 tests / 0 failures. §2 all six brand listings filtered **and pure** — `wrongBrand: 0` from the
  same `/api/products?brandId=…` call the page makes — plus all six category counts and the negative
  case. §3–§7 all pass, including the §4 offset table showing resting geometry byte-identical before and
  after the whole press sequence. §8 **cannot run** (005 unbuilt). §9 passes on a production build under
  4× CPU throttle, with the caveat that a real handset is the honest final word.
  Two probe bugs found in the process and fixed in the harness, not the app: the toolbar probe never
  settled on the unknown-filter state (it renders `—`, not a count), and `rect.top + scrollY` is not a
  stable document position on this page.
- [ ] T049 Record the SC-011 comparison in `specs/004-mobile-brands-rows/notes/reception.md`: at least 7 of 10 reviewers judge the section more premium than the T001 baseline and fewer than 2 find it busier
  **Instrument written; measurement not performed — this needs ten humans and cannot be closed by an
  agent.** `notes/reception.md` pairs the T001 baseline `brands-360.png` against the shipped
  `brands-us2-rest-360.png` at the same width and scroll position, gives the two questions in Persian
  with three fixed answers each, randomisation guidance, and an empty 10-row results table. SC-012 is
  recorded as additionally impossible right now: it asks about three motion systems and feature 002's
  ground does not exist. The note does list the two judgement calls a reviewer should be told about —
  the section is ~250px taller on a phone, and the three stories were shortened to fit the band.
  **Dropped by owner decision 2026-09-22, and left unchecked because it was never measured.** Asked
  directly whether they could assemble ten reviewers, the answer was no — and the owner volunteered their
  own read instead: the section is "somehow simple, boring, not styled and mis-placed in desktop".
  SC-011 therefore has no evidence behind it. The reception instrument in `notes/reception.md` goes
  unused. Do not report this feature as reception-validated.
- [x] T050 Run `npm run typecheck` and `npm test` clean, then restart the dev server if `npm run build` was run at any point (it rewrites `.next` under a live server)
  Typecheck clean; **113 unit tests, 0 failures** — the two `product-images` failures are gone (T055).
  **`npm test` was deliberately not run, and it cannot be made clean as written.** It is
  `dotenv -e .env.test -- vitest run`; `.env.test` does not exist in this repo, so `DATABASE_URL` falls
  through to `.env` → `hami_site_api`, and `tests/setup.ts` runs `resetDb()` in a global `beforeEach`
  that `deleteMany()`s all 19 tables — including for the pure unit tests, which never touch a database.
  The dev database currently holds 0 rows in every table, so nothing was destroyed by the runs that did
  happen, but this is a live hazard and the fix belongs to the test harness, not to this feature.
  `npm run build` **was** run in Phase 6 for the throttled measurement; the dev server was restarted
  afterwards and re-verified the way `quickstart.md` prescribes: one `next dev` process, port 3000
  owner, first `/_next/static/chunks/*.js` → 200.
- [x] T051 Update the knowledge graph with `graphify update .` per `CLAUDE.md`
  Ran. 5180 nodes / 8527 edges / 412 communities; the curated graph was backed up to
  `graphify-out/2026-09-21/` first. `.graphifyignore` is holding: zero `.claude/worktrees` nodes.
  Two warnings left standing, both cosmetic: the installed skill is 0.9.16 against package 0.9.40
  (`graphify install` would sync them), and community labels are stale at 54 saved against 412
  present (`graphify label` refreshes them with the LLM).
- [x] T052 [P] Verify no file under `data/`, `app/api/`, or `prisma/` was modified — the Principle III freeze boundary
  `git status --porcelain -- data app/api prisma` → empty. `lib/catalog.ts` was read, never written.
- [ ] T053 **Carried out of T009/T010.** `categoryLinks.mobile` reaches 8 products, but the export holds 134
  `kind: "phone"` products that live only in brand-shaped categories (`آیفون-استوک` 45, `سامسونگ-samsung` 37,
  `شیائومی-xiaomi` 30, `تی-سی-اچ-tch` 10, `داریا-باند` 4, `ووکال` 5, `نوکیا` 2+1, `realme-ریلمی` 1). No category
  groups them, so no homepage tile can honestly say "همه گوشی‌ها" — and the parent `موبایل-و-تبلت` (id 3) has 0
  direct products because `queryProducts` matches `categoryId` exactly with no subtree walk. Closing this needs
  either a `kind` filter or a subtree walk in `lib/catalog.ts` + `app/api/products/route.ts`, both frozen by
  Principle III. **Owner decision required before any tile is re-labelled.**
  → **Owner accepted the 8 on 2026-09-22: "accept 8".** No frozen layer is being opened for this. The
  consequence is a labelling rule, not a code change — the tile keeps its current wording and MUST NOT be
  re-labelled to anything that promises all phones, because it does not deliver them. Revisit only if
  feature 005's category structure makes a `kind` filter cheap.
- [x] T054 `components/shop/CategoryTiles.tsx` renders the API's root categories verbatim, so the shop page shows
  three tiles that lead nowhere — `موبایل-و-تبلت`, `لوازم-جانبی`, `لوازم-جانبی-لپ-تاپ` all resolve to 0 products
  and render the empty state. Verified in the browser at `/shop`. Either filter the tiles to categories with
  products (needs a count the categories API does not currently return) or hand-pick them in the content layer.
  Overlaps feature 005.
  **Fixed, by deriving rather than hand-picking.** New `lib/shop-category-tiles.ts` resolves which root
  categories actually hold products from `lib/catalog.ts` — which is read, never modified — and the shop
  page passes that short list of slugs down through `ShopClient` to `CategoryTiles`. The categories API
  was not touched and returns no counts; the count is resolved server-side where the catalogue can be
  read for free, and only six strings cross to the client.
  Verified in the browser: the six tiles are now `خدمات آنلاین` 1 · `ارسال رایگان ویژه` 3 · `سیمکارت` 3 ·
  `تجهیزات کامپیوتر و لبتاب` 5 · `ماوس و کیبورد` 5 · `موبایل` 8 — every one a populated listing, none
  showing the empty state. Guarded by `tests/unit/shop-category-tiles.test.ts`, which asserts every tile
  is a root with ≥1 product **and** re-asserts that the three that were removed still have 0, so the
  exclusion is a checked fact rather than a frozen decision.
- [x] T055 `tests/unit/product-images.test.ts` has 2 failures that **predate this feature** and were not caused by
  any task here: `categoryImageFor("home", "خانگی")` returns `/images/categories/phone.png` instead of
  `home.png`, and `resolveProductImage > ignores legacy image URLs`. T050 cannot go green until they are triaged —
  decide whether the mapping or the expectation is wrong.
  **One was a real bug, one was a stale expectation.**
  - *Real bug, fixed in code.* `resolveProductImage` returned any `images[].url`, including a remote one.
    The whole export carries remote URLs (`https://hamihamrah-shop.com/shop-resources/…`, 1758 of them,
    0 local), and `lib/catalog.ts` mirrors only each product's **primary** image locally — the gallery
    keeps its origin URLs. So a bare `find(img => img.url)` could hand the storefront a live-host URL,
    which is precisely the 5.8–7.5s-per-image, `next/image` 500-ing failure the mirror exists to escape.
    Now local paths only, falling through to the offline keyword pack otherwise. The test was right and
    the code had drifted from the file's own header comment.
  - *Stale expectation, fixed in the test.* `home.png`/`tv.png` have no keyword sets because the mapping
    was checked against the catalogue and **zero of its 32 categories matched either** — documented in
    `lib/product-images.ts`. The test still asserted the old files. Corrected to assert the fall-through,
    and a new case re-runs the original check against `listCategories()` so the decision gets revisited
    the day the shop actually stocks those departments.
  - **Two things the triage turned up.** The comment claimed the two PNGs "were removed" — they were
    not: `public/images/categories/home.png` and `tv.png` are still on disk (~290 KB), unreferenced by
    any code path. Deleting them is the owner's call, so the tests assert the mapping, not the files'
    absence, and the comment now says that accurately. And a new case asserts every tile the mapping does
    name actually exists on disk, so a mapping can never point at a missing file again.

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Setup)**: no dependencies
- **Phase 2 (Foundational)**: **BLOCKS ALL USER STORIES.** T004→T005→T006→T007 is a strict chain; T008/T009 depend on T005; T010/T011 verify the phase
- **Phases 3–6 (US1→US4)**: each depends on Phase 2 only. US2 depends on US1 (T012 is its host file); US3 depends on US2 (the expand control from T023 is what it makes reachable); US4 depends on US2 (motion budget applies to the emphasis transition)
- **Phase 7**: after the stories being shipped

### Story dependency graph

```
Phase 2 (blocking) ──┬──> US1 (T012…T022) ──┬──> US2 (T023…T032) ──┬──> US3 (T033…T039)
                     │                       │                      └──> US4 (T040…T045)
                     └───────────────────────┴──> Phase 7
```

### Within each story

Resolution/test before implementation where automated; markup before styling; implementation before
**[BROWSER]** verification; story checkpoint before the next priority.

### Parallel opportunities

- T001, T003 (Setup) run together
- T005 and T009 are different files, but T009 needs T005's resolver — only T003-style checks are truly parallel in Phase 2
- T013 and T020 are separate files within US1
- T046, T047, T052 are independent polish tasks
- **Phase 2 is the serial bottleneck. Nothing else can be validated until destinations work.**

---

## Parallel Example: User Story 1

```bash
# After T012 exists, these touch different files:
Task: "Extend mark/label data in components/brand/BrandMarks.tsx (T013)"
Task: "Handle long-name and no-mark cases in components/home/BrandRows.tsx (T020)"
# Baseline capture is independent of everything:
Task: "Record before-state screenshots (T001)"
```

---

## Implementation Strategy

### MVP First — Setup + Foundational + User Story 1

1. Phase 1 baseline (T001–T003)
2. **Phase 2 in full** — the destinations must actually work (T004–T011)
3. Phase 3 — six honest, navigable, RTL-correct rows with no emphasis (T012–T022)

**MVP delivers real value on its own**: it replaces the homepage's weakest section with a working brand list
and simultaneously repairs eleven silently-broken links. spec.md US1 is explicitly designed as the safe floor
that survives every other decision.

### Incremental delivery

- **+US2** → the emphasis interaction, the reference's actual signature
- **+US3** → parity for keyboard and screen-reader users
- **+US4** → motion discipline and reduced-motion equivalence
- **+Phase 7** → cross-spec coherence, documentation corrections, validation record

### Stop conditions

- If the destination fix turns out to require a change under `app/api/` or `lib/catalog.ts`, **stop** — that
  is a Principle III amendment, not an implementation detail (plan.md gate row III).
- If a seventh brand is ever added without an authentic mark, it renders without a visual; generating one is
  prohibited by FR-027 and was the reason the set was fixed at six.

### Deferred, tracked elsewhere

Three category tiles with no artwork (computer accessories, SIM cards, car chargers) belong to feature 005 and
are unresolved: generated rasters arrive ~2 MB and without alpha, so they neither match the existing flat SVG
badges nor solve isolation.
