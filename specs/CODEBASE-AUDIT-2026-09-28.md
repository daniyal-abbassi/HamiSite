# Codebase audit — 2026-09-28 · task HERMES-AUDIT-01 (worker: hermes, mode: research)

Read-only audit of the working tree on branch `Hami-v3` (HEAD `8864feb` + 6 modified / 42 untracked
files belonging to live agents). No file outside this report was written. Every finding carries the
command that produced it.

**Commands run:** `npm run typecheck` (exit 0) · `npm run test:unit` (25 files / 340 tests, all pass,
`setup 0ms`) · `grep`/`git ls-files` sweeps per section · no build, no browser, no DB queries (see
"Not checked, and why").

---

## Pass 1 — Type and build correctness

| sev | file:line | what is wrong | evidence | suggested fix |
|---|---|---|---|---|
| info | — | `tsc --noEmit` is **clean**, exit 0, zero output | `npm run typecheck` | none |
| info | — | Unit suite **green**: 25 files, 340 tests, 0 failures; `setup 0ms` proves no DB load | `npm run test:unit` | none |
| **medium** | `package.json` (whole) | **No linter exists**: no `lint` script, no `eslint` dependency, no `.eslintrc*`. `tsc` is the only static gate — exhaustive-deps lies, unused vars, hook-rule violations have no automated check | `python3 -c "…'lint' in scripts"` → `False`; `grep eslint package.json` → none; `ls -a \| grep -i eslint` → none | add ESLint + `eslint-config-next` with a `lint` script (one dev-dep chain, standard for this stack) |
| low | `tests/unit/orders.test.ts:21,41,61,81` | the only 4 real `as any` in the repo — Prisma `Decimal` mocked as `{toString}`. Test-only, but it hides type drift if the order model changes | `grep -rn '\bas any\b' app components lib tests` → 4 hits + 1 false positive (test title at `tests/api/auth-legacy-login.test.ts:71` contains the words "as any") | give the mock a `Decimal`-compatible type or import the real Decimal class |
| low | `lib/atmosphere/progression.ts:302` | `return PROGRESSION[segment]!.color` — non-null assertion hides an out-of-range `segment`; only one `!.` assertion in the codebase | `grep -rnE '…!\.' app components lib` → 1 hit | return `undefined` or clamp `segment` before indexing |
| info | `tests/unit/http.test.ts` | stderr stack on every run is that file's deliberate "maps a non-ApiError throw to 500" case — not a failure | visible in `npm run test:unit` output; board 2026-09-28 04:05 documents it | none |
| info | — | `@ts-ignore` / `@ts-expect-error`: **0 occurrences** in `app/`, `components/`, `lib/`, `tests/`, `types/` | `grep -rn '@ts-ignore\|@ts-expect-error' … \| wc -l` → `0` | none |

## Pass 2 — Bugs and dead logic

