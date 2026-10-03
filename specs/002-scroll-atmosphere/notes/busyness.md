# T017 — FR-005 busyness gate: **FAIL → waived by the owner, 2026-09-22**

> **Decision recorded.** The owner re-confirmed Resolved Q2 = C: the existing glow field stays exactly as
> it is and the ground progression ships on top of it. FR-005's "must read as calmer than the existing
> decorative glow field" clause is therefore **waived, not met** — see the Amendment Record in `spec.md`.
> Options B and A were declined rather than dismissed; B remains the only option with measured evidence
> that the page gets quieter.
>
> **Every number below stands unchanged.** The gate did not pass and is not restated as having passed.
> This note is the evidence behind a decision, not a record of a defect resolved.

Measured at 360px (`WIDTH=360`), 21 positions across the whole document, ~1130 bare-ground pixels
per position, `specs/002-scroll-atmosphere/tools/ground-sweep.mjs`, output in
`notes/ground-sweep.json`.

FR-005: *"The progression MUST NOT increase the perceived busyness of the page. The result MUST read as
calmer than the existing decorative glow field it follows."* It does not.

## What passes

The mechanism is sound and independent of this gate:

- Declared tone is monotonic — `#2a0409 → #0d0205`, 1 of 20 steps rises (SC-002, FR-004, contract P3).
- Largest seam is 0.00098 luminance against a mean of 0.00024 (4.01×). A single section boundary, not a band.
- The layer is inert, `aria-hidden`, `pointer-events: none`, and removing it leaves a complete page (G1).

## What fails, and why

Left/right asymmetry — mean |left-median − right-median| lightness over the bare pixels, 0–255 scale —
is the measurable face of the alternation FR-005 is about. `app/globals.css:193-214` alternates the
per-section glow to a different side every section.

| pass | asymmetry | range across sweep | direction reversals |
|---|---|---|---|
| existing field, no layer | 7.05 | 10.33 | 7 |
| layer at α = 0.2 | 7.15 | 9.67 | 9 |
| layer at α = 0.5 (draft value) | 6.90 | 9.67 | 9 |
| layer at α = 0.85 | 7.38 | **14.00** | 7 |
| **glows off**, no layer | **0.85** | 9.00 | 7 |
| **glows off**, layer α = 0.5 | **0.49** | **7.67** | 7 |

Two findings, both decisive:

**1. The variation is above the layer, so the layer cannot subdue it.** Switching the section glows off
collapses asymmetry from 7.05 to 0.85 — 88% of the alternation is those pseudo-elements. They live on
`main > section::before/::after`, and `main` is `relative z-10` (`app/(main)/layout.tsx`) while
`.hami-page-ground` is `z-index: 0`. The glows composite on top of the new ground. An opaque tint
*beneath* a varying layer shifts the base that variation sits on; it cannot reduce the variation. Across
α = 0.2 → 0.85 the asymmetry moves within ±3.5% of the no-layer value, and at α = 0.85 both asymmetry
(7.38) and range (14.00) get **worse** than no layer at all.

This contradicts the reasoning I had written into `page-ground.css` — that a uniform alpha "cuts the
amplitude of the left-right-left alternation while leaving their presence intact". Measured, it does not.
That comment has been corrected.

**2. No opacity would have worked, position aside.** A blend over a varying field scales each step by
(1−α) and preserves every step's sign, so the *number* of reversals is invariant under it. The only way
an overlay reduces direction changes is by contributing a monotone drift large enough to swamp the
field's oscillation — which is Q2 = A (replace the field), not Q2 = C (keep it).

So FR-005 is not reachable by an additive layer that leaves the existing field intact. This is a
structural result, not a tuning result: there is no α, no stage count and no tone table that fixes it.

## Escalation — back to Q2 with the evidence

tasks.md T017 and plan.md's Complexity Tracking both say a failed gate escalates to the owner rather
than lowering FR-005. Q2 is offered again:

- **B — reduce the existing field to a quiet base, then let the progression carry the change.** The two
  `glows off` rows above are a measurement of this world: asymmetry 7.05 → 0.49 (14× quieter) and range
  10.33 → 7.67 (26% down) with the layer on at the draft alpha. This is the only option with measured
  evidence that the page gets calmer. Cost: it edits `app/globals.css:182-224`, which Q2 = C ruled out.
- **A — replace the field with the progression.** Highest ceiling on calm; largest blast radius, and it
  deletes decoration the owner has not asked to delete.
- **C — the current spec, as chosen.** Delivers direction (the descent is real and seam-free) and
  demonstrably does not deliver "calmer than before". Ships a feature whose own quality gate fails.

Recommendation: **B.** The mechanism built in Phase 2/US1 (`--hami-ground`, `PageGround`,
`progression.ts`, the sweep tool) carries over unchanged — B only adds a reduction of the existing glow
alpha to the same file set.
