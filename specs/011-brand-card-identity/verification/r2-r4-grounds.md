# T011 — the six grounds, computed (R2/R4 record)

Palette render: `palette@360.png` (six plates, text visible) · per-plate files `palette-card-0..5.png`.
All values read from the live page's `--card-ground` / `--card-accent` (recognition-test.mjs output,
20:4x run) — the stylesheet paints ground+0.011 / ground−0.046 in `L`, the current deck range.

| # | Maker (key behind `--key`) | Ground `oklch(L C H)` | Placement | Top stop L | Bottom stop L | Cream ratio* | Champagne ratio* |
|---|---|---|---|---|---|---|---|
| A | APPLE | `0.205 0.000 0` | accent (monochrome) | 0.216 | 0.159 | 15.26 | 12.21 |
| B | SAMSUNG | `0.200 0.012 266` | accent over near-neutral | 0.211 | 0.154 | 15.42 | 12.34 |
| C | XIAOMI | `0.215 0.050 52` | ground | 0.226 | 0.169 | 15.02 | 12.02 |
| D | NOKIA | `0.205 0.045 266` | ground | 0.216 | 0.159 | 15.30 | 12.24 |
| E | REALME | `0.215 0.048 95` | ground | 0.226 | 0.169 | 14.89 | 11.91 |
| F | TCH | `0.179 0.036 2` | house (shop burgundy) | 0.190 | 0.133 | 16.12 | 12.90 |

\* Ratios are the WCAG figures computed against the **base ground** — the darkest stop is only
darker, so every stop and every point of the gradient sits above the figure shown. Floor is 4.5:1
(data-model rule 4; `tests/unit/brand-identity.test.ts` proves all twelve pairs ≥ 4.5 — it passed at
20/20, the minimum being REALME at 14.89). T024 re-measures in the browser six ways and must agree.

## Δ between the pairs that must not collide

- **Apple (neutral) vs TCH (house)** — rule 7 / D4: Oklab distance **0.045** (ΔL 0.026, |Δa| 0.036,
  Δb ≈ 0.001) against a test floor of 0.02. Apple is achromatic grey, TCH is the shop's warm
  burgundy: measurably different, and Apple's is "cooler" exactly as D4 predicts.
- **Samsung vs Nokia** — rule 6 / D3: hue difference **0°** (both 266° — the same documented family,
  no invented teal). They are separated by **placement**: Samsung's ground holds only C 0.012
  (near-neutral) with the blue in the accent/rule; Nokia's ground carries C 0.045. ΔL 0.005, so the
  separation is the chroma of the ground, which is what the placement table in data-model.md is for.
- Spread of L across all six: 0.215 − 0.179 = **0.036 ≤ 0.09** (R2's family arithmetic — see the
  T021 test), max ground C = 0.050 ≤ 0.055 ceiling.

## T012 (R3) — the four forbidden colour claims, grepped

- `#1428A0` (Samsung): **absent from every value, token and rendered string.** It occurs twice in the
  tree, both times inside `lib/brand-identity.ts` comments that name it *in order to refuse it*
  ("aggregator-only… deliberately absent", the D2 rationale). The record cites the aggregator URL as
  `hueSource` with `kind: "aggregator"` and carries no hex.
- `#005AFF` (Nokia): same — one comment recording the refusal; no value anywhere.
- any hex for REALME / TCH: none — those records have `kind: "none"` and the value is ours in OKLCH.
- the words "official"/"registered" beside a maker name: absent (asserted by the T008 test, R3 verbatim).

```bash
grep -nE "1428A0|005AFF" lib/brand-identity.ts lib/content/home.ts components/home/BrandRows.tsx app/\(main\)/home.css
# two hits, both refusal comments in lib/brand-identity.ts (lines 16, 122) — quoted in the file
# itself as the evidence that they are never used as values. Zero hits in any .tsx, any CSS, any string.
grep -nE "oklch\(|#[0-9a-fA-F]{3,8}" components/home/BrandRows.tsx
# (no output — the component carries no colour literal; the envelope is not bypassable here)
```

**Verdict R3:** every hue family traces to a source recorded in `lib/brand-identity.ts` with a check
date (2026-09-26), the one `observed` kind being Xiaomi's orange on its own markup, and no value on
any card is presented as a maker's. PASS.

## T013 (R4) — the hueless pair

- APPLE renders achromatic: `--card-ground: oklch(0.205 0.000 0)` — **C = 0** in the shipped record —
  and its accent is a cool silver (`oklch(0.78 0.110 255)`), the monochrome register D1 retained for
  exactly this card. Nothing about an Apple colour is asserted anywhere: the record's `hueSource.kind`
  is `none` with Apple's own site as the checked URL.
- TCH renders the shop's house burgundy (`oklch(0.179 0.036 2)` = the deck's existing `#1e0a10`,
  converted, visually unchanged) with `placement: house` — the card makes no maker claim because
  nothing was sourced; it is unrepresented *on purpose*, which `hueSource.kind: "none"` records.
- Distinguishable without the name: plates A and F in `palette@360.png` are grey-vs-burgundy — the
  Oklab distance 0.045 above is the measurable version of that, and the person check rides on T015.

**Verdict R4:** PASS as instrumented; the human half is counted in `r1-recognition.md`.
