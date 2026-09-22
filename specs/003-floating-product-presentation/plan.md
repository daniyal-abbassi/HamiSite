# Implementation Plan: Floating Product Presentation

**Branch**: `Hami-v3` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-floating-product-presentation/spec.md`

**An earlier revision of this plan declared the feature blocked on a false premise and was corrected the same
day.** See `research.md`'s retraction. What is there now is measured.

## Summary

Make the product the protagonist: strip the chrome around it, give it dimensional presence on the dark ground,
and move it with intent — as one systematic rule across 188 products rather than a hand-composed hero screen.

The route to dimensional presence was settled by the owner as Q2 = B: remove the background from each
merchant photograph so the real object can sit on any surface. The spec's hard-constraint table — 188 locally
held JPEGs, no alpha, ≤900px, median 58 KB — is **accurate**, re-measured here against
`public/images/catalog/`: 188 files, 11 MB, all `JPEG`/`RGB`, max dimension 900, median 59,996 bytes, 142
square and 45 portrait. So the feature is not blocked on assets; it is blocked on nothing, and its central
risk is exactly the one the spec named — whether 188 cut-outs can be produced and trusted.

Three things therefore drive this plan:

1. **Measure before committing** (FR-034). A stratified 24-file isolation trial decides whether this is a
   catalog-wide treatment or a curated one. Everything downstream is conditional on that number.
2. **Depth cues are permitted and dangerous.** Q3 = B lifts the reference's ban on shadows, and FR-009
   requires the replacement cue be systematic — proven on a grid of twenty, not on a hero.
3. **FR-030's 188 individual reviews have no engineering answer.** Recorded as an open cost of the chosen
   route rather than absorbed into a task list nobody will execute.

## Technical Context

**Language/Version**: TypeScript 5.5.4, React 19.2.8, Next.js 15.5.25 App Router; Python 3 with Pillow
12.3.0 for asset tooling.

**Primary Dependencies**: Next/Image, Tailwind 3.4.19. **Dependency cost is not a constraint on this
initiative** — the owner ruled quality the priority on 2026-09-22 — so tooling is chosen on output, not on
whether it is already in `package.json`. In practice the installed set is strong: `gsap@3.15.0` (imported in
`components/ui/CardSwap.tsx`, `components/layout/PillNav.tsx`) and `motion@13.2.0`
(`components/home/FeaturedProducts.tsx`). A matting model — `rembg` over CPU `onnxruntime`, ~176 MB — is
expected to be installed for D2. `sharp` is present only as a transitive dependency and must not be imported.

**Storage**: `data/hami-products.json` plus `data/catalog-images.json` (188 product-id → `/images/catalog/`
mappings), both read through `lib/catalog.ts`. No database, no endpoint change, no change to the mirror
scripts that already ran. Derived assets land in `public/images/products/isolated/` with sources untouched
alongside (FR-031).

**Testing**: Vitest 4.1.10, `environment: "node"` — no DOM harness, same as `002/research.md` D6. Asset
integrity is tested as data (does product *n* map to a derivative derived from product *n*'s source, at the
recorded size?) and reviewed as images. How it *looks* is a browser and a human per `quickstart.md`.

**Target Platform**: Browser. Mobile primary (standing instruction from 004); desktop derives.

**Performance Goals**: FR-032 — cut-outs must not make a listing meaningfully slower to become usable.
Sources run 8.5–103 KB with a 60 KB median, so alpha WebP at displayed sizes should land near parity.

**Constraints**: The 900px ceiling is accepted, not worked around (Q1 = A: sharpness over scale).
`prefers-reduced-motion` parity is non-negotiable (FR-013). `/home` is at 95% with 13 GB free — ample for
11 MB of sources, a 176 MB model and 188 derivatives, noted so it is checked rather than assumed.

**Scale/Scope**: 188 source images, 189 product records, one treatment rule, four surfaces (featured grid,
new-arrivals row, category listing, product page). No cart/checkout/account/admin.

## Constitution Check

Gates from `.specify/memory/constitution.md` v1.1.0, evaluated before Phase 0.

| Principle | Status | Note |
|---|---|---|
| I. Honest Interface | **PASS — one defect found and closed during planning** | All 188 products with a photograph render their own. The 189th had none and was resolving through a keyword fallback to a confident stock image of another company's device; it now renders a shared brand placeholder built from the merchant's real mark, and the guessing table behind it is deleted. Beyond that: FR-029 treats a bad matte as a misrepresentation, which is why D2 refuses generative editing and D3 measures the failure rate before anything ships. |
| II. Persian RTL | **PASS by design** | FR-024/FR-025 require re-derivation, not mirroring; D5 states the light direction and asymmetry on the inline axis. |
| III. Static Data Seam | **PASS** | `data/`, `app/api/`, `prisma/` untouched. Image files are assets, not data; `catalog-images.json` is read, not rewritten. |
| IV. Luxury is the bar | **This is the feature** | Q3 = B's dimensional, animated direction is squarely within IV, and IV's "restraint over decoration" is what keeps FR-009's depth cues from becoming the noise 001 and 002 exist to remove. |

**No gate violations.** One defect found in the existing implementation (D1) is fixed as a precondition, not
justified as a deviation.

Re-check after Phase 1: unchanged. The design adds no data path, fabricates no product, and the one
provenance hole closes rather than widening.

## Project Structure

### Documentation (this feature)

```text
specs/003-floating-product-presentation/
├── spec.md                                   # input; its asset table verified accurate
├── plan.md                                   # this file
├── research.md                               # Phase 0 — the retraction, then D1…D8
├── data-model.md                             # Phase 1 — SourceImage, DerivedAsset, Treatment, LegibilityGuard
├── contracts/product-presentation-behaviour.md
├── quickstart.md
└── reviews/index.csv                         # FR-030's 188 rows, produced here and reviewed by hand
```

### Source Code

```text
public/images/
├── catalog/<product-id>.jpg          # EXISTS — the 188 mirrored merchant sources, untouched
└── products/isolated/<id>.webp       # NEW — derived alpha assets (FR-031: sources stay)

