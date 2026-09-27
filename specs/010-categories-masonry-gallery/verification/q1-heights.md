# Q1 — the columns stagger, and the arrangement is not a matrix

**Contract**: [../contracts/category-masonry.md](../contracts/category-masonry.md) Q1 · **Task**: T014
**Run**: 2026-09-26 17:40 · chromium headless via `tools/shots/viewport.mjs`, dev server on `:3000`

## Measured tile heights

| Width | Distinct heights | Authored (`tileHeightPx`) | Match |
|---|---|---|---|
| 360 | 148, 208, 268 | S 148 · M 208 · L 268 | ✅ exact |
| 768 | 224, 320, 392 | S 224 · M 320 · L 392 | ✅ exact |
| 1280 | 288, 400, 512 | S 288 · M 400 · L 512 | ✅ exact |

Three distinct values at every width, tallest ÷ shortest ≈ 1.81 / 1.75 / 1.78. No width collapses into equal
cells (FR-002).

## Column bottoms — and the defect this clause caught

| Width | Columns | Measured bottoms | Ratio | First build |
|---|---|---|---|---|
| 360 | 2 | 928, 1028 | **1.108** | 928, 1028 — same |
| 768 | 3 | 968, 968, 968 | **1.000** | 1208, 960, 800 → **1.51** |
| 1280 | 4 | 932, 932, 904, 932 | **1.031** | 1128, 1044, 1108, 708 → **1.59** |

**Q1 failed on the first build and it was not visible in the numbers the plan predicted.** The rhythm the plan
drafted — `[L, M, S]` cycled with the start shifted one place per breakpoint — satisfies every rule written down:
Latin square ✓, three of each tier per breakpoint ✓, `service` not permanently largest ✓, heights exactly as
authored ✓. And it left one column **420 px short** at 1280, because nine tiles do not divide into four columns
and CSS's auto-placement is greedy. The ragged bottom is the edge case `spec.md` names — "how masonry reads as
unfinished rather than editorial" — and it is plainly visible in the first `masonry@1280.png`.

The fix is not a CSS change. It is a different **tier assignment**, found by simulating the browser's placement
algorithm and searching the Latin-square assignments for the one that packs most evenly. The current table packs
to 1.108 / 1.000 / 1.031.

**The simulation is not trusted, it is cross-checked.** `columnBottomRows()` in
`tests/unit/category-masonry.test.ts` predicts 928/1028, 968×3 and 932/932/904/932; the browser above produced
those same numbers at all three widths, to the pixel. That agreement is what makes the unit guard worth having —
without it the guard would be a model of nothing.

## Two corrections the measurement forced, both recorded where they were wrong

1. **Content width is not what `tailwind.config.ts` says.** The config sets `container.padding: "1.5rem"`, and
   `app/globals.css:224-226` overrides it with a fluid `padding-inline`. Measured padding is **20 px at 360,
   ~31 px at 768, 48 px at 1280**, so the columns are **154 / 225 / 281 px**, not the 150/229/293 the config
   implies. `CONTENT_WIDTH` in `lib/category-masonry.ts` now carries the measured values and `sizes` is expressed
   in vw, because a fixed px hint is wrong at every width except the one it was measured at.
   This error was inherited: it is the same arithmetic that produced 009's "smallest tile ≥164 px at 360", which
   009's plan then "corrected" to 148 px using the same wrong padding. The correction was in the right direction
   and still off — the real floor at 360 is 154 px.
2. **The first version of the CSS used one `data-tier` attribute re-scaled by each media query.** Every span
   number was right and the design was still broken: it would have pinned each department to its mobile tier
   forever, which is exactly the permanently-largest-tile shape FR-013a exists to prevent. The guard now asserts
   the *attribute-qualified* selector (`[data-tier-md="L"] { grid-row: span 17 }`), so the defect cannot return.

## Screenshots

`masonry@360.png` · `masonry@768.png` · `masonry@1280.png` — viewport captures scrolled to the chapter.

## Not claimed

Whether the stagger reads as *editorial* rather than merely uneven is SC-008, and it belongs to the owner on
their own phone. Every number above can be green while that answer is no.
