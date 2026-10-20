# Quickstart: Architectural Review & Deepening (040-codebase-architecture)

**Date**: 2026-10-18  
**Feature**: [spec.md](spec.md)

This guide documents the end-to-end procedure for scanning codebase architecture, reviewing visual deepening candidates, and executing grilling/decision loops.

---

## Prerequisites
- Node.js >= 20.x installed.
- Git repository with commit history.
- Browser or HTML viewer available.

---

## Scenario 1: Generate Visual Architectural HTML Report

### Command
```bash
node tools/architecture/scan.mjs
```

### Expected Outcome
1. Scanner inspects git commit history for recent hotspots (`git log --oneline -n 100`).
2. Identifies at least 3 distinct deepening candidates (e.g., catalog read projections, cart/auth providers, filter controls).
3. Produces a self-contained HTML file in `/tmp/architecture-review-<timestamp>.html`.
4. Console reports:
   ```text
   Architecture report generated at: /tmp/architecture-review-20261018-075000.html
   Top Recommendation: [Candidate Title]
   ```
5. Opening the report in a browser displays:
   - Header with visual legend (seams, leaks, deep modules).
   - Candidate cards with side-by-side Mermaid Before/After diagrams.
   - Recommendation badges (`Strong`, `Worth exploring`, `Speculative`).

---

## Scenario 2: Validate Report Schema Conformance

### Command
```bash
node tools/architecture/scan.mjs --json > /tmp/report.json
npx ajv-cli validate -s specs/040-codebase-architecture/contracts/report-schema.json -d /tmp/report.json
```

### Expected Outcome
- The output JSON validates cleanly against `contracts/report-schema.json`.

---

## Scenario 3: Conduct Grilling Loop on a Selected Candidate

### Command
```bash
node tools/architecture/grill.mjs --candidate cand-catalog-query-deepening
```

### Expected Outcome
- Interactive prompt evaluates the deletion test and verifies adapter count.
- If approved, prompts to add any new terms to `GLOSSARY.md`.
- If rejected, prompts to generate an ADR in `docs/adr/`.

---

## Scenario 4: Quality Gate Verification Post-Deepening

After applying an approved candidate refactoring:

```bash
# 1. Typecheck
npm run typecheck

# 2. Unit test suite
npm run test:unit

# 3. Clean diff boundaries
git diff --check
```

### Expected Outcome
- All 608+ tests pass, 0 TypeScript errors, clean git diff.

