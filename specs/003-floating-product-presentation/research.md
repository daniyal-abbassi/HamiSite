# Phase 0 Research: Floating Product Presentation

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-09-22

The spec's asset table is the premise for Q1, Q2 and Q3 and for FR-016…FR-034. It does not survive contact
with the repository. Every figure below is measured; the reproduction commands are at the bottom.

---

## D1. The blocking finding: there are no product photographs to float

**Decision**: Split the feature. **US1 proceeds now** against the assets that exist, because it needs none of
them. **US2, US3's depth work and FR-028…FR-034 are blocked** behind a decision the owner has to make: where
do 188 honest product images come from.

**Measured, on 2026-09-22:**

```
products: 189
primary_image is a local path (/…):            0
primary_image is a remote http(s) URL:        188
products with no image at all:                  1
files in public/images/products/:              31   (all .png)
  of which *-removebg-preview.png:             26
entries in data/catalog-images.json:          188   (keyed by product id)
```

The 188 `primary_image` URLs are live and are the shop's own photography — spot-checked four: HTTP 200,
`image/jpeg`, 87–119 KB each, 555 ms to 3,134 ms to fetch. So the spec's "opaque background-bearing JPEG,
median 58 KB, ≤900px" description of the *data* is accurate. Its claim that they are **locally held** is not.

What actually renders today comes from `lib/product-images.ts`, whose own header comment says: *"The
legacy-import `ProductImage.url` values point at the old shop's host and are deliberately ignored… Mapping
is keyword-based (product name / category / brand, English + Persian) with a stable hash for variety inside
a family."* The pool it maps into is 31 PNGs described as *"assets ported from
docs/inspires/techBazar/public/images/products"*, and the filenames are of a template demo shop's stock:
`apple-watch-9-removebg-preview.png`, `asus-vivobook-2-removebg-preview.png`,
`dell-gaming-removebg-preview.png`, `galaxy-15-removebg-preview.png`, `firebolt-ninja-removebg-preview.png`.

**Three things follow, and none of them is a styling problem.**

1. **Principle I is failing on the live site, at scale.** A Xiaomi Poco X7 Pro is represented by a photograph
   of something else. The constitution's wording is specific and has no exception path: *"Missing data MUST
   stay visibly missing. It MUST NOT be filled with a plausible placeholder, a stock photograph, or an
   assumed value."* A keyword-and-hash lookup into a 31-file pool of another shop's stock imagery is the
   textbook instance. FR-022's "no view that is not of that actual product" is not a future risk here; it is
   a description of the present.
2. **The `docs/inspires/` constraint is already breached.** The constitution forbids porting anything out of
   that tree; these images are its product photo folder.
3. **Feature 004 made it stricter, correctly and unknowingly.** 004's T055 change made
   `resolveProductImage` local-only — it dropped the last path by which a merchant photograph could have
   reached the screen. That change was right under the "no remote hotlink as merchandise" rule it was written
   for, and it closed the only honest route that existed. Worth saying plainly: the two features are pulling
   in opposite directions and neither had this fact in view.

**Why the isolation route is simultaneously easier and impossible.** Easier, because 26 of the 31 files
currently used are already cut out — the mechanical work Q2 = B commissioned is largely done. Impossible,
because cut-outs of the wrong products are still the wrong products. FR-028 requires "every isolated object
MUST be derived from that product's own existing photograph", and there is no photograph of the product.

**Alternatives considered**:

- **Hotlink the merchant's own 188 JPEGs.** Rejected: they are opaque background-bearing rectangles, which
  is the whole problem Q2 = B exists to solve, and 004 already rejected remote imagery as merchandise on the
  sound grounds that it can vanish or change without this repository knowing.
- **Hotlink *and* remove backgrounds at request time.** Rejected: an image pipeline dependency on the live
  homepage, and FR-031 requires sources retained alongside derivatives, which a runtime path cannot do.
