# CLI & Workflow Contract: Architectural Review (040-codebase-architecture)

**Date**: 2026-10-18  
**Feature**: [spec.md](../spec.md)

---

## 1. Diagnostic Scanner Invocation

### Command
```bash
node tools/architecture/scan.mjs [options]
```

### Options
- `--scope <path>`: Limits hotspot scanning to a specific directory (e.g. `lib/` or `components/`).
- `--out <path>`: Overrides report destination (defaults to `$TMPDIR/architecture-review-<timestamp>.html`).
- `--json`: Emits raw `ArchitecturalReviewReport` JSON to stdout.
- `--open`: Automatically opens the generated HTML file in the default browser (`xdg-open` / `open` / `start`).

### Exit Codes
- `0`: Scan completed successfully; report generated.
- `1`: Error reading git history or writing temp file.

---

## 2. Interactive Grilling Workflow

### Command
```bash
node tools/architecture/grill.mjs --candidate <candidate-id>
```

### Interactive Steps
1. **Deletion Test Verification**: Prompt evaluation: "If this module is deleted, does complexity concentrate or scatter?"
2. **Seam & Adapter Check**: Verifies if 2 adapters exist for the seam.
3. **Glossary Alignment**: Prompts to add newly defined concepts to `GLOSSARY.md`.
4. **ADR Recording**: If the proposal is rejected for enduring reasons, prompts to generate an ADR draft in `docs/adr/`.

