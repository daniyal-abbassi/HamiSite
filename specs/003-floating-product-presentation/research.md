# Phase 0 Research: Floating Product Presentation

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-09-22

## A retraction, first, because an earlier draft of this file was wrong

An earlier version of this document claimed that 0 of 189 products had a local photograph, that the
storefront was rendering a keyword-matched pool of techBazar template stock images in place of the
merchant's own products, and that feature 003 was therefore blocked behind an asset-acquisition decision.

**None of that is true.** The spec's own asset table — 188 locally-held opaque JPEGs, ≤900px, median 58 KB —
is accurate, and was accurate when the spec was written. The error came from reading one field
(`primary_image` in `data/hami-products.json`) and concluding from it, when the file two lines away in the
same directory, `data/catalog-images.json`, is the mapping the application actually uses. It was published to
the owner and committed. Recording the mistake here rather than editing it out, because the trap is easy to
fall into again: **`primary_image` in the raw export is a remote origin URL and is not what renders.**

What is real, measured 2026-09-22 against `public/images/catalog/`:

```
files:            188   (11 MB total)
format:           JPEG, all 188
colour mode:      RGB, all 188   → no alpha anywhere, confirmed at decode not by extension
largest dimension: 900px
square / portrait / landscape: 142 / 45 / 1     (spec said 141 / 45; one landscape file is unlisted there)
distinct sizes:   16, led by 800×800 (117), 675×900 (45), 900×900 (7)
bytes:            min 8,501 · median 59,996 · max 103,563
```

So the feature is not blocked, the central risk is the one the spec already named — producing 188 trusted
cut-outs — and the honesty finding that displaced it for a while is a real but much smaller thing, described
in D1 below.

---

## D1. What the asset pipeline actually is today

**Decision**: Feature 003 builds on the existing mirror rather than introducing an image path. `D2` is about
*matting* it, not obtaining it.

The chain, verified end to end:

```
data/hami-products.json ──▶ lib/catalog.ts ─────────────────────────┐
   primary_image = remote   imports data/catalog-images.json        │
                             as `mirror`, keyed by product id       │
                                     │                              ▼
scripts/mirror-catalog-images.py     ▼                     serializeProduct()
   fetched once, already run     /images/catalog/<id>.jpg   images[0] = local,
   → public/images/catalog/      (188 files, present)       isDefault: true
                                     │                              │
                                     └──────────────┬───────────────┘
                                                    ▼
                                    lib/product-images.ts :: resolveProductImage()
                                      prefers the product's own LOCAL image;
                                      the keyword→template pack is the fallback
                                      underneath it, not a competitor to it
                                                    │
                       ProductCard · ProductDetail · ProductListRow · CartLine
```

`lib/catalog.ts:126-135` explains the mirror's reason: the live shop's host measured **5.8–7.5 s per image**,
so `next/image` handed the origin a seven-second fetch and returned 500 roughly as often as it succeeded. The
mirror moved the primary image to `public/` and deliberately kept the origin URL for the rest of the gallery.

`resolveProductImage` is explicit about the order — *"The product's own photograph wins… a real picture of the
thing being sold beats any stand-in"* — and its local-only filter is the reason feature 004's T055 change was
correct rather than harmful: an unmirrored product falls through to the offline pack **instead of back onto
the slow network**.

**The residue that IS real, and it is one file, not 188.** Of 189 products, 188 have a mirrored photograph.
The one that does not (`data/hami-products.json` → a record with `primary_image: null`) resolves through the
keyword fallback to a template stock image and is presented as if it were that product. That is a genuine
Principle I defect — *"Missing data MUST stay visibly missing. It MUST NOT be filled with a plausible
placeholder, a stock photograph, or an assumed value"* — and it is exactly FR-019 and US4/2's case: the
imageless record must look intentional, with no substitute object invented.

