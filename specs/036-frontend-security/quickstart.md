# Quickstart: Frontend Security Hardening

**Feature**: [spec.md](spec.md) | **Branch**: `036-frontend-security`

This guide explains how to test and verify the frontend security hardening features.

---

## 1. Verifying CSP & Security Headers

### Test HTTP Headers with curl

```bash
# Test storefront home page headers
curl -I http://localhost:3000/

# Expected headers to verify:
# Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-...' ...
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
# Permissions-Policy: camera=(), microphone=(), geolocation=()
# X-Frame-Options: DENY
```

### Verify Nonce Injection in HTML

```bash
# Verify that inline scripts in rendered HTML carry the nonce
curl -s http://localhost:3000/ | grep -E '<script[^>]*nonce='
```

### Verify Telegram Mini App Frame Ancestors

```bash
# Test TMA layout headers allow Telegram framing
curl -I http://localhost:3000/tma

# Expected CSP frame-ancestors:
# frame-ancestors 'self' https://web.telegram.org https://*.telegram.org
```

---

## 2. Running Automated Unit Tests

Run the security test suite:

```bash
# Run unit tests for frontend security
npm run test:unit tests/unit/frontend-security.test.ts

# Run all unit tests
npm run test:unit
```

---

## 3. Negative Security Tests (Manual & Automated)

| Vector | Input / Action | Expected Result |
|--------|----------------|-----------------|
| **Open Redirect** | Access `/login?next=//evil.com` or `/login?next=https://attacker.org` | Redirects safely to `/` (default fallback) |
| **Backslash Bypass** | Access `/login?next=/\evil.com` | Redirects safely to `/` |
| **XSS in URL** | Access `/login?next=javascript:alert(1)` | Redirects safely to `/` |
| **Inline Script Injection** | Insert un-nonced `<script>` in DOM | Blocked by CSP with console violation report |
| **Frame Embedding** | Embed `http://localhost:3000` in external `<iframe>` | Refused by `frame-ancestors 'none'` and `X-Frame-Options: DENY` |
| **Oversized Upload** | Select >5MB image in Catalog Image Manager | Blocked client-side before upload with Persian error |
| **Active SVG Upload** | Select `.svg` file in Catalog Image Manager | Blocked client-side with file type error |
| **CSRF / Cross-Origin Mutation** | Send POST to `/api/orders` with `Origin: http://evil.com` | Rejected with 403 Forbidden |

---

## 4. Quality Gate Verification

Before finishing changes, verify all quality gates:

```bash
npm run typecheck
npm run test:unit
npm run build
```

