# Implementation Plan: Review Partner Requests in Admin Dashboard (بررسی درخواست‌های همکاری در پنل مدیریت)

**Branch**: `026-partner-requests-review` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/026-partner-requests-review/spec.md`

## Summary

Build a dedicated back-office management and review suite for wholesale partner applications. Store administrators can view, filter, and search inbound B2B partnership requests at `/admin/partners`, securely inspect applicant commercial data and uploaded verification documents (lease agreements, business licenses, registration notices), and execute one-click approvals or rejections. Approving an application transactionally upgrades the applicant's account to `Role.WHOLESALE` with their approved shop name, enabling immediate access to exclusive partner bundles (`/partners/bundles`).

---

## Technical Context

**Language/Version**: TypeScript 5.6 / Node.js 20+

**Primary Dependencies**: Next.js 15 App Router, React 19, Prisma ORM 5.22, Zod 3.23, Tailwind CSS, Lucide React

**Storage**: PostgreSQL accessed via Prisma Client (`PartnerApplication` and `User` models)

**Testing**: Vitest (`npm run test:unit`), TypeScript (`npm run typecheck`), Next.js Production Build (`npm run build`)

**Target Platform**: Modern Web Browsers (Mobile & Desktop), Linux Server

**Project Type**: Full-stack Next.js E-commerce Application

**Performance Goals**: Partner applications table load with filters < 200ms; approval/rejection transaction < 150ms

**Constraints**:
- Persian RTL first (`lang="fa"`, `dir="rtl"`, Persian numerals, Jalali date formatting).
- Strict Admin Role Gating: visible and actionable exclusively by `Role.ADMIN`.
- Secure Document Streaming: document files are served only to authenticated administrators.
- Synchronized Account Elevation: approving an application automatically elevates the user to `Role.WHOLESALE`.
- Honest Interface: accurate statuses (`PENDING`, `APPROVED`, `REJECTED`) with zero false mock states.

**Scale/Scope**:
- 1 Admin management view (`/admin/partners/page.tsx` & `PartnersAdminClient.tsx`).
- 1 Admin sidebar item with pending badge counter (`components/admin/AdminSidebar.tsx`).
- 1 Detailed inspection & review modal (`PartnerApplicationModal.tsx`).
- 4 API route endpoints:
  - `GET /api/admin/partners` (list with filters & pagination)
  - `GET /api/admin/partners/[id]` (application detail)
  - `POST /api/admin/partners/[id]/decision` (approve/reject transaction)
  - `GET /api/admin/partners/[id]/documents/[docType]` (authenticated secure document stream)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status | Evidence / Notes |
|---|---|---|---|
| **I. Honest Interface** | Stock status, applicant state, and review history must be 100% accurate. Missing data stays missing. | **PASS** | Applications display real database state (`PENDING`, `APPROVED`, `REJECTED`). Missing documents display «فایل در دسترس نیست», never placeholder imagery. |
| **II. Persian RTL by Default** | `lang="fa"`, `dir="rtl"`, logical CSS, Persian digits, Jalali calendar. | **PASS** | Persian numerals (`fa-IR`), Jalali date formatting, logical CSS padding/margins, Persian status badges. |
| **III. Database-backed Storefront & Back Office** | PostgreSQL via Prisma is source of truth. Schema changes additive. | **PASS** | Leverages existing `PartnerApplication` and `User` models in PostgreSQL via Prisma Client. All status transitions are transactional. |
| **IV. Design Is Open — Luxury Is the Quality Bar** | High perceived value, restrained luxury, editorial composition. | **PASS** | Admin interface uses dark luxury glass aesthetic, refined typography, and purposeful badges matching `/admin/bundles`. |

---

## Project Structure

### Documentation (this feature)

```text
specs/026-partner-requests-review/
├── spec.md              # Feature specification & requirements
├── plan.md              # Implementation plan (this file)
├── research.md          # Architecture decisions & trade-offs (Phase 0)
├── data-model.md        # Entities, Prisma schema, and lifecycle (Phase 1)
├── contracts/           # API and interface contracts (Phase 1)
│   └── admin-partners-api.md
├── quickstart.md        # End-to-end runnable validation guide (Phase 1)
├── checklists/
│   └── requirements.md  # Requirements quality checklist
└── tasks.md             # Implementation tasks (/speckit-tasks output)
```

### Source Code (repository layout)

```text
app/
├── (admin)/admin/partners/                     # Admin partner applications UI
│   ├── page.tsx                                # Server component loading initial applications
│   └── PartnersAdminClient.tsx                 # Client component with filtering, table, and modal
├── api/admin/partners/                         # Admin partner application endpoints
│   ├── route.ts                                # GET (list with pagination/search/status filters)
│   ├── count/route.ts                          # GET (pending counter for sidebar/header)
│   ├── [id]/route.ts                           # GET (single application detail)
│   ├── [id]/decision/route.ts                  # POST (approve or reject with user elevation)
│   └── [id]/documents/[docType]/route.ts       # GET (secure document stream)

components/
├── admin/
│   ├── AdminSidebar.tsx                        # Add "درخواست‌های همکاری" item + pending badge
│   └── partners/
│       ├── PartnerApplicationModal.tsx         # Detailed inspection modal with document previews
│       └── PartnerStatusBadge.tsx              # Luxury status badge component
```

---

## Complexity Tracking

*No unjustified complexity or constitutional violations.*
All endpoints use established project conventions (`withAuth`, `requireAdmin`, `withErrorHandling`, `prisma.$transaction`).
Document streaming handles disk I/O cleanly with stream responses and proper MIME types.
