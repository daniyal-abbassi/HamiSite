# Quickstart: Accessibility Compliance (WCAG 2.2 AA) Validation

**Feature**: `027-accessibility-compliance`  
**Date**: 2026-10-13  

---

## 1. Prerequisites

1. Development server running: `npm run dev`
2. Modern Chromium-based browser with DevTools or Playwright test runner.
3. Unit test environment: `npm run test:unit`

---

## 2. End-to-End Validation Scenarios

### Scenario 1: Skip Link & Full Keyboard Navigation
1. Open the storefront at `http://localhost:3000/`.
2. Do not use the mouse. Press `Tab` once.
3. **Verify**: A high-contrast button reading **«پرش به محتوای اصلی»** appears at the top corner of the screen.
4. Press `Enter`.
5. **Verify**: Keyboard focus moves directly into the main page content (`#main`), bypassing the navigation header.
6. Continue pressing `Tab` to navigate through products, links, and buttons.
7. **Verify**: Every focused element displays a distinct, high-contrast `:focus-visible` ring.

---

### Scenario 2: Modal Focus Trapping & Escape Key Dismissal
1. Navigate to `/admin/partners` in the browser.
2. Tab to the **«بررسی»** button on any application and press `Enter`.
3. **Verify**:
   - The inspection modal opens.
   - Focus shifts into the modal container.
   - Screen reader attributes (`role="dialog"`, `aria-modal="true"`) are present on the container.
4. Press `Tab` and `Shift+Tab` repeatedly:
   - **Verify**: Focus never escapes to the underlying admin table or background sidebar. It cycles strictly within the modal controls.
5. Press the `Escape` key.
6. **Verify**: The modal closes immediately, and keyboard focus is automatically restored to the «بررسی» button.

---

### Scenario 3: Icon-Only Buttons & Form Error Announcements
1. Inspect the storefront header and footer.
2. Inspect the search button, shopping cart button, and mobile menu toggle.
3. **Verify**: Every icon-only button contains a descriptive Persian `aria-label` (e.g. `aria-label="سبد خرید"`).
4. Open the partner request form at `/partners` or `/login`.
5. Submit the form with empty fields.
6. **Verify**:
   - Invalid fields receive `aria-invalid="true"`.
   - Error messages are associated via `aria-describedby`.
   - Error messages are enclosed in a container with `role="alert"` so assistive tools speak the error immediately.

---

### Scenario 4: Automated Accessibility Unit Tests
Run the automated accessibility test suite:
```bash
npm run test:unit tests/unit/accessibility-compliance.test.ts
```
**Verify**: All automated DOM checks pass with 0 critical or serious WCAG 2.2 violations.

---

### Scenario 5: Reduced Motion Preference Verification
1. Emulate `prefers-reduced-motion: reduce` in browser DevTools (Rendering panel -> Emulate CSS media feature prefers-reduced-motion).
2. Browse through the storefront home page and category carousels.
3. **Verify**: All looping animations, smooth auto-scrolls, and motion transitions immediately switch to static cross-fades without motion jank.

