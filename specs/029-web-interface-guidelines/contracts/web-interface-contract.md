# Interface Contracts: Web Interface Guidelines Compliance

**Feature**: `specs/029-web-interface-guidelines`  
**Date**: 2026-10-13  
**Status**: Completed  

---

## 1. Focus Indicator Contract

All interactive HTML elements (`<button>`, `<a>`, `<input>`, `<select>`, `<textarea>`, `[role="button"]`, and interactive badges) must adhere to the following contract:

```css
/* Base accessibility rule in app/globals.css */
:where(a, button, input, select, textarea, [role="button"]):focus-visible {
  outline: 2px solid var(--aqua);
  outline-offset: 3px;
}
```

- When Tailwind utilities are used directly on interactive elements, they must specify:
  ```html
  className="... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
  ```
- **Invariant**: No element may declare `outline-none` or `outline: none` without simultaneously declaring a `:focus-visible:ring-*` or equivalent replacement.

---

## 2. Transition Contract

- **Forbidden Utility**: `transition-all` on elements that change layout dimensions (`width`, `height`, `padding`, `margin`, `inset`).
- **Permitted Utilities**:
  - `transition-colors` (for `color`, `background-color`, `border-color`, `text-decoration-color`, `fill`, `stroke`)
  - `transition-transform` (for CSS `transform`)
  - `transition-opacity` (for CSS `opacity`)
  - `transition-[transform,opacity]` (for modal/flyout animations)
- **Reduced Motion Invariant**: All transitions must degrade cleanly under `prefers-reduced-motion: reduce`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

---

## 3. Form Control Contract

- Every `<input>`, `<textarea>`, and `<select>` must feature:
  - An associated `<label htmlFor="...">` with an identical `id` on the input control, or be nested directly within a `<label>` element.
  - A descriptive `name` attribute.
  - A contextual `autoComplete` attribute (e.g. `tel`, `name`, `email`, `address-line1`, or `off`).
- Submit buttons must implement:
  - `disabled={isSubmitting || isLoading}`
  - An accessible loading spinner (`aria-hidden="true"`) alongside an active text description or `aria-live="polite"` update.
- **Paste Invariant**: No form control or listener may intercept paste events to invoke `preventDefault()`.

