# Implementation plan

Replace redundant shop banners and duplicate header with one compact editorial hero. Reuse local product illustrations, established warranty copy and real contact information. Follow with ivory category navigation and a paper catalog; retain the shared LiquidSelection marker. Use the existing museum card variant only at the shop caller. Refine sidebar groups, result toolbar, empty states and mobile sheet through scoped CSS/hooks, leaving URL logic unchanged.

Execution sequence: page/hero, category/catalog presentation, filters/toolbar, responsive browser review, query interactions and TypeScript/database-free unit suite. Durable tasks: Beads HamiSite-basic-structure-zrb. Reference direction is the user-approved /partners design, informed by UseLayouts Editorial Deck and Componentry Layered Stack in the preceding pass.

## Completed validation

- Implemented a wine hero, paper catalog, existing department artwork, scoped museum cards, compact filters and responsive list/grid views.
- Preserved catalog/query contracts and product purchasing eligibility. Filter/sort changes retain scroll position.
- Fixed the mobile filter modal stacking above the bottom navigation and its action contrast.
- Browser verified at 1280, 768 and 360 pixels: no document horizontal overflow; category filtering (19 audio products), ascending price sorting, list view, empty search, clear filters and page 2.
- `npm run typecheck -- --incremental false`: passed.
- `npm run test:unit`: 25 files, 341 tests passed; database integration/reset commands were not used.
- `git diff --check`: passed. `graphify update .`: completed.
- Dev server remains available at http://localhost:3000/shop. No commit or push performed.

## Product-card revision after visual review

The first museum variant still looked like a familiar boxed catalog card. The shop now treats the photograph as the object: the image ground matches the paper page, product cutouts sit without a white tile, and restrained numbered labels, quieter metadata, and a fine baseline separate each piece. The treatment remains scoped to the shop grid and preserves the existing card actions and details.
