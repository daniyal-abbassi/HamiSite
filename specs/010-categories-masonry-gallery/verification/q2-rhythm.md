# Q2 — the rhythm is a pattern, not an accident

**Contract**: [../contracts/category-masonry.md](../contracts/category-masonry.md) Q2 · **Task**: T009
**Run**: 2026-09-26 17:07 · `npm run test:unit tests/unit/category-masonry.test.ts tests/unit/category-departments.test.ts`

```
✓ tests/unit/category-departments.test.ts (14 tests) 27ms
✓ tests/unit/category-masonry.test.ts (15 tests) 44ms
Test Files  2 passed (2)
     Tests  29 passed (29)
   Duration  3.71s (setup 0ms, …)
```

`setup 0ms` is the proof the right config ran — `vitest.frontend.config.ts` has no `setupFiles`, so
`tests/setup.ts`'s `resetDb()` never touched a database.

## The assertions that carry Q2

| Test | What it forbids |
|---|---|
| `equals the table written in data-model.md` | The pattern drifting away from its own documentation. The table is transcribed in the test as well as authored in the module, so a one-sided edit fails. |
| `holds three tiles of each tier at every breakpoint` | A width where one tier dominates — the shape that reads as a grid, not a rhythm. |
| `is a Latin square: every department holds each tier exactly once across the three widths` | Any department being permanently the tall one or permanently the stub (FR-013a). |
| `never leaves the one-product department permanently the largest tile` | The exact accident that ended 009's variant B — `service` is S at 360, L at 768, M at 1280. |
| `is keyed by kind, so a department leaving cannot re-shuffle the others` | The rejected positional derivation, which would rewrite the composition when a slug stops resolving. |
| `carries a rhythm for all three breakpoints, holding each tier exactly once` *(departments file)* | The same property re-checked against the departments the seam **actually produced**, not against the table. |

## The generated table

Read out of `lib/category-masonry.ts` through `categoryDepartments()`, not typed by hand — heights are
`tileHeightPx()` output, i.e. `H(n) = 8n + gap(n−1)` at the authored spans.

| # | `kind` | label | base (2 col, gap 12) | md (3 col, gap 16) | xl (4 col, gap 20) |
|---|---|---|---|---|---|
| 1 | `phone` | گوشی موبایل | L 268 px | M 320 px | S 288 px |
| 2 | `audio` | هدفون و ایرپاد | M 208 px | S 224 px | L 512 px |
| 3 | `charger` | شارژر و کابل | S 148 px | L 392 px | M 400 px |
| 4 | `smartwatch` | ساعت هوشمند | L 268 px | M 320 px | S 288 px |
| 5 | `powerbank` | پاوربانک | M 208 px | S 224 px | L 512 px |
| 6 | `computer_accessory` | لوازم کامپیوتر | S 148 px | L 392 px | M 400 px |
| 7 | `sim_card` | سیم‌کارت | L 268 px | M 320 px | S 288 px |
| 8 | `car_charger` | شارژر فندکی | M 208 px | S 224 px | L 512 px |
| 9 | `service` | خدمات آنلاین | S 148 px | L 392 px | M 400 px |

Tier distribution, counted from the same table: **S/M/L = 3/3/3 at all three breakpoints**. The produced
departments were counted independently and gave `base tier counts from produced departments: 3/3/3`, so the seam
and the authored table agree while the export is healthy.

Each row contains exactly one L, one M and one S. That is the Latin-square property, and it is why no
department's size can be read as a statement about its catalogue weight.

## Not claimed here

Q2 says nothing about what the page **looks like**. Whether the stagger reads as editorial rather than broken,
and whether the columns end at tolerable places, is Q1 — measured at three widths by T014, which has not run yet
because T011 needs `app/(main)/home.css`.
