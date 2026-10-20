# Data Model: Codebase Architecture Diagnostic & Deepening (040-codebase-architecture)

**Date**: 2026-10-18  
**Feature**: [spec.md](spec.md)

---

## 1. DeepeningCandidate

Represents an identified architectural friction point and the proposed refactoring that transforms shallow wrappers into deep modules.

### Attributes
- `id`: Unique identifier (e.g. `cand-catalog-query-deepening`).
- `title`: Short, active verb phrase naming the deepening (e.g., "Deepen Catalog Query Pipeline").
- `recommendation_strength`: Enum (`Strong` | `Worth exploring` | `Speculative`).
- `dependency_category`: Enum (`in-process` | `local-substitutable` | `ports & adapters` | `mock`).
- `affected_files`: List of involved source paths (relative to repo root).
- `problem_statement`: Single sentence describing the friction/shallowness.
- `solution_statement`: Single sentence describing the architectural deepening.
- `wins`: Array of short bullet points (<= 6 words each) grounded in architectural terms (locality, leverage, interface shrink, test surface).
- `visualizations`: Object containing `before` and `after` diagram definitions (Mermaid markup or SVG schema).
- `adr_relationship`: Optional object with `adr_id`, `status` (`aligns` | `contradicts`), and `reopen_rationale`.

### Validation Rules
- Must use exact architectural vocabulary (`module`, `interface`, `depth`, `seam`, `adapter`, `leverage`, `locality`).
- Problem and solution statements must each be exactly one concise sentence.
- Must include both before and after visual specifications.

---

## 2. ArchitecturalReport

Represents the self-contained HTML review artifact generated in the OS temp directory.

### Attributes
- `report_id`: Unique identifier with timestamp (`architecture-review-<timestamp>`).
- `repository_name`: String (e.g. `HamiSite-basic-structure`).
- `generated_at`: ISO 8601 timestamp.
- `hotspots_inspected`: List of directories or modules identified from commit churn.
- `candidates`: Array of `DeepeningCandidate` instances.
- `top_recommendation_id`: ID of the single candidate recommended for immediate action.
- `top_recommendation_rationale`: Single sentence explaining why this candidate provides highest leverage.
- `file_path`: Absolute path in OS temp directory (`/tmp/architecture-review-<timestamp>.html`).

---

## 3. ArchitecturalSeam

Represents an abstraction boundary separating two or more modules.

### Attributes
- `seam_id`: Unique identifier.
- `caller_module`: String identifier.
- `provider_module`: String identifier.
- `adapters`: Array of concrete implementations behind this seam.
- `justification_status`: Enum (`real` [>= 2 adapters] | `hypothetical` [1 adapter] | `leaking` [implementation details exposed]).
- `deletion_test_outcome`: Enum (`concentrates_complexity` | `scatters_complexity`).

---

## 4. DomainConcept

Represents a ubiquitous domain language entry managed in `GLOSSARY.md`.

### Attributes
- `term`: The canonical domain name (e.g., `OrderIntake`, `DiscountOfferRail`).
- `definition`: Precise description of business responsibility and invariants.
- `owning_module`: The deep module responsible for this domain concept.
- `created_at`: ISO 8601 timestamp.
- `status`: Enum (`active` | `deprecated`).

---

## 5. Lifecycle States

```text
[Identified in Hotspot Scan] 
         │
         ▼
[Report Generated (HTML)] 
         │
         ▼
[Grilling Decision Tree]
    ├─── Rejected ──► [Record in docs/adr/ (if permanent)]
    │
    └─── Approved ──► [Deepen Module] ──► [Update GLOSSARY.md] ──► [Run Quality Gates]
```

