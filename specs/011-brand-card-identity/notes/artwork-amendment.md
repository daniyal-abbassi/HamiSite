# Artwork amendment — the owner overwrote FR-016

**2026-09-27 01:47 +0330.** Six generated brand-card artworks were placed in `public/images/brands/` and the
feature's no-imagery rule was ordered overwritten. This file is the record of who decided what, because FR-016
was written as a refusal, it was refused on the project's own reasoning, and an agent then shipping pictures
would look like it had broken the bar to make its own work easier.

## What arrived

Six PNGs, all 1942×809, RGBA with a transparent margin around a rounded card. One composition for all six:
product render on the leading side, maker's wordmark on the trailing side, a planet-limb glow tinted per brand.

| File | Brand | Artwork hue | Sourced ground in `lib/brand-identity.ts` |
|---|---|---|---|
| `appleC.png` | APPLE | red / orange | none — monochrome is the documented register |
| `samsungC.png` | SAMSUNG | blue | blue, accent-placed |
| `xiaomiC.png` | XIAOMI | orange | orange, ground-placed |
| `nokiaC.png` | NOKIA | blue | blue, ground-placed |
| `RealmeC.png` | REALME | amber | yellow |
| `tchC.png` | TCH | **green** | none — house burgundy, nothing was sourceable |

Total weight as shipped: **9.07 MB** for images that render about 330 px wide on a phone.

## The four decisions, in the owner's words

Asked as four plain-language questions about the rule, the hues, the duplicated logo and the asset sizes:

1. *"overwrite the rules"* — FR-016 is amended, not worked around.
2. *"thats TCH and not TCL!!! tch and apple are approved!"* — the green card is correct and stays; and the
   answer doubles as a correction to the identity table, which had researched the wrong company. See the TCH
   note in `spec.md`'s assumptions.
3. *"drop the live one"* — the live SVG wordmark comes off the card, so the maker's name is drawn once.
4. *"go with current sizes — we will fix it later if it was bad"* — no cropping, no re-encoding of the sources.
   The `next/image` optimizer still compresses what it serves; that is not an edit to the files.

And on whether to finish 011's colour verification first: *"cut-short"*. The recognition test (T015) and the
family/contrast passes that depend on it are abandoned, not deferred — with the artwork on the card the ground
hue is no longer what identifies a maker, so R1 has nothing left to measure.

## What this costs, stated plainly

- **The hue system stops being the identity.** Six cards were tuned inside a documented OKLCH envelope — lightness
  band, chroma ceiling, placement — to make each maker recognisable by colour alone. A photographic render of the
  maker's own phone does that job better, so the envelope is now decoration behind the artwork. The envelope
  assertions stay in the test suite: they still bind any colour the page states in words.
- **Trademark exposure moved from theoretical to real.** The original clause refused generated maker imagery
  because it "would either reproduce a brand's protected look or depict products as merchandise". All six do both:
  these are photoreal iPhone, Galaxy, Nokia 105, realme, TCL-styled and Xiaomi renders carrying the registered
  logos. That is the owner's call to make on their shop, and they made it. It is recorded here so nobody later
  reads the card as an approved-asset program. Apple's logo usage terms were never read — T033 already says so,
  and nothing in this amendment changes that.
- **TCL's green is not evidence.** `hueFamily: "none"` stays on the TCH record. The card's ground remains the
  shop's burgundy; the artwork's green is art direction. No text on the page may claim a colour for TCH.
- **The name is no longer live text in Latin script.** The Persian name, the description line and the count all
  stay text — FR-015 was not amended. The wordmark exists only inside a raster image now, so it is not selectable
  and not readable by a screen reader. The card's accessible name comes from its `aria-label`
  («خرید محصولات …»), which is unchanged, so nothing is lost to assistive tech; what is lost is copyability.
- **9 MB of source PNG is in `public/`, served verbatim to anyone who asks for it by path.** The deck does not
  reference them at full size, but they are on the origin. Deferred by decision 4.

## What was NOT changed

The six makers, their order, their Persian labels, their destinations, the purchasable counts, the sticky
mechanism, the fit budget and the 008 acceptance gate. `measure-deck.mjs` is re-run after this lands and its
numbers compared clause by clause against `specs/011-brand-card-identity/verification/baseline-008-gate.md`;
the instrument itself is not edited.

## The 008 fit gate after the artwork — measured, not asserted

`BASE_URL=http://127.0.0.1:3015 node specs/008-brands-stacking-cards/verification/measure-deck.mjs`, run at
360 × 640 against a private dev server. The instrument was not edited; the markup hook moved instead (see the
`data-deck-mark` comment in `components/home/BrandRows.tsx`).

| Clause | Baseline (T002) | With artwork | |
|---|---|---|---|
| C1 six tops, source order | PASS | PASS — 0,1,2,3,4,5 | unchanged |
| C2 no clipped mark or label | PASS — 0 of 25 | **FAIL — 1 of 26** | see below |
| FR-008 chapter length | 1959 px = 3.06 screens | 2390 px = 3.73 screens | ceiling 6.5, still inside |
| D2 height vs budget | tallest 180 px | tallest 278 px | ceiling 460, still inside |
| C8 reduced-motion static stack | PASS | PASS — six cards, no sticky | unchanged |
| C9 three arrivals | PASS | PASS | unchanged |

**C2 is the one red clause and it is not noise.** The failing sample is the last card mid-exit at scrollY 6284:
its artwork band sits at −12..94 while its Persian name sits at 102..135. The harness counts a card as holding
the top while `bottom > 0`, so a card two-thirds off the screen is still measured — and a 278 px card spends far
longer in that state than the 180 px card it replaced. The baseline's zero-of-twenty-five was one sample-grid
away from catching the same thing with a 40 px mark plate; the artwork made the head 106 px tall and the sample
grid landed on it.

So the clause is doing its job on a real, brief crop of the wordmark the artwork carries. It is also a clause
written when the protected head was 40 px. **Re-scoping it is a requirement change, not an implementation
detail**, and FR-014's own answer to a deck that fails to fit is the static stack — which would delete the
mechanism 008 was built for to satisfy a measurement of the head's height. Left red and handed up.

**Desktop needed its own fix, found by measuring rather than by eye.** `cardFitBudget` is called with
`viewportHeight: 640` at every width, so the 460 px ceiling is a phone number that also binds the 1280 card. At
1174 px wide the artwork's own ratio asks for 489 px, and all six desktop cards were measured pinned at exactly
460 with the band taller than the card holding it. `max-block-size: 300px` with `object-fit: contain` puts them
at 427–452 and letterboxes the art instead of cropping the drawn frame.
