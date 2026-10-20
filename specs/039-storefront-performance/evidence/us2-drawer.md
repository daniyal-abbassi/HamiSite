# US2 Evidence — Cart Drawer On-Demand Deferral (T014)

**Status**: Implemented & Verified  
**Affected Files**: `components/providers/CartProvider.tsx`, `components/layout/CartButton.tsx`  
**Reference Task**: T014 [US2]  

## 1. Baseline Trace & Problem Statement
- **Prior Behavior**: `CartProvider` statically imported and mounted `<CartDrawer />` directly in the root `(main)` layout for every public and authenticated visitor.
- **Transitive Dependencies Loaded on Entry**: `CartDrawer` pulled in `CartLine`, `TomanPrice`, `lucide-react` icons (`Minus`, `Plus`, `Sparkles`, `Trash2`, `ShoppingBag`, `X`), `next/image`, `next/link`, and drawer formatting logic directly into the common client chunk, transferring and executing bytes even when the visitor never opened the cart.
- **Unused First-Load Bytes**: The cart drawer bundle evaluated on initial visit across home, shop, category, and product routes before any shopping interaction occurred.

## 2. Optimization Implementation
- **Client Boundary Deferral**: Loaded `CartDrawer` via Next.js dynamic client boundary (`next/dynamic` with `ssr: false`).
- **Deferred Render Gate**: Maintained `hasOpened` state in `CartProvider`. The drawer component is not mounted in the DOM on initial load until the first trigger (`openDrawer()`, `addItem()`, or `addBundle()`).
- **Speculative Prefetch**: Added `onPointerEnter` and `onFocus` handlers on `CartButton` to speculatively pre-warm the `CartDrawer` chunk (`import("@/components/cart/CartDrawer")`) on desktop hover and keyboard focus before the actual click.
- **Lifecycle & Interaction Preservation**:
  - **Immediate Pending Feedback**: `AddToCartButton` and `CartButton` state changes execute synchronously.
  - **Focus & Focus Restoration**: Maintained via `useModalDialog` inside `CartDrawer`. `returnFocus` tracks the triggering element (`document.activeElement`) and restores focus on close.
  - **Escape & Backdrop Handling**: Native `<dialog>` `cancel` event prevents default and calls `closeDrawer()`, cleanly restoring document overflow and state.
  - **Successful-Add Drawer Opening**: Both `addItem` and `addBundle` mark `hasOpened: true` and `drawerOpen: true`, displaying the cart immediately upon mutation confirmation.
  - **Warm Repeated Opens**: Once `hasOpened` is true, the component remains cached in memory; subsequent closes and opens have zero chunk fetch overhead.

## 3. Verification
- `npm run test:unit`: All 63 suites pass (608/608 tests).
- Dialog accessibility and focus restoration contract preserved.

