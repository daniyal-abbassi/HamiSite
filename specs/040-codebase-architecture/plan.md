# Implementation Plan: Codebase Architecture Diagnostic & Deepening (مرتب کردن معماری پروژه)

**Branch**: `040-codebase-architecture` | **Date**: 2026-10-18 | **Spec**: [specs/040-codebase-architecture/spec.md](spec.md)

**Input**: Feature specification from `specs/040-codebase-architecture/spec.md` and skill instructions from `improve-codebase-architecture`.

---

## Summary

Surface architectural friction and propose **deepening opportunities** that transform shallow modules into deep ones with simple interfaces and high locality. The feature delivers:
1. An automated repository scanner that detects hot spots in recent git history and identifies shallow modules, leaking seams, and low-locality helpers.
2. A self-contained, visual HTML report (`<tmpdir>/architecture-review-<timestamp>.html`) with side-by-side Before/After Mermaid and structural diagrams.
3. An interactive grilling workflow to validate candidate seams, ensure domain vocabulary alignment in `GLOSSARY.md`, and record decisions in `docs/adr/`.
4. High-leverage module deepening that simplifies caller interfaces and strengthens the test surface while preserving 100% of existing business and visual invariants.

---

## Technical Context

**Language/Version**: Node.js 22.x (ESM), TypeScript 5.8+  
**Primary Dependencies**: Next.js 15.5.25 (App Router), React 19, Tailwind CSS (via CDN in report), Mermaid.js (via CDN in report), Prisma 6.5.0  
**Storage**: None for diagnostic tool; PostgreSQL via Prisma for application domain entities  
**Testing**: Vitest (`npm run test:unit`), Playwright for visual/browser verification  
**Target Platform**: Linux development environment, modern web browsers (Chrome/Chromium)  
**Project Type**: Full-stack Next.js web application + diagnostic tooling scripts  
**Performance Goals**: Diagnostic scan and HTML report generation in < 30 seconds; 0 external runtime server dependencies for report viewing  
**Constraints**: Zero repo pollution during scan (HTML output in OS temp directory); strict architectural vocabulary (`module`, `interface`, `depth`, `seam`, `adapter`, `leverage`, `locality`); no breaking changes to database schemas  
**Scale/Scope**: Entire codebase with initial focus on recent hotspot areas (`lib/catalog-db.ts`, `components/providers/`, `components/shop/`)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Plan Alignment | Status |
| --- | --- | --- | :---: |
| **I. Honest Interface** | UI must not assert unsupported data or fake stock/prices | Deepened catalog and cart modules preserve all stock checks and «تماس بگیرید» fallbacks | **PASS** |
| **II. Persian RTL** | Primary experience in Persian (`fa-IR`), logical CSS | Any deepened UI or report summary respects Persian RTL and Toman currency formatting | **PASS** |
| **III. DB Source of Truth** | PostgreSQL/Prisma is authority for catalog/accounts | Deepening internal query pipelines preserves Prisma models and additive data integrity | **PASS** |
| **IV. Luxury Quality Bar** | Refined, premium visual standards | Visual HTML report adheres to editorial, high-craft aesthetic; zero template clichés | **PASS** |

*Post-Design Evaluation*: All gates pass without requiring constitutional amendments or complexity exemptions.

---

## Project Structure

### Documentation (this feature)

```text
specs/040-codebase-architecture/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Phase 0 architectural research & vocabulary rules
├── data-model.md        # Phase 1 data entities and lifecycle states
├── quickstart.md        # Phase 1 runnable validation scenarios
├── contracts/           # Phase 1 schemas and CLI contracts
│   ├── report-schema.json
│   └── cli-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 task breakdown (generated via /speckit-tasks)
```

### Source Code (repository root)

```text
tools/architecture/
├── scan.mjs             # Diagnostic scanner and HTML report generator
├── grill.mjs            # Interactive grilling decision loop
└── templates/
    └── report.html.mjs  # Self-contained HTML report template with Tailwind + Mermaid

lib/
├── catalog-db.ts        # Primary catalog read and discount calculation module
└── content/contact.ts   # Verified contact facts

components/
├── providers/
│   ├── AuthProvider.tsx # Deepened session & identity provider
│   └── CartProvider.tsx # Deepened cart & sync provider
└── shop/                # Shop and catalog visual modules

docs/adr/                # Architectural Decision Records
GLOSSARY.md              # Ubiquitous domain language dictionary
```

**Structure Decision**: The diagnostic scanner and report generator live under `tools/architecture/`, completely decoupled from runtime application code. Any deepened application modules remain in their canonical locations under `lib/` and `components/`.

---

## Complexity Tracking

> No constitution violations. Pure architectural deepening reduces net complexity by consolidating shallow wrappers into deep modules.