| sev | file:line | what is wrong | evidence | suggested fix |
|---|---|---|---|---|
| **medium** | `components/admin/coupons/CouponsAdminClient.tsx:38` (132 lines) | dead component: exported and **never imported**. The live page `app/(admin)/admin/coupons/page.tsx` renders `<EmptyState …آماده‌سازی نشده است/>` instead — the finished-looking client is scaffolding nobody mounts | `grep -rn 'CouponsAdminClient' app components` → only the definition; `cat app/(admin)/admin/coupons/page.tsx` → EmptyState | either wire it into the coupons page or delete it; owner's call (back office is Constitution-III-frozen, report-only) |
| **medium** | `lib/payment/zarinpal.ts:17,50` | payment `fetch` with no `response.ok` branch and no guard that `payload.data` exists: a non-JSON reply throws inside `response.json()`, a JSON error body makes `payload.data.code` a TypeError. Money path | `sed -n '10,70p' lib/payment/zarinpal.ts` — no `response.ok` anywhere in the file | check `response.ok` and `payload?.data` before reading `.code`; map to the existing Persian error surface |
| low | `lib/shop-query.ts:75` | `subtreeCounts()` exported, **zero references anywhere** | `grep -rn subtreeCounts app components lib tests scripts tools specs` → 1 hit (its own definition) | delete |
| low | `components/liquid/motion.ts:71` | `EASE_OUT_STRONG` exported, zero references (the other easings are used) | `grep -rn EASE_OUT_STRONG …` → 1 hit (definition) | delete or use at the call sites that hand-write the same curve |
| low | `components/atmosphere/useAtmosphereGround.ts:118` | `STAGE_COUNT` exported, zero references | `grep -rn STAGE_COUNT …` → 1 hit (definition) | drop the `export` or delete |
| low | `lib/content/home.ts:213` | `storeExperienceSlots` exported, zero references in source (only mentioned in specs docs) | `grep -rn storeExperienceSlots app components lib tests` → 1 hit (definition) | delete; update the spec note that cites it |
| low | `lib/auth.ts:172` | `getSessionUser` exported but only called by `getOptionalSessionUser` in the same file; all real callers use the wrapper | `grep -rn getSessionUser app components lib` → 3 hits, all `lib/auth.ts` (def, comment, wrapper) | drop the `export` on `getSessionUser` |
| low | `components/partners/PartnerForm.tsx:304` | success state renders `` `Track / ${status.id}` `` — Latin digits and an English label shown to a Persian-language user | `sed -n '295,306p' components/partners/PartnerForm.tsx` | run the id through `toFaDigits` (and decide whether the English "Track /" label is deliberate pseudo-English) |
| info | `components/shop/FilterSheet.tsx`, `components/ui/dialog.tsx`, `components/cart/CartDrawer.tsx`, `components/ui/flip-words.tsx` | **no bug found**: every `addEventListener`/`setTimeout` sampled has its cleanup (`removeEventListener` / `clearTimeout`), add=remove counts match | `grep -c add/removeEventListener` per file; `sed -n '50,56p' components/ui/flip-words.tsx` | none — but only 4 of 31 `useEffect` sites were sampled (see Not checked) |
| info | `components/partners/PartnerForm.tsx:282`, `lib/api-client.ts:23-33`, `lib/api-client.ts:49-57` | **no bug found**: non-2xx/envelope errors are handled (`response.ok` + `body.success` in PartnerForm; try/catch JSON + `!body.success` → `ApiClientError` in `api-client`) | `sed` of each site | none |

## Pass 3 — Junk and duplication

Method for CSS: extract every `.class` token from each stylesheet, grep the whole `app/`, `components/`,
`lib/` tree (all file types) for it; anything whose only hits are in CSS files is orphaned.