- **Present the 189th product and every unmatched product as visibly imageless.** Correct under Principle I
  and it is D1's fallback if the owner declines the fetch — an honest empty product is a smaller failure than
  a confident lie. It is also a storefront where most tiles show no object, so it is a stopping point, not a
  destination.
- **Keep the current treatment and treat this finding as out of scope.** Rejected; it is the one finding in
  this plan that is not a design choice.

### Sequencing this implies

| Stage | Work | Needs the assets? |
|---|---|---|
| **Now** | US1: chrome removal, product-as-protagonist, whitespace-carried hierarchy, one action per surface (FR-001…FR-005) | No |
| **Now** | Make `resolveProductImage` honest about what it is doing: a stand-in must be *labelled or absent*, never confident | No |
| **Owner decision** | Fetch the 188 real JPEGs (D2) and matting capability (D3) | — |
| **After D2/D3** | US2: isolation, grounding cue, seamlessness (FR-006…FR-009) | Yes |
| **After D4 measurement** | Decide catalog-wide versus curated | Yes |
| **Parallel** | US3: motion (D7) | No — motion applies to whatever frame exists |

The spec's own Assumptions already say "User Story 1 remains the safe floor… The two are sequenced, not
coupled." This is that sentence, taken literally, plus the reason the other half cannot start.

### The FR-030 problem, named

FR-030: "Every one of the 188 derived assets MUST be individually reviewed against its source before use. A
batch process is acceptable for producing them; a batch approval is not." SC-012 makes it a success criterion
with zero accepted defects.

That is 188 human image comparisons. Feature 004's equivalent gate — a ten-person reception panel — was
dropped on 2026-09-22 because the panel could not be assembled. There is no version of FR-030 that an agent
can satisfy alone, and an agent signing it off would be exactly the fabricated validation this initiative has
refused twice. If the 188-asset route is taken, the review either happens with the merchant's own eyes — the
most plausible source, since these are their products — or SC-012 goes unmeasured and says so. The plan does
not pretend otherwise, and `reviews/index.csv` exists precisely so the gap is countable rather than
atmospheric.

---

## D2. Getting the 188 real photographs onto disk

**Decision**: One idempotent script, `scripts/catalog-images/fetch.mjs`, downloading each product's
`primary_image` from `hamihamrah-shop.com` into `public/images/products/catalog/<product-id>.jpg`, verifying
content-type and byte length, recording a manifest, and re-running safely.

**Rationale**: The URLs are already in `data/hami-products.json` as the shop's own assets, they respond, and
~90 KB × 188 ≈ 17 MB — noise against 13 GB free. Keying by product id rather than by URL keeps the mapping
auditable when the export changes and makes a re-run cheap. Verification is required and not optional: a
hotlinked 200 that is actually a 1 KB placeholder, or a page that returns HTML with an image content-type,
would otherwise poison every downstream step silently.

`data/catalog-images.json` already holds 188 entries keyed by product id, which is very likely the same
mapping previously extracted from the shop. D2 treats it as a cross-check, not as a source: if the two
disagree for a product, that product is quarantined for review rather than guessed.

**Alternatives considered**: asking the merchant for an export or a ZIP (better provenance, unknown
turnaround, and it makes the feature's start date somebody else's); `next/image` remote patterns (caches into
`.next` which is not retained, and does not give FR-031 its sources); fetching lazily on first render
(removes the auditable artifact and makes the homepage depend on another company's server — the reason 004
removed remote hotlinks in the first place).

**Consent note**: downloading images the shop itself serves publicly, for the shop's own storefront, is not
the kind of fetch that needs a policy argument. It is still a bulk request to a third-party host, so it runs
sequentially with a delay, and it is a single explicit command the owner invokes rather than something folded
into `npm run build`.

---

## D3. Matting must be deterministic, not generative

**Decision**: Alpha comes from a segmentation/matting pass that **copies source pixels and only changes
transparency**. If no such tool is available at execution time, the honest answer is that isolation is
blocked, not that an image model is used instead.

