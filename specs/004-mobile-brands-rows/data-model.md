# Data Model: Mobile Brands Row Presentation

Phase 1 output. This feature introduces no persistence and no schema — it defines a **view model** for one
section and corrects an identity mapping. All source data is read-only from the static seam (Principle III).

## Brand identity — the corrected mapping

The authoritative source of a brand's destination is the catalog, not a hand-written string. Each row binds
three independently-sourced facts.

| Field | Source of truth | Verified value for the six |
|---|---|---|
| `id` | `data/hami-products.json` → product `brand.id` | resolved at read time, never hard-coded |
| `slug` | `lib/catalog.ts` → `slugify(brand.name)`, **Persian names** | `اپل`, `سامسونگ`, `شیائومی`, `تی-سی-اچ`, `نوکیا`, `ریلمی` |
| `href` | `lib/content/home.ts` — the shareable Latin form | `/shop?brand=apple` … retained |
| `label` | `components/brand/BrandMarks.tsx` | اپل، سامسونگ، شیائومی، تی‌سی‌اچ، نوکیا، ریلمی |
| `mark` | `components/brand/BrandMarks.tsx` | 6 exist; all six selected brands have one |
| `story` | `lib/content/home.ts` → `brandStories` | present for APPLE, SAMSUNG, XIAOMI only |
| `productCount` | derived from the catalog | 49, 42, 30, 23, 3, 1 |

**Rule:** `href` is presentation. Resolution goes `href slug → stored slug → catalog brand`. A row whose
brand cannot be resolved to a catalog id MUST NOT render as a link.

**Why this exists:** the `slug` column is what was missing. Hrefs were authored in Latin, the API emits
Persian, and nothing connected them — so every brand link silently returned the full catalogue.

## Entities

### BrandRow — one row in the section

| Attribute | Type | Rule | Source |
|---|---|---|---|
| `brand` | identity above | MUST resolve to a catalog id with ≥1 product | FR-002 |
| `index` | ordinal | rendered in **Persian digits**, ordered for RTL | FR-024, 001/FR-011 |
| `label` | text | Persian, no letter-spacing | 001/FR-057, FR-023 |
| `mark` | asset or none | authentic mark only; never generated | FR-026, FR-027 |
| `story` | text or absent | shown when present; absence never signalled | FR-004 |
| `destination` | route | first press navigates | FR-012 |
| `emphasisControl` | separate target | own label, own focus, ≥ thumb-comfortable | FR-016 |

### EmphasisState — section-level, exactly one holder

```
resting ──press expand control──▶ emphasised
emphasised ──press same control──▶ resting
emphasised(A) ──press control(B)──▶ emphasised(B)      [A releases in the same frame]
emphasised ──press outside / scroll away / navigate──▶ resting
```

Invariants: at most one row emphasised at a time (FR-007); no intermediate both/neither state (FR-008);
release is reachable by every input method (FR-009); row geometry does not shift siblings (FR-011, D5).

### ResolutionOutcome — the new, explicit failure state

| Outcome | Condition | Rendering |
|---|---|---|
| `resolved` | slug matched a catalog brand | filtered listing, brand named |
| `unknown-brand` | slug present, no match | **explicit empty state naming the requested brand** — never an unfiltered catalogue |
| `not-requested` | no slug param | full catalogue, correct behaviour |

`unknown-brand` is the whole point of the fix: today it is silently reported as `not-requested`.

## Validation rules

| Rule | Enforcement |
|---|---|
| Every row destination resolves to ≥1 product | unit-testable pure function over the mapping table |
| No row renders a generated or invented mark | review gate; FR-027 |
| Story absence produces no disabled/dimmed/pending styling | FR-004, browser-verified |
| Persian digits everywhere a number appears | FR-024, browser-verified |
| No letter-spacing on Persian labels | 001/FR-057, browser-verified via computed style |
| Nothing animates while off screen | FR-017, browser-verified |

## Scope note

The eight `CategoryHub` hrefs share the defective resolution line. They are corrected by the same change
because leaving one half of a single bug in place would keep the silent fallback alive, but category
*presentation* remains feature 005's scope. No category entity is defined here.