| sev | file:line | what is wrong | evidence | suggested fix |
|---|---|---|---|---|
| **medium** | `app/(main)/home.css:116-315` | the entire `.brand-rows*` block (~35 selectors, ~200 lines) is orphaned: `BrandRows.tsx` now renders `className="brand-deck"` after the 011 rework, and **no file contains the string `brand-rows` outside this stylesheet** | `grep -rn 'brand-rows' app components lib` → only `home.css`; `sed -n '38,90p' components/home/BrandRows.tsx` → `className="brand-deck"` | delete the block — but `app/(main)/home.css` is **locked by qoder**, so post a REQUEST, do not edit |
| **medium** | `app/globals.css:191,354,395-420,788-…` | orphan clusters, CSS-only: `bg-product-stage` (the known one), `site-header`, `word-swap` + its `@keyframes`, `swap-card`/`swap-card-1..3`/`-body`/`-icon`/`-index`/`-title`, `card-museum`/`card-obsidian`/`card-oxblood`/`card-saffron`, `frame-bleed`/`frame-mat`/`frame-plinth`, `nav-featured-union`, `shiny-edge`, `text-stroke`, `gold-gradient-text` | for each: `grep -rn <cls> app components lib` → total-files `1` (the stylesheet itself), zero non-CSS hits | batch-delete after 002's T025 is reconciled (it still points at `.bg-product-stage`: `specs/002-scroll-atmosphere/tasks.md:329,332`) |
| low | `app/(main)/home.css:527-553+` | more orphans, CSS-only: `proof-media`, `store-architecture`, `store-slot`, `product-composition`, `brand-composition`, `b2b-route`, `cat-ambient-stage`, `cat-corner-glow` | same method; `grep -rn 'b2b-route' app components lib` → CSS only | fold into the same cleanup pass (owner of home.css) |
| low | `lib/shop-query.ts:189` vs `lib/utils.ts:9` | duplicated price formatter: `amount()` re-implements `formatToman` (same `toLocaleString("fa-IR") + «تومان»`), risking the two drifting | `grep -rn 'formatToman\|fa-IR' lib` shows both | replace the inline lambda with `formatToman` |
| low | repo root | three tracked junk files: `start-err.txt` (**0 bytes**), `start-log.txt` (148 B, a stale `next start` log), `aura-landingSample.html` (41.7 KB scratch landing page) | `git ls-files \| awk -F/ 'NF==1'`; `wc -c` on each | `git rm --cached` (owner decides; do not delete without asking) |
| low | `.specify/integrations/.cache/catalog-*.json` (4 files) | tooling build-cache committed to git (`.cache/` in a tracked path) | `git ls-files '*.json' \| grep '/.cache/'` → 4 | add `.specify/integrations/.cache/` to `.gitignore`, untrack |
| info | — | `console.log` in `app/`, `components/`, `lib/`: **0** · `TODO/FIXME/XXX`: **0** | `grep -rn 'console\.log' app components lib` → empty; same for TODO | none |
| info | `package.json` | no unused dependency found: `lenis` is dynamically imported at `components/atmosphere/ScrollSmooth.tsx:69` (static-import scan alone would have missed it); `react-dom` has no direct import but is a required Next.js peer | `grep -rn 'lenis' …` → `ScrollSmooth.tsx:69` | none |

## Pass 4 — Old and unrelated files

| sev | file | what it is / was | replaced by | references remaining | verdict |
|---|---|---|---|---|---|
| info | `specs/005-categories-carousel/` (14 md + `baseline/` PNGs) | spec of the carousel feature | code deleted by 010 (`components/home/CategoryCarousel.tsx` gone); only a historical comment mentions it (`components/home/CategoryArrival.tsx:41`) | source: none | **deliberate historical record — keep**, no action |
| info | `specs/009-categories-editorial-mosaic/` (incl. `preview/*.png`, `compare.html`) | cancelled feature (owner rejected both variants); `notes/status.md` documents the cancellation | feature 010 | source: none (`grep -rn 'CategoryMosaic\|category-mosaic' app components lib` → empty) | **historical record — keep**; preview images are the rejection evidence, do not report as junk |
| low | `public/brand/categories/feature-phone.svg`, `speaker.svg`; `public/images/shapes/wave.svg`, `indicate-banner.svg` | 4 images whose basename appears **nowhere** in any ts/tsx/css/md/json in the repo | live tile art lives in `images/categories/v3` (`lib/product-images.ts:36-46`) | none in repo text | candidates, **prove against the live DB before any deletion** (see Not checked) |
| info | `public/images/products/` 5 pack files (`powerbank-*.png`, `charger-gan.png`, `cable-braided.png`) | the retired template-guess pack | `lib/catalog.ts` mirror + `/brand/placeholder-product.webp` | `lib/product-images.ts:20` comment says verbatim: "unreferenced by any code path. Deleting it is the owner's call" | **known + deliberately left** — not a new finding; owner's call |
| info | `public/store/shop-original.jpg`, `shop-ai-relight.png` | source frames of the shop-photo derivative chain (`shop-original → shop-upright → shop-ai-relight → shop-hero-master → shop.jpg`) | final `shop.jpg` | cited by `specs/001-premium-rtl-storefront/audits/01-truthfulness.md:13` and asserted by `tests/unit/admissible-claims.test.ts:60` ("the derivative chain must not reach a render path") | **audit-trail evidence — keep** |
| info | `.scratch/` | nothing tracked (`git ls-files '.scratch/*'` → empty; ignored at `.gitignore:77`) | — | — | clean |
| info | `specs/012-*/verification/` (untracked PNG/JSON) | live agents' in-flight evidence | — | — | **not junk**, per brief — left untouched and uncommitted |
| info | file `s`, `app/(main)/zz-ls-probe/` | previously flagged | already gone | — | confirmed absent, not chased |

