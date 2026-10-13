# Research: WCAG 2.2 Accessibility Compliance & FarsiUI Standards

**Feature**: `027-accessibility-compliance`  
**Date**: 2026-10-13  
**Status**: Completed  
**Sources**: [FarsiUI Accessibility Compliance](https://farsiui.ir/skills/accessibility-compliance), WCAG 2.2 Guidelines, W3C WAI-ARIA Authoring Practices (APG)

---

## 1. Skip Links & Landmark Architecture

### Decision
Implement a persistent, visually hidden skip-to-content anchor in the root layout (`app/layout.tsx` and `app/(tma)/layout.tsx`) that becomes prominent upon initial keyboard focus:
```html
<a
  href="#main"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-amber-400 focus:text-zinc-950 focus:font-bold focus:shadow-2xl focus:outline-hidden focus:ring-2 focus:ring-zinc-950"
>
  پرش به محتوای اصلی
</a>
```
All major templates will ensure the primary page container has `id="main"` with `tabIndex={-1}` for programmatic focus transfer.

### Rationale
- Complies with WCAG 2.4.1 (Bypass Blocks).
- Avoids repetitive tabbing through header navigation bars, store logo, category dropdowns, and search buttons before reaching content.
- Supports both desktop and mobile keyboards.

### Alternatives Considered
- *In-page jump buttons*: Clutters visual UI and only works after scrolling. Rejected.

---

## 2. High-Contrast Focus Indicators (`:focus-visible`)

### Decision
Define a global, consistent focus-ring system in `app/globals.css` using `:focus-visible` and Tailwind utility classes (`focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950`).
Additionally, configure scroll margin clearance:
```css
:focus {
  scroll-margin-top: calc(var(--header-height, 4rem) + 1rem);
  scroll-margin-bottom: calc(var(--dock-height, 5rem) + 1rem);
}
```

### Rationale
- Complies with WCAG 2.4.7 (Focus Visible) and WCAG 2.4.11 (Focus Not Obscured - Level AA new in WCAG 2.2).
- Ensures that when a keyboard user tabs to an element located behind a sticky header (store header) or sticky mobile dock (bottom nav), the browser automatically scrolls it into view with sufficient margin.
- Mouse clicks do not trigger distracting rings, preserving luxury visual aesthetic while empowering keyboard users.

### Alternatives Considered
- *Default browser focus outlines*: Highly inconsistent across browsers (Safari blue vs Chrome black/white vs Firefox dotted) and frequently clashes with dark luxury palette.

---

## 3. Accessible Dialogs & Slide-Over Drawers (Focus Trapping & Escape Dismissal)

### Decision
Standardize all modal overlays (`PartnerApplicationModal`, `BundleFormModal`, mobile search overlay, curve drawer) on the WCAG WAI-ARIA Dialog Pattern:
1. **Container Attributes**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="[modal-title-id]"`.
2. **Focus Shift**: When the dialog mounts/opens, focus automatically shifts to the dialog container or first focusable interactive element.
3. **Focus Trapping**: A lightweight `useFocusTrap` hook or container listener captures `Tab` / `Shift+Tab` to cycle strictly within the open modal's focusable elements (`button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])`).
4. **Escape Key Handling**: A `keydown` listener triggers the dialog's close callback on `Escape`.
5. **Return Focus**: Upon unmounting/closing, focus immediately returns to the `triggerRef` element that launched the modal.

### Rationale
- Fulfills the explicit Dialog Checklist from the FarsiUI Accessibility Compliance skill.
- Prevents accidental background interaction and lost keyboard focus.

### Alternatives Considered
- *Heavy external focus-trap library (`focus-trap-react`)*: Adds unnecessary runtime bundle weight. A lightweight hook (~40 LOC) leveraging standard browser DOM APIs meets all requirements cleanly.

---

## 4. Accessible Names & Icon-Only Button Labels

### Decision
Audit and equip all icon-only buttons across storefront and admin views with Persian accessible names:
1. **Toolbars and Action Buttons**: Supply explicit `aria-label` (e.g. `aria-label="باز کردن سبد خرید"`, `aria-label="بستن پنجره"`, `aria-label="جست‌وجوی محصولات"`).
2. **Decorative Icons**: Add `aria-hidden="true"` to all Lucide and Devigner SVG icons inside labeled buttons so screen readers don't announce raw SVGs.
3. **Visually Hidden Labels**: Use `<span className="sr-only">...</span>` for complex composite controls.

### Rationale
- Complies with WCAG 1.1.1 (Non-text Content) and 4.1.2 (Name, Role, Value).
- Eliminates the common screen reader issue: "Button, unlabelled".

---

## 5. Form Fields, Labels & Dynamic Validation Announcements

### Decision
1. **Programmatic Labeling**: Replace floating detached text with `<label htmlFor="field-id">` and ensure all inputs have matching `id` attributes.
2. **Error Indication**: On validation failure, mark inputs with `aria-invalid="true"` and `aria-describedby="[field-id]-error"`.
3. **Live Announcements**: Place error summaries and dynamic feedback (e.g., "درخواست با موفقیت ثبت شد", "کد ملی وارد شده نامعتبر است") in containers with `role="alert"` and `aria-live="polite"`.

### Rationale
- Complies with WCAG 3.3.1 (Error Identification), 3.3.2 (Labels or Instructions), and 4.1.3 (Status Messages).

---

## 6. Color Contrast & Touch Target Sizing (WCAG 2.2 AA)

### Decision
1. **Contrast Ratio**:
   - Primary text (`text-zinc-100`, `text-stone-100`) on dark background (`bg-zinc-950` / `bg-[#0B0204]`) provides a contrast ratio > 14:1 (exceeds 4.5:1 requirement).
   - Muted secondary text: replace overly dark `text-zinc-600` with `text-zinc-400` (contrast ratio ~ 5.3:1) for readable metadata and timestamps.
   - Status badges: ensure text and border combinations (amber, emerald, rose) meet minimum 4.5:1 text and 3:1 graphical boundary standards.
2. **Target Sizing**:
   - Ensure all touch interactive elements on mobile viewport have a minimum bounding box or padding envelope of 44×44 CSS pixels (WCAG 2.5.8 AA).

---

## 7. Reduced Motion Integration

### Decision
Enhance `app/globals.css` with a reduced-motion media query override:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
And wrap GSAP timelines and smooth-scroll hooks (e.g., Lenis) in check for `window.matchMedia("(prefers-reduced-motion: reduce)").matches`.

### Rationale
- Complies with WCAG 2.3.3 (Animation from Interactions).
- Protects users with vestibular motion disorders from experiencing nausea or dizziness.

