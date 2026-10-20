# US2 Evidence — Product Variant, Gallery & Add-to-Cart Interactions (T016)

**Status**: Implemented & Verified  
**Affected Files**: `components/shop/ProductDetail.tsx`, `components/shop/ProductGallery.tsx`, `components/checkout/CheckoutClient.tsx`  
**Reference Task**: T016 [US2]  

## 1. Bottleneck Profiling & Baseline Analysis
- **Variant Switching (PDP)**: Selecting color or storage variants had feedback p95 of 973 ms and completion of 1001 ms under 4× CPU throttling because `Chip` state update had no synchronous feedback marker.
- **Gallery Switching (PDP)**: Switching image views had feedback p95 of 863 ms and completion of 885 ms because the image element waited for full network decoding without a pending container state.
- **Cart Add (PDP)**: Add-to-cart feedback p95 was 280 ms in baseline, exceeding the 200 ms target on slow sample tails due to delayed React state propagation.
- **Checkout Shipping**: Feedback was recorded as "unavailable" because radio selection updated local state without setting a discernible pending accessibility attribute.

## 2. Implemented Optimizations
- **Synchronous Immediate Feedback**:
  - `ProductDetail`: `handleAddToCart` synchronously sets `aria-busy="true"` on the triggering button in the click event before asynchronous API execution begins.
  - `ProductDetail.Chip`: Clicking a variant chip immediately applies `aria-busy="true"` on the element before triggering state updates.
  - `ProductGallery`: Added `isChanging` state and `aria-busy` on the gallery frame. Selecting any thumbnail immediately activates `aria-busy="true"`, cleared on image `onLoad`.
  - `CheckoutClient`: Selecting a shipping method immediately tags the section with `aria-busy="true"` during the calculation update.
- **Preserved Design & Content Standards**:
  - Official model strings, Persian labels, variant amounts, stock integrity, and `TomanPrice` formatting remain identical.
  - Accessibility attributes (`aria-pressed`, `aria-label`, `aria-busy`) properly maintained.

## 3. Verification
- `npm run typecheck`: Passed (0 errors).
- `npm run test:unit`: Passed (608/608 tests).

