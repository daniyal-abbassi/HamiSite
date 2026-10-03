# Data Model: Scroll-Driven Atmosphere

Phase 1 output. This feature introduces no persistence and no schema. It defines one **view model** — the
tonal progression — as a pure, enumerable structure so that the two requirements that cannot be checked
by eye (contrast at every intermediate point, and a correct tone at an arbitrary entry position) become
functions that a unit test can call.

All of it is derived at read time from the rendered page. Nothing here is stored, and nothing touches the
static data seam (Constitution III is not engaged).

## Entities

### AtmosphereStage — one settled tonal state

| Attribute | Type | Rule | Source |
|---|---|---|---|
| `key` | string | unique within the progression | design |
| `anchorSectionId` | string | MUST name a section that exists in the current homepage order | `app/(main)/page.tsx` |
| `tone` | colour value | MUST sit inside the bounded lightness range (see LegibilityBand) | design |
| `order` | integer | ascending, defines the single deliberate sequence FR-003 asks for | derived from section order |

**Not modelled:** a stage's colour is not a fixed value in this document. FR-027 reserves stage count,
colours, positions, durations and curves to the design phase; the model fixes the *shape*, not the
values.

### TonalProgression — the ordered sequence

| Attribute | Type | Rule |
|---|---|---|
| `stages` | AtmosphereStage[] | ≥ 2. FR-001: a shopper scrolling top to bottom MUST pass through more than one tonal state, so a one-stage progression is invalid by definition |
| `initial` | tone | MUST be exactly the tone at scroll position 0, and MUST be re-reached at position 0 (FR-007) |
| `terminal` | tone | MUST resolve into the footer without an abrupt change at the seam (FR-008) |
| `monotonicDirection` | axis | the progression has one clear overall direction (FR-003); it is not a sequence of unrelated colours |

### ScrollPosition — where the shopper is

| Attribute | Type | Rule |
|---|---|---|
| `progress` | number 0…1 | normalized document scroll; the ONLY value handed to CSS, one write per animation frame |
| `anchors` | number[] | resolved from live layout, recomputed on resize and orientation change, never remembered as pixels |
| `visible` | boolean | the document is the foreground tab; when false nothing runs (FR-025) |

**Derivation, and why it is a rule:** `toneAt(progress)` is a pure function of `progress` and the
progression. Because nothing is accumulated across frames, entering mid-document, after reload, after
back/forward, or after an end-key jump is correct on the first frame with no catch-up animation — that is
SC-009 and the extreme-velocity edge case, both satisfied by the absence of state rather than by
handling it.

### LegibilityBand — the constraint that makes SC-004 checkable

| Attribute | Type | Rule |
|---|---|---|
| `minL` / `maxL` | relative luminance | the band every intermediate tone must stay inside |
| `worstCaseRatio(foreground)` | number | MUST be ≥ the threshold for every meaningful foreground colour used on the page, computed over the band, not over the endpoints |
| `sampledTexts` | set | the representative nodes the browser sweep measures: product name, price, availability label, section heading, body copy, header label |

This is the entity that exists because the failure mode is invisible. A progression can pass at every
stage and fail between two of them, and only while moving.

### FallbackGround — the deliberate tone used when the effect cannot run

| Attribute | Type | Rule |
|---|---|---|
| `tone` | colour value | MUST be an intentional chosen value, never an unstyled default (FR-024) |
| `when` | condition | reduced-motion preference, a device that cannot sustain the effect, forced-colors, or print |
| `content` | — | MUST be identical to the animated page: same sections, products, prices, links, reading order (FR-021, SC-008) |

### MotionPreference — not a flag on the ground, a different expression of it

```
prefers-reduced-motion: no-preference ──▶ continuous: tone interpolates with progress
prefers-reduced-motion: reduce          ──▶ discrete:   one settled tone per region, no travel
forced-colors / print                    ──▶ inert:      FallbackGround, layer not painted
```

Both branches expose the same stage set. The reduced-motion branch is not a degraded page; FR-020 and
FR-021 together require distinct settled tones per region with identical content, which is why the
progression is modelled as stages first and interpolation second.

## State transitions

The ground holds no state machine — deliberately. The only transitions are:

```
(unmounted) ──layout mount──▶ correct-for-position, no animation
progress changes ──▶ tone recomputed from progress alone
document hidden ──▶ no work; on return, recomputed, never caught up
resize / orientation ──▶ anchors recomputed; tone recomputed
```

There is no "settling", no target and no current value, so there is nothing that can drift. SC-010
(fifteen minutes of continuous scrolling with no drift in the tone-to-position correspondence) is
satisfied structurally: the correspondence is a function, and functions do not drift.

## Validation rules

| Rule | Enforcement |
|---|---|
| Every stage anchors to a section that exists | unit-testable over the progression table |
| At least two stages | unit-testable |
| Every tone, including every interpolation between two adjacent tones, stays inside LegibilityBand | unit-testable over the band; **confirmed** by the browser contrast sweep (SC-004) |
| `toneAt(0)` equals the initial tone, and `toneAt(1)` resolves into the footer | unit-testable |
| Progression is monotonic along its declared axis | unit-testable — this is the guard that catches someone editing one stage value and quietly breaking contrast |
| Reduced-motion mapping yields the same stage set | unit-testable |
| No meaningful information is carried by the ground alone | review gate; contract clause G1 |
| The shopper's own scroll is never intercepted | browser-verified: keyboard, wheel and touch all move the document natively |

## Explicitly out of this model

Section content, section order, section design, product data, and every other page. The feature is the
homepage ground and its scroll feel only; extension elsewhere is a separate decision once the
progression is proven (spec, Out of Scope).
