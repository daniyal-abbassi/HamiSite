# Quickstart & Verification Guide: Next.js Multi Design System

**Feature**: `specs/028-nextjs-multi-design-system`  
**Date**: 2026-10-13  
**Status**: Ready for Verification  

---

## 1. Prerequisites & Setup

Ensure dependencies are installed and test environment is ready:
```bash
npm run typecheck
npm run test:unit
```

---

## 2. Unit Verification

Run the dedicated test suite validating design system mapping, cookie parsing, FOUC script mechanics, and orthogonal mode separation:
```bash
npx vitest run --config vitest.frontend.config.ts tests/unit/multi-design-system.test.ts
```

**Expected Result**:
- `resolveDesignSystem("default")` returns `"style-nova"`
- `resolveDesignSystem("comfort")` returns `"style-vega"`
- `resolveDesignSystem("glass")` returns `"style-glass"`
- Unrecognized or undefined inputs fall back cleanly to `"style-nova"`
- Cookie and class synchronization logic verifies with zero errors

---

## 3. End-to-End Browser Validation

1. Start development server:
   ```bash
   npm run dev -- -H 0.0.0.0 -p 3000
   ```
2. Open browser at `http://localhost:3000`.
3. Inspect `document.body.classList`:
   - Verify that `style-nova` is present and no duplicate `style-*` classes exist.
4. Set cookie `document.cookie = "design-system-preview=comfort;path=/;"` and hard-refresh (`Ctrl+F5`):
   - Verify that the initial server-rendered HTML contains `class="... style-vega ..."` on `<body>`.
   - Verify there is no flash of unstyled content (FOUC).
5. Toggle dark/light mode:
   - Verify that `class="dark"` / `class="light"` on `<html>` toggles while `style-vega` remains on `<body>`.

