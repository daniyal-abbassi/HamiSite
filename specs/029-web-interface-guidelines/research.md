# Research & Audit Findings: Web Interface Guidelines Compliance

**Feature**: `specs/029-web-interface-guidelines`  
**Date**: 2026-10-13  
**Status**: Completed  

---

## 1. Guideline Audit Matrix

We performed static and automated codebase scans across `app/` and `components/` matching against the rules in Vercel's Web Interface Guidelines (`https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`).

### A. Focus Visibility & Bare `outline-none`
- **Rule**: Never use `outline-none` / `outline: none` without a visible focus replacement (e.g., `:focus-visible:ring-*`).
- **Audit Findings**:
  - `components/ui/badge.tsx:201`: Has `outline-none` without focus ring indicator.
  - `components/admin/bundles/BundleFormModal.tsx:466` & `PartnerApplicationModal.tsx:138`: Dialog containers use `outline-none` to prevent container focus ring, which is acceptable on dialog roots provided the inner active controls retain `:focus-visible`.
  - Global CSS (`app/globals.css:160-163`) already establishes a baseline:
    ```css
    :where(a, button, input, select, textarea):focus-visible {
      outline: 2px solid var(--aqua);
      outline-offset: 3px;
    }
    ```
- **Remediation**:
  - Replace bare `outline-none` in `components/ui/badge.tsx` with `focus-visible:ring-2 focus-visible:ring-primary`.
  - Ensure all interactive elements consistently use `:focus-visible` rather than unstyled `:focus`.

### B. CSS Transition Optimization (`transition: all` / `transition-all`)
- **Rule**: Never use `transition: all` or unbounded layout property animations; list specific properties explicitly (`transition-colors`, `transition-transform`, `transition-opacity`).
- **Audit Findings**:
  - 44 instances of `transition-all` exist in components (e.g., badge, carousel dots, modal tabs).
  - While small components like opacity/color changes tolerate `transition-all`, animating layout dimensions (`width`, `height`, `margin`) triggers composite recalcs.
- **Remediation**:
  - Replace instances of `transition-all` with targeted transitions: `transition-[transform,opacity]`, `transition-colors`, or `transition-[color,background-color,border-color,box-shadow]`.

### C. Form Usability & Paste Safety
- **Rule**: Inputs need `autocomplete` and meaningful `name`; paste events must never be blocked (`preventDefault`); labels must be clickable; loading submit buttons must be disabled during async operations.
- **Audit Findings**:
  - Codebase has **zero** instances of `onPaste` with `preventDefault`. Clipboard pasting is 100% unrestricted.
  - Auth, partner, and checkout forms use Zod validation and React Hook Form.
- **Remediation**:
  - Ensure submit buttons on partner applications, auth, and bundle creation include `disabled={isSubmitting}` and inline spinner feedback.
  - Verify all `<input>` elements have matching `<label htmlFor="...">` and `autoComplete` attributes.

### D. Media, Aspect Ratios & CLS Prevention
- **Rule**: All `<img>` or `next/image` tags must specify explicit dimensions (`width`, `height`, or `fill` with aspect-ratio parent containers) and lazy loading below the fold.
- **Audit Findings**:
  - Images in catalog rails and product cards utilize Next.js `Image` with fixed aspect ratios (`aspect-square` or `aspect-[4/3]`) or explicit sizes.
  - All decorative icons in `Header.tsx`, `Footer.tsx`, and `MobileDock.tsx` use `lucide-react` with `aria-hidden="true"`.

### E. Touch & Mobile Responsiveness
- **Rule**: `touch-action: manipulation` across touch controls; mobile safe areas with `env(safe-area-inset-*)`; sticky chrome scroll clearances.
- **Audit Findings**:
  - `app/globals.css:1056` declares `touch-action: manipulation;` on interactive components.
  - `app/layout.tsx` enforces `viewportFit: "cover"`, enabling `env(safe-area-inset-bottom)` on `MobileDock` and `Footer`.
  - `app/globals.css:165-168` provides `scroll-margin-top` and `scroll-margin-bottom` matching header and dock heights.

---

## 2. Architecture Decisions & Standards

1. **Focus Ring Uniformity**: Use `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none` across buttons, inputs, and interactive badges.
2. **Targeted Transitions**: Eliminate `transition-all` in favor of compositor-safe Tailwind classes (`transition-colors`, `transition-transform`, `transition-opacity`).
3. **Automated Verification**: Create unit tests in `tests/unit/web-interface-guidelines.test.ts` verifying touch manipulation, keyboard scroll margins, and transition rules.

