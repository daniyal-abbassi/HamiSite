# Implementation Plan: Floating Product Presentation

**Branch**: `Hami-v3` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-floating-product-presentation/spec.md`

## Summary

Make the product the protagonist: strip the chrome around it, give it dimensional presence on the dark
ground, and move it with intent — as one systematic rule across the catalog rather than a hand-composed hero
screen.

**The plan is blocked on a factual correction, and it should not be executed until that correction is
accepted.** The spec's "The Hard Constraint" table — the premise for all three Resolved Questions and for
FR-028…FR-034 — states that 188 of 189 products have **locally-held opaque JPEG photographs** whose
backgrounds must be removed. Measured on 2026-09-22, that is not the situation:

| Claim | Reality, measured |
|---|---|
| 188 locally-held product photographs | **0 local product photographs.** All 188 `primary_image` values are remote `https://hamihamrah-shop.com/...` URLs; the 189th has none. |
| JPEG, 3 channels, no alpha, ≤900px | True of the remote files (spot-checked: HTTP 200, `image/jpeg`, 87–119 KB, 0.56–3.1 s). Not true of anything on disk. |
| What ships today is the merchant's own photography | **It is not.** `lib/product-images.ts` deliberately ignores the remote URLs and maps by keyword plus a stable hash onto **31 PNGs in `public/images/products/`, ported from the `docs/inspires/techBazar` template**. 26 of those 31 filenames are `*-removebg-preview.png` — already-background-removed stock images of products such as `apple-watch-9`, `asus-vivobook`, `dell-gaming`, `galaxy-15` and `firebolt-ninja`. |

Two consequences, and they point in opposite directions.

**Good news, and it is bigger than it looks.** Background removal has already been done for most of what
currently renders, so the isolation route the owner chose (Q2 = B) is not the 188-file production job the
spec fears. **Bad news, and it is worse.** The isolated images are not photographs of the products being
sold — a Poco X7 Pro renders as a keyword-matched stand-in — which violates Principle I and
`001/FR-031`'s "premium impact built from the photography that already exists for each product" today, on
the live homepage. Feature 004 tightened this by making `resolveProductImage` local-only, which removed the
last route to the merchant's real picture.

So Q2 = B cannot be executed as written, because its inputs do not exist locally; and the honesty problem
FR-022/FR-023 were written to prevent is already live. The plan below therefore has a Phase 0 that is not
about visual treatment at all: get the 188 real photographs onto disk, or stop.

## Technical Context

**Language/Version**: TypeScript 5.5.4, React 19.2.8, Next.js 15.5.25 App Router; Python 3 with Pillow
12.3.0 available for asset tooling.

**Primary Dependencies**: Next/Image, Tailwind 3.4.19. **No new package is added to `package.json`**, and the
constraint is weaker than it sounds — `motion@13.2.0` and `gsap@3.15.0` are already dependencies and already
in use (`components/home/FeaturedProducts.tsx`, `components/ui/CardSwap.tsx`, `components/layout/PillNav.tsx`),
so the motion language for FR-010 can be built from what is installed. `sharp` is present in
`node_modules` as a transitive dependency and must not be treated as available to import.

**Storage**: `data/hami-products.json` and `data/catalog-images.json` (188 entries keyed by product id)
through `lib/catalog.ts`. No database, no endpoint change. Derived image assets land in
`public/images/products/isolated/` with sources beside them.

**Testing**: Vitest 4.1.10, `environment: "node"` — no DOM harness, same as `002/research.md` D6. Asset
integrity is tested as data (does product X map to a file that exists, derived from the URL the export
names?) and reviewed as images. Anything about how it *looks* is a browser and a human, per
`quickstart.md`.

**Target Platform**: Browser. Mobile primary (standing instruction from 004); desktop derives.

**Project Type**: Single Next.js app, storefront frontend.

**Performance Goals**: FR-032 — cut-out assets must not make a listing meaningfully slower to become usable
than today. With 188 products on one page this is a real budget, so derivatives ship as alpha-capable WebP
at the sizes actually displayed, not as 900px PNGs.

**Constraints**: The 900px source ceiling is accepted, not worked around (Q1 = A: sharpness over scale).
`/home` is at **95% used, 13 GB free** — irrelevant for 17 MB of JPEGs, relevant if a model-backed tool gets
installed here.

**Scale/Scope**: 188 source images, 189 product records, one treatment rule, four surfaces (featured grid,
new-arrivals row, category listing, product page). No cart/checkout/account/admin.

## Constitution Check

Gates from `.specify/memory/constitution.md` v1.1.0, evaluated before Phase 0.

| Principle | Status | Note |
|---|---|---|
| I. Honest Interface | **CURRENTLY FAILING, independently of this feature** | A product shown as a stand-in photograph of a different product is a false statement about merchandise, and it is live today across 188 records. `Missing data MUST stay visibly missing… MUST NOT be filled with a plausible placeholder, a stock photograph, or an assumed value` — `public/images/products/*` is precisely a stock photograph standing in. This feature cannot pass Principle I by improving the presentation of those images; it can only fail less elegantly. **Blocking: see research D1.** |
| I (cont.) | The `docs/inspires/` constraint is also already breached | The constitution bars porting anything out of `docs/inspires/`; `lib/product-images.ts`'s own comment says these images were "ported from docs/inspires/techBazar". |
| II. Persian RTL | **PASS, by design** | FR-024/FR-025 require re-derivation rather than mirroring; D6 states the asymmetry rule in logical properties. |
| III. Static Data Seam | **PASS** | `data/`, `app/api/`, `prisma/` untouched. Asset files are not data. |
| IV. Luxury is the bar | **OPEN — this is the feature** | US1 is the part that can be excellent with the assets that exist. |

