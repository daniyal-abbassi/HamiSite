# Quickstart: Floating Product Presentation

**Feature**: [spec.md](./spec.md) | **Contract**: [product-presentation-behaviour.md](./contracts/product-presentation-behaviour.md)

## Read this before running anything

**§0 is a gate, not a step.** `research.md` D1 measured that 0 of 189 products have a local photograph, that
188 render a keyword-matched template stock image, and that 26 of those stock files are already
background-removed. Sections §2 and §4 below are only meaningful after the 188 real sources are on disk.
Skipping to §3 — making a stock image of an Apple Watch float beautifully on a dark ground — is the one
outcome this feature must not produce.

```bash
# §0. Where product imagery actually comes from
node -e '
const d=JSON.parse(require("fs").readFileSync("data/hami-products.json","utf8"));
const u=d.products.map(p=>p.primary_image);
console.log({total:u.length,local:u.filter(x=>String(x).startsWith("/")).length,
  remote:u.filter(x=>/^http/.test(String(x))).length,none:u.filter(x=>!x).length});'
ls public/images/products | sed 's/.*\.//' | sort | uniq -c
ls public/images/products | grep -c removebg
# expected today: {total:189, local:0, remote:188, none:1}; 31 png; 26 removebg
```

Then, from the browser: open a product whose name does not match its category art and confirm what you are
being shown is not it. This is H1's failure and it is the finding, not a step to complete.

## Prerequisites

```bash
npm run typecheck
npx vitest run tests/unit        # never bare `npm test` — it truncates 19 DB tables (002/005 research D8)
```

No new package in `package.json`. `motion` and `gsap` are already installed and in use; if a third animation
or image library appears, that is a plan violation. A matting tool is required for §4 and needs explicit
owner approval before install — `/home` is at 95% with 13 GB free.

Dev server health before any browser claim: exactly one Next process, one listener on 3000, and a 200 on a
`/_next/static/chunks/*.js` request. An HTML 200 is not proof of a working page.

## §1 — US1 needs no assets, so run it first

Pick one real product and put it on a screen with the treatment on and once as it ships today, side by side
at 360px and 1280px. Ask two people what the page is about and what competed for attention.

Expected: P1–P5. The product is named unprompted; no element on the screen is neither the product, its
information, nor its action; one primary action. This stage is provable with the current files, which is why
it is sequenced first (`research.md` D1's staging table).

## §2 — Provenance, before beauty

Run the fetch (owner-invoked, sequential, throttled — it is a bulk request to a third-party host), then:

```bash
node scripts/catalog-images/fetch.mjs        # writes public/images/products/catalog/<id>.jpg
node scripts/catalog-images/manifest.mjs     # writes data/catalog-image-manifest.json
npx vitest run tests/unit/product-images.test.ts
```

Expected: 188 fetched with content-type `image/jpeg` and a plausible byte length; any quarantine listed by
product id rather than silently dropped; the provenance-chain test green with every id equal. **Measure the
real dimension distribution here and write it back into `research.md` D8** — the spec's "141 square, 45
portrait, ≤900px" describes remote files nobody had downloaded.

Also expected, and it is the point: `resolveProductImage` can no longer fall back to the template pool
without failing a test. If it still can, §2 has not run.

## §3 — The 24-sample isolation measurement (FR-034)

Select the stratified sample named in `research.md` D4 — the fine-detail classes (cables, straps, earbuds,
SIM cards), translucent and reflective finishes, the two smallest sources, portrait files, the imageless
record — and isolate exactly those 24 with the deterministic matte. Review each against its source.

Report the count that could not be cleanly isolated. Then branch:

- **under ~10%** → catalog-wide, with framed fallback for the remainder
- **10–35%** → catalog-wide with the framed form as co-primary; §1's P3 review matters more, because two
  visual states now share the page
- **over ~35%** → stop. This is a listing-quality feature, not a floating-product one, and the spec should be
  re-scoped rather than pushed through

Do not proceed to §4 without this number written down. It is the measurement the spec asked for before the
treatment was relied on.

## §4 — The seam and the checkerboard

Show one product on three surfaces of different tone, including feature 002's darkest scroll position.
Then render a row of twenty real products and look at it as a whole rather than as twenty tiles.

Expected: D1 (no accidental seam on any product), D2 (no row mixing isolated and framed with mismatched
baselines), D5 (a square and a portrait file read as siblings). D3 requires 002's ground to be sampled at
intermediate positions — note 002's Question 1 is reopened as of 2026-09-22, so this runs against whatever the
ground currently does, and re-runs after 002 settles.

The independent test the spec sets is the right one: repeat on the smallest and the portrait files, "which is
where any rule will actually break."

## §5 — Sharpness caps

Open the product page at 1280px for the two smallest sources and for a 900px one. Measure rendered width
against the manifest's recorded source width.

Expected: S2 — no product exceeds its own pixels. The tempting failure is a grid that looks better with bigger
objects; FR-018 settles that in favour of sharpness, and isolation buying apparent scale "MUST NOT be used as
a reason to exceed what the pixels support".

## §6 — Motion, purpose, and calm after two minutes

Watch a surface for thirty seconds doing nothing. Interact normally. Then browse treated surfaces for two
minutes and answer whether the page still reads as calm.

Expected: M1–M8, and SC-007 (a reviewer can state what each movement communicated), SC-009 (8 of 10 still say
calm after two minutes). Verify with `prefers-reduced-motion` on, and compare the reduced-motion behaviour
against 004's brand rows and 005's carousel side by side — one rule across three surfaces is FR-038, and it is
the coherence clause most likely to drift. Measure frame cost on a **production build** (`npm run build &&
npx next start`) under CPU throttling; dev-mode numbers are not comparable, and 004 measured a 50 ms versus
33 ms difference that vanished entirely in production.

## §7 — Weight and responsiveness

Same route, same device profile, before and after the derivatives ship.

Expected: S3 and S4 — a listing becomes usable no slower than today, and every product that could not be
isolated remains presentable, browsable, and counted.

## §8 — Judgement gates that cannot be automated

SC-001, SC-002, SC-005, SC-011, SC-012, SC-013, SC-015 all require people. **SC-012 is 188 individual image
comparisons against their sources** and FR-030 explicitly forbids batch approval.

Say what is true rather than filling it in: feature 004's ten-person reception gate (T049) was dropped on
2026-09-22 because the panel could not be assembled, and its owner's own read on the finished brands surface
was that it is "somehow simple, boring, not styled and mis-placed in desktop". There is no evidence a
188-review panel is available. If it is not, the honest outcomes are either the merchant reviewing their own
products — the most plausible route, since these are their photographs — or SC-012 and SC-013 staying visibly
unmeasured. Do not mark them passed.

## Definition of done for this feature

Typecheck and `npm run build` clean; §0 and §2 green with no product rendering a stand-in photograph; §3's
number written down and the branch taken from it stated; §1, §4–§7 verified in a real browser at 360px and
1280px with client chunks confirmed loading; §8 either measured or explicitly unmeasured.

And the Constitution IV clause that outranks the checklist: a page where every product is honest, correctly
sized and still looks like a catalogue of rectangles has not delivered this feature. Equally, a page where
products float beautifully and none of them are the products for sale has failed it — which is where the
storefront stands today.