**Resolved on 2026-09-22, and implemented.** The owner chose one identical, brand-owned placeholder for every
imageless product rather than an empty state, and asked that its world be generated:
`public/brand/placeholder-product.webp`, built by `scripts/make-product-placeholder.py`.

The distinction that keeps this inside Principle I is that the tile asserts something about the **shop**, not
about the product. Constitution I forbids filling missing data with "a plausible placeholder, a stock
photograph, or an assumed value" — a picture that could be mistaken for the merchandise. This one cannot be:
it is the merchant's own monogram in champagne on the obsidian-and-oxblood ground, and it reads immediately as
"this is Hami Hamrah, and there is no photo here."

Two things were deliberately not done, and both are load-bearing:

- **The mark is the real one** (`public/brand/hami-mark-alpha.png`), never a generated approximation. An
  AI-invented logo would fabricate a brand identity, which is a worse honesty failure than a missing product
  photo. Only the atmospheric backdrop is generated; its raw is kept at
  `assets/generated-placeholder/hami-placeholder-backdrop.png` so the composite is reproducible.
- **The mark is knocked out in champagne `#E5D3B3`, not left oxblood.** Its source `#640211` measures
  **1.48:1** against the `#0B0204` ground — present in the file, invisible to a shopper. Champagne measures
  **13.6:1**. The shape is untouched; only the fill changes, which is a standard monochrome knockout rather
  than a redraw.

The last-resort `return pick("phone", product.name)` is gone, along with the keyword, brand and category rule
tables it depended on — a guess refined is still a guess. The 31-file template pack stays on disk and is now
referenced by nothing; deleting it is the owner's call.

Verified in a browser on 2026-09-22: `/shop/اپل-آیدی` renders `/brand/placeholder-product.webp`, and the
`/shop` listing renders 12 `/images/catalog/<id>.jpg` photographs with zero template-pack paths and zero
remote hotlinks in the DOM. `tests/unit/product-images.test.ts` pins the catalog-wide version of that — 188
products to their own file, exactly one (`347 اپل آیدی`, `primary_image: null`) to the placeholder.

One incidental gain: `CartLine` was calling `resolveProductImage({ name })` with no images at all, so every
cart line was rendering a keyword-guessed stock image while the database row had a real one. It now passes
`item.product.image`, so cart lines show the product's own photograph or the placeholder.

---

## D2. Matting: what has to be installed, and it is not a cost question now

**Decision**: The isolation step is a deterministic segmentation/matting pass that **copies source pixels and
changes only transparency**. The owner has ruled that dependency cost is not a constraint on this initiative
and that quality is the priority (2026-09-22), so the tool is chosen on output quality, and installing it is
expected rather than an escalation. `rembg` over `onnxruntime`, CPU, is the default candidate (~176 MB model);
`birefnet`-class models are preferred where detail demands it even at more compute.

**Why deterministic and not generative, restated because it survives the cost change**: this is not a budget
argument, it is an honesty argument. FR-029 classifies a clipped product, a residual halo or a shifted colour
or finish as a defect that *blocks that product from use*, and SC-012 allows zero accepted instances. A
generative image edit — which is what `pixel_bridge`'s `edit_image` performs — re-synthesises every pixel it
touches, and will confidently straighten a bezel, drop a port, tidy a logo or brighten a finish. When a
deterministic matte fails it fails *visibly*: a hole, a halo, a chopped strap. A generative failure is
invisible by construction and nothing downstream can audit it. The distinction the owner's ruling removes is
"too expensive to install"; the one it cannot remove is "cannot be verified against the source."

**Nothing matting-capable is installed today**: no `rembg`, no ImageMagick, no GPU. Pillow 12.3.0 is present
(compositing and alpha encoding, not segmentation). `sharp` sits in `node_modules` as a transitive
dependency of Next and is not in `package.json`, so it may vanish on a lockfile change and must not be
imported for this.

**Disk**: `/home` is at 95% used with **13 GB free**. Sources are 11 MB; 188 alpha WebP derivatives at
displayed sizes are the same order. A ~176 MB model is comfortable. The note is here so nobody treats 95% as
a blocker — it is not one for this feature — and so a future session does not install a large model here
without checking.

