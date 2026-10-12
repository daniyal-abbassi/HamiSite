# Implementation Plan: B2B Partner Bundles (سبد کالای اختصاصی همکاران)

**Branch**: `025-b2b-partner-bundles` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/025-b2b-partner-bundles/spec.md`

## Summary

Build an exclusive B2B Partner Bundle (سبد کالای همکار) feature that empowers store administrators to curate multi-product promotional packages with custom item multipliers, discounted lump-sum package pricing, and limited inventory quotas. Authenticated wholesale partners (`Role.WHOLESALE` and `Role.AGENT`) can discover and purchase these indivisible packages inside their partner portal with instant online/cash settlement and dual synchronized inventory deduction (decrementing both bundle quota and constituent physical warehouse stocks). Public and retail visitors are strictly blocked from seeing or purchasing partner bundles.

---

## Technical Context

**Language/Version**: TypeScript 5.6 / Node.js 20+

**Primary Dependencies**: Next.js 15 App Router, React 19, Prisma ORM 5.22, Zod 3.23, Tailwind CSS, Lucide React

**Storage**: PostgreSQL accessed via Prisma Client

**Testing**: Vitest (`npm run test:unit`), TypeScript (`npm run typecheck`), Next.js Production Build (`npm run build`)

**Target Platform**: Modern Web Browsers (Mobile & Desktop), Linux Server

**Project Type**: Full-stack Next.js E-commerce Application

**Performance Goals**: Partner bundle catalog initial page render < 250ms; atomic checkout transaction execution < 150ms

**Constraints**:
- Persian RTL first (`lang="fa"`, `dir="rtl"`, Persian numerals, `تومان` currency).
- Strict B2B Role Gating: visible and purchasable ONLY by `Role.WHOLESALE` and `Role.AGENT`.
- All-or-nothing purchase: constituent items cannot be picked, removed, or altered by the partner.
- Payment restriction: Cash/Instant Gateway settlement only (B2B 60-day credit terms disallowed).
- Dual synchronized inventory deduction with zero overselling.

**Scale/Scope**:
- 2 new Prisma models (`PartnerBundle`, `PartnerBundleItem`) and relations in `CartItem` / `OrderItem`.
- 1 Admin management view (`/admin/bundles`) and modal/editor for bundle creation and stock adjustment.
- 1 Partner showcase view (`/partners/bundles`) with editorial luxury presentation.
- 4 API routes (`/api/admin/bundles`, `/api/admin/bundles/[id]`, `/api/partners/bundles`, `/api/partners/bundles/[slug]`).
- Updates to Cart (`/api/cart/items`, `CartProvider`, `CartDrawer`) and Orders (`/api/orders`, `lib/orders.ts`).

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status | Evidence / Notes |
|---|---|---|---|
| **I. Honest Interface** | Stock status and prices must be 100% accurate. Missing data stays missing. | **PASS** | Bundle stock counts reflect real remaining quotas and warehouse stocks. Depleted bundles display «تکمیل ظرفیت», never false availability. |
| **II. Persian RTL by Default** | `lang="fa"`, `dir="rtl"`, logical CSS, Persian digits, Toman currency. | **PASS** | All labels, titles, numbers (`fa-IR`), and layouts adhere to RTL standards. |
| **III. Database-backed Storefront & Back Office** | PostgreSQL via Prisma is source of truth. Schema changes additive. | **PASS** | `PartnerBundle` and `PartnerBundleItem` added cleanly. DB sync with `prisma db push` preserves all existing data. |
| **IV. Design Is Open — Luxury Is the Quality Bar** | High perceived value, restrained luxury, editorial composition. | **PASS** | Partner showcase cards use editorial layouts, refined typography, and purposeful badges without noisy marketplace templates. |

---

## Project Structure

### Documentation (this feature)

```text
specs/025-b2b-partner-bundles/
├── spec.md              # Feature specification & requirements
├── plan.md              # Implementation plan (this file)
├── research.md          # Architecture decisions & trade-offs (Phase 0)
├── data-model.md        # Entities, Prisma schema, and lifecycle (Phase 1)
├── contracts/           # API and interface contracts (Phase 1)
│   ├── admin-bundles-api.md
│   ├── partner-bundles-api.md
│   └── cart-checkout-bundle-api.md
├── quickstart.md        # End-to-end runnable validation guide (Phase 1)
├── checklists/
│   └── requirements.md  # Requirements quality checklist
└── tasks.md             # Implementation tasks (/speckit-tasks output)
```

### Source Code (repository layout)

```text
prisma/
└── schema.prisma                               # Add PartnerBundle, PartnerBundleItem, CartItem & OrderItem relations

lib/
├── bundles.ts                                  # Server queries, dual stock validation, and serialization
├── cart.ts                                     # Cart calculation & serialization supporting bundle lines
└── orders.ts                                   # Order transaction & stock restoration for bundles

app/
├── (admin)/admin/bundles/                      # Admin bundle management UI
│   ├── page.tsx                                # Bundle list, status toggle, quota adjustment
│   └── [id]/edit/page.tsx                      # Bundle editor
├── (main)/partners/bundles/                    # Partner bundle showcase UI
│   ├── page.tsx                                # Wholesale partner bundle catalog
│   └── [slug]/page.tsx                         # Bundle detailed view
├── api/admin/bundles/                          # Admin bundle CRUD endpoints
│   ├── route.ts                                # GET (list), POST (create)
│   └── [id]/route.ts                           # GET, PUT/PATCH, DELETE
├── api/partners/bundles/                       # Partner showcase endpoints (role-gated)
│   ├── route.ts                                # GET active bundles
│   └── [slug]/route.ts                         # GET single bundle
├── api/cart/items/route.ts                     # Support bundleId in add/update/remove
└── api/orders/route.ts                         # Dual stock deduction & cash-only enforcement

components/
├── admin/bundles/                              # Admin bundle table, forms, product selector
├── partners/bundles/                           # Partner bundle cards, item chips, purchase modal
└── cart/                                       # CartLine & CartDrawer bundle rendering
```

---

## Complexity Tracking

*No unjustified complexity or constitutional violations.*
All changes use existing patterns (`withAuth`, `prisma.$transaction`, `withErrorHandling`, Next.js App Router).
