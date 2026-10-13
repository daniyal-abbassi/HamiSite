# Interaction Design Contracts & Tokens

**Feature**: `specs/030-interaction-design`  
**Date**: 2026-10-13  
**Status**: Completed  

---

## 1. Timing & Easing Contract

```css
:root {
  /* Interaction Timing Tokens */
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-smooth: 350ms;

  /* Natural Motion Easings */
  --ease-enter: cubic-bezier(0, 0, 0.2, 1);    /* Ease-out: entering screen */
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);     /* Ease-in: exiting screen */
  --ease-natural: cubic-bezier(0.4, 0, 0.2, 1); /* Ease-in-out: standard move */
}
```

---

## 2. Interactive Component State Contract

Every button and interactive surface must implement:

```tsx
// Standard interactive button pattern
<button
  type="button"
  disabled={disabled || loading}
  className={cn(
    // Base layout
    "inline-flex items-center justify-center font-medium transition-[transform,opacity,background-color,border-color]",
    "duration-150 ease-out",
    
    // Hover (desktop only)
    "hover:opacity-95 hover:-translate-y-0.5",
    
    // Active (tactile physical press)
    "active:scale-[0.98] active:translate-y-0",
    
    // Focus visible (keyboard accessible)
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
    
    // Disabled / Loading
    "disabled:pointer-events-none disabled:opacity-50 disabled:translate-y-0 disabled:scale-100"
  )}
>
  {loading && <Spinner className="size-4 animate-spin me-2" aria-hidden="true" />}
  <span>{label}</span>
</button>
```

---

## 3. Reduced Motion Invariant

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
Under reduced motion, all micro-compressions (`active:scale-*`) and translations are flattened to instant state changes without motion sickness risks.

