# Research & Technical Decisions: Frontend Security Hardening

**Feature**: [spec.md](spec.md) | **Date**: 2026-10-14 | **Branch**: `036-frontend-security`

## Technical Context & Findings

### 1. Framework & Runtime Architecture
- **Framework**: Next.js 15.5.25 (App Router), React 19.2.8, TypeScript 5.x.
- **Routing**: App Router with RSC (React Server Components) and client components.
- **Current Middleware**: `middleware.ts` currently runs with `runtime: "nodejs"` and only matches `/admin/:path*` for admin access checks via Prisma.
- **Rendering Model**: Root layout `app/layout.tsx` is already dynamically rendered per-request due to `await cookies()`. There are zero `force-static` pages in the repository, making nonce-based CSP fully compatible without sacrificing static caching constraints.

---

## Key Technical Decisions

### Decision 1: Content Security Policy & Nonce Strategy
- **Mechanism**: Implement per-request dynamic nonce generation inside `middleware.ts`.
- **Nonce Generation**: 128-bit cryptographically secure random value via Web Crypto `crypto.randomUUID()` encoded as base64.
- **Header Injection**:
  - Injected into request headers as `x-nonce: <nonce>` and `Content-Security-Policy: <csp>`.
  - Injected into response headers as `Content-Security-Policy: <csp>`.
- **Policy Directives**:
  ```text
  default-src 'self';
  script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://telegram.org ${isDev ? "'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://hamihamrah-shop.com https://dkstatics-public.digikala.com https://*.digikala.com;
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors ${frameAncestors};
  upgrade-insecure-requests;
  ```
- **Tradeoff Analysis for `style-src 'unsafe-inline'`**:
  Next.js and modern UI animation engines (GSAP, Lenis, Vaul, Tailwind dynamic styles) generate dynamic inline CSS styles on HTML elements. Restricting `style-src` to nonces breaks element-level inline styles (`style={{ ... }}`) across client components without substantial security benefit, since script execution is the primary XSS vector. Per the FarsiUI security guidance (`references/csp-headers-cors.md`), `'unsafe-inline'` on `style-src` is an accepted and documented tradeoff.
- **Framing & Telegram Mini App (TMA)**:
  - Storefront and admin pages require strict anti-clickjacking: `frame-ancestors 'none'`.
  - Telegram Mini App routes (`/tma/:path*`) are designed to be embedded within Telegram clients. For `/tma`, `frame-ancestors` is configured as `'self' https://web.telegram.org https://*.telegram.org`.
- **Nonce Consumption in RSC**:
  - `app/layout.tsx` reads `x-nonce` via `(await headers()).get("x-nonce")`.
  - Nonce is passed to `DesignSystemBootstrap` (`<DesignSystemBootstrap nonce={nonce} />`), JSON-LD scripts, and `app/(tma)/layout.tsx` Telegram script.

### Decision 2: Static Security Headers Configuration
- **Placement**: `next.config.mjs` via `headers()` covering all paths (`/:path*`).
- **Static Headers**:
  - `X-Content-Type-Options: nosniff`: Prevents browser MIME-type sniffing of script/style payloads.
  - `Referrer-Policy: strict-origin-when-cross-origin`: Shields URL parameters and paths from leaking across origins while preserving origin on HTTPS requests.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`: Disables high-risk hardware sensors that the storefront does not use.
  - `X-Frame-Options: DENY`: Legacy clickjacking defense for older clients.
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains`: Sent in production over HTTPS to enforce browser transport security.

### Decision 3: XSS Prevention, HTML Sanitization & URL Handling
- **Library**: `isomorphic-dompurify` for server-safe and client-safe HTML sanitization.
- **Sanitizer Utility (`lib/security/sanitize.ts`)**:
  - Enforces strict allowlists: `['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'code', 'pre']` and attributes `['href', 'title', 'target', 'rel']`.
  - Enforces safe protocol regular expressions: `/^(?:https?:|mailto:|\/(?!\/))/i`.
  - Automatically appends `rel="noopener noreferrer"` to external links.
- **JSON-LD Escape Utility (`lib/security/xss.ts`)**:
  - Escapes `<` to `\u003c` in serialized JSON-LD script blocks to prevent script breakouts.
- **URL & Redirect Validation (`lib/security/urls.ts`)**:
  - `safeHttpUrl(raw)`: Accepts only valid `http:` and `https:` URLs, stripping dangerous pseudo-protocols like `javascript:`, `data:`, `vbscript:`.
  - `safeRedirectPath(raw, fallback = "/")`: Validates redirect targets to strictly require a single leading slash (`/`), rejecting protocol-relative URLs (`//evil.com`), backslash bypasses (`/\evil.com`), and control characters.

### Decision 4: Client Auth Token Hygiene & CSRF Defenses
- **Cookie Security**:
  - Confirmed that session tokens are stored in `HttpOnly; Secure; SameSite=Lax; Path=/` cookies via `lib/auth.ts`.
  - JavaScript code in `localStorage` and `sessionStorage` never holds authentication or session tokens.
- **CSRF Defense on Mutations**:
  - Custom Request Header: `lib/api-client.ts` (`apiMutate`) attaches `X-Hami-Client: web` and `Content-Type: application/json` on all client mutation requests.
  - Server Origin Verification: `lib/security/csrf.ts` provides `assertSameOrigin(request)` which verifies that incoming `Origin` / `Referer` headers match `SITE_ORIGIN` or the current request host for state-modifying requests (POST, PUT, PATCH, DELETE).

### Decision 5: Client-Side Input Bounds & Safe Upload Verification UX
- **Validation Helper (`lib/security/upload-validation.ts`)**:
  - Validates `file.size` against specific entity caps (5MB for catalog images, 10MB for partner legal documents).
  - Validates `file.type` against allowlists (`image/jpeg`, `image/png`, `image/webp`, `image/avif` for images; plus `application/pdf` for partner documents).
  - Rejects active content such as SVGs, HTML files, or executables.
  - Returns localized Persian error messages immediately to prevent unnecessary network payload transmission.
  - Integrated into `CatalogImageManager.tsx`, `BundleFormModal.tsx`, `VariantPhotoPicker.tsx`, and `PartnerForm.tsx`.

