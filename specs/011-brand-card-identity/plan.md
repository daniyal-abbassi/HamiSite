# Implementation Plan: Brand Card Identity

**Branch**: `011-brand-card-identity` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-brand-card-identity/spec.md`

## Summary

Give each of the six brand cards in the 008 deck a distinct identity — a colour and one honest line — without the
deck turning into a logo wall and without stating anything untrue about a maker.

**The controlling rule is one envelope, six hues.** Every card keeps the shop's existing lightness and a fixed,
low chroma; only the hue changes, and each hue comes from the family that maker is publicly associated with. The
exact colour values are Hami's, not the makers'. That single rule answers four problems at once: the six cards stay
one family (FR-012), no card can become a bright flat fill (FR-011), the text contrast is identical on all six
because the lightness never moves (FR-013), and a seventh maker needs only a hue number (FR-017).

**This plan is written around a finding that invalidated part of the spec.** The research pass
(`research/brand-identity-sources.md`) established that **not one of the six makers has a colour value citable from
a primary source** — every Samsung/realme/Nokia/TCL hex in circulation comes from third-party aggregators. Only
Xiaomi's orange appeared in the markup of the brand's own site. So FR-002 was rewritten during specification:
**hue family from the brand, exact value ours.** That is more honest than printing an aggregator's hex as an
official colour, and it happens to be what makes the palette harmonise, since a hue we choose can sit with
burgundy and champagne in a way a corporate colour cannot.

**Two things the research found matter more than the colour work**, and both are now requirements:
**Nokia does not manufacture phones** (a licensed partner is the exclusive maker), and **realme is not an
independent company** (an Oppo sub-brand again since January 2026). Both read like safe common sense, which is
exactly why they end up on commercial pages. FR-020 forbids them and a test enforces it with a phrase blocklist.

**No new dependency. No generated maker imagery.** `oklch()` colour is native CSS.

## Technical Context

**Language/Version**: TypeScript 5.x on Node 24 (Next.js 15.5 App Router, React 19.2)

**Primary Dependencies**: none added. Tailwind 3.4 plus the hand-written block in `app/(main)/home.css`;
`oklch()` for the derived palette; the existing `lib/content/home.ts` brand table.

**Storage**: `data/hami-products.json` through `lib/catalog.ts` (Constitution III). Nothing here is catalogue
data: identity is authored presentation data, in the same category as the `badge` and `image` fields already on
the brand and department tables.

**Testing**: Vitest, **node environment, no DOM** — `npm run test:unit`. This feature is unusually well suited to
it: the palette is arithmetic, so **garishness and contrast are both computable without a browser**. A ~30-line
OKLCH→sRGB→relative-luminance path in the test file asserts every card's text contrast and every card's chroma
ceiling. Geometry and the recognition test need a browser.

**Target platform**: 360 px first — the deck is a phone-first component and 008's fit budget is defined at
360 × 640. Desktop is the enhancement.

**Project Type**: Single Next.js app, frontend-only, one section.

**Performance goals**: none new. The treatment is static colour and text; no image, no script, no animation is
added. 008's measured chapter length (3.06 screens) must not grow.

**Constraints**: FR-014 is the hard one — **008's mechanism and its passing acceptance measurement must survive
unchanged**. `measure-deck.mjs` is the referee and must be re-run after this feature, with no clause newly
failing (SC-005).

**Scale/Scope**: Six cards. One new pure module, one new test file, one stylesheet block edited, one content
table replaced. **Zero components added, zero files deleted.**

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | How |
|---|---|---|
| **I. Honest Interface** | ✅ PASS — **and this feature is mostly this principle** | Six one-line characterisations, each with a recorded public source and check date (FR-007, SC-003). Two documented slogans appear only as the makers' own words, attributed (FR-008). Two widely-repeated slogans that research could **not** verify — Apple's "Think different", Nokia's "Connecting People" — are on a test-enforced blocklist. Three known-false framings (Nokia as a phone factory, realme as independent, TCH as a phone maker by heritage) are forbidden by FR-020 and asserted by a phrase guard. Where research found nothing (TCH's colour), the card shows **less** rather than guessing (FR-018). |
| **II. Persian RTL by Default** | ✅ PASS | Lines are live Persian text, not artwork; no `letter-spacing`; Persian numerals wherever a number appears. The Latin wordmark stays isolated with `dir="ltr"` exactly as 008 left it. |
| **III. Static Data Seam** | ✅ PASS | No catalogue or database touch. Identity data is authored in a pure module, guarded by tests the same way 010's rhythm table is. |
| **IV. Luxury is the quality bar** | ✅ PASS | The single-envelope rule *is* the quality mechanism: one lightness, one low chroma, hue only. Restraint is structural rather than a taste decision someone has to defend, and the chroma ceiling is a number a test enforces. |
| Constraint: prefer editing over new abstraction | ✅ PASS | No new component, no new layer beyond one data module. `BrandRows.tsx` and the existing deck CSS block are edited. |
| Constraint: no new dependency | ✅ PASS | `oklch()` is native. |
| Definition of Done | ✅ PASS | No lock contention: 008's files are held by the same lane that will do this work, and qoder is already inside them. |

**Gate result: no violations, and no conditional.** The one real risk is not governance — it is SC-001, the
recognition test, which can genuinely fail. That is handled as a measurement, not as a hope (see D3).

### Post-design re-check

Still clean, with one thing worth naming: **the palette rule was chosen before the colours were picked, and that
order is the point.** Picking six colours and then arguing about whether they clash is how a deck like this goes
wrong. Fixing lightness and chroma first means any hue that satisfies the envelope is automatically in family, so
the argument is about hue identity (a research question) and never about taste.

## Project Structure

### Documentation (this feature)

```text
specs/011-brand-card-identity/
├── plan.md                          # this file
├── spec.md                          # FR-001…FR-021, SC-001…SC-009 (amended after research)
├── research/brand-identity-sources.md   # the sourced fact table — the feature's evidence base
├── notes/jev-advisory.md            # four closed questions, one near-tie, one contradiction recorded
├── research.md                      # Phase 0 — D1…D7 design decisions
├── data-model.md                    # Phase 1 — the brand identity record and its validation rules
├── quickstart.md                    # Phase 1 — how to run it and how to run the recognition test
├── checklists/requirements.md       # spec-quality gate (16/16 passed)
└── contracts/
    └── brand-identity.md            # Phase 1 — R1…R8, the acceptance contract