**Hard subjects, and the spec named them correctly**: cables, straps, earbuds, translucent plastic, SIM
cards, reflective finishes, products photographed with packaging or hands in frame. All present in this
catalog. D4 counts them instead of arguing about them.

**Alternatives considered**: generative edit via `pixel_bridge` (rejected above — zero installs, and the only
option that manufactures undetectable lies); luminance/chroma keying against known-white backgrounds via
Pillow (cheap and deterministic, good exactly where a source is a white studio shot; abandoned as primary
because these are shop photographs and not all are on white — verify per D4's sample rather than assuming
either way); no isolation at all, all products framed (this is D6's fallback, and it is a complete deliverable
if D4 comes back bad).

---

## D3. FR-034's measurement comes before the treatment, not after

**Decision**: Before any storefront surface changes, isolate a **stratified sample of 24** and measure. The
strata are forced by the data: a slice of the 117 800×800 files, the 45 portrait 675×900 files, the
8.5 KB/smallest sources, the fine-detail classes (cables, straps, earbuds, SIM cards), translucent and
reflective finishes, and the imageless record.

**Report** the count and the list of products that cannot be cleanly isolated, per FR-034 — which requires
this be "measured and reported **before** the treatment is relied upon across the storefront, because the
answer determines whether this is a catalog-wide presentation or a curated one."

**Rationale**: three outcomes and their consequences:

- **under ~10% fail** → catalog-wide, with FR-033's framed fallback carrying the remainder.
- **10–35% fail** → catalog-wide, but the framed presentation is co-primary rather than an exception, and
  D5's grounding cue must look deliberate in both forms side by side. This is US2/5's checkerboard risk.
- **over ~35% fail** → this stops being a floating-product feature and becomes a listing-quality feature.
  Say so, and re-scope.

