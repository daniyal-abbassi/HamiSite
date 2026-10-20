# Quickstart: UI Craft Rules & Quality Verification (041-ui-craft-rules)

**Date**: 2026-10-18  
**Feature**: [spec.md](spec.md)  

This guide documents the procedures for scanning storefront interfaces for craft violations, verifying touch targets and aspect ratios, and ensuring zero layout shift.

---

## Scenario 1: Run Automated UI Craft Audit Scan

### Command
```bash
node tools/craft/audit.mjs
```

### Expected Outcome
- The audit tool scans all `.tsx` and `.jsx` files under `components/` and `app/`.
- Verifies absence of arbitrary Tailwind bracket classes (`p-[*px]`, `m-[*px]`, `gap-[*px]`, `text-[*px]`).
- Verifies touch target adequacy on interactive buttons and icon toggles.
- Emits structured report with zero error-level violations.

---

## Scenario 2: Validate JSON Schema Conformance

### Command
```bash
node tools/craft/audit.mjs --json > /tmp/craft-audit.json
node -e '
const fs = require("fs");
const report = JSON.parse(fs.readFileSync("/tmp/craft-audit.json", "utf8"));
if (!Array.isArray(report.violations) || typeof report.scanned_files_count !== "number") {
  console.error("Schema validation failed");
  process.exit(1);
}
console.log("✓ Audit JSON conforms to schema");
'
```

---

## Scenario 3: Verify Touch Targets and Mobile Viewports

### Procedure
1. Open the storefront in Chrome/browser at 360px viewport width (e.g. mobile emulation).
2. Inspect primary interactive controls:
   - Header cart button and search triggers.
   - Filter chips and sheet triggers in `/shop`.
   - Product card "Add to Cart" and variant selectors.
   - Modal/drawer close buttons.
3. Verify each control's computed bounding box satisfies `width >= 44px` and `height >= 44px`.

---

## Scenario 4: Run Quality Gates

```bash
# 1. Typecheck
npm run typecheck

# 2. Unit test suite
npm run test:unit

# 3. Clean git diff check
git diff --check
```

