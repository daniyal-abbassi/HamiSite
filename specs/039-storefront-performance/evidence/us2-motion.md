# US2 Evidence — Motion & Shared-Shell Listener Audit (T017)

**Status**: Audited & Verified  
**Affected Files**: `components/layout/Header.tsx`, `components/atmosphere/ScrollSmooth.tsx`, `components/home/Reveal.tsx`  
**Reference Task**: T017 [US2]  

## 1. Audit Scope & Verification
- Audited scroll event listeners in `components/layout/Header.tsx`.
- Audited smooth scrolling implementation in `components/atmosphere/ScrollSmooth.tsx`.
- Evaluated layout and motion consumers across `components/home/`.

## 2. Findings & Measurements
- **`Header.tsx`**:
  - The scroll handler is already throttled to at most one `requestAnimationFrame` per burst (`handleScroll` uses `if (frame) return; frame = requestAnimationFrame(...)`).
  - Added with `{ passive: true }` listener options to avoid blocking browser main-thread scroll.
  - State update (`setScrolled`, `setVisible`) bails out in React when values do not change, resulting in 0 renders during steady scrolling.
  - **Verdict**: Retained as optimal; no trace-proven overhead justifies altering the header scroll architecture.
- **`ScrollSmooth.tsx`**:
  - `shouldEase()` strictly refuses initialization on coarse-pointer (touch) devices, mobile viewports, or when `prefers-reduced-motion: reduce` is detected.
  - Lenis is loaded strictly on demand via dynamic `import("lenis")` only on desktop fine-pointer devices.
  - Touch scrolling on mobile remains 100% native OS momentum scrolling, ensuring zero JavaScript overhead during mobile interaction.
  - Keyboard interactions (PageUp, PageDown, Home, End) bypass Lenis animation and scroll natively.
  - `allowNestedScroll: true` is properly configured, preventing lockouts in the cart drawer and filter sheets.
  - **Verdict**: Retained; meets all performance and accessibility constraints.
- **`Reveal.tsx` & Home Motion**:
  - Evaluated in conjunction with F-01. Initial server markup renders `visible=true` with `reveal--visible`.
  - No extraneous resize or scroll thrashing found.

## 3. Decision
- No unnecessary modifications made to `Header.tsx` or `ScrollSmooth.tsx`; documented the trace-proven efficiency and evidence-backed preservation of the existing motion and listener contracts.