## Pass 5 — Consistency with the written record

| sev | claim / target | file:line | verdict | evidence |
|---|---|---|---|---|
| **medium** | `PROJECT-BACKLOG-STATUS.md`: "Not wired: the featured tabs" / "6 of 7 surfaces" | `specs/PROJECT-BACKLOG-STATUS.md:95-101` (R1 block) | **now false in the working tree**: all 7 surfaces carry `LiquidSelection` — `FeaturedProducts.tsx:9,134` is wired (uncommitted SURF-A work) | `grep -rln 'LiquidSelection' components app` → 7 consumers: ProductDetail, ProductGallery, ShopResults, CategoryTiles, FeaturedProducts, MobileDock, PillNav |
| **medium** | 011 tasks.md "0 of 34 marked" | `specs/011-brand-card-identity/tasks.md` | **checkbox lie confirmed**: 34 boxes open while T001–T013 landed and ship tests — `tests/unit/brand-identity.test.ts` exists with **38 `it()` cases**, suite green | `grep -c '^- \[ \]'` → 34; `grep -c 'it(' tests/unit/brand-identity.test.ts` → 38; `npm run test:unit` green |
| info | 011 `FR-006` contradiction | `specs/011-brand-card-identity/spec.md` vs shipped cards | status doc accurate: `home.css` comment confirms owner deleted the description line ("`011 FR-006's sourced line is no longer rendered — removed on the owner's order`") | `sed -n '432,441p' app/(main)/home.css` |
| info | status doc: `.bg-product-stage` "dead CSS with no users left" | `specs/PROJECT-BACKLOG-STATUS.md:101` | **true** — and 002's `tasks.md:329,332` still references it (as the doc says) | `grep -rn bg-product-stage app components lib` → `app/globals.css:191` only |
| info | 007 spot-check (4 boxes: T001, T002, T004/T005, T009) | `specs/007-motion-assembly-band/tasks.md:67,73,84,92,124,144` | no false-done found in sample; T009's subject (`@supports (animation-timeline: view())`) **does not exist in source**, so that box is genuinely open | `grep -rn 'animation-timeline' app components` → empty |
| info | 012 open boxes (30) | `specs/012-liquid-dock-navigation/tasks.md:92-106` | genuinely open — T035–T046 are verification/acceptance steps, in flight | read each line; matches `PROJECT-BACKLOG-STATUS` R1 |
| **high** | **RTL / FR-057**: `letter-spacing` on Persian text | `app/globals.css:460` (`.eyebrow { … letter-spacing: 0.08em }`) and `app/globals.css:336-342` (`@apply … tracking-[0.14em]`) | violation: `.eyebrow` is rendered on Persian strings — «تازه‌ها» `components/home/NewArrivals.tsx:46`, «ویترین منتخب» `components/home/FeaturedProducts.tsx:92`, plus `B2bSection.tsx:24`, `AssemblyBand.tsx:44,100`, `page.tsx:88`. The repo's own rule is pinned to 0 elsewhere with the comment `Persian: tracking breaks letter joining (001/FR-057)` (`app/(main)/home.css:429,440`) | `grep -n 'eyebrow' app/globals.css`; `grep -rn 'className="eyebrow' components app` |
| low | physical `left`/`right` in RTL | `app/globals.css:711,1166`; `components/liquid/liquid-selection.module.css:80` | not defects: the two `left: 50%` are symmetric centering; the liquid port positions with physical `left` **by design** (server HTML `left:80%;width:20%` for RTL index 0 is the port's proven contract, `.agent-pair` board 2026-09-27) | `grep -rnE '(^\|[;{ ])left:' app components --include='*.css'` → 3 hits |
| low | prices / digits reaching users | all 8 `تومان` sites | **good**: every price goes through `formatToman` (`lib/utils.ts:9-20`, null-safe) or `toLocaleString("fa-IR")`; 49 `toFaDigits` call sites; order numbers already Persian (`2b85ed1`). Only exception found: `PartnerForm.tsx:304` `Track / ${id}` (Pass 2) | `grep -rn 'تومان' app components lib` → 8 hits, all formatted |
| low | `.section-label` | `components/layout/PageHeader.tsx:56`, `components/admin/AdminPageHeader.tsx:8` (8 tsx references total) | class used in markup but **zero CSS rules anywhere**: `grep -rn 'section-label' app components --include='*.css'` → empty. Either intentional flat styling or a lost rule — needs a browser to judge | see Not checked |

---

## Top ten, in the order I would do them

1. **`.eyebrow` letter-spacing on Persian text** (`app/globals.css:460`, `:336-342`) — the site's own FR-057 rule, violated on every homepage section eyebrow. Set to `0` like `home.css` already does.
2. **zarinpal `response.ok` + `payload.data` guard** (`lib/payment/zarinpal.ts:17,50`) — money path, currently one HTML 502 away from a TypeError.
3. **Decide the coupons client's fate**: wire `CouponsAdminClient.tsx` into `app/(admin)/admin/coupons/page.tsx` or delete the 132 dead lines (owner — back office is frozen).
4. **Add ESLint** — the repo has no linter at all; `tsc` alone cannot catch hook/deps bugs.
5. **Untrack root junk**: `start-err.txt`, `start-log.txt`, `aura-landingSample.html`, plus `.specify/integrations/.cache/*.json`.
6. **Dead exports**: `subtreeCounts`, `EASE_OUT_STRONG`, `STAGE_COUNT`, `storeExperienceSlots`, over-export `getSessionUser` — five one-line deletions.
7. **Orphan CSS cleanup** — `.brand-rows*` block in `home.css:116-315` (REQUEST to qoder, it's locked) + the `globals.css` clusters; reconcile `002/T025`'s `.bg-product-stage` pointer in the same pass.
8. **Correct `PROJECT-BACKLOG-STATUS.md`**: featured tabs are wired (7/7 in the working tree); note 011's checkbox lie at 34-open/38-tests.
9. **Dedupe the price formatter**: `lib/shop-query.ts:189` → `formatToman`.
10. **Prove the 4 orphan images against the live DB**, then hand the delete/keep decision to the owner.

## Not checked, and why

- **`npm run build`** — forbidden while tmux `hh-dev` (:3000) and `hh-opencode-dev` (:3015) both run against the same `.next`; a build has twice broken the running dev server (`CLAUDE.md`, 012 tasks.md T043).
- **Anything visual**: 360px layouts, above-the-fold (001/T085), `.section-label` rendering, eyebrow appearance, no-JS/reduced-motion states, entrance motion (T113) — needs a browser on an already memory-starved box with two agents' probes in flight.
- **Live DB (`hami_site_api`)** — whether the 4 orphan images or any "orphaned" path is referenced from DB-stored content; no DB reads were made (frozen directory + no `npm test` rule).
- **Full `useEffect` review** — 31 sites exist; only the 4 listener/timer sites were sampled (all clean).
- **async-without-await heuristic** — 7 rough candidates from a 400-char window; the one inspected (`CheckoutClient.tsx:140`) awaits further down. No confirmed case; the check was inconclusive, not clean.
- **Complete checkbox reconciliation of 007/012** — 4 + 12 boxes sampled; the rest not read line-by-line.
- **`app/api/`, `data/`, `prisma/`, back office internals** — Constitution III frozen; only grep-visible surface observations are reported above.
