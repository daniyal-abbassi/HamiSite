# T010 — Discount rail projection and equivalence

On the frozen 2026-10-18 catalog, the prior discount rail queried and serialized **189 full products (about 1,351 KB of server objects)** to render five cards. It discarded 183 unavailable products after that read. The resulting six available records contain five eligible offers and one unsellable record. A direct warm read of the old full candidate query took 275 ms; the new available-only source returned six full records (about 36 KB) in 117 ms on its first read and 13 ms for a subsequent full rail call. These are local diagnostic timings, not SC-001 browser claims.

The new reader applies only `available: true` in SQL and keeps the original offer order (`specialOffer` descending, `updatedAt` descending, `id` ascending). It has **no row cap** before the existing variant-level sellability and reduction-rate logic. The ranking code is otherwise unchanged: a variant must be sellable, limited stock must be positive, comparison price must exceed unit price, and the highest reduction rate wins per product. Stable sorting keeps the source order for equal rates. Zero or missing prices cannot become a discount. The current dataset had zero eligible-rate ties and zero missing-price candidates, so those guards are code-preservation checks rather than a claim of observed edge-case coverage.

| Check | Before | After |
| --- | --- | --- |
| Candidate records hydrated | 189 | 6 |
| Eligible offers | 5 | 5 |
| Selected product IDs, in order | 2004, 1939, 2013, 1929, 1832 | same |
| Selected variant IDs | none, 3342, 3452, 3310, 3152 | same |
| Winner positions in prior 189-row source | 25, 89, 17, 97, 13 | all preserved |
| Default five-card shelf | 5 cards | 5 cards |

The obtainable shelf was audited separately: its price query returns exactly six records and its total is six on this catalog, so changing it would add complexity without a measured gain. The main and continuation shelves return 12 and six records respectively. Their IDs and order were recorded before this edit; those readers are unchanged.

Baseline route samples: `home-fresh-r1`–`r5`, `home-returning-r1`–`r5` in `baseline-public.json`. Final route and screenshot evidence remains pending the next production build. This server reader does not add client bundle bytes or change price/stock authority.
