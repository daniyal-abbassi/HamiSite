# Responsive Design & Layout Contracts

**Feature**: `specs/031-responsive-design`  
**Date**: 2026-10-13  
**Status**: Completed  

---

## 1. Breakpoint & Fluid Spacing Contract

```css
/* Standard Breakpoints (Tailwind CSS v4) */
/* sm:  640px  (phablets / landscape) */
/* md:  768px  (tablets)               */
/* lg:  1024px (desktops / laptops)    */
/* xl:  1280px (standard monitors)     */
/* 2xl: 1536px (wide screens)          */
```

- Mobile layouts must be designed for **360px base width** as the standard target, with graceful degradation to **320px**.
- Container layouts must use fluid widths: `w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-8`.

---

## 2. Touch Target Contract (WCAG 2.5.5 / 2.5.8)

- Any standalone touch button or tab must measure at least:
  ```css
  min-height: 44px;
  min-width: 44px;
  ```
- Or measure at least `32px` with combined surrounding clearance of $\ge 44\text{px}$.
- Touch event delay must be removed via:
  ```css
  touch-action: manipulation;
  ```

---

## 3. RTL Logical Properties Contract

Shared layout elements must strictly follow CSS logical naming conventions:

| Physical (Avoid) | Logical (Mandatory) | Purpose |
| :--- | :--- | :--- |
| `margin-left` / `ml-*` | `margin-inline-start` / `ms-*` | Leading margin |
| `margin-right` / `mr-*` | `margin-inline-end` / `me-*` | Trailing margin |
| `padding-left` / `pl-*` | `padding-inline-start` / `ps-*` | Leading padding |
| `padding-right` / `pr-*` | `padding-inline-end` / `pe-*` | Trailing padding |
| `left: 0` / `left-0` | `inset-inline-start: 0` / `start-0` | Leading absolute anchor |
| `right: 0` / `right-0` | `inset-inline-end: 0` / `end-0` | Trailing absolute anchor |
| `text-left` / `text-right` | `text-start` / `text-end` | Text alignment |

