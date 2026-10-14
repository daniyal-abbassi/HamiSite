# Implementation Plan: Frontend Security Hardening

**Branch**: `036-frontend-security` | **Date**: 2026-10-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/036-frontend-security/spec.md` and FarsiUI skill guidance `https://farsiui.ir/skills/frontend-security`.

## Summary

Harden storefront and administrative frontend surfaces against client-side security risks:
1. **CSP with Nonces & Security Headers**: Introduce per-request cryptographic nonces in Next.js `middleware.ts`, injecting a strict Content Security Policy (`script-src 'self' 'nonce-...' 'strict-dynamic'`) on HTML page loads, and static security headers in `next.config.mjs` (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `X-Frame-Options: DENY`, `Strict-Transport-Security`).
2. **Framing & TMA Compatibility**: Configure strict anti-clickjacking `frame-ancestors 'none'` on general storefront/admin routes while permitting approved Telegram client origins for `/tma/:path*`.
3. **XSS Mitigation & HTML/URL Sanitization**: Escaping in structured data JSON-LD scripts, server/client HTML sanitization via `isomorphic-dompurify`, protocol allowlisting (`http:`, `https:`, `mailto:`) on dynamic links with `rel="noopener noreferrer"`, and strict open redirect protection on `next`/`returnTo` parameters.
4. **Auth & CSRF Defenses**: Verification of `HttpOnly; Secure; SameSite=Lax` cookies with zero session token storage in `localStorage`/`sessionStorage`, plus origin assertion on state-changing API mutations and `X-Hami-Client` header coordination in `api-client.ts`.
5. **Upload & Form Input Bounding**: Client-side validation of file sizes and allowed MIME types prior to transmission in catalog and partner management forms, rejecting active content like SVGs.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+

**Primary Dependencies**: Next.js 15.5.25 (App Router), React 19.2.8, `isomorphic-dompurify` (HTML sanitization), Zod 3.23.8, Tailwind CSS 4.x

**Storage**: PostgreSQL via Prisma 5.20 (existing session model and credentials; no new schema migration required)

**Testing**: Vitest (`npm run test:unit`), TypeScript (`npm run typecheck`), Next.js Production Build (`npm run build`)

**Target Platform**: Modern web browsers (desktop and mobile), Telegram WebApp (TMA)

**Project Type**: Next.js App Router Web Application (Storefront + Admin Back-Office + Telegram Mini App)

**Performance Goals**: Sub-5ms middleware execution overhead for nonce generation and header injection; zero hydration or rendering latency regressions.

**Constraints**:
- Must preserve Persian RTL formatting (`dir="rtl"`, `lang="fa"`) and Persian digits.
- Must not break hydration or dynamic CSS/animations (GSAP, Lenis, Vaul, Tailwind).
- Never use `git add -A`, `git checkout --`, `git restore`, or `git stash` (AGENTS.md rule).
- Never mutate or drop development database; tests run against isolated `.env.test`.

**Scale/Scope**: Entire application surface: `middleware.ts`, `next.config.mjs`, `app/layout.tsx`, `components/common/DesignSystemBootstrap.tsx`, `lib/security/`, `lib/api-client.ts`, catalog & partner upload components.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle / Rule | Compliance Status | Analysis & Justification |
|---|---|---|
| **I. Honest Interface** | PASS | Does not fabricate stock, prices, or claims. Generic security errors do not expose customer accounts or leak authentication details. |
| **II. Persian RTL by Default** | PASS | All user-facing security validation feedback (file upload limits, invalid inputs) is in standard Persian with Persian digits where appropriate. |
| **III. Database-backed Storefront & Back Office** | PASS | Preserves existing Prisma PostgreSQL session authentication model and catalog data layers without disruption. |
| **IV. Luxury & Craftsmanship** | PASS | Eliminates security warning banners and broken FOUC transitions by seamlessly supplying nonces to `DesignSystemBootstrap` without visual degradation. |
| **DoD Gates** | PASS | All changes will verify `npm run typecheck`, `npm run test:unit`, and `npm run build` clean. |

## Project Structure

### Documentation (this feature)

```text
specs/036-frontend-security/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Research findings & architectural decisions
├── data-model.md        # Data entities and type contracts
├── quickstart.md        # Verification and testing guide
├── contracts/           # Interfaces and contracts
│   ├── security-headers.ts
│   ├── url-validation.ts
│   ├── upload-validation.ts
│   └── csrf.ts
├── checklists/
│   └── requirements.md  # Requirements quality checklist
└── tasks.md             # Dependency-ordered task list (speckit-tasks output)
```

### Source Code Paths

```text
# Security Utilities & Modules
lib/security/
├── csp.ts               # Nonce generation and CSP header builder
├── static-headers.ts    # Static HTTP security headers
├── urls.ts              # URL protocol allowlist and redirect validation
├── sanitize.ts          # Isomorphic HTML sanitization with allowlist
├── xss.ts               # JSON-LD and inline script escaping
├── csrf.ts              # Origin verification on state-modifying requests
└── upload-validation.ts # Client file validation helper (sizes, types, active content)

# Middleware & Next Config
middleware.ts            # Nonce injection, CSP headers, admin session routing
next.config.mjs          # Static security headers configuration

# Root Layout & Components
app/layout.tsx           # Reads x-nonce and supplies nonce to inline scripts
app/(tma)/layout.tsx     # Supplies nonce to Telegram Web App script
components/common/DesignSystemBootstrap.tsx # Accepts nonce prop
lib/api-client.ts        # Attaches X-Hami-Client request header on mutations

# Upload Form Integrations
components/admin/CatalogImageManager.tsx    # Client pre-upload validation
components/admin/bundles/BundleFormModal.tsx# Client pre-upload validation
components/admin/products/VariantPhotoPicker.tsx # Client pre-upload validation
components/partners/PartnerForm.tsx         # Client upload validation integration

# Tests
tests/unit/
├── frontend-security-headers.test.ts # CSP and static header tests
├── frontend-security-urls.test.ts    # URL and redirect safety tests
├── frontend-security-sanitize.test.ts# HTML sanitization & JSON-LD escape tests
└── frontend-security-upload.test.ts  # File upload constraint tests
```

## Complexity Tracking

No constitution violations detected. Standard Next.js and industry-standard security practices applied.
