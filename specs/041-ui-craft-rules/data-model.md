# Data Model: UI Craft Rules & Quality Enhancement (041-ui-craft-rules)

**Date**: 2026-10-18  
**Feature**: [spec.md](spec.md)  

---

## 1. CraftRule

Represents a codified quality rule defined in `ui-craft-rules`.

### Attributes
- `id`: String identifier (e.g. `CRAFT-001-TOUCH-TARGET`, `CRAFT-002-NO-ARBITRARY-VALUES`, `CRAFT-003-RESERVE-SPACE`).
- `name`: Short descriptive title.
- `category`: Enum (`Design System` | `Layout` | `Typography` | `Color` | `Icons` | `Interaction` | `Content` | `Production`).
- `severity`: Enum (`error` | `warning`).
- `description`: The precise constraint and enforcement rule.
- `regex_pattern`: Optional RegExp string used by the audit tool to flag violations.

---

## 2. CraftViolation

Represents a detected deviation during the automated audit scan.

### Attributes
- `rule_id`: String (references `CraftRule.id`).
- `file_path`: Relative path from repository root (e.g. `components/shop/ProductCard.tsx`).
- `line_number`: Integer (1-indexed).
- `snippet`: The offending code excerpt.
- `suggested_fix`: Concrete remediation suggestion (e.g. "Replace `p-[13px]` with `p-3` (12px) or `p-4` (16px)").

---

## 3. LayoutReservation

Represents the space reservation geometry for an asynchronous media element.

### Attributes
- `element_type`: Enum (`image` | `skeleton` | `video` | `card`).
- `aspect_ratio`: String (e.g. `1/1` for square product cards, `16/9` for banners, `4/3` for editorial).
- `min_height`: Optional CSS length value.
- `cls_impact`: Number representing expected layout shift prevention (0.00).

---

## 4. TouchTargetConstraint

Represents the physical and interactive geometry of a user-facing interactive control.

### Attributes
- `target_id`: String identifier (e.g. `cart-toggle-btn`, `product-card-action`).
- `visual_dimensions`: Object with `width` and `height` in pixels (e.g. `24x24`).
- `interactive_dimensions`: Object with `width` and `height` in pixels (MUST be >= `44x44`).
- `padding_technique`: Enum (`utility-padding` | `pseudo-inset` | `wrapper-dimensions`).

---

## 5. AuditReport

Represents the overall outcome of `tools/craft/audit.mjs`.

### Attributes
- `scanned_files_count`: Integer.
- `violations`: Array of `CraftViolation`.
- `passed`: Boolean (`true` if error count === 0).
- `summary`: Object with counts by category and severity.

