# Quickstart & Verification Guide: Web Interface Guidelines Compliance

**Feature**: `specs/029-web-interface-guidelines`  
**Date**: 2026-10-13  
**Status**: Completed  

---

## Verification Scenarios

### Scenario 1: Focus Visibility & Keyboard Traversal
1. Open the storefront homepage at `/`.
2. Press `Tab` repeatedly.
3. Verify that:
   - The skip link appears first at the top of the viewport.
   - Each header link, button, and menu trigger displays a sharp `:focus-visible` ring.
   - No interactive element conceals or removes focus outline without an equivalent replacement.

### Scenario 2: Form Interaction & Unblocked Paste
1. Navigate to `/partners` or `/login`.
2. Copy a sample mobile number or text to the system clipboard.
3. Paste into the input field using `Ctrl+V` or `Cmd+V`.
4. Verify that text is pasted instantaneously without being intercepted.
5. Click directly on field labels; verify that focus moves immediately into the input control.

### Scenario 3: Reduced Motion Compliance
1. In browser DevTools (Rendering tab), emulate `prefers-reduced-motion: reduce`.
2. Scroll through homepage sections and open the mobile sheet/dialog.
3. Verify that motion effects, parallax transforms, and infinite animations are disabled or simplified to instant transitions.

### Scenario 4: Automated Audit Suite
Run the dedicated Web Interface Guidelines unit test suite:
```bash
npm run test:unit tests/unit/web-interface-guidelines.test.ts
```
Verify that all guideline rules pass with exit code 0.

