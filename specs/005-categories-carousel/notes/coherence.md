# T037 / T038 — FR-038 coherence with feature 004, and what it binds

FR-038 is reciprocal with `004/FR-032`: the categories carousel and the brand rows may stay two different
widgets — a bending arc and a stacked list — provided they share five behaviours. They are checked here
against what 004 actually shipped, not against what it was planned to ship.

| Behaviour | 004 shipped | 005 now | Bound? |
|---|---|---|---|
| **One motion vocabulary** | `220ms cubic-bezier(0.2, 0.7, 0.3, 1)` on `.brand-rows` transitions | the same duration and curve on `.cat-panel`, `.cat-panel__art::after` and the nav buttons | **X1 yes** |
| **One emphasis rule** | exactly one row holds emphasis, released five ways | exactly one panel is active; emphasis is colour **and** scale, never colour alone | **X2 yes** |
| **One interaction contract** | a press on a destination navigates, never reveals decoration first | press on the active panel navigates; press on any other centres it | **X3 yes** |
| **One visibility rule** | nothing animates off screen | Embla is `destroy()`ed off screen | **X4 yes** |
| **One reduced-motion behaviour** | transitions removed, state kept | transitions removed, arc kept (it is layout), movement resolves instantly | **X5 yes** |

The shared values are duplicated as literals in two files rather than declared once. That is the drift
risk FR-038 exists to prevent, and it is worth a follow-up: hoisting `220ms` and the curve into a custom
property on `:root` would make the binding structural instead of a convention two files happen to honour.
Deliberately not done here — it touches 004's shipped CSS, which is out of this feature's scope, and a
half-migration would be worse than two honest copies.

## Screenshots (T038)

`baseline/carousel-360.png`, `baseline/carousel-1280.png` and the T001 before-shots are all against the
homepage's **dark** ground, as FR-039 requires.

**The section was failing FR-039 before it was caught.** `.category-catalogue` carried a cream card
(`#faf4e6` paper, `#21181a` ink) — the light chapter. The badges are dark lacquer artwork, so on cream
they read as holes cut in the page rather than objects on a stage. The section now sits one step off the
obsidian ground with the type knocked out in champagne, and `--catalogue-brand` moved from oxblood to
champagne because `#640211` on `#120104` measures about 1.5:1 — present in the file, invisible to a
shopper.

## Two sources of category routes on one page (T042)

`lib/content/home.ts` still exports `categoryMosaic` (six hand-written tiles) and `categoryLinks` (six
encoded slugs) alongside `lib/category-departments.ts` (nine derived). `CategoryHub` no longer reads the
mosaic. The drift guard in `tests/unit/brand-resolution.test.ts` still asserts `categoryLinks` resolves,
so both are live and both are tested — but two tables naming the same routes is exactly how one ends up
stale. Consolidating them is a small, separate piece of work and should not be smuggled into this feature.