specs/008-brands-stacking-cards/     # the deck this must not break; its gate is re-run, not edited
```

### Source code (repository root)

```text
lib/
└── brand-identity.ts                # NEW (pure): the six identity records — hue family, our hue value,
                                     #   the line, source URL + date, ours-vs-slogan flag, forbidden framings —
                                     #   plus the palette envelope (lightness, chroma ceiling) and the
                                     #   derivation function the CSS variables come from

components/home/
├── BrandRows.tsx                    # EDIT: emit each card's derived custom properties and the line
└── BrandShowcase.tsx                # unchanged unless the section needs the new ground

app/(main)/
└── home.css                         # EDIT inside 008's .brand-deck block only:
                                     #   per-card custom properties, tinted ground, accent, contrast

lib/content/
└── home.ts                          # EDIT: `brandStories` (3 invented entries) is replaced by the sourced
                                     #   table in lib/brand-identity.ts; the old copy does not survive

tests/unit/
└── brand-identity.test.ts           # NEW: the sourced-claims guard, the palette envelope, the computed
                                     #   contrast per card, the slogan and framing blocklists

specs/011-brand-card-identity/verification/
├── recognition-test.mjs             # NEW: SC-001 — six swatches, names hidden, count what a person gets
└── palette@360.png                  # the six cards, one screenshot each, at the phone width
```

**Structure decision**: one pure module again, for the same reason 010 used one and Jev scored that pattern 0.99
— the claims worth defending here are *data with sources* and *arithmetic*, and the node-only harness can assert
both only if they live outside a component.

## The design, in the four decisions that matter

**D1 — One envelope, six hues.** All six cards share the deck's existing lightness and a fixed low chroma; only
the OKLCH hue changes. The hue comes from the maker's documented family; the value is ours. This is what makes
"tinted card" and "not garish" compatible — the objection to full tint is saturation and brightness, not hue, and
both are pinned.

**D2 — The two no-hue makers are distinguished by *why* they have no hue.** Apple gets an achromatic
aluminium-grey register because monochrome is its documented identity. TCH gets the **house** treatment — wine
and champagne, no maker claim at all — because nothing was sourced for it. Those two look different from each
other, and the difference means something rather than decorating.

**D3 — The owner's literal ask and Jev's objection are settled by a measurement, not by taste.** The owner asked
for recognition by colour; Jev scored full tint 0.01 and accent-only 0.83. Rather than pick, the plan builds the
strongest treatment the envelope allows and runs SC-001 — names hidden, count what a person identifies. If four
of six is not reached, the treatment gets bolder one measured step at a time, with a screenshot per step.

**D4 — Contrast stops being six problems.** Because lightness never varies, the cream and champagne text tokens
have the same ratio against all six grounds. One computed check in the test file covers every card, and the
browser confirms it six times rather than discovering it six times.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. Two deferred items recorded so they are not mistaken for oversights:

| Item | Status | Why deferred |
|---|---|---|
| Apple's logo usage terms | **Deferred, flagged** | Research hit a 404 on the usage rules and could not read them. The card uses the wordmark already on disk and adds no logo; if a designer later wants the mark itself, that is a legal question this feature does not answer. |
| A primary brand-guideline document for Samsung, realme, Nokia, TCL | **Out of scope** | The researcher was bot-blocked on every search engine and had direct fetches plus an encyclopaedia only. A later pass with working search could upgrade a hue family's evidence. It would not change the rule that the value stays ours, so nothing here waits on it. |