**Alternatives considered**: spot-checking hero products, which the spec forbids explicitly ("reviewed
against that same standard rather than spot-checked on hero products"); proceeding and measuring later, which
buys the whole 188-asset pipeline on an assumption.

---

## D4. Derivative format and FR-032's weight budget

**Decision**: Derivatives are alpha-capable WebP at the sizes actually displayed, emitted into
`public/images/products/isolated/<id>.webp` with a manifest carrying source path, derived path, dimensions and
bytes. Sources stay untouched alongside (FR-031).

**Rationale**: FR-032 requires transparency without a download regression. PNG at 900px is the wrong answer
for a product grid on a phone; WebP carries alpha at a fraction of the size. The manifest makes D7 and FR-018
checkable rather than vibes-based: with recorded pixel dimensions per product, "each presentation size MUST be
chosen from the resolution actually available for that product" becomes arithmetic over 16 known sizes.

Measured headroom is good: sources are 8.5–103 KB with a 60 KB median, so an alpha WebP at displayed sizes
should land near parity, not above.

**Alternatives considered**: AVIF (smaller, slower to decode, and an isolation-quality defect is easier to
spot on a fast decode — quality review is the binding activity here, not byte count); PNG (FR-032 fails on a
188-tile grid); keeping JPEG and faking the float with a mask (returns the seam problem FR-007 forbids).

---

## D5. One grounding cue, proven on 24 before it is proven on 188

**Decision**: A single contact shadow derived from the object's own measured alpha bounds and baseline, plus a
subtle top-lit falloff. Both computed from the asset, never hand-placed per product.

**Rationale**: FR-009 permits depth cues and requires them systematic — a cut-out on a dark ground with
nothing beneath it reads as pasted rather than suspended. Deriving from alpha is what makes it a rule rather
than a CSS default that is wrong for every non-square object; a phone and a cable reel need different
shadows and no fixed `box-shadow` knows that.

The reference forbids shadows; Q3 = B overrides that, and the override is not free. Depth cues under 188
products on a dark red-noir ground is precisely how this initiative reintroduces the noise 001 and 002 exist
to remove, and FR-009 says so. The mitigations are numeric, not aspirational: one light direction site-wide,
one blur scale, one opacity ceiling, and a hard rule that a product in the FR-033 framed fallback gets no
shadow at all — the two states must never mix in one row, because that is the checkerboard.

**The framed fallback is a composition, not a defeat** (FR-020, FR-033): object on its own opaque panel, same
radius, same lighting, deliberate — so the D3-measured population looks *placed* rather than *unprocessed*.

**RTL**: the light direction is stated on the inline axis (reading-start side), a re-derivation rather than a
mirror (FR-024, FR-025).

**Alternatives considered**: reflection (reads as a glossy surface the brand does not have, and doubles the
cost of any seam error); card-level drop shadow (re-adds the chrome FR-002 removes); no cue at all (rejected
by FR-009's own reasoning).

---

## D6. Motion, and it may use whatever is best

**Decision**: Motion is built on the strongest available tool rather than the already-installed one. GSAP
(`gsap@3.15.0`, installed, already imported in `components/ui/CardSwap.tsx` and
`components/layout/PillNav.tsx`) is the working choice for scroll-linked and physically-eased object motion;
`motion@13.2.0` is also installed and in use in `components/home/FeaturedProducts.tsx`. Where neither
suffices, adding a package is sanctioned — the owner set quality above dependency cost on 2026-09-22.

**Rationale**: FR-010 makes motion central after Q3 = B, and the animated product-page experience the owner
recalled is a scroll-scrubbed, physically-weighted one. That is GSAP's home ground. What the cost ruling
changes is the licence to reach for the right tool; what it does not change is FR-014, which requires this
motion and feature 002's scroll-driven ground to read as one choreography — and **two libraries each driving
scroll-linked motion on one page is the specific way to fail FR-014**. So the quality-first ruling produces
one instruction here: pick a single motion system for the whole homepage, across 002, 003, 004 and 005, rather
than the best tool per feature.

**Two open couplings, both upstream of this feature.** 002's Question 1 was reopened on 2026-09-22 for the
owner's "smooth and heavy" scroll, so whether 003's motion sits on an eased-scroll page or a native one is
currently undecided; and `ScrollSmoother` is now a live candidate there, which would move the scroll
authoring model for everything on the page. 003's motion work should not be finalised before that resolves.

**Constraints that survive everything**: FR-011 no indefinite looping and every reveal comes to rest;
FR-012/FR-013 identical product, information and action under reduced motion, nothing missing; FR-015 smooth
on a mid-range phone. The duration and easing family stays shared with 004's rows
(`220ms cubic-bezier(0.2, 0.7, 0.3, 1)`) and 005's carousel until one system is chosen for all of them —
FR-038 and 005's contract X1 bind them reciprocally, and a per-feature choice is the failure those clauses
name.

**Off-screen** — no reveal fires outside the viewport and none replays on return, matching 002/FR-019 and
005/FR-019.

**"Reveal, don't announce"** resolves to: the object settles into place from slightly larger to actual size
under 300 ms, with its information arriving with it rather than after it. A product growing toward the shopper
reads as an object entering a space; a product fading up reads as a div.

**Alternatives considered**: scroll-scrubbed turntable rotation — this is the Apple experience the request
recalled, and it needs imagery the catalog does not contain: the 45 portrait and 117 square files are one
view each, and the 133 products with additional views hold them as **remote gallery URLs that were the reason
the mirror exists** (5.8–7.5 s, `next/image` 500-ing). Out of Scope names 360° viewers. Revisit only if the
merchant's additional views get mirrored too, which is now a cheap extension of D2's tooling rather than a new
problem; cross-fade-only reveals (the "fades are not motion" default this initiative keeps producing).

---

## D7. Size caps from measured pixels, per product

**Decision**: `lib/product-presentation.ts` computes each product's maximum display size from its own
measured source dimensions, with a floor below which the product takes the framed presentation rather than
being upscaled.

**Rationale**: FR-018 is unambiguous — sharpness wins over scale (Q1 = A), the 900px ceiling is accepted
rather than worked around, and each size comes "from the resolution actually available for that product
rather than from a layout ideal". FR-006's isolation is expected to buy apparent scale by removing wasted
background, and FR-018 says in terms that this **must not** be used as a reason to exceed the pixels.

**Now measured rather than inherited** — the distribution D7 needs: 16 distinct sizes across 188 files, led
by 800×800 (117), 675×900 (45), 900×900 (7), 600×600 (4), 720×720 (2), 554×554 (2), max dimension 900, 142
square against 45 portrait and 1 landscape. The earlier draft of this file said this had to be re-measured
after the assets were fetched; it did not need fetching — it needed looking at the directory that was already
there.

**Aspect rule** (FR-017): the frame sizes to the object's alpha bounds, so a portrait phone and a square
power bank share a baseline and a visual weight without either being letterboxed, distorted or cropped past
the product. This is the likeliest place for US2/4's "degraded version of the other" failure, so it is a
stated rule with a fixture per size class rather than a CSS default.

---

## D8. FR-030's 188 individual reviews — the constraint that has no engineering answer

**Decision**: Produce `specs/003-floating-product-presentation/reviews/index.csv` — one row per product, with
its source path, derivative path, reviewer, date and a verdict on the three things that matter: same object,
nothing missing, finish unchanged. Unreviewed assets default to the framed presentation, never to "floating".

**Rationale**: FR-030 states "a batch process is acceptable for producing them; a batch approval is not," and
SC-012 requires zero accepted defects across 188. No tool and no agent can close that. It is recorded as a
genuine open cost of Q2 = B rather than absorbed silently into a plan.

The most plausible reviewer is the merchant — these are their products and they know if the picture is wrong —
and a 188-row CSV is something one person can work through in sittings. What is not acceptable is the agent
signing it off. Feature 004's ten-person reception panel (T049) was dropped on 2026-09-22 because the panel
could not be assembled; the honest state of an unrun review is unmeasured, and this feature should inherit
that discipline.

**The useful consequence**: because unreviewed means *framed* rather than *absent*, the feature degrades
safely. Unreviewed products stay fully visible and honest, just not floating. Progress is countable as rows
flip from `unreviewed` to `approved` rather than being a vibe about how the page feels.

---

## Reproducing the measurements

```bash
# 1. The mirror: what renders for 188 of 189 products
node -e '
const m=require("./data/catalog-images.json"), fs=require("fs"), path=require("path");
const ids=Object.keys(m);
console.log("entries:", ids.length, "| files present:",
  ids.filter(id=>fs.existsSync(path.join("public", m[id].replace(/^\//,"")))).length);'
# expected: entries: 188 | files present: 188

# 2. Their real properties — the spec's table, verified
python3 -c "
from PIL import Image; import os, collections
d='public/images/catalog'; dims=collections.Counter(); modes=collections.Counter(); n=[]
for f in os.listdir(d):
    im=Image.open(os.path.join(d,f)); dims[(im.width,im.height)]+=1; modes[im.mode]+=1
    n.append(os.path.getsize(os.path.join(d,f)))
print('modes:',dict(modes),'| largest:',max(max(k) for k in dims),'| n:',len(n))
print('sizes:',dims.most_common(6))"

# 3. The fallback that still reaches production for exactly one product
grep -n "return pick(\"phone\"" lib/product-images.ts
node -e '
const d=require("./data/hami-products.json");
console.log("no primary_image:", d.products.filter(p=>!p.primary_image).map(p=>({id:p.id,name:p.name})));'

# 4. Matting capability: none installed
python3 -c "import rembg" 2>&1 | tail -1     # ModuleNotFoundError
which convert magick                          # nothing
df -h /home | tail -1                         # 13G free
```
