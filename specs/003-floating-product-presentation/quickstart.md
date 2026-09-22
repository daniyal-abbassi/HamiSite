# Quickstart: Floating Product Presentation

**Feature**: [spec.md](./spec.md) | **Contract**: [product-presentation-behaviour.md](./contracts/product-presentation-behaviour.md)

## Prerequisites

```bash
npm run typecheck
npx vitest run tests/unit        # never bare `npm test` — it truncates 19 DB tables (003/research D8 note)
```

Installing a matting model is expected (D2) — dependency cost is not a constraint on this initiative, per the
owner's ruling of 2026-09-22 — but it is a real install, so run it deliberately and check space:
`df -h /home` was **13 GB free** at planning time.

Dev server health before any browser claim: one Next process, one listener on 3000, and a 200 on a
`/_next/static/chunks/*.js` request. An HTML 200 is not proof of a working page.

## §0 — Confirm the assets are what the spec says they are

The earlier draft of this guide told you to prove the storefront was showing the wrong photographs. It was
wrong, and the check below is the one that should have been run first.

```bash
node -e '
const m=require("./data/catalog-images.json"), fs=require("fs"), path=require("path");
const ids=Object.keys(m);
const present=ids.filter(id=>fs.existsSync(path.join("public", m[id].replace(/^\//,""))));
console.log({entries:ids.length, filesPresent:present.length});'

python3 -c "
from PIL import Image; import os, collections
d='public/images/catalog'; modes=collections.Counter(); dims=collections.Counter(); n=[]
for f in os.listdir(d):
    im=Image.open(os.path.join(d,f)); modes[im.mode]+=1; dims[(im.width,im.height)]+=1
    n.append(os.path.getsize(os.path.join(d,f)))
print('modes:',dict(modes),'| max dim:',max(max(k) for k in dims),'| median bytes:',sorted(n)[len(n)//2])"
```

Expected: **188 entries, 188 files present**, all `RGB` (no alpha anywhere), max dimension 900, median
~60 KB. Then confirm the product cards really use them: the mirror is applied in `lib/catalog.ts`'s
`serializeProduct`, promoted to `images[0]`, and `resolveProductImage` prefers a product's own local image.
Open a distinctive product — one whose photograph has an unusual shape — and confirm the card shows *it*.

The one defect this guide used to ask you to confirm is now fixed, and §0 checks it stays fixed. The product
with no photograph — `347 اپل آیدی`, `primary_image: null` — resolves to
`/brand/placeholder-product.webp`, one shared brand tile built by `scripts/make-product-placeholder.py` from
the merchant's real mark knocked out in champagne (13.6:1 against the ground; the mark's own oxblood is
1.48:1 and would have been invisible). Open that product and confirm the tile reads as *Hami Hamrah with no
photo here*, not as a device.

Then confirm the guesswork is gone rather than dormant:

```bash
grep -n "NAME_RULES\|BRAND_RULES\|pick(\"phone\"" lib/product-images.ts   # expect no matches
npx vitest run tests/unit/product-images.test.ts
```

Expected from the test: 188 products resolve to `/images/catalog/<their-own-id>.jpg`, exactly one to the
placeholder, and zero paths under `/images/products/` — the template pack, which is now referenced by nothing
and still sits on disk awaiting an owner decision.

## §1 — US1 needs no asset work, so run it first

Put one real product on a screen with the treatment on and once as it ships today, side by side at 360px and
1280px. Ask two people what the page is about and what competed for attention.

Expected: P1–P5. The product is named unprompted; nothing on the screen is neither the product, its
information, nor its action; one primary action. The spec's own Assumptions make this the safe floor, and it
is provable with everything already in place.

## §2 — The 24-file isolation measurement (FR-034) — the gate

Build the stratified sample from the measured distribution rather than from a guess about it: a slice of the
117 `800×800` files, some of the 45 `675×900` portraits, the smallest sources (minimum is 8,501 bytes), the
fine-detail classes — cables, straps, earbuds, SIM cards — translucent and reflective finishes, and the
imageless record.

```bash
python3 scripts/isolate-catalog-images.py --sample 24   # deterministic matte, alpha only, no regeneration
```

Review all 24 against their sources at 1:1 and at displayed size. **Report the count that cannot be cleanly
isolated**, then branch:

- **under ~10%** → catalog-wide, with the framed fallback for the remainder
- **10–35%** → catalog-wide, but framed becomes co-primary, and §3's P3 review matters more because two visual
  states now share the page
- **over ~35%** → stop and re-scope. This becomes a listing-quality feature, not a floating-product one.

Do not proceed past this without the number written down. FR-034 asked for it before the treatment was
relied on, and it is the only clause in the spec that can save the feature from its own premise.