**Measured**: nothing matting-capable is installed. No `rembg`, no ImageMagick, no GPU. Pillow 12.3 is
present, which handles compositing and alpha encoding but cannot segment. `sharp` exists in `node_modules` as
a transitive dependency of Next and is **not** in `package.json`, so it may vanish on a lockfile change and
must not be imported.

**Rationale**: FR-029 classifies a clipped product, a residual halo, or a shifted colour or tone as a defect
that *blocks that product from use*, and SC-012 permits zero accepted instances. A generative image edit —
which is what `pixel-bridge`'s `edit_image` performs, driving ChatGPT or Gemini — re-synthesises every pixel
it touches. It can silently straighten a bezel, drop a port, "clean" a logo or change a finish, and it will
do so confidently and often attractively. That is the precise failure Principle I and FR-022 forbid, and it is
the failure mode the store's twenty-year reputation cannot absorb. The project's own standing rule already
bars generated imagery as product representation.

A deterministic matte cannot produce a *clean* edge on hard subjects either, but when it fails it fails
visibly — a hole, a halo, a chopped strap — which FR-033's fallback exists to catch. A generative failure is
invisible by construction, and nothing downstream can audit it. That asymmetry is the whole argument.

**What has to be installed** and requires the owner's explicit approval, per the no-silent-installs rule: a
model-backed segmentation tool (the usual candidate is `rembg` over `onnxruntime`, CPU, ~176 MB of model).
At CPU inference this is seconds per image, so 188 images is a coffee, not a job. The `u2net_human_seg` /
`isnet-general-use` class of models is the right family for product shots; `birefnet` is better on fine
detail like cables at more cost.

**Hard subjects are predicted, and the spec named them correctly**: cables, straps, earbuds, translucent
plastic, SIM cards, reflective finishes, and products photographed with packaging or hands in frame. Every
one exists in this catalog. D4 exists to count them instead of arguing about them.

