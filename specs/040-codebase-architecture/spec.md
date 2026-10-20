# Feature Specification: Codebase Architecture Diagnostic & Deepening (مرتب کردن معماری پروژه)

**Feature Branch**: `040-codebase-architecture`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "https://farsiui.ir/skills/improve-codebase-architecture"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Architectural Scan & Visual Deepening Report (Priority: P1)

As a project developer or lead architect, I want an automated diagnostic scan of the codebase that identifies architectural friction, shallow modules, and leaking seams, presenting them in a self-contained visual HTML report with Before/After diagrams, so that I can clearly understand where structural complexity lives without sifting through thousands of lines of source code.

**Why this priority**: Delivers immediate, high-leverage visibility into codebase health and architectural debt without risking any code regressions or modifying production files.

**Independent Test**: Can be fully tested by running the architectural scanner across the repository; it generates a standalone HTML report in the OS temp directory containing concrete candidates with valid Before/After Mermaid and structural diagrams, leaving the repository working tree clean.

**Acceptance Scenarios**:

1. **Given** a repository with commit history and domain modules, **When** the architecture scanner is executed, **Then** it identifies hotspots and friction points (shallow wrappers, scattered calls, leaking seams) and produces a standalone HTML file at `<tmpdir>/architecture-review-<timestamp>.html`.
2. **Given** the generated HTML report, **When** viewed in any standard web browser, **Then** it renders a structured dashboard featuring candidate cards with recommendation badges (`Strong`, `Worth exploring`, `Speculative`), affected file lists, concise problem/solution statements, locality/leverage wins, and side-by-side Before/After architectural diagrams.
3. **Given** existing architectural records in `docs/adr/`, **When** a candidate touches an area governed by an ADR, **Then** the report explicitly highlights the ADR relationship or warning callout rather than silently ignoring established decisions.

---

### User Story 2 - Architectural Grilling & Domain Alignment (Priority: P2)

As a project owner or developer, I want to review the top candidate deepening opportunities through an interactive decision tree (grilling loop), so that we rigorously evaluate constraints, test surfaces, seams, and adapters before any code is changed.

**Why this priority**: Prevents premature or churn-heavy refactorings; ensures every architectural seam earns its place (the "two adapters justify a seam" rule), updates the project domain glossary (`GLOSSARY.md`), and captures trade-offs in ADRs.

**Independent Test**: Can be tested by selecting an architectural candidate from the report; the system conducts an interactive evaluation of boundaries, updates or creates `GLOSSARY.md` for newly defined domain concepts, and documents any rejected proposals as durable ADRs in `docs/adr/`.

**Acceptance Scenarios**:

1. **Given** a selected candidate deepening opportunity from the report, **When** the grilling loop is initiated, **Then** the system interrogates the deletion test ("does deleting this module concentrate complexity or just scatter it?"), verifies adapter justifications, and details what logic stays behind the seam.
2. **Given** a candidate that sharpens or introduces a domain term, **When** the decision crystallizes, **Then** the term and its precise definition are added to `GLOSSARY.md`.
3. **Given** a candidate that is rejected with an enduring architectural rationale, **When** prompted by the user, **Then** the decision is recorded as an ADR in `docs/adr/` so future scans do not re-suggest the rejected pattern.

---

### User Story 3 - Targeted Deepening Execution & Quality Verification (Priority: P3)

As a maintainer, I want approved deepening refactorings implemented cleanly, transforming shallow pass-through modules into deep modules with simple interfaces and cohesive implementations, while maintaining 100% functional and visual correctness.

**Why this priority**: Directly realizes the maintenance, testability, and AI-navigability benefits of deep modules while strictly guarding against regressions in shopping flows, administrative tools, or Persian typography.

**Independent Test**: Can be tested by executing an approved candidate refactoring; all affected unit tests continue to pass, TypeScript compiles with zero errors, and the resulting module interface demonstrates reduced surface area for callers.

**Acceptance Scenarios**:

1. **Given** an approved deepening plan for a shallow module, **When** the refactoring is executed, **Then** the public interface is narrowed to a focused set of operations, internal implementation details are hidden behind the seam, and callers no longer need to coordinate multi-step plumbing.
2. **Given** an executed deepening change, **When** automated quality gates are run (`npm run typecheck`, `npm run test:unit`, `git diff --check`), **Then** all checks pass cleanly with zero regression in business logic or client hydration.

---

### Edge Cases