scripts/
├── mirror-catalog-images.py          # EXISTS — already run; D2's matting step is added beside it
└── isolate-catalog-images.py         # NEW — deterministic matte + alpha WebP encode, idempotent
                                      #      emits data/catalog-isolation-manifest.json

lib/
├── product-images.ts                 # EDITED — the last-resort fallback returns an empty presentation
│                                     #        instead of a confident stand-in (D1)
└── product-presentation.ts           # NEW pure module — size caps from measured pixels, aspect rule,
                                      #        form selection (isolated | framed) per product

components/products/
├── ProductFrame.tsx                  # NEW — the one place the treatment lives
└── ProductReveal.tsx                 # NEW client — the motion layer, over ProductFrame

specs/003-floating-product-presentation/reviews/index.csv

tests/unit/
├── product-images.test.ts            # UPDATED — a product with no photograph resolves to nothing
└── product-presentation.test.ts      # NEW — size cap and form selection over all 189 records
```

**Structure decision**: one component, `ProductFrame`, owns the treatment and every surface that shows a
product goes through it, because FR-016's "a systematic rule, not per-product exception work" is only true if
there is exactly one place the rule lives. `ProductReveal` wraps rather than replaces, so no surface can opt
into motion and accidentally opt out of the honesty rules. The asset work is scripts plus committed output,
not a build step — it runs once, by hand, and a reviewer can diff an image set.

Existing components (`ProductCard`, `ProductDetail`, `ProductListRow`, `CartLine`) keep calling
`resolveProductImage`; the change is that the image it returns is now isolated, and that its no-image branch
stops inventing one.

## Complexity Tracking

> No Principle I–IV violations. Two real costs of the chosen route are recorded here because the template
> asks for justification of deviations and there are none — what this feature has instead is work that cannot
> be shortcut.

| Cost | Why unavoidable | Simpler alternative rejected because |
|---|---|---|
| Installing a matting model (~176 MB, CPU inference) | FR-006/Q2 = B require genuine alpha; resizing cannot create it, and Pillow has no segmenter | Generative edit via `pixel_bridge`: zero installs, but it re-synthesises the product and FR-029 makes a shifted finish a misrepresentation. Rejected on verifiability, not cost — the owner's quality ruling removes the cost objection and not this one. |
| 188 human asset reviews (FR-030, SC-012) | "A batch process is acceptable for producing them; a batch approval is not" | Agent sign-off, or spot-checking heroes. Both are the fabricated validation this initiative has already refused twice (004's T049). `reviews/index.csv` makes the gap countable; unreviewed means framed, never absent, so the feature degrades safely rather than stalling. |

## Key Decisions (summary — full reasoning in research.md)

- **D1** — Build on the existing mirror. The one real provenance hole is closed: an imageless product now
  renders a shared brand tile built from the merchant's own mark, and the keyword guessing that used to fill
  the gap is deleted rather than refined. **Done and verified in the browser, 2026-09-22.**
- **D2** — Isolate deterministically: copy source pixels, change only transparency. Install what that needs.
  A generative edit is disqualified on auditability, not on price.
- **D3** — Measure FR-034's failure rate on a stratified sample of 24 **before** relying on the treatment
  catalog-wide. The answer decides system versus curation, and >35% fails means re-scoping.
- **D4** — Ship derivatives as alpha WebP at displayed sizes, sources retained, manifest committed.
- **D5** — One grounding cue derived from the object's own alpha bounds; one light direction on the inline
  axis; no shadow at all on the framed fallback; never both forms in one row with different baselines.
- **D6** — Motion may use the best tool, but **one motion system for the whole homepage** across 002, 003,
  004 and 005 — two libraries each driving scroll-linked motion is how FR-014 fails. Held until 002's
  reopened Question 1 resolves.
- **D7** — Size caps computed per product from measured pixels; 16 known source sizes, so this is arithmetic.
- **D8** — FR-030's review is produced as a countable artifact and stays honest about who can complete it.