**Gate result: Principle I fails before this feature starts.** That is not a design flaw to justify in
Complexity Tracking; it is a precondition. The table is filled anyway, because the deviation is the finding.

Re-check after Phase 1: unchanged. The design does not create new dishonesty, and D1 is what removes the old.

## Project Structure

### Documentation (this feature)

```text
specs/003-floating-product-presentation/
├── spec.md                                   # input; its asset table is superseded by research.md D1
├── plan.md                                   # this file
├── research.md                               # Phase 0 — D1…D8
├── data-model.md                             # Phase 1 — SourceImage, DerivedAsset, Treatment, LegibilityGuard
├── contracts/product-presentation-behaviour.md
└── quickstart.md
```

### Source Code

```text
public/images/products/
├── catalog/<product-id>.jpg          # NEW — the 188 real sources, fetched once from the merchant's CDN
└── isolated/<product-id>.webp        # NEW — derived alpha assets; sources kept alongside (FR-031)

scripts/
└── catalog-images/
    ├── fetch.mjs                     # NEW — one-time download of the 188 remote JPEGs, idempotent
    ├── isolate.py                    # NEW — matte + alpha-preserving WebP encode, deterministic, no generative step
    └── manifest.mjs                  # NEW — emits data/catalog-image-manifest.json (source, derived, dims, bytes)

lib/
├── product-images.ts                 # REWRITTEN — resolves a product to its OWN derived asset, or to none
└── product-presentation.ts           # NEW pure module — size caps, aspect rule, fallback class per product

components/
├── products/ProductFrame.tsx         # NEW — the single presentation rule: object fit, grounding cue, legibility
├── products/ProductReveal.tsx        # NEW client — motion layer over ProductFrame, `motion` already installed
└── ui/card.tsx                       # edited where chrome removal requires it

specs/003-floating-product-presentation/reviews/
└── index.csv                         # NEW — one row per product for the FR-030 individual review, and its result

tests/unit/
├── product-images.test.ts            # UPDATED — a product must resolve to its own image or to nothing
└── product-presentation.test.ts      # NEW — size cap and fallback-class rules over all 189 records
```

**Structure decision**: one component, `ProductFrame`, owns the treatment; every surface that shows a product
goes through it, because FR-016's "a systematic rule, not per-product exception work" is only true if there
is exactly one place the rule lives. `ProductReveal` is a wrapper, not a sibling, so no surface can opt into
motion and accidentally opt out of the honesty rules. The asset pipeline is three small scripts under
`scripts/` rather than a build step — it runs once, by hand, and its output is committed data, so a reviewer
can diff an image set.

## Complexity Tracking

> Principle I fails at the gate. Recorded here as required, with the honest resolution: this is not a
> violation to justify, it is a dependency this feature has uncovered.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Feature 003 is blocked on producing 188 local product images that the spec assumed already existed | There is no version of "products float as themselves" that does not start from photographs of the products | "Ship US1 only and defer the assets" was considered and is the **recommended path** — see D1's staging. It is not a rejection of the requirement, it is sequencing: US1 needs no asset change (the spec's own Assumptions say so), so it can be excellent immediately while the asset question is decided. |
| A Python segmentation step (`rembg` or equivalent) may be required, and nothing matting-capable is installed | Alpha cannot be produced by resizing; Pillow alone cannot matte a busy background | Hand-keying 188 files was rejected as unscalable and unauditable; a generative image edit was rejected under D3 because it re-synthesises the product, which FR-029 forbids. Requires owner approval before install — `/home` has 13 GB free and the model is ~176 MB. |

## Key Decisions (summary — full reasoning in research.md)

- **D1** — Sequence the feature behind the asset question. US1 ships against the images that exist; US2 does
  not start until the 188 real photographs are on disk or the owner decides otherwise.
- **D2** — Fetch the merchant's own 188 JPEGs once into version-controlled local storage. They are reachable
  and they are the shop's own assets.
- **D3** — Isolate deterministically. A generative edit is disqualified: FR-029 treats a shifted finish or a
  silently "improved" edge as a misrepresentation.
- **D4** — Measure FR-034's failure rate on a stratified sample of 24 **before** committing to a
  catalog-wide treatment, because the answer decides whether this is a system or a curation.
- **D5** — Ship cut-outs as alpha WebP at displayed sizes, with the source retained beside the derivative.
- **D6** — Grounding cue is one contact shadow derived from the object's own bounding box, proven on the grid
  of 24 before the grid of 188.
- **D7** — Motion from `motion`, already installed; one reveal, one pointer response, no loops, no
  entrance on scroll-back.
- **D8** — Sharpness caps size per product from measured pixel data, not from a layout ideal.

## What is NOT decided here

Whether 188 cut-outs can be individually reviewed. FR-030 and SC-012 require a per-asset human pass, and the
owner declined a ten-person panel for feature 004 three days ago. That contradiction is named in D1 and left
for the owner rather than engineered around.