- **Contradicting an Existing ADR**: When a deepening candidate contradicts a previously ratified ADR in `docs/adr/`, the report MUST NOT discard it silently nor propose it blindly; it must feature an amber warning badge stating the conflict and justifying why reopening the decision is warranted by real measured friction.
- **Scattered Commit History**: When recent git log history shows uniform or diffuse commits without an obvious hotspot, the scanner falls back to core domain seams (catalog read pipelines, checkout state machines, authentication and cart providers).
- **Next.js App Router Boundary Constraints**: Deepening cannot naively collapse Client Component and Server Component boundaries. Server-only database actions and client-side interactive state must preserve their required boundary decorators (`"use client"`) without leaking database secrets to client bundles.
- **No Existing GLOSSARY.md**: If `GLOSSARY.md` does not yet exist in the repository root, the system initializes it lazily upon the first ratified domain term.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST inspect recent repository commit history and module structures to locate architectural friction, specifically identifying shallow modules (where the interface is nearly as complex as the implementation), leaking seams, and scattered calls.
- **FR-002**: The system MUST generate a self-contained, offline-viewable HTML report in the OS temporary directory (`<tmpdir>/architecture-review-<timestamp>.html`) without writing artifacts into the repository source tree.
- **FR-003**: The generated HTML report MUST include:
  - Header with repository title, scan timestamp, and visual legend (solid module, dashed seam, red leak, deep gradient).
  - Individual candidate cards for each identified deepening opportunity.
  - A prominent "Top Recommendation" card highlighting the highest-leverage candidate with rationale.
- **FR-004**: Each candidate card in the report MUST detail:
  - Concise title describing the deepening action.
  - Recommendation strength badge (`Strong`, `Worth exploring`, `Speculative`).
  - Monospaced list of involved files and modules.
  - One-sentence problem statement and one-sentence solution statement.
  - Wins expressed in strict architectural terms (locality, leverage, interface reduction, test surface).
  - Side-by-side Before and After visual diagrams using Mermaid flowcharts and/or hand-crafted CSS/SVG structures.
- **FR-005**: The system MUST adhere strictly to the standardized architectural vocabulary: `module`, `interface`, `depth`, `deep`, `shallow`, `seam`, `adapter`, `leverage`, and `locality`. It MUST NOT substitute vague terms such as "service", "component" (when referring to architectural modules), "API" (for internal interfaces), or "cleaner code".
- **FR-006**: The system MUST apply the **deletion test** to candidate modules: verifying whether deleting or collapsing the module concentrates complexity effectively or merely shifts it around.
- **FR-007**: The system MUST provide an interactive grilling workflow for user-selected candidates to evaluate boundary conditions, caller dependencies, test surfaces, and adapter justifications ("one adapter = hypothetical seam; two = real seam").
- **FR-008**: The system MUST synchronize domain terminology with `GLOSSARY.md`, updating or creating the glossary when new concepts emerge during architectural review.
- **FR-009**: The system MUST support recording permanently rejected candidates or load-bearing trade-offs as architectural decision records in `docs/adr/`.
- **FR-010**: Any approved implementation MUST preserve all constitution rules (honest interface facts, Persian RTL, Prisma database source of truth, luxury visual standards) and verify clean passes across `npm run typecheck` and `npm run test:unit`.

---

### Key Entities

- **DeepeningCandidate**: An architectural refactoring proposal characterized by a title, recommendation badge, participating files, problem statement, solution statement, locality/leverage wins, Before/After diagrams, and optional ADR cross-references.
- **ArchitecturalReport**: The standalone visual document encapsulating scanned candidate cards, visual legend, and the primary top recommendation.
- **ArchitecturalSeam**: The abstraction boundary separating distinct modules, evaluated by whether it represents a real seam (multiple adapters, e.g., prod DB vs in-memory test) or a hypothetical seam that should be collapsed.
- **DomainConcept**: A ubiquitous language term defined in `GLOSSARY.md` representing business invariants and naming conventions.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The architectural scanner completes its repository inspection and generates a complete HTML report file in under 60 seconds without creating uncommitted files in the git workspace.
- **SC-002**: 100% of candidate cards in the generated report contain complete side-by-side Before/After architectural visualizations (Mermaid or custom SVG/HTML).
- **SC-003**: 100% of reported wins and problems use exact architectural terms (`module`, `interface`, `depth`, `seam`, `adapter`, `leverage`, `locality`) without generic placeholders.
- **SC-004**: The report includes at least 3 distinct deepening candidates spanning different areas of recent activity, ranked with clear recommendation badges.
- **SC-005**: Executing any approved candidate refactoring results in a demonstrable reduction of caller interface surface area while maintaining 100% green test and typecheck suites (zero regressions in existing 608 unit tests).

---

## Assumptions

- Recent git history (`git log --oneline`) is available and represents active areas of developer focus.
- The operating system provides a standard temporary directory accessible via environment variables (`TMPDIR`, `/tmp`, or `TEMP`).
- An interactive browser environment or local viewing capability is available to render the generated HTML report.
- Existing database schemas and Prisma models remain the authority for persistence and are not altered during pure architectural refactoring unless explicitly approved by the owner.

