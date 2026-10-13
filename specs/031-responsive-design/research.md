# Research & Audit Findings: Responsive Design & RTL Mobile Standards

**Feature**: `specs/031-responsive-design`  
**Date**: 2026-10-13  
**Status**: Completed  

---

## 1. Viewport Audit & Breakpoint Matrix

Hami Hamrah uses Tailwind's mobile-first breakpoint scale:
- `default`: `< 640px` (Compact mobile phones: 320px, 360px, 390px, 414px)
- `sm`: `640px` (Large phones in landscape, phablets)
- `md`: `768px` (Standard tablets like iPad Mini)
- `lg`: `1024px` (Small laptops, desktop transition)
- `xl`: `1280px` (Standard desktop monitors)
- `2xl`: `1536px` (Wide desktop displays)

### A. Horizontal Overflow Analysis
- **Rule**: Content must never bleed outside the document width (`overflow-x: hidden` on body is a safety net, but underlying containers must not overflow).
- **Findings**:
  - `app/globals.css:133` enforces `overflow-x: hidden;` on `body`.
  - Flex child items containing Persian typography use `truncate` or `line-clamp-1/2` alongside `min-w-0` to prevent flex items from expanding beyond parent width.
  - High-resolution photographs (e.g. `pdp`, `social`, banners) use responsive Next.js `Image` with `sizes` and `object-contain`/`object-cover`.

### B. Touch Target Compliance (WCAG 2.5.5 / 2.5.8)
- **Rule**: Interactive targets must be $\ge 44\times 44\text{px}$ on touch screens.
- **Findings**:
  - `components/layout/MobileDock.tsx`: Uses `min-h-[44px]` with flex layout.
  - `components/layout/CartButton.tsx`: Uses `size-11` ($44\times 44\text{px}$).
  - `components/discover-button.tsx`: Sized for mobile tap targets.
  - `components/common/DesignSystemPicker.tsx`: Ensure individual pill buttons have adequate padding or wrapper height ($\ge 36\text{px}$ with surrounding space, or min 44px hit-target on touch).

### C. RTL & CSS Logical Properties Audit
- **Rule**: Avoid `ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*` in layout containers; use `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`.
- **Findings**:
  - Directional margins/paddings across header, footer, and admin navigation already extensively use `ms-*`, `me-*`, `ps-*`, `pe-*`.
  - Absolute positioning pins (such as the cart badge `-end-0.5 -top-0.5`) properly use logical start/end coordinates.

---

## 2. Technical Remediation Strategy

1. **Safe Area Insets Enforcement**: Verify that all floating bottom layers (`MobileDock.tsx`, `Footer.tsx`) correctly add `env(safe-area-inset-bottom)`.
2. **Hit Target Assurance**: Ensure all button and link triggers in shared navigation satisfy $\ge 44\times 44\text{px}$ touch targets.
3. **Automated Test Suite**: Implement `tests/unit/responsive-design.test.ts` to assert viewport configurations, touch target dimensions, and logical property usage across UI modules.

