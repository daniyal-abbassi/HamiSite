# Implementation Plan: Refresh Persian Typography

**Branch**: `Hami-v3` | **Date**: 2026-10-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/038-persian-typography/spec.md`.

## Summary

Refresh Hami Hamrah's Persian typography across shopping and operational journeys. First capture the current rendering and compare two coherent treatments on the same real-content screens: a revised Estedad hierarchy and a Vazirmatn hierarchy, both using already self-hosted assets. Select the stronger treatment against the specification's readability and premium-brand criteria, then propagate a small shared role scale through existing styles and components. Preserve the current data and RTL behavior. Verify rendered screens, mixed-script content, number formatting, font fallback, and the constitution's quality gates.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 15.5.25 App Router, React 19.

**Primary Dependencies**: Existing Tailwind CSS v4 configuration, `app/globals.css`, self-hosted Estedad and Vazirmatn variable WOFF2 subsets, existing DM Mono Latin face, `lib/utils.ts` number formatting, and the installed FarsiUI Persian Typography guide. No new runtime dependency is planned.

**Storage**: Existing files only. No database model, migration, seed, or persisted preference is needed.

**Testing**: Real-browser review at mobile and desktop widths and 200% zoom; focused pure frontend tests only for changed formatting behavior; `npm run typecheck`, `npm run test:unit`, and `npm run build`. Browser review must confirm live client chunks and interaction after a build.

**Target Platform**: Public storefront, customer journeys, partner portal, admin back office, and Telegram mini-app in the existing web application.

**Project Type**: Single Next.js web application with shared styles and route-specific components.

**Performance Goals**: Readable first render and fallback with no obscured action or disruptive text shift. Measure representative before/after font requests and rendered layout rather than asserting an unmeasured score.

**Constraints**: Persian RTL by default, localized prices and quantities, accurate existing catalog facts, appropriate font rights, premium visual quality, preserved owner edits, and no destructive database commands. The design must address current small text in storefront and dense operational screens without making everything one size.

**Scale/Scope**: At least five main storefront screens plus representative account, partner, admin, and Telegram mini-app screens; headings, body, controls, captions, prices, tables, mixed-script content, and font loading. No content rewrite, payment-flow change, broad layout redesign, or new backend interface.

## Constitution Check

*Gate before Phase 0: pass. Re-checked after Phase 1: pass.*

| Principle or gate | Design response | Result |
| --- | --- | --- |
| I. Honest Interface | Typography changes preserve product facts and missing-data presentation; price formatting changes must not create values. | Pass |
| II. Persian RTL by Default | Maintain Persian digits and natural joining; isolate inherently Latin values without changing the surrounding Persian direction. | Pass |
| III. Database-backed Storefront | No change to catalog authority, data schema, API, or checkout logic. | Pass |
| IV. Luxury Quality Bar | Compare real screens, then use one deliberate hierarchy across surfaces; judge the result against premium editorial composition. | Pass |
| Definition of Done | Implementation must pass typecheck/build, interactive real-browser checks, phone/desktop review, 200% zoom, RTL, and visual quality. | Pass |

No constitutional exception is requested. This planning phase changes only feature documentation.

## Project Structure

### Documentation (this feature)

```text
specs/038-persian-typography/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/typography-contract.md
├── quickstart.md
├── checklists/requirements.md
└── tasks.md                       # Produced in the tasks phase
```

### Source Code (repository root)

```text
app/
├── globals.css                    # Current faces and shared visual rules
├── layout.tsx                     # Persian language and RTL document
├── (main)/                       # Shopping and customer pages
├── (admin)/                      # Back-office pages
└── (tma)/                        # Telegram mini-app pages
tailwind.config.ts                 # Shared font aliases
public/fonts/                      # Existing Estedad, Vazirmatn, DM Mono assets
components/
├── home/                          # Editorial display hierarchy
├── shop/                          # Catalog and product content
├── cart/ and checkout/            # Prices, totals, and form content
├── auth/, partners/, admin/, tma/  # Functional and dense surfaces
└── ui/                            # Shared controls
lib/utils.ts                       # Canonical visible price formatting
tests/unit/                        # Focused pure formatting checks if changed
```

**Structure Decision**: Extend existing design tokens and component styles rather than adding a typography package, database setting, or parallel design system. Preserve the existing FarsiUI rule and use its guidance as a review input. The untracked `lib/persian-typography.ts` belongs to earlier RTL work and must be inspected before any implementation edit; this feature does not assume it is authoritative.

## Phase 0: Research

[research.md](research.md) records the current font and style baseline, two candidate directions, asset-rights gate, mixed-script/number policy, and validation strategy. No planning clarification remains. The typeface selection is an explicit first implementation decision based on side-by-side real-screen evidence, not a silent return to a previously rejected font.

## Phase 1: Design and Contracts

[data-model.md](data-model.md) defines the design and review records without introducing persisted application entities. [Typography contract](contracts/typography-contract.md) defines observable text behavior for each role and surface. [Quickstart](quickstart.md) gives the end-to-end validation procedure.

**Post-design gate**: Pass. Existing assets and presentation paths support the design. The final font decision remains bounded by a measurable comparison and license verification before release; no scope, security, or data-model question remains unresolved.

## Implementation Sequence for the Tasks Phase

1. Capture baseline screens and computed typography; verify source and rights of both installed font families.
2. Compare two coherent type treatments on identical real-content storefront screens and select the better direction against spec criteria.
3. Establish shared typography roles, then update the core storefront journey and verify it independently.
4. Review mixed Persian/Latin text, numbers, prices, and tables against the observable contract.
5. Carry the approved hierarchy into customer, partner, admin, and Telegram mini-app screens.
6. Check font loading and fallback, 200% zoom, browser interaction, typecheck, unit tests where relevant, build, and owner side-by-side review.
