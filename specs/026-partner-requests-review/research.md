# Architecture Research: Review Partner Requests in Admin Dashboard

**Feature**: `026-partner-requests-review`  
**Date**: 2026-10-13  
**Status**: Complete

---

## 1. Context & Objectives

The public partnership application form (`/partners`) allows prospective B2B wholesale clients to submit their commercial details along with verification documents (lease agreement, trade license, or company registration notice). While the submission endpoint (`POST /api/partners`) successfully stores submissions in the `PartnerApplication` database table, the administration portal lacks an interface to list, inspect, approve, or reject these incoming requests.

This research establishes the architecture for the back-office review experience, secure document access, and the automated user elevation transaction.

---

## 2. Key Architecture Decisions

### Decision 1: Admin API Route Design & Gating
- **Choice**: Dedicated REST route endpoints under `/api/admin/partners/*` protected by `withAuth` and `requireAdmin` middleware.
  - `GET /api/admin/partners`: Paginated list of applications with filter support (`status`, `entityType`, `search`).
  - `GET /api/admin/partners/[id]`: Complete application detail, including applicant verification metadata and document access URLs.
  - `POST /api/admin/partners/[id]/decision`: Atomic transition to `APPROVED` or `REJECTED`, recording reviewer admin identity, timestamp, and optional decision notes.
  - `GET /api/admin/partners/count`: Lightweight endpoint returning `{ pendingCount: number }` for live dashboard and sidebar badge counters.
- **Rationale**: Keeps back-office routes neatly organized alongside existing endpoints (`/api/admin/bundles`, `/api/admin/products`, `/api/admin/orders`) with consistent envelope formatting (`{ success: true, data: ... }`).
- **Alternatives Considered**: Merging with `/api/admin/users`. Rejected because partner applications have distinct multi-document workflows and lifecycle states separate from generic user management.

---

### Decision 2: Secure Document Inspection & Preview
- **Choice**: Authenticated document streaming endpoint `GET /api/admin/partners/[id]/documents/[docType]`.
- **Rationale**: Verification documents (commercial lease contracts, tax IDs, trade licenses) contain sensitive business and personal data. They must NOT be placed in an unauthenticated public bucket or static web folder. The streaming endpoint verifies that the requester has `Role.ADMIN` before reading the file from `storage/partners/` and streaming with appropriate `Content-Type` (`image/jpeg`, `image/png`, `application/pdf`) and `Content-Disposition: inline`.
- **Alternatives Considered**: Public static URLs under `/uploads`. Rejected for privacy and regulatory compliance.

---

### Decision 3: Atomic Wholesale User Account Provisioning / Elevation
- **Choice**: Synchronized elevation inside `prisma.$transaction`.
  When an admin approves an application:
  1. Find or initialize the `User` associated with the application's mobile number (`normalizeIranianMobile(application.mobile)`).
  2. If the user already exists: update `role: Role.WHOLESALE` and `shopName: application.shopName`.
  3. If no user exists yet: create a `User` record with `phoneNumber: application.mobile`, `role: Role.WHOLESALE`, `shopName: application.shopName`, and `isActive: true`.
  4. Update `partnerApplication`: `status: 'APPROVED'`, `reviewedBy: adminUserId`, `reviewedAt: new Date()`, `notes: adminNote`.
- **Rationale**: Guarantees zero orphaned approvals: an approved partner can immediately log in and access exclusive B2B partner bundles (`/partners/bundles`) without manual secondary account creation.
- **Alternatives Considered**: Manual admin step to create user account after approving. Rejected because it introduces unnecessary human error and delays partner onboarding.

---

### Decision 4: Admin UI Layout & Aesthetics
- **Choice**: Single responsive management page at `/admin/partners` featuring a filterable data table, live status tabs, a review inspection drawer/modal (`PartnerApplicationModal`), and an active sidebar badge.
- **Rationale**: Matches the luxury dark/glass visual language established in `/admin/bundles` and `/admin/products`. Preserves Persian RTL layout and Jalali formatting without visual clutter.

---

## 3. Technology Stack Alignment

- **Framework**: Next.js 15 App Router (Server Components + Client Components for modals).
- **ORM / Storage**: Prisma Client querying PostgreSQL `PartnerApplication` and `User` models.
- **Validation**: Zod schema for decision submission (`decisionSchema: z.object({ action: z.enum(["APPROVE", "REJECT"]), note: z.string().optional() })`).
- **Icons & UI**: Lucide React (`Building2`, `Store`, `CheckCircle2`, `XCircle`, `FileText`, `Eye`, `Download`), Tailwind CSS.

