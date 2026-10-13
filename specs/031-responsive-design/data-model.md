# Data Model: Responsive Breakpoints & Viewport Entities

**Feature**: `specs/031-responsive-design`  
**Date**: 2026-10-13  
**Status**: Completed  

---

## Viewport Dimension Model

```typescript
export type BreakpointName = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export interface ViewportDefinition {
  name: BreakpointName;
  minWidth: number;
  maxWidth?: number;
  targetDevice: string;
}

export const RESPONSIVE_BREAKPOINTS: Record<BreakpointName, ViewportDefinition> = {
  xs: { name: "xs", minWidth: 320, maxWidth: 639, targetDevice: "Mobile phone (compact/standard)" },
  sm: { name: "sm", minWidth: 640, maxWidth: 767, targetDevice: "Large phone / Phablet" },
  md: { name: "md", minWidth: 768, maxWidth: 1023, targetDevice: "Tablet (portrait/landscape)" },
  lg: { name: "lg", minWidth: 1024, maxWidth: 1279, targetDevice: "Laptop / Desktop" },
  xl: { name: "xl", minWidth: 1280, maxWidth: 1535, targetDevice: "Desktop monitor" },
  "2xl": { name: "2xl", minWidth: 1536, targetDevice: "Ultra-wide screen" },
};
```

---

## Responsive Invariants

1. **Zero Overflow Invariant**: For any screen width $W \ge 320\text{px}$, `scrollWidth \le clientWidth`.
2. **Touch Clearance Invariant**: Every interactive mobile control must have a bounding hit-box of at least $44\times 44\text{px}$ or $32\times 32\text{px}$ with $\ge 12\text{px}$ separation.
3. **Safe Area Invariant**: Fixed bottom elements must expand clearance using `calc(... + env(safe-area-inset-bottom))`.

