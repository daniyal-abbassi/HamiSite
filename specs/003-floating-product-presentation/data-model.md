# Phase 1 Data Model: Floating Product Presentation

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md) | **Date**: 2026-09-22

The entities here are about **provenance**, because that is what this feature turned out to be missing. The
visual treatment is a function of two of them and nothing else — which is the point: if a product's identity
cannot be reconstructed from the manifest, no amount of composition makes the surface honest.

---

## SourceImage

One merchant photograph, as it exists before this feature touches anything. FR-031 requires it survives
alongside its derivative, so it is an entity with an address, not an intermediate.

| Field | Type | Rule |
|---|---|---|
| `productId` | number | Key. Never derived from the URL, which can change (D2). |
| `remoteUrl` | string | From `data/hami-products.json` → `primary_image`. Present for 188 of 189 records. |
| `localPath` | `public/images/products/catalog/<id>.jpg` or `null` | `null` until D2 has run for that product. **`null` is not an error state; it is the current state of all 189.** |
| `bytes`, `contentType` | number, string | Recorded at fetch; a 200 that returns 1 KB or `text/html` is quarantined, not used (D2). |
| `width`, `height` | number | Measured from the file, never from the filename. Drives D8's size cap and FR-017's aspect rule. |
| `fetchedAt` | ISO timestamp | So a stale source is visible as stale. |
| `provenance` | `"merchant-cdn" \| "template-port" \| "generated" \| "none"` | The field that does not exist today and would have caught the D1 finding. **`template-port` and `generated` MUST NEVER be rendered as a product's picture** (Principle I, FR-028). |

**Transitions**: `none → fetched → verified → isolated → reviewed`, with two failure exits — `quarantined`
(bad fetch or unreadable file) and `fallback-framed` (FR-033: cannot be cleanly isolated, gets the deliberate
framed composition instead). A product in `fallback-framed` is still fully presentable and browsable; SC-014
requires it be neither hidden nor counted down.

---

## DerivedAsset

The isolated object. One per source, strictly one-way.

| Field | Type | Rule |
|---|---|---|
| `localPath` | `…/isolated/<id>.webp` | Alpha-capable, at displayed sizes (D5). |
| `method` | `"deterministic-matte" \| "none"` | **No generative value is permitted** (D3). The type system should not be able to express one. |
| `alphaBounds` | `{top,right,bottom,left}` as fractions | Measured from the alpha channel. This is the input to the grounding cue (D6) and to the baseline alignment (FR-017) — the reason a phone and a cable reel can share a rule. |
| `maxSharpWidth` | number | `min(source width, layout width)`, D8. Never exceeded. |
| `defects` | `("clipped" \| "halo" \| "colour-shift" \| "edge-chew")[]` | Non-empty ⇒ FR-029 blocks that product from isolation use and routes it to `fallback-framed`. A defect is not a tuning parameter. |
| `reviewStatus` | `"unreviewed" \| "approved" \| "rejected"` | Starts `unreviewed` and **stays there until a human sets it** (FR-030). |

**The invariant that makes this feature honest:** every displayed product image traces
`product → SourceImage(productId) → DerivedAsset(sourceProductId) → file`, with the two ids equal and
`provenance === "merchant-cdn"`. Today the chain is `product → keyword+hash → 31-file pool`, which cannot
satisfy it for any product. `tests/unit/product-images.test.ts` asserts the invariant, and it fails until D2
runs — correctly, and loudly, rather than continuing to render a confident stand-in.

---

## ReviewRecord

FR-030's unit of work, made countable so the gap is arithmetic instead of atmosphere.

One row per product in `reviews/index.csv`: product id, source path, derivative path, reviewer, date, verdict
against the three things that matter — is it the same object, is anything missing, is the finish unchanged.
SC-012 is zero accepted defects across 188, and `research.md` D1 records that the panel this needs is the same
kind of panel 004's T049 could not assemble. An unreviewed asset MUST NOT be treated as approved by default;
the default is the framed presentation, which needs no review because it shows the unmodified photograph.

That rule has a useful consequence: **the feature degrades safely rather than stalling.** Unreviewed
products are visible and honest, just not floating.

---

## Treatment

The single presentation rule. One instance, applied everywhere; a surface may only choose a slot size, never
its own physics (FR-016).

| Field | Meaning | Constraint |
|---|---|---|
| `slot` | the box a surface offers | named per surface: featured grid, new-arrivals row, listing tile, product page |
| `scale` | object size within the slot | `min(slot, maxSharpWidth)` — D8, FR-018 |
| `baseline` | where the object's contact edge sits | derived from `alphaBounds`, not from the frame's box |
| `grounding` | contact shadow + falloff | from `alphaBounds` and one site-wide light direction; **absent entirely** for a framed fallback (D6) |
| `reveal` | entrance and pointer response | from `motion`, already installed (D7); one shared duration/easing family with 004 and 005 |
| `chrome` | what surrounds the object | **removal is the rule** — no border, panel, fill or card shadow carrying hierarchy (FR-002, FR-003) |
| `form` | `isolated \| framed` | the two co-existing states, chosen by `DerivedAsset`/`ReviewRecord` state, never by hand |

**FR-009's checkerboard guard is a hard rule here, not a preference:** a single row MUST NOT mix `isolated`
and `framed` items with different baselines. When a row contains both, `framed` wins for the whole row, so the
inconsistency in the source photographs never becomes an inconsistency on the page (US2/5, US4/4).

---

## LegibilityGuard

The information that must survive every treatment and every motion frame (FR-021, SC-006).

`{ name, price, availability, brand }` — each with a rendered contrast measurement against the surface it
actually sits on at that scroll position, checked per surface type rather than averaged.

Two couplings worth naming. `research.md` D6's light direction and the ground feature 002 is still deciding
both change the pixels behind this text; FR-008 requires separation across 002's full tonal range including
intermediate points, and 002's Question 1 was reopened on 2026-09-22, so **the range this must clear is not yet
fixed**. The guard therefore samples the current ground rather than assuming 002's planned one, and
`quickstart.md` §6 re-runs it after 002 settles.

`availability` renders «تماس بگیرید» for any unknown state, unchanged by treatment — Principle I has no
exception path, and a product so beautiful it lost its stock badge has regressed.

---

## Relationships

```
data/hami-products.json ──▶ SourceImage ──▶ DerivedAsset ──▶ ReviewRecord
   (product records)         (merchant CDN)    (alpha WebP)      (human, FR-030)
                                                     │
                                                     ▼
                          Treatment (one rule) ◀── LegibilityGuard
                                   │
     ┌──────────────┬──────────────┼───────────────┬──────────────┐
     ▼              ▼              ▼               ▼              ▼
 featured grid  new-arrivals   listing tile   product page   (005 carousel
                                                               uses none of
                                                               these — D1)
```

Nothing here is persisted to a database, and no field is written at request time. The manifest
(`data/catalog-image-manifest.json`) is the serialized form of SourceImage + DerivedAsset and is committed,
so an image set can be reviewed as a diff.
