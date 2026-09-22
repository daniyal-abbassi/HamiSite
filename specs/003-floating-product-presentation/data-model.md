# Phase 1 Data Model: Floating Product Presentation

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md) | **Date**: 2026-09-22

The entities here are about **provenance and auditability**, because FR-029 makes a bad matte a
misrepresentation rather than a rough edge, and FR-030 makes trust a per-file human act. The visual treatment
is a function of two of them and nothing else — which is the point: if a derivative cannot be traced back to
the exact photograph it came from, no composition makes the surface honest.

---

## SourceImage

The merchant's own photograph. **This entity is not new** — it already exists and is already what 188 of 189
products render, through `data/catalog-images.json` → `public/images/catalog/<id>.jpg` (`research.md` D1).
What is new is naming it as an entity so a derivative can be checked against it.

| Field | Type | Rule |
|---|---|---|
| `productId` | number | Key. `data/catalog-images.json` is already keyed this way, which is what makes the mirror survive a URL change. |
| `localPath` | `public/images/catalog/<id>.jpg` | **Present for 188 of 189 records, verified 2026-09-22.** Absent for the one record whose export `primary_image` is `null`. |
| `remoteUrl` | string or `null` | `primary_image` in the export — the origin the mirror was built to escape (5.8–7.5 s per image, `next/image` returning 500). Kept as provenance and as the gallery's remaining source; **never rendered as the card image**. |
| `bytes`, `width`, `height` | numbers | Measured from the file, not from its name. Measured distribution: 8,501–103,563 bytes, median 59,996; 16 distinct sizes, max dimension 900; 142 square, 45 portrait, 1 landscape. Drives D7's cap and FR-017's aspect rule. |
| `hasAlpha` | boolean | `false` for all 188 — every file decodes as `RGB`. This single field is why the feature exists. |
| `provenance` | `"merchant-mirror" \| "offline-pack" \| "generated" \| "none"` | **Only `merchant-mirror` may be presented as a product's picture.** `offline-pack` is `lib/product-images.ts`'s keyword-matched 31-file template pool: legitimate as a layout placeholder, forbidden as a product's image (Principle I, FR-028, FR-022). `generated` is never permitted on this path — see D2. |

