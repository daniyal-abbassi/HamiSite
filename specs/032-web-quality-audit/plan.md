# Implementation Plan: Web Quality Audit

**Branch**: `Hami-v3` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

**Input**: Active feature `specs/032-web-quality-audit`. `setup-plan.sh` returned `032-web-quality-audit` as its feature branch identifier; the actual checkout is `Hami-v3`. This plan does not change branches.

## Summary

Use the FarsiUI-linked Web Quality Audit skill for representative public storefront journeys. Record live evidence separately from source hypotheses, rank findings by visitor impact, make bounded corrections, and repeat affected checks. The initial installation, audit, and link-name fix already exist in this working tree; mobile performance remains Beads issue `HamiSite-basic-structure-abi`.

## Technical Context

**Language/Version**: TypeScript 5.5.4, React 19, Next.js 15.5.25; the skill's analyzer is Bash with `jq`.

**Primary Dependencies**: Existing Next.js app, browser/Chromium, project-local `web-quality-audit` skill, optional temporary Lighthouse CLI. No new runtime package.

**Storage**: Markdown report under this feature directory and Beads for follow-up. The storefront reads its existing PostgreSQL catalog; the audit adds no database entity or migration.

**Testing**: Typecheck, unit tests, production build, live browser checks at mobile and desktop widths, client-chunk verification, and focused repeat audits.

**Target Platform**: Public same-origin storefront in modern browsers. Initial scope: `/`, `/shop`, and one available `/shop/[slug]` page. Authenticated journeys require separate access.

**Project Type**: Next.js web app plus contributor-facing audit workflow.

**Performance Goals**: Meet the specification's three-journey coverage and evidence-completeness criteria. Prefer field p75 LCP, INP, and CLS for user impact; repeat local lab measurements before using them for decisions.

**Constraints**: Preserve truthful product/contact claims and Persian RTL. Do not reset or reseed the database. Stop any server serving `.next` before a build, then restart and check client chunks. `.agents/skills/` is ignored by Git in this checkout.

**Scale/Scope**: One initial public audit and repeatable report contract. No new public API, persistent product data, or broad visual redesign.

## Constitution Check

*Gate before Phase 0: pass. Rechecked after Phase 1: pass. No exception needed.*

| Principle | Planned behavior | Result |
| --- | --- | --- |
| I. Honest Interface | Preserve existing catalog/contact facts; label unverified claims and measurements. | Pass |
| II. Persian RTL by Default | Audit `lang="fa"`, `dir="rtl"`, mobile layout, names, and Persian shopper flow. | Pass |
| III. Database-backed Storefront | Read current public pages; change no schema, seed, API, or authorization contract. | Pass |
| IV. Luxury Quality Bar | Treat visual and responsive regressions as quality findings; preserve coherent art direction. | Pass |
| Definition of Done | Require typecheck, build, real-browser mobile/desktop checks, and a loadable client chunk. | Pass |

**Post-design gate**: The report model and contract add documentation only. They preserve all five decisions above. **Pass**.

## Project Structure

### Documentation and skill

```text
specs/032-web-quality-audit/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/audit-report.md
├── quickstart.md
├── audit.md
└── checklists/requirements.md

.agents/skills/web-quality-audit/
├── SKILL.md
└── scripts/analyze.sh
```

### Application touchpoints

```text
app/layout.tsx
app/(main)/page.tsx
app/(main)/shop/page.tsx
app/(main)/shop/[slug]/page.tsx
components/home/DiscountedProducts.tsx
app/robots.ts
app/sitemap.ts
next.config.mjs
```

**Structure Decision**: Keep upstream guidance in the existing project skill location and audit artifacts beside the feature spec. No new runtime module or table is justified.

## Phase 0: Research

[research.md](research.md) resolves source provenance, evidence hierarchy, route scope, crawler metadata behavior, and tool compatibility. No `NEEDS CLARIFICATION` remains. The repository's one-agent rule applies; no worker was dispatched.

## Phase 1: Design and Contracts

[data-model.md](data-model.md) defines report concepts. [contracts/audit-report.md](contracts/audit-report.md) defines the contributor-facing format; no external API is exposed. [quickstart.md](quickstart.md) supplies the runnable validation sequence.

## Handoff

The initial skill installation, [audit.md](audit.md), link-name fix, and verification already exist. The remaining investigation is Beads issue `HamiSite-basic-structure-abi`: repeat equivalent mobile performance measurements, inspect field data if available, trace the dominant cost, then choose bounded fixes. Keep it open until evidence and correction criteria are met.
