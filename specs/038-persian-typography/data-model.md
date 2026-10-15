# Data Model: Typography Roles and Review Evidence

**Feature**: [spec.md](spec.md)

This presentation feature introduces no database entities, migration, API payload, or persisted user preference. The following records describe design and verification artifacts for implementation.

## Typography role

| Field | Meaning | Constraint |
| --- | --- | --- |
| Role | Display, page heading, section heading, body, support, label, control, caption, price, or numeric data | Every sampled text element has one primary role |
| Script context | Persian, Latin, or mixed | Persian remains the default; Latin runs keep official spelling |
| Visual parameters | Selected family, real weight, size, line height, spacing | Persian joining remains intact; no synthetic weight dependency |
| Surface context | Storefront, customer, partner, admin, or Telegram mini-app | Same role is recognizably consistent; contextual density may vary |

## Review sample

| Field | Meaning | Constraint |
| --- | --- | --- |
| Route and state | Real screen and relevant state (for example long name or validation error) | Include the five core storefront screens and functional surfaces |
| Viewport and zoom | Phone, desktop, and 200% zoom observations | Record the tested size rather than inferring it |
| Content case | Persian paragraph, mixed name/code, price/quantity, long label, or dense numeric row | At least 20 mixed-script examples across the full review set |
| Candidate | Baseline, revised Estedad, or Vazirmatn treatment | Compare identical content and viewport |
| Observation | Legibility, ordering, clipping, fallback, and premium-fit result | Record evidence for pass/fail and owner preference |

## Review outcome

Each review sample is **unreviewed → pass or finding → corrected → rechecked**. A finding cannot be closed from a source-only change. The selected treatment also records the upstream source and rights for the font assets used. This record can live in the feature's implementation evidence; it does not become application data.