**Transitions**: `mirrored → matted → reviewed`, with two failure exits — `unmattable` (FR-033: cannot be
cleanly isolated, gets the deliberate framed composition) and `review-rejected` (FR-029 defect found by a human,
which routes back to `unmattable`'s treatment). A product in either state is still fully presentable and
browsable; SC-014 requires it be neither hidden nor counted down.

The one product with no `SourceImage` has no transition at all. It renders an intentional empty presentation
(D1's fix), not an object.

---

## DerivedAsset

The isolated object. One per source, strictly one-way, and never edited after production — a fix means
re-matting from the source, because an edit to a derivative breaks the audit FR-031 exists to preserve.

| Field | Type | Rule |
|---|---|---|
| `localPath` | `public/images/products/isolated/<id>.webp` | Alpha-capable at displayed sizes (D4). |
| `sourceProductId` | number | **MUST equal the consuming product's id.** This one equality is the whole honesty argument, and it is what `tests/unit/product-images.test.ts` asserts. |
| `method` | `"deterministic-matte" \| "none"` | No generative value is expressible (D2). A model that re-synthesises pixels cannot be diffed against a source, so a defect in it is undetectable by construction. |
| `alphaBounds` | fractions `{start, end, top, bottom}` | Measured from the alpha channel, on the **inline** axis rather than left/right so the grounding cue and baseline do not need mirroring for RTL. Input to D5's shadow and FR-017's shared baseline — the reason a phone and a cable reel can obey one rule. |
| `maxSharpWidth` | number | `min(source width, layout width)`, D7. Never exceeded. |
| `defects` | `("clipped" \| "halo" \| "colour-shift" \| "edge-chew")[]` | Non-empty ⇒ FR-029 blocks that product from isolated use. A defect is not a tuning parameter. |
| `reviewStatus` | `"unreviewed" \| "approved" \| "rejected"` | Starts `unreviewed` and **stays there until a human sets it** (FR-030). |

**The invariant**: every displayed product image traces
`product → SourceImage(productId) → DerivedAsset(sourceProductId) → file`, with the two ids equal and
`provenance === "merchant-mirror"`.

Measured today that chain holds for **188 of 189** products — the mirror already does the first two hops, and
this feature adds the third. It fails for the one record with no photograph, which resolves through the
keyword fallback to a stock image of something else. That single branch is what `tests/unit/product-images.ts`
must assert against, and the fix is to make the fallback visibly empty rather than confident (D1).

---

## ReviewRecord

FR-030's unit of work, made countable so the gap is arithmetic instead of atmosphere.

One row per product in `reviews/index.csv`: product id, source path, derivative path, reviewer, date, and a
verdict on the three things that matter — same object, nothing missing, finish unchanged. SC-012 is zero
accepted defects across 188, and `research.md` D8 records that no tool or agent can close it; the plausible
reviewer is the merchant, since these are their products.

An unreviewed asset is **not** approved by default. The default is the framed presentation, which needs no
review because it shows the unmodified photograph. That consequence is what makes the feature degrade safely
rather than stall: unreviewed products stay visible, correct and honest — just not floating.

---

## Treatment

The single presentation rule. One instance, applied everywhere; a surface may choose a slot size, never its
own physics (FR-016).

| Field | Meaning | Constraint |
|---|---|---|
| `slot` | the box a surface offers | named per surface: featured grid, new-arrivals row, listing tile, product page |
| `scale` | object size within the slot | `min(slot, maxSharpWidth)` — D7, FR-018 |
| `baseline` | where the object's contact edge sits | from `alphaBounds`, not from the frame's box |
| `grounding` | contact shadow + falloff | from `alphaBounds` and one site-wide light direction on the inline axis; **absent entirely** on the framed form (D5) |
| `reveal` | entrance and pointer response | one motion system shared with 002, 004 and 005 (D6). Until it is chosen, 004's shipped `220ms cubic-bezier(0.2, 0.7, 0.3, 1)` |
| `chrome` | what surrounds the object | **removal is the rule** — no border, panel, fill or card shadow carrying hierarchy (FR-002, FR-003) |
| `form` | `isolated \| framed` | chosen by `DerivedAsset` + `ReviewRecord` state, never by hand |

**FR-009's checkerboard guard is a hard rule, not a preference:** a single row MUST NOT mix `isolated` and
`framed` items with different baselines. When both occur, `framed` wins for the whole row, so variation in the
source photographs never becomes inconsistency on the page (US2/5, US4/4). This is the clause most likely to be
quietly broken by a per-card CSS default, so the rule lives in one function.

---

## LegibilityGuard

The information that must survive every treatment and every motion frame (FR-021, SC-006).

`{ name, price, availability, brand }` — each measured for rendered contrast against the surface it actually
sits on at that scroll position, checked per surface type rather than averaged.

Two couplings worth naming. D5's light direction and the ground feature 002 is still deciding both change the
pixels behind this text; FR-008 requires separation across 002's full tonal range including intermediate
points, and 002's Question 1 was reopened on 2026-09-22, so **the range this must clear is not yet fixed**. The
guard therefore samples the current ground rather than assuming 002's planned one, and `quickstart.md` §6
re-runs it once 002 settles.

`availability` renders «تماس بگیرید» for any unknown state, unchanged by treatment — Principle I has no
exception path, and a product so beautiful it lost its stock badge has regressed.

---

## Relationships

```
data/hami-products.json ─┬─ primary_image (remote origin, 5.8-7.5s) ─▶ not rendered as a card
                         │
data/catalog-images.json ─┴─▶ SourceImage ──▶ DerivedAsset ──▶ ReviewRecord
   188 ids → local paths      (mirror, RGB,     (alpha WebP,    (human, FR-030,
                               ≤900px)           id-equal)       default unreviewed)
                                    │                  │
                                    └────────┬─────────┘
                                             ▼
                            Treatment (one rule) ◀── LegibilityGuard
                                             │
        ┌──────────────┬────────────────┬────┴───────────┬──────────────────┐
        ▼              ▼                ▼                ▼                  ▼
   featured grid   new-arrivals     listing tile    product page       cart line
        │              │                │                │                  │
        └──────────────┴────── lib/product-images.ts :: resolveProductImage ┘
                        own local image wins; offline pack only when absent
```

Nothing here is persisted to a database and nothing is written at request time.
`data/catalog-isolation-manifest.json` is the serialized form of SourceImage + DerivedAsset and is committed,
so an image set can be reviewed as a diff against the sources it came from.