Check the matting is honest while you are here: open a source and its derivative in the same viewer and
confirm pixels are identical where opaque. A finish that shifted, a logo that tidied itself or a bezel that
straightened is D2's disqualifying failure mode, not a rounding error.

## §3 — The seam and the checkerboard

Show one product on three surfaces of different tone, including feature 002's darkest scroll position. Then
render a grid of twenty real products and look at it as a whole rather than as twenty tiles.

Expected: D1 (no accidental seam on any product), D2 (no row mixing `isolated` and `framed` with mismatched
baselines), D5 (a square and a portrait file read as siblings), and P3 (no border, panel or card shadow doing
the hierarchy's work). D3 requires sampling 002's ground at intermediate positions — 002's Question 1 is
reopened as of 2026-09-22, so run this against the ground's actual current behaviour and re-run after it
settles.

The spec's independent test is the right one: repeat on the smallest and the portrait files, "which is where
any rule will actually break."

## §4 — Sharpness caps

Open the product page at 1280px for the smallest sources and for a `900×900` one. Compare rendered width
against the manifest's recorded source width.

Expected: S2 — no product exceeds its own pixels. The tempting failure is a grid that looks better with bigger
objects; FR-018 settles it for sharpness, and says in terms that isolation buying apparent scale is not a
licence to exceed the pixels.

## §5 — Weight

Same route, same device profile, before and after derivatives ship; compare a 24-tile listing's time to usable.

Expected: S4 and D4. Sources run 8.5–103 KB, so alpha WebP at displayed sizes should be near parity, not a
regression. Measure on a **production build** (`npm run build && npx next start`) — dev-mode numbers are not
comparable, and 004 measured a 50 ms versus 33 ms gap that vanished entirely in production.

## §6 — Motion, purpose, and calm after two minutes

Watch a surface for thirty seconds doing nothing. Interact normally. Then browse treated surfaces for two
minutes and answer whether the page still reads as calm.

Expected: M1–M8, SC-007 (a reviewer can state what each movement communicated) and SC-009 (8 of 10 still say
calm after two minutes). Verify with `prefers-reduced-motion` on and compare against 004's brand rows and
005's carousel side by side — one rule across three surfaces is FR-038 and it is the coherence clause most
likely to drift.

**M6/M7 are the ones at risk.** Confirm a single motion system is driving scroll-linked movement on the
homepage; `gsap` and `motion` are both installed and both in use, so two are possible and FR-014 forbids it.
This section cannot be finalised before 002's reopened Question 1 decides whether the page is scroll-eased at
all — a scroll-scrubbed reveal on a lerped page behaves differently.

## §7 — Right-to-left

Compare every composition against the inline-axis rule: light direction, product-against-headline asymmetry,
reveal direction. Expected R1/R2, SC-011: no composition reads as an afterthought mirror. Check the reference
document's LTR-specific alignments were adapted or dropped, with the adaptation noted.

## §8 — FR-030's review pass, and what to do if it cannot happen

`reviews/index.csv` carries one row per product: source path, derivative path, reviewer, date, and a verdict
on three questions — same object, nothing missing, finish unchanged. SC-012 requires zero accepted defects
across 188, and FR-030 states a batch process may produce them but a batch approval may not sign them off.

No agent can close this. The realistic reviewer is the merchant, who knows whether the picture is their
product, and 188 rows is something one person can work through in sittings.

If the review does not happen: unreviewed means **framed**, not absent, so the feature degrades safely and
stays honest — the products are visible, correct and simply not floating. Record the count of rows still
`unreviewed` rather than letting the column imply approval. Feature 004's ten-person reception gate (T049) was
dropped on 2026-09-22 because the panel could not be assembled; the honest state of an unrun review is
unmeasured, and this feature inherits that discipline.

## §9 — Judgement gates that cannot be automated

SC-001, SC-002, SC-005, SC-011, SC-013, SC-015 need people. SC-013 in particular asks reviewers whether an
isolated object depicts the same product as the merchant's original — which is §0's check done at scale by
someone with an opinion. Where a gate goes unmeasured it stays visibly unmeasured.

## Definition of done for this feature

Typecheck and `npm run build` clean; §0 confirming the mirror is what renders and the one imageless record
presented honestly; §2's number measured and the branch taken from it stated in writing; §1 and §3–§7 verified
in a real browser at 360px and 1280px with client chunks confirmed loading; §8's review count reported; §9
either measured or explicitly unmeasured.

And the Constitution IV clause that outranks the checklist: a page where every product is honest, correctly
sized and still looks like a catalogue of rectangles has not delivered this feature. Conversely one where
products float beautifully and any of them are not the products for sale has failed it — which is why §0 is
first and §2 is a gate.
