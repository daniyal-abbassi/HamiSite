# Phase 0 Research: Codebase Architecture Diagnostic & Deepening (040-codebase-architecture)

**Date**: 2026-10-18  
**Feature**: [spec.md](spec.md)

---

## 1. Architectural Vocabulary & Core Principles

### Decision
Adopt the exact architectural vocabulary and design principles from John Ousterhout's *A Philosophy of Software Design* and Matt Pocock's *improve-codebase-architecture* skill:

| Term | Precise Definition | Disallowed Substitutes |
| --- | --- | --- |
| **Module** | A cohesive unit of code with an interface and an implementation. | "Component" (when referring to non-UI modules), "service", "unit", "layer" |
| **Interface** | Everything a caller must know or specify to use the module. | "API" (for internal boundaries), "signature" |
| **Implementation** | The internal mechanics and state hidden behind the interface. | "Code", "internals" |
| **Depth** | The ratio of leverage: how much functionality and complexity is hidden behind a simple, small interface. | "Power", "abstraction level" |
| **Deep Module** | Simple interface hiding substantial complexity (high leverage, high locality). | "Solid service", "clean architecture" |
| **Shallow Module** | An interface nearly as complex as its implementation; thin pass-through or wrapper. | "Boilerplate wrapper", "middleman" |
| **Seam** | The boundary between two modules where behavior can be varied or substituted. | "Boundary", "abstraction" |
| **Adapter** | Concrete implementation fitting a specific environment behind a seam (e.g., Postgres vs In-memory). | "Driver", "provider" |
| **Leverage** | High value delivered to N call sites through 1 consolidated interface. | "Reusability", "DRY" |
| **Locality** | Related code and state live together; bugs and changes concentrate in one place rather than leaking across callers. | "Cohesion" |

### Core Evaluation Tests
1. **The Deletion Test**: Does deleting or collapsing this module concentrate complexity productively, or merely scatter it across call sites?
   - *Signal*: If deleting a thin wrapper removes redundant mappings and places logic directly in the owning deep module, it is a shallow module that should be deepened.
2. **The Seam Justification Rule**: "One adapter = hypothetical seam; two adapters = real seam."
   - *Signal*: A seam with only a single implementation is speculative complexity unless a second adapter (e.g., local test substitute or distinct provider) already exists or is actively required.

---

## 2. Codebase Scan Strategy & Hot Spot Detection

### Decision
Scope the scan before analyzing code to follow YAGNI (You Aren't Gonna Need It). Deepening a module is only valuable if that module changes or creates maintenance friction.

### Rationale
- Inspect recent Git commit history (`git log --oneline -n 100`) to find frequently modified files and subsystems.
- Rank areas by churn and dependency density:
  - High Churn Subsystems in recent commits: Storefront catalog queries (`lib/catalog-db.ts`, `lib/home-rails-db.ts`), Cart/Auth state providers (`components/providers/AuthProvider.tsx`, `components/providers/CartProvider.tsx`), and shop filtering (`components/shop/FilterSidebar.tsx`, `ShopResults.tsx`).
  - Known God Nodes & Leaks: Modules where callers must perform multi-step orchestration (e.g., calculating discount eligibility across raw product arrays before rendering rails).

### Alternatives Evaluated
- *Full-tree static AST scan*: Rejected as primary method because it flags stable, working, rarely-touched utilities that have zero ongoing architectural cost.
- *Purely heuristic rule checkers (ESLint)*: Rejected because shallow modules and leaking seams are semantic design issues, not syntactic lint errors.

---

## 3. Visual HTML Report Architecture

### Decision
Generate a standalone HTML file in the operating system temporary directory (`$TMPDIR` or `/tmp`), using CDN-hosted Tailwind CSS for styling and CDN-hosted Mermaid.js for diagrams, combining declarative flowcharts with hand-crafted CSS/SVG schematics.

### Rationale
- **Zero Repo Pollution**: Output is written to `<tmpdir>/architecture-review-<timestamp>.html`. It does not create uncommitted artifacts in the git working tree.
- **Visual Mass & Call Flow**:
  - Use **Mermaid flowcharts** for call graphs, dependency cycles, and leaking seams (highlighting leaks in red `#dc2626`).
  - Use **Hand-crafted CSS/SVG** for module depth comparisons (mass diagrams comparing interface width vs implementation height).
- **Side-by-side Before/After**: Every candidate card directly contrasts current shallowness with proposed depth.

### Alternatives Evaluated
- *Markdown-only summary in chat*: Rejected because complex multi-module seam leaks cannot be effectively visualized in plain text without visual spatial comparison.
- *Dedicated React dev server report*: Rejected because it requires starting extra daemons and ports, violating zero-overhead principles.

---

## 4. Grilling Loop & Domain Synchronization

### Decision
Implement an interactive decision workflow that walks the decision tree for selected candidates before code edits, updating `GLOSSARY.md` for domain terms and offering to record rejected candidates as Architecture Decision Records (ADRs) in `docs/adr/`.

### Rationale
- Prevents architectural churn by forcing explicit trade-off evaluation.
- When the owner rejects a candidate with an enduring rationale (e.g., "Prisma models are intentionally exposed to Server Components per Principle III"), saving it in `docs/adr/` ensures future agent sessions never re-suggest the same refactoring.

