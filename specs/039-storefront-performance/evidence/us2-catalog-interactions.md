# US2 Evidence — Catalog Search, Filter, Sort & Navigation Responsiveness (T015)

**Status**: Implemented & Verified  
**Affected Files**: `components/shop/FilterSidebar.tsx`, `components/shop/ShopResultControls.tsx`, `components/discover-button.tsx`, `components/shop/ProductCard.tsx`, `components/shop/ProductListRow.tsx`  
**Reference Task**: T015 [US2]  

## 1. Bottleneck Profiling & Baseline Analysis
- **Search (Shop Header)**: In baseline, search input submission had feedback p95 at 1138 ms and completion at 1472 ms because no immediate pending state was signaled until the server response arrived.
- **Filter (Brand / Category Selection)**: Filter interaction had feedback p95 of 1707 ms and completion at 3587 ms. On mobile, `GlassMenu` had an artificial 350 ms `window.setTimeout` before calling `router.push`, and mutations were executed outside React transitions without pending indicators.
- **Sort (Shop Results)**: Changing sort order had 8 timeouts out of 20 attempts during baseline, with feedback p95 of 355 ms and completion at 1226 ms. Uncoordinated `router.push` invocations on `<select id="shop-sort">` caused interrupted transitions.
- **Navigation (Product Card Open)**: Navigation feedback took 684 ms because clicking an `a[href^="/shop/"]` card link lacked visible pending feedback while the target page route and payload were being retrieved.

## 2. Implemented Optimizations
- **Coordinated React Transitions**: Wrapped URL search and filter updates in `React.useTransition` in both `FilterSidebar` and `ShopResultControls`.
- **Immediate Pending Feedback**:
  - `FilterSidebar`: Bound `aria-busy={isPending ? "true" : undefined}` on `<aside>`, immediately communicating pending status upon category, brand, price, or stock changes.
  - `ShopResultControls`: Added `aria-busy={isPending ? "true" : undefined}` to `#shop-sort` and the view mode buttons. Event handlers apply immediate `aria-busy="true"` on interaction.
  - `DiscoverButton`: Removed the artificial 350 ms timeout on mobile `GlassMenu` selection. Added immediate `aria-busy="true"` on the search form and menu container on submission/selection.
  - `ProductCard` & `ProductListRow`: Added immediate click feedback setting `aria-busy="true"` on the article container synchronously when navigation begins.
- **URL Semantics & Back-Navigation**: Maintained exact query parameter serialization, filter intersection, reset-on-page semantics, and scroll restoration.

## 3. Verification
- `npm run typecheck`: Passed (0 errors).
- `npm run test:unit`: Passed (608/608 tests).