**Alternatives considered**: generative edit via `pixel_bridge` (rejected above — the only real option
available with zero installs, and it is the one that manufactures undetectable lies); luminance/chroma keying
against the known white backgrounds via Pillow (cheap, deterministic, and good exactly where the sources are
white studio shots; abandoned as the primary because these files came from a shop's own pages and the spec is
right that they are not all on white); shipping the remote JPEGs framed on a deliberate panel for every
product (this is FR-033's fallback, and D6 makes it a first-class composition rather than a degradation).

---

## D4. FR-034's measurement comes before the treatment, not after

**Decision**: Before any storefront surface changes, isolate a **stratified sample of 24** and measure. The
strata are forced by the data, not invented: the 134 phones, the busiest-background accessories, the
fine-detail classes (cables, straps, earbuds, SIM cards), the translucent and reflective finishes, the two
smallest sources, the portrait files, and the single imageless record.

**Report**: the count and the list of products that cannot be cleanly isolated, per FR-034 — which requires
this be "measured and reported **before** the treatment is relied upon across the storefront, because the
answer determines whether this is a catalog-wide presentation or a curated one".

**Rationale**: This is the requirement the spec wrote for exactly the situation this feature is in, and it is
the only honest way to know what is being committed to. Three outcomes and their consequences:

- **Under ~10% fail** — catalog-wide, with FR-033's framed fallback carrying the remainder.
- **10–35% fail** — catalog-wide, but the framed presentation is co-primary rather than an exception, and
  D6's grounding cue has to look deliberate in both forms side by side. The spec calls this out as the
  checkerboard risk in US2/5.
- **Over ~35% fail** — this stops being a floating-product feature and becomes a listing-quality feature.
  Say so, and re-scope.

**Alternatives considered**: spot-checking hero products, which the spec explicitly forbids ("reviewed
against that same standard rather than spot-checked on hero products"); proceeding and measuring later, which
buys the whole 188-asset pipeline on an assumption.

---

## D5. Derivative format and FR-032's weight budget

**Decision**: Derivatives are alpha-capable WebP encoded at the sizes actually displayed, emitted with a
manifest carrying dimensions and bytes. Sources stay untouched alongside (FR-031).

**Rationale**: FR-032 requires transparency without a download regression. PNG at 900px is the wrong answer
for a grid of products on a phone — WebP carries alpha and is typically a fraction of the size. The manifest
makes FR-018 and D8 checkable rather than vibes-based: with actual pixel dimensions per product, "each
presentation size MUST be chosen from the resolution actually available for that product" becomes arithmetic.

`next/image` already handles responsive sizing, so the derivative is the source of truth for the object and
the browser picks a candidate. Nothing is loaded twice: the isolated object replaces the picture rather than
layering onto it.

**Alternatives considered**: SVG (nonsense for photographs); AVIF (smaller, slower to decode, and an
isolation-quality regression is easier to spot on a fast decode); PNG (FR-032 fails on a 188-tile grid).

---

## D6. One grounding cue, proven on 24 before it is proven on 188

**Decision**: A single contact shadow derived from the object's own measured bounding box and baseline, plus
a subtle top-lit falloff. Both computed from the asset's alpha extents, never hand-placed per product.

**Rationale**: FR-009 permits depth cues and requires them to be systematic, because a cut-out on a dark
ground with nothing under it reads as pasted rather than suspended. The derivation-from-alpha rule is what
makes it systematic rather than a CSS default that is wrong for every non-square object: a phone and a cable
reel need different shadows and no fixed `box-shadow` knows that.

The reference forbids shadows; Q3 = B overrides that, and the plan should not pretend the override is free.
Shadows under 188 products on a dark red-noir ground is precisely how this initiative reintroduces the noise
001 and 002 exist to remove, and FR-009 says so. Mitigation is numeric, not aspirational: one light direction
site-wide, one blur scale, one opacity ceiling, and a hard rule that a product shown in the FR-033 framed
fallback gets no shadow at all — the two states must never mix in one row, because that is the checkerboard.

**The framed fallback is a composition, not a defeat** (FR-020, FR-033): object on its own opaque panel, same
radius, same lighting, deliberate. Chosen so that the ~measure-from-D4 population looks *placed* rather than
*unprocessed*.

**RTL**: the light direction is stated in the inline axis (D6 fixes it to come from the reading-start side),
which is a re-derivation rather than a mirror — FR-024/FR-025.

**Alternatives considered**: reflection (rejected: reads as a glossy surface the brand does not have, and
doubles the cost of any seam error); drop shadow at card level (rejected — it re-adds exactly the panel
chrome FR-002 removes); no cue at all (rejected by FR-009's own reasoning).

---

## D7. Motion from what is already installed, and one motion vocabulary

**Decision**: The reveal and pointer response are built on `motion@13.2.0`, already a dependency and already
used in `components/home/FeaturedProducts.tsx`. One entrance per product per page appearance, settling and
staying settled; one continuous pointer response; nothing that loops.

**Rationale**: FR-010 makes motion central after Q3 = B, FR-011 forbids indefinite looping, and
`research.md`-class rejections of animation libraries are moot here — `motion` and GSAP are both inside
`package.json` already. Adding a third would be the actual violation.

Two constraints this feature does not own and must satisfy anyway. **FR-014** requires coexistence with
feature 002's scroll-driven ground as one choreography — and 002's US1 shipped while its own FR-005 gate
**failed**, and its Question 1 was reopened on 2026-09-22 for the owner's "smooth and heavy" scroll, so the
ground behaviour this has to harmonise with is currently undecided. **FR-038/005's X1** binds this surface
and 004's rows and 005's carousel to a single duration scale and easing family; 004 already ships
`220ms cubic-bezier(0.2, 0.7, 0.3, 1)` and 005's plan adopts it, so 003 adopts the same rather than choosing
its own.

**Reduced motion** (FR-013): identical product, information and action, motion absent, nothing missing. Same
rule as 004 and 005 — one behaviour across all three surfaces, per FR-038.

**Off-screen** — no reveal fires for a product outside the viewport, and none replays on return, matching
005's FR-019 rule and 004's C-obligations.

**"Reveal, don't announce"** resolves to: the object settles into place from slightly larger to actual size,
under 300 ms, and its information arrives with it rather than after it. A product that grows toward the
shopper reads as an object entering a space; a product that fades up reads as a div. Deliberate choice,
recorded so it can be argued with.

**Pointer response is a small parallax tilt tied to the object's own measured extents, and it settles
immediately on pointer-out.** Kept modest because FR-015's phone budget and a page that already has a scroll
ground, a dragging carousel and hover-emphasised brand rows is not a page with room for eighteen live objects.
It is also the clause most likely to fail US3/2 in review, so the tolerance is tight by design.

**Alternatives considered**: GSAP timelines (installed, but `motion` is already doing this job in
`FeaturedProducts`, and two motion systems on one page is the incoherence FR-014 names); scroll-scrubbed
turntable rotation (this is the Apple experience the request recalled, and it needs 360° imagery the catalog
does not contain — 133 products have *additional* views, remote and measured slow, which are different angles
of a photograph at best and other products at worst; Out of Scope explicitly names 360° viewers);
cross-fade-only reveals (rejected as the "fades are not motion" default this initiative keeps producing).

---

## D8. Size caps from measured pixels, per product

**Decision**: `lib/product-presentation.ts` computes each product's maximum display size from its own
measured source dimensions, with a floor below which the product takes the framed fallback rather than being
upscaled.

**Rationale**: FR-018 is unambiguous — sharpness wins over scale, the 900px ceiling is accepted rather than
worked around, and each size comes "from the resolution actually available for that product rather than from
a layout ideal". A layout ideal is exactly what a grid wants and exactly what the smallest files cannot give:
the two 400×400 and 447×447 sources in a 900px hero would be visibly soft, and isolation does not licence
exceeding the pixels (FR-018 says so in terms).

This is also what makes the rule systematic in the FR-016 sense: one function over a manifest, not an
eyeballed column width per surface.

**Unverified and marked as such**: the spec's "141 square, 45 portrait, largest dimension 900px" describes
the merchant's remote files. Only four were fetched for this plan, so **the distribution has to be measured
on all 188 after D2** and D8's caps derived from that measurement rather than from the table in the spec,
which has already been wrong once in this document about where the images live.

**Aspect rule** (FR-017): the frame sizes to the object's alpha bounds, so a portrait phone and a square
power bank share a baseline and a visual weight without either being letterboxed or cropped. This is the
single most likely place for US2/4's "degraded version of the other" failure, so it is a stated rule with a
test fixture rather than a CSS default.

---

## Reproducing the measurements

```bash
# 1. Local versus remote product imagery
node -e '
const d=JSON.parse(require("fs").readFileSync("data/hami-products.json","utf8"));
const u=d.products.map(p=>p.primary_image);
console.log({total:u.length, local:u.filter(x=>String(x).startsWith("/")).length,
  remote:u.filter(x=>/^http/.test(String(x))).length, none:u.filter(x=>!x).length});
'
# expected: { total: 189, local: 0, remote: 188, none: 1 }

# 2. What actually renders
ls public/images/products | sed "s/.*\.//" | sort | uniq -c      # 31 png
ls public/images/products | grep -c removebg                      # 26
grep -n "PRODUCT_DIR\|ported from" lib/product-images.ts | head

# 3. The merchant's files are live JPEGs
node -e '
const d=JSON.parse(require("fs").readFileSync("data/hami-products.json","utf8"));
(async()=>{for(const p of d.products.slice(0,4)){const t=Date.now();
const r=await fetch(p.primary_image);const b=await r.arrayBuffer();
console.log(r.status,b.byteLength,Date.now()-t+"ms",r.headers.get("content-type"));}})();
'

# 4. Matting capability: none present
python3 -c "import rembg" 2>&1 | tail -1        # ModuleNotFoundError
which convert magick                            # nothing
node -e "console.log(Object.keys(require('./package.json').dependencies))"

# 5. Dimensional reality of all 188 — run only after D2's fetch, then write
#    the real distribution into this file, replacing the spec's inherited table.
```
