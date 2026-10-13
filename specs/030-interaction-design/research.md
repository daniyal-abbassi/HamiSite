# Research: Interaction Design Standards & Patterns

**Feature**: `specs/030-interaction-design`  
**Date**: 2026-10-13  
**Status**: Completed  

---

## 1. Principles of Interaction Design for Hami Hamrah

### A. The 100ms Tactile Boundary
- **Principle**: An action must provide immediate visual feedback in $\le 100\text{ms}$ to feel physical and responsive.
- **Implementation**:
  - Buttons and interactive cards adopt `active:scale-[0.98]` or `active:scale-95`.
  - Use `transition-transform duration-100 ease-out` on interactive controls.
  - On touch devices, prevent sticky hover states using `@media (hover: hover)` or touch-action optimization.

### B. Standard Duration Bands
- **Micro-interactions (hovers, pill tabs, checkboxes)**: `100ms - 150ms` (`ease-out`)
- **Component transitions (dropdown menus, accordions, tooltips)**: `200ms - 300ms` (`cubic-bezier(0, 0, 0.2, 1)`)
- **Modals & Drawers (dialogs, bottom sheets)**: `250ms - 350ms` (`cubic-bezier(0.4, 0, 0.2, 1)`)
- **Never animate layout dimensions (`width`, `height`, `padding`, `margin`)**; animate `transform: scale()`, `transform: translateY()`, and `opacity`.

### C. State Machine Coverage
Every interactive control must support all states:
1. **Default**: Resting idle tone.
2. **Hover**: Subdued brightness or highlight (desktop only).
3. **Focus-Visible**: High-contrast outline ring (accessible for keyboard).
4. **Active/Pressed**: Micro-compression (`scale(0.98)`).
5. **Loading**: Spinner icon, `cursor-not-allowed`, and `disabled` attribute to prevent duplicate requests.
6. **Disabled**: `opacity-50 pointer-events-none`.

---

## 2. Technical Evaluation of Existing Components

1. **Header CTAs & Links**: Already feature `-translate-y-0.5` and `active:scale-95`. Ensure all interactive buttons in `components/common/DesignSystemPicker.tsx` and cart actions share the same tactile feel.
2. **Cart Button (`CartButton.tsx`)**: Displays badge count; can benefit from subtle bounce/pulse microinteraction on quantity update.
3. **Modals (`PartnerApplicationModal.tsx`, `BundleFormModal.tsx`)**: Already employ backdrop blurs; ensure opening and closing transitions execute within 250ms.

