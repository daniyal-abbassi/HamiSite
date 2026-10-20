# Project Domain & Architecture Glossary (GLOSSARY.md)

This glossary records the canonical terminology used across Hami Hamrah codebase architecture, domain logic, and decision records.

---

## 1. Architectural Vocabulary

These terms are grounded in John Ousterhout's *A Philosophy of Software Design* and define the architectural evaluation standards:

- **Module**: A cohesive unit of code with an interface and an implementation. Never substitute "service", "component" (when referring to non-UI modules), or "layer".
- **Interface**: Everything a caller must know or specify to use the module. Represents the contract and primary test surface.
- **Implementation**: The internal mechanics, data structures, and private routines hidden behind the interface.
- **Depth**: The ratio of leverage: how much functionality and complexity is hidden behind a simple, small interface.
- **Deep Module**: A module whose interface is significantly simpler than its implementation (high leverage, high locality).
- **Shallow Module**: A module whose interface is nearly as complex as its implementation (thin pass-through, wrapper with low leverage).
- **Seam**: The abstraction boundary separating two modules where behavior can be varied or substituted. Justified only when at least two adapters exist or are actively required.
- **Adapter**: A concrete implementation fitting a specific environment behind a seam (e.g. Postgres adapter vs In-memory test adapter).
- **Leverage**: High value delivered to N call sites through 1 consolidated interface.
- **Locality**: Related state and logic live together; bugs and changes concentrate in one module rather than scattering across callers.

---

## 2. Business Domain Vocabulary

- **Storefront Session Seam**: Unified client boundary coordinating user identity lifecycle, token persistence, and cart instance synchronization. *(Owning Module: `components/providers/AuthProvider.tsx`)*
- **Catalog Projection**: Public-safe transformation of database product records, excluding internal supplier IDs, barcodes, and cost per item.
- **Discount Offer Rail**: Curated collections of active discounted products displayed on the homepage with verified availability.
- **Cart Session**: Ephemeral or customer-bound basket containing line items, quantities, and pricing calculations in Toman.
- **Partner Bundle**: B2B wholesale package consisting of bundled hardware units with tiered volume pricing, restricted to verified wholesale accounts.
- **Toman Price**: Standardized Iranian currency representation rendered in Persian numerals (`fa-IR`) with `تومان` symbol.
