# Quickstart & Verification: Responsive Design & Mobile Standards

**Feature**: `specs/031-responsive-design`  
**Date**: 2026-10-13  
**Status**: Completed  

---

## Verification Scenarios

### Scenario 1: Compact Screen Inspection (320px–360px)
1. Open Chrome DevTools Device Mode (Toggle device toolbar).
2. Set viewport dimensions to `320 × 568` (iPhone SE) and `360 × 800` (Android standard).
3. Scroll down the storefront homepage and shop pages.
4. Verify that:
   - No horizontal scrollbar appears.
   - Text wraps cleanly with no words clipped or falling outside cards.
   - All interactive pills and buttons stay within screen margins.

### Scenario 2: Touch Target Verification
1. Inspect the mobile navigation dock (`MobileDock.tsx`).
2. Verify each tab measures at least $44\text{px}$ in height (`min-h-[44px]`).
3. Inspect `CartButton.tsx` in the header; verify it measures $44\times 44\text{px}$ (`size-11`).

### Scenario 3: Notched Screen Clearance
1. Inspect the bottom clearance of `Footer.tsx` and `MobileDock.tsx`.
2. Verify CSS styles include `env(safe-area-inset-bottom)` to protect against gesture bar overlap.

### Scenario 4: Automated Verification Suite
Run the responsive design test suite:
```bash
npm run test:unit tests/unit/responsive-design.test.ts
```
Verify all responsive assertions pass with exit code 0.

