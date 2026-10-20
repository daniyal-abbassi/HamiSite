# CLI Contract: UI Craft Audit Scanner (041-ui-craft-rules)

**Date**: 2026-10-18  
**Feature**: [spec.md](../spec.md)  

---

## 1. Diagnostic Craft Scanner Invocation

### Command
```bash
node tools/craft/audit.mjs [options]
```

### Options
- `--scope <path>`: Limits scanning to a specific directory (e.g. `components/shop` or `app/`). Defaults to `components/` and `app/`.
- `--json`: Emits raw `CraftAuditReport` JSON conforming to `contracts/craft-rules-schema.json` to stdout.
- `--fix`: When possible, automatically suggests safe token replacements.
- `--fail-on-error`: Exits with code 1 if any `error` level violation is detected (for CI gates).

### Exit Codes
- `0`: Scan completed cleanly with zero error-level craft violations.
- `1`: One or more error-level craft violations detected (when `--fail-on-error` is specified) or scan execution error.

---

## 2. Terminal Output Format

```text
Scanning storefront UI for craft violations...
Scanned 48 files across components/ and app/

[FAIL] CRAFT-001-NO-ARBITRARY-VALUES:
  components/shop/ProductCard.tsx:42
  Found arbitrary pixel value: 'p-[13px]'
  Fix: Replace with token 'p-3' (12px) or 'p-4' (16px)

[WARN] CRAFT-002-TOUCH-TARGET:
  components/layout/CartButton.tsx:28
  Icon button size (32px) may be below 44px min touch target
  Fix: Add 'min-h-[44px] min-w-[44px]' or 'p-2.5'

Summary: 1 Error, 1 Warning. Audit failed.
```

