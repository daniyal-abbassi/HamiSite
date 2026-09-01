# Login Slice Hardening & Verification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **On execution, copy this file to `docs/superpowers/plans/2026-08-22-login-hardening.md`** to match the repo's existing convention, and commit it in Task 0.

## Context

The frontend is about to be built **inside this same Next.js app**, and it will authenticate against the existing login slice. Before that happens the slice needs to be provably correct, because every frontend screen will depend on its contract.

The audit found the backend is in good shape structurally — 27 test files / 172 tests green, `tsc --noEmit` clean, sessions correctly stored as SHA-256 hashes of opaque 32-byte tokens — but it has **five confirmed defects** and **no usable contract surface for a frontend**:

- There are no named DTO types. `types/api.ts` exists and is imported by *nothing*; `sanitizeUser`'s return type is anonymous and inferred, so the wire shape has no independent definition and any edit to that function is a silent public-API change.
- Failures carry only an English `message`. A frontend cannot branch on "invalid credentials" vs "account deactivated" without string-matching prose.
- A malformed request body returns **500**, not 400.
- Login's not-found path skips bcrypt entirely while the found path pays ~120 ms — a measured, trivially exploitable **user-enumeration timing oracle**.
- Anyone can self-register as `AGENT` (the B2B sales-rep role).
- A concurrent duplicate registration returns 500 instead of 409.
- One malformed third-party cookie (`_ga=%zz`) throws `URIError` out of cookie parsing and **500s every authenticated request** for that browser until cookies are cleared.

Two capabilities the frontend needs simply do not exist: a user cannot edit their own profile, and **a password can never be changed through the API** — not by the user, not by an admin.

On the legacy side: the old site is a SaaS storefront ("Mixin v4") with **no user-login endpoint at all** — auth there is one shop-wide `Authorization: Api-Key` header (token verified live: 200 on `/api/v4/health/`, 401 without it). Consequently every imported customer lands with the same hardcoded password and logs in **by normalized `+98…` phone number** — a code branch with zero test coverage today.

**Outcome:** a login slice with fixed defects, stable machine-readable error codes, drift-proof exported types, self-service profile + password endpoints, full test coverage, a written contract doc, and end-to-end verification through the real dev server.

**Goal:** Harden, type, extend, and verify the login vertical slice end-to-end so a same-origin frontend can be built against a stable contract.

**Architecture:** Keep the existing design — opaque session tokens, SHA-256-hashed in `sessions`, httpOnly `session_token` cookie, 30-day sliding TTL, per-handler `withAuth` guarding. No JWT, no `middleware.ts`, no CORS (frontend is same-origin). Changes are additive: an optional `code` on `ApiError` with a status-derived fallback so all 33 non-auth routes gain codes with zero edits; shared `readJson`/`parseJsonBody` helpers; a `types/auth.ts` contract module with a compile-time drift guard.

**Tech Stack:** Next.js 14.2 App Router (API routes only), Prisma 5.20 + PostgreSQL, Zod 3.23, bcryptjs 2.4, Vitest 4.1.10, TypeScript strict, path alias `@/*` → repo root.

**Spec:** `docs/superpowers/specs/2026-08-12-backend-completion-design.md` (§1–§2 define the session model and `withAuth` semantics this plan preserves). This plan extends it; it does not revise it.

---

## Global Constraints

- **Frontend is same-origin** (pages land in this app's `app/`). `SameSite=lax` + `httpOnly` stays exactly as-is. **Do not add CORS, `SameSite=None`, `Access-Control-*`, or a token-in-body fallback.**
- **Never run two `npm test` processes concurrently.** All test files share one Postgres `test` schema and `resetDb()` truncates 20 tables per test. Concurrent runners produce nondeterministic failures that look like real bugs.
- **`--reporter=basic` is invalid on Vitest 4.** Use the default reporter or `--reporter=dot`.
- **Next serializes SameSite in lowercase**: `SameSite=lax`. Assert with `toMatch(/SameSite=lax/i)`, never `toContain("SameSite=Lax")`. There is no `Max-Age` (only `Expires`), and no `Secure` outside production.
- **Never `git add -A`.** `.gitignore` covers none of `graphify-out/`, `.claude/`, `CLAUDE.md`, `oldWebsite-openapi.json` (2.1 MB). Use explicit paths in every commit.
- **Never run `npm run db:fresh` or `npm run db:seed`** during this work. `db:fresh` is `prisma db push --force-reset` against `.env`'s `public` schema — the dev database holding the entire imported legacy catalog — followed by a full legacy re-import (one HTTP call per product) that hard-deletes and recreates every product's images/variants, cascading away PriceTiers, CartItems and ProductHistory.
- **No write calls to the legacy API.** GET only, and this plan needs none.
- Every task ends with `npm run typecheck` (exit 0), then `npm test` (0 failed), then its own commit, then `graphify update .`.
- Out of scope, do not add: rate limiting, SMS/OTP, password reset, refresh tokens, session list / revoke-all, CSRF tokens, expired-session reaper, `middleware.ts`.

---

## Verified Baseline

| Fact | Value |
|---|---|
| Test suite | 27 files / 172 tests, all pass, ~76 s |
| `npm run typecheck` | exit 0, no output |
| `new ApiError(` call sites | 111 (82 two-arg, 29 three-arg) — all keep compiling when `code` is added as an optional 4th param |
| `fail()` callers outside `lib/http.ts` | **0** — adding `code` to the envelope breaks nothing |
| Error-body assertions in tests | 1, a property read (`payment-mock.test.ts:69`), not a deep-equal |
| Routes calling `request.json()` | 23 files (this plan fixes 4 + 2 new; 19 remain as follow-up) |
| Test fixtures | `seedMinimal()` → `test.admin` `+989120000101`, `test.retail` `+989120000102`, `test.wholesale` `+989120000103`, all password `Password@123`; seeded admin email is `admin@mixin-shop.example` |

**Blast radius of the error-code change is provably zero.** Confirmed by grep, not assumed.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `types/api.ts` *(modify)* | `ApiErrorCode`, `ApiSuccess`, `ApiFailure`, `ApiResponse`. **Types only, zero runtime** — a `"use client"` component can import it with zero bundled bytes. | 1 |
| `types/auth.ts` *(new)* | `PublicUser` + request/response types + the drift guard. Types only. | 3, 5 |
| `lib/http.ts` *(modify)* | Adds `code` to `ApiError`, `codeForStatus`, `readJson`, `parseJsonBody`. | 1 |
| `lib/schemas/auth.ts` *(new)* | The four auth zod schemas — the reviewed source of truth for request shapes. | 3–7 |
| `lib/phone.ts` *(new)* | `normalizeIranianMobile`. | 3 |
| `lib/auth.ts` *(modify)* | `DUMMY_PASSWORD_HASH`, hardened `parseCookies`, coded `withAuth` throws. | 1, 2, 3 |
| `app/api/auth/{login,register,me}/route.ts` *(modify)* | | 3, 4, 6 |
| `app/api/auth/change-password/route.ts` *(new)* | | 7 |
| `tests/unit/http.test.ts`, `tests/api/auth-profile.test.ts`, `tests/api/auth-legacy-login.test.ts` *(new)* | | 1, 6–8 |
| `docs/api/auth.md` *(new)* | The frontend-facing contract. | 9 |

No import cycles: `types/api.ts` imports nothing → `lib/http.ts` type-imports it → `types/auth.ts` type-imports `lib/auth.ts` + `lib/schemas/auth.ts` → neither imports back.

---

## Task 0: Baseline & tree hygiene

**Files:** `.gitignore` (modify)

- [ ] **Step 1: Confirm the baseline is actually green before changing anything**

```bash
cd /home/lain/lain_projects/hami-site/hami_site_api_routes
npm run typecheck && npm test
```
Expected: no typecheck output; `Test Files 27 passed (27)` / `Tests 172 passed (172)`.

- [ ] **Step 2: Resolve the dirty working tree**

`git status` shows deleted `app/layout.tsx`, `app/page.tsx`, `openapi.json` and untracked `.claude/`, `CLAUDE.md`, `graphify-out/`, `oldWebsite-openapi.json`. Since the frontend is landing in this app and will need a root layout:

```bash
git restore app/layout.tsx app/page.tsx
```

`openapi.json` is a byte-identical duplicate of `oldWebsite-openapi.json` (same sha256) — the deletion is a rename that was never staged. Keep it deleted.

- [ ] **Step 3: Extend `.gitignore`**

Append:
```
graphify-out/
oldWebsite-openapi.json
.claude/settings.local.json
```
Leave `CLAUDE.md` and `.claude/launch.json` tracked — they are project config.

- [ ] **Step 4: Commit hygiene separately, and copy this plan into the repo**

```bash
mkdir -p docs/superpowers/plans
cp /home/lain/.claude/plans/home-lain-lain-projects-hami-site-hami-sunny-salamander.md docs/superpowers/plans/2026-08-22-login-hardening.md
git add .gitignore openapi.json docs/superpowers/plans/2026-08-22-login-hardening.md
git commit -m "chore: drop the duplicated legacy openapi.json and ignore generated artifacts"
```

---

## Task 1: Stable error codes + JSON body helpers

**Files:** Modify `types/api.ts`, `lib/http.ts`, `lib/auth.ts:166,170,173`; Create `tests/unit/http.test.ts`; Modify `tests/unit/withAuth.test.ts`

**Interfaces produced:** `ApiErrorCode` (union), `ApiError.coded(status, code, message, details?)`, `codeForStatus(status): ApiErrorCode`, `readJson(request): Promise<unknown>`, `parseJsonBody<S>(request, schema): Promise<z.infer<S>>`. `fail()` gains an optional 4th `code` param. Every failure body now always carries `error.code`.

**Design:** `code` is the **4th, optional** positional param on `ApiError`, and `withErrorHandling` derives one from the status when a route omits it. That combination is what turns a 37-route change into a 1-file change: the other 33 routes gain stable documented codes for free, forever, with no edit.

| Status | Fallback code | Auth routes override with |
|---|---|---|
| 400 | `BAD_REQUEST` | `VALIDATION_FAILED`, `MALFORMED_JSON`, `INVALID_CURRENT_PASSWORD` |
| 401 | `AUTH_REQUIRED` | `INVALID_CREDENTIALS` |
| 403 | `FORBIDDEN` | `ACCOUNT_DEACTIVATED`, `FORBIDDEN_ROLE` |
| 404 | `NOT_FOUND` | — |
| 409 | `CONFLICT` | `DUPLICATE_ACCOUNT` |
| 5xx | `INTERNAL_ERROR` | — |

The frontend contract this buys: **`code` is always present on a failure and is never `undefined`.**

> **Rejected alternative — do not do this.** You could fix all 23 `request.json()` routes with one line: `if (error instanceof SyntaxError) return fail(400, …)` inside `withErrorHandling`. Reject it. A `SyntaxError` from anywhere else — a bad `JSON.parse` of a stored field, a genuine bug — would be laundered into a client-facing 400 and would stop reaching `console.error`. That trades a loud server bug for a silent one. The explicit `readJson` boundary is precise and testable.

- [ ] **Step 1: Write the failing tests — create `tests/unit/http.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ApiError, codeForStatus, ok, parseJsonBody, readJson, withErrorHandling } from "@/lib/http";

function jsonReq(body: string) {
  return new Request("http://localhost/x", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("failure envelope codes", () => {
  it("derives a stable code from the status when the route passes none", async () => {
    for (const [status, code] of [
      [400, "BAD_REQUEST"], [401, "AUTH_REQUIRED"], [403, "FORBIDDEN"],
      [404, "NOT_FOUND"], [409, "CONFLICT"], [500, "INTERNAL_ERROR"],
    ] as const) {
      const res = await withErrorHandling(async () => {
        throw new ApiError(status, "boom");
      });
      expect((await res.json()).error.code).toBe(code);
    }
  });

  it("lets an explicit code win over the status fallback", async () => {
    const res = await withErrorHandling(async () =>
      Promise.reject(ApiError.coded(401, "INVALID_CREDENTIALS", "Invalid credentials")),
    );
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
    expect(body.error.message).toBe("Invalid credentials");
    expect(body.error.details).toBeUndefined();
  });

  it("maps a non-ApiError throw to 500 INTERNAL_ERROR", async () => {
    const res = await withErrorHandling(async () => {
      throw new TypeError("kaboom");
    });
    expect(res.status).toBe(500);
    expect((await res.json()).error.code).toBe("INTERNAL_ERROR");
  });

  it("keeps the success envelope untouched", async () => {
    const body = await (await withErrorHandling(async () => ok({ a: 1 }, { m: 2 }))).json();
    expect(body).toEqual({ success: true, data: { a: 1 }, meta: { m: 2 } });
  });

  it("codeForStatus falls back sensibly for unmapped statuses", () => {
    expect(codeForStatus(418)).toBe("BAD_REQUEST");
    expect(codeForStatus(503)).toBe("INTERNAL_ERROR");
  });
});

describe("readJson / parseJsonBody", () => {
  it("turns a malformed body into 400 MALFORMED_JSON, not 500", async () => {
    const res = await withErrorHandling(async () => ok(await readJson(jsonReq("{ not json"))));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("MALFORMED_JSON");
  });

  it("turns an empty body into 400 MALFORMED_JSON", async () => {
    const res = await withErrorHandling(async () => ok(await readJson(jsonReq(""))));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("MALFORMED_JSON");
  });

  it("parseJsonBody resolves on success and 400s with field details on failure", async () => {
    const schema = z.object({ a: z.string().min(2) });
    await expect(parseJsonBody(jsonReq('{"a":"hello"}'), schema)).resolves.toEqual({ a: "hello" });

    const res = await withErrorHandling(async () => ok(await parseJsonBody(jsonReq('{"a":"x"}'), schema)));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.details.fieldErrors.a).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
npx dotenv -e .env.test -- vitest run tests/unit/http.test.ts
```
Expected: FAIL — `codeForStatus`, `readJson`, `parseJsonBody`, `ApiError.coded` are not exported.

- [ ] **Step 3: Replace `types/api.ts`**

```ts
/** Stable, machine-readable failure codes. NEVER remove or repurpose a member —
 * frontends branch on these. Adding a member is backwards-compatible. */
export type ApiErrorCode =
  // 400
  | "BAD_REQUEST"
  | "VALIDATION_FAILED"
  | "MALFORMED_JSON"
  | "INVALID_CURRENT_PASSWORD"
  // 401
  | "AUTH_REQUIRED"
  | "INVALID_CREDENTIALS"
  // 403
  | "FORBIDDEN"
  | "FORBIDDEN_ROLE"
  | "ACCOUNT_DEACTIVATED"
  // 404 / 409
  | "NOT_FOUND"
  | "CONFLICT"
  | "DUPLICATE_ACCOUNT"
  // 5xx
  | "INTERNAL_ERROR";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  success: false;
  error: {
    message: string;
    /** Always present. Branch on this, never on `message`. */
    code: ApiErrorCode;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
```

Keep this file runtime-free — no `const`, no enum.

- [ ] **Step 4: Apply the `lib/http.ts` diff**

```diff
+import type { z } from "zod";
 import { NextResponse } from "next/server";
+import type { ApiErrorCode } from "@/types/api";

 export class ApiError extends Error {
   status: number;
   details?: unknown;
+  /** Optional stable failure code. When omitted, `withErrorHandling` derives one
+   * from `status` — that's what lets the other 33 route files gain codes
+   * without a single edit. */
+  code?: ApiErrorCode;

-  constructor(status: number, message: string, details?: unknown) {
+  constructor(status: number, message: string, details?: unknown, code?: ApiErrorCode) {
     super(message);
     this.status = status;
     this.details = details;
+    this.code = code;
   }
+
+  /** Ergonomic form for the common "coded, no details" case. */
+  static coded(status: number, code: ApiErrorCode, message: string, details?: unknown) {
+    return new ApiError(status, message, details, code);
+  }
 }

+const STATUS_FALLBACK_CODES: Record<number, ApiErrorCode> = {
+  400: "BAD_REQUEST",
+  401: "AUTH_REQUIRED",
+  403: "FORBIDDEN",
+  404: "NOT_FOUND",
+  409: "CONFLICT",
+};
+
+export function codeForStatus(status: number): ApiErrorCode {
+  return STATUS_FALLBACK_CODES[status] ?? (status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST");
+}
+
 export function ok<T>(data: T, meta?: Record<string, unknown>) {
   return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
 }

-export function fail(status: number, message: string, details?: unknown) {
+export function fail(status: number, message: string, details?: unknown, code?: ApiErrorCode) {
   return NextResponse.json(
     {
       success: false,
       error: {
         message,
+        code: code ?? codeForStatus(status),
         ...(details !== undefined ? { details } : {}),
       },
     },
     { status },
   );
 }

+/** Reads a JSON body, turning a malformed one into a 400 instead of the
+ * SyntaxError -> 500 that a bare `await request.json()` produces. */
+export async function readJson(request: Request): Promise<unknown> {
+  try {
+    return await request.json();
+  } catch {
+    throw ApiError.coded(400, "MALFORMED_JSON", "Request body must be valid JSON");
+  }
+}
+
+/** readJson + zod, collapsing the parse/throw dance every route repeats and
+ * guaranteeing one VALIDATION_FAILED shape across the whole API. */
+export async function parseJsonBody<S extends z.ZodTypeAny>(
+  request: Request,
+  schema: S,
+): Promise<z.infer<S>> {
+  const parsed = schema.safeParse(await readJson(request));
+  if (!parsed.success) {
+    throw ApiError.coded(400, "VALIDATION_FAILED", "Invalid request body", parsed.error.flatten());
+  }
+  return parsed.data;
+}
+
 export async function withErrorHandling(handler: () => Promise<NextResponse>) {
   try {
     return await handler();
   } catch (error) {
     if (error instanceof ApiError) {
-      return fail(error.status, error.message, error.details);
+      return fail(error.status, error.message, error.details, error.code);
     }

     console.error("Unhandled API error", error);
-    return fail(500, "Internal server error");
+    return fail(500, "Internal server error", undefined, "INTERNAL_ERROR");
   }
 }
```

`import type { z }` is type-only — `lib/http.ts` gains no runtime zod import.

- [ ] **Step 5: Give `withAuth`'s three throws explicit codes (`lib/auth.ts:166,170,173`)**

```diff
-        throw new ApiError(401, "Authentication required");
+        throw ApiError.coded(401, "AUTH_REQUIRED", "Authentication required");
...
-        throw new ApiError(403, "Account deactivated");
+        throw ApiError.coded(403, "ACCOUNT_DEACTIVATED", "Account deactivated");
...
-        throw new ApiError(403, "Forbidden");
+        throw ApiError.coded(403, "FORBIDDEN_ROLE", "Forbidden");
```

- [ ] **Step 6: Pin those codes — append to `tests/unit/withAuth.test.ts`**

Every guarded route in the API inherits these, so they are contract:

```ts
  it("tags its 401/403 failures with stable codes", async () => {
    const handler = withAuth(async () => NextResponse.json({ ok: true }), { roles: [Role.ADMIN] });

    expect((await (await handler(requestWithCookie())).json()).error.code).toBe("AUTH_REQUIRED");

    const { token } = await createSession(seed.retail.id);
    expect((await (await handler(requestWithCookie(token))).json()).error.code).toBe("FORBIDDEN_ROLE");

    await prisma.user.update({ where: { id: seed.retail.id }, data: { isActive: false } });
    expect((await (await handler(requestWithCookie(token))).json()).error.code).toBe("ACCOUNT_DEACTIVATED");
  });
```

Match the existing helper names in that file (`requestWithCookie`) — read it first rather than assuming.

- [ ] **Step 7: Run tests to verify they pass**

```bash
npm run typecheck && npm test
```
Expected: exit 0; `Test Files 28 passed (28)`, ~181 tests, **0 failed**.

- [ ] **Step 8: Commit**

```bash
git add lib/http.ts lib/auth.ts types/api.ts tests/unit/http.test.ts tests/unit/withAuth.test.ts
git commit -m "feat(api): add stable machine-readable error codes to the failure envelope"
graphify update .
```

---

## Task 2: Fix the cookie `URIError` 500

**Files:** Modify `lib/auth.ts:59-67`, `tests/unit/auth.test.ts`, `tests/api/auth.test.ts`

**Defect:** `decodeURIComponent` runs on *every* cookie value. One malformed `%` escape in an unrelated third-party cookie throws `URIError` out of `parseCookies` → out of `resolveSession` → caught by `withErrorHandling` as a non-`ApiError` → **500 on every authenticated request** for that browser, permanently, and undebuggable from the user's side.

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/auth.test.ts`:

```ts
describe("cookie parsing robustness", () => {
  it("survives a malformed percent-escape in an unrelated cookie", () => {
    const req = new Request("http://localhost/x", {
      headers: { cookie: `_ga=%zz; ${SESSION_COOKIE_NAME}=deadbeef; other=%E0%A4%A` },
    });
    expect(getSessionTokenFromRequest(req)).toBe("deadbeef");
  });

  it("still decodes well-formed escapes and skips a valueless cookie", () => {
    const req = new Request("http://localhost/x", {
      headers: { cookie: "a=hello%20world; b=eyJ4Ijox=; c" },
    });
    // `c` has no '=' and must be skipped rather than producing a garbage key.
    expect(getSessionTokenFromRequest(req)).toBeNull();
  });
});
```

Append to `tests/api/auth.test.ts` — this one proves the user-visible bug is gone:

```ts
  it("authenticates normally when the browser also sends a malformed cookie", async () => {
    const loginRes = await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password }));
    const sessionCookie = loginRes.headers.get("set-cookie")!.split(";")[0];

    const res = await me(new Request("http://localhost/api/auth/me", {
      headers: { cookie: `_ga=%zz; ${sessionCookie}` },
    }));
    expect(res.status).toBe(200);   // was 500 before this fix
  });
```

Add `SESSION_COOKIE_NAME` / `getSessionTokenFromRequest` to the imports where missing.

- [ ] **Step 2: Run to verify they fail**

```bash
npx dotenv -e .env.test -- vitest run tests/unit/auth.test.ts tests/api/auth.test.ts
```
Expected: FAIL — `URIError: URI malformed`, and the route test returns 500.

- [ ] **Step 3: Replace `parseCookies` (`lib/auth.ts:59-67`)**

```ts
function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};

  const cookies: Record<string, string> = {};
  for (const pair of header.split(";")) {
    const trimmed = pair.trim();
    if (!trimmed) continue;

    const eq = trimmed.indexOf("=");
    if (eq < 1) continue; // no name, or a bare flag with no "=" — skip it

    const name = trimmed.slice(0, eq);
    const raw = trimmed.slice(eq + 1);

    // decodeURIComponent throws URIError on a malformed escape (e.g. "%zz").
    // A junk THIRD-PARTY cookie must never be able to 500 an authenticated
    // request, so fall back to the raw value instead of propagating.
    let value: string;
    try {
      value = decodeURIComponent(raw);
    } catch {
      value = raw;
    }

    cookies[name] = value; // last-wins, matching the previous Object.fromEntries behaviour
  }

  return cookies;
}
```

Last-wins is deliberately preserved — changing it is an unrelated behaviour change, and it is largely moot now that `clearSessionCookie` uses `Path=/`.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run typecheck && npm test
```
Expected: exit 0; ~184 tests, **0 failed**.

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts tests/unit/auth.test.ts tests/api/auth.test.ts
git commit -m "fix(auth): a malformed unrelated cookie no longer 500s every authenticated request"
graphify update .
```

---

## Task 3: Login hardening — timing oracle, malformed body, phone normalization, full coverage

**Files:** Create `lib/phone.ts`, `lib/schemas/auth.ts`, `types/auth.ts`; Modify `lib/auth.ts`, `app/api/auth/login/route.ts`, `tests/api/auth.test.ts`, `tests/unit/auth.test.ts`

**Interfaces produced:** `normalizeIranianMobile(raw: string): string`, `loginSchema`, `PublicUser`, `LoginRequest`, `LoginResponse`, `DUMMY_PASSWORD_HASH`.

This task creates the *seeds* of `lib/schemas/auth.ts` and `types/auth.ts` (login only); Tasks 4–7 grow them. That keeps every diff self-contained and avoids writing code you rewrite two commits later.

**The timing oracle, measured:** a valid-hash `bcrypt.compare` takes ~120 ms; the not-found path returns in ~1 ms. That gap enumerates the entire customer base over a LAN.

> **Critical:** the dummy hash **must be a well-formed bcrypt string**. bcryptjs short-circuits to `false` in ~0 ms on a malformed hash, so a placeholder like `"dummy"` compiles, passes a naive test, and fixes *nothing*. The unit test in Step 1 exists to catch exactly that regression.

**Test strategy for timing:** assert a **floor only** (`> 20 ms`), never a ceiling and never a ratio. A floor is one-sided — it can only fail if the bcrypt work genuinely isn't happening. Ceilings and ratios flake on loaded CI runners.

- [ ] **Step 1: Write the failing unit tests — append to `tests/unit/auth.test.ts`**

```ts
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/auth";
import { normalizeIranianMobile } from "@/lib/phone";

describe("login timing equalization", () => {
  it("DUMMY_PASSWORD_HASH is a well-formed cost-10 bcrypt hash", () => {
    // A malformed hash makes bcrypt.compare return false in ~0ms, silently
    // reintroducing the user-enumeration oracle.
    expect(DUMMY_PASSWORD_HASH).toMatch(/^\$2[aby]\$10\$[./A-Za-z0-9]{53}$/);
  });

  it("comparing against it costs real bcrypt work and never matches", async () => {
    const start = Date.now();
    await expect(verifyPassword("anything at all", DUMMY_PASSWORD_HASH)).resolves.toBe(false);
    expect(Date.now() - start).toBeGreaterThan(20);
  });
});

describe("normalizeIranianMobile", () => {
  it("canonicalizes the common Iranian mobile spellings to E.164", () => {
    expect(normalizeIranianMobile("09121112233")).toBe("+989121112233");
    expect(normalizeIranianMobile("9121112233")).toBe("+989121112233");
    expect(normalizeIranianMobile("0912 111 2233")).toBe("+989121112233");
    expect(normalizeIranianMobile("+989121112233")).toBe("+989121112233");
  });

  it("leaves anything unrecognised untouched so usernames pass through", () => {
    expect(normalizeIranianMobile("test.retail")).toBe("test.retail");
    expect(normalizeIranianMobile("admin")).toBe("admin");
  });
});
```

- [ ] **Step 2: Write the failing route tests — `tests/api/auth.test.ts`**

Hoist a URL-agnostic raw-body helper above the `describe` blocks (the handlers never read `request.url`, so any URL works):

```ts
function rawRequest(url: string, body: string, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}
const LOGIN_URL = "http://localhost/api/auth/login";
```

Add to `describe("POST /api/auth/login")`:

```ts
  it("logs in by normalized phone number, not just username", async () => {
    const res = await login(jsonRequest({ identifier: "+989120000102", password: seed.retail.password }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.id).toBe(seed.retail.id);
  });

  it("accepts the local 0912… spelling of a stored +98 number", async () => {
    const res = await login(jsonRequest({ identifier: "09120000102", password: seed.retail.password }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.id).toBe(seed.retail.id);
  });

  it("returns a byte-identical 401 for an unknown identifier and a wrong password", async () => {
    const unknown = await login(jsonRequest({ identifier: "no.such.user", password: seed.retail.password }));
    const wrongPw = await login(jsonRequest({ identifier: seed.retail.username, password: "definitely-wrong" }));

    expect(unknown.status).toBe(401);
    expect(wrongPw.status).toBe(401);
    expect(await unknown.json()).toEqual(await wrongPw.json());
    expect(unknown.headers.get("set-cookie")).toBeNull();
  });

  it("tags a failed login with INVALID_CREDENTIALS", async () => {
    const res = await login(jsonRequest({ identifier: seed.retail.username, password: "nope" }));
    expect((await res.json()).error.code).toBe("INVALID_CREDENTIALS");
  });

  it("pays the bcrypt cost even when no user matched (no timing oracle)", async () => {
    const start = Date.now();
    const res = await login(jsonRequest({ identifier: "no.such.user", password: "whatever" }));
    const elapsed = Date.now() - start;

    expect(res.status).toBe(401);
    // Floor only, never a ceiling or a ratio -> cannot flake on a loaded runner.
    // A cost-10 compare is ~120ms; the pre-fix code returned in ~1ms.
    expect(elapsed).toBeGreaterThan(20);
  });

  it("returns 403 ACCOUNT_DEACTIVATED at the login route itself", async () => {
    await prisma.user.update({ where: { id: seed.retail.id }, data: { isActive: false } });
    const res = await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password }));

    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe("ACCOUNT_DEACTIVATED");
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(await prisma.session.count({ where: { userId: seed.retail.id } })).toBe(0);
  });

  it("returns 400 MALFORMED_JSON (not 500) for an unparseable body", async () => {
    const res = await login(rawRequest(LOGIN_URL, "{ identifier: "));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("MALFORMED_JSON");
  });

  it("returns 400 VALIDATION_FAILED for a missing, empty, or too-short field", async () => {
    for (const body of [
      { password: "Password@123" },                       // identifier missing
      { identifier: seed.retail.username },               // password missing
      { identifier: seed.retail.username, password: "" }, // empty password
      { identifier: "ab", password: "Password@123" },     // identifier too short
    ]) {
      const res = await login(jsonRequest(body));
      expect(res.status).toBe(400);
      const parsed = await res.json();
      expect(parsed.error.code).toBe("VALIDATION_FAILED");
      expect(parsed.error.details).toBeTruthy();
    }
  });

  it("returns the sanitized user with no passwordHash", async () => {
    const res = await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password }));
    const { data } = await res.json();

    expect(Object.keys(data)).not.toContain("passwordHash");
    expect(data).toMatchObject({
      id: seed.retail.id, username: seed.retail.username, role: "RETAIL", isActive: true,
    });
    expect(typeof data.createdAt).toBe("string");   // ISO string, not a Date
  });

  it("sets the session cookie with Path=/, HttpOnly, SameSite and an Expires", async () => {
    const res = await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password }));
    const setCookie = res.headers.get("set-cookie")!;

    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toMatch(/SameSite=lax/i);   // Next serializes it LOWERCASE
    expect(setCookie).toMatch(/Expires=/);
    expect(setCookie).not.toContain("Secure");    // NODE_ENV !== production
  });

  it("persists the request's user-agent on the Session row", async () => {
    await login(rawRequest(
      LOGIN_URL,
      JSON.stringify({ identifier: seed.retail.username, password: seed.retail.password }),
      { "user-agent": "HamiTest/1.0 (vitest)" },
    ));
    const session = await prisma.session.findFirstOrThrow({ where: { userId: seed.retail.id } });
    expect(session.userAgent).toBe("HamiTest/1.0 (vitest)");
  });

  it("stores only a SHA-256 hash of the token, never the token itself", async () => {
    const res = await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password }));
    const token = res.headers.get("set-cookie")!.split(";")[0].split("=")[1];

    const session = await prisma.session.findFirstOrThrow({ where: { userId: seed.retail.id } });
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(session.tokenHash).not.toBe(token);
    expect(session.tokenHash).toBe(hashSessionToken(token));
  });

  it("keeps a second device signed in when the first logs out", async () => {
    const a = (await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password })))
      .headers.get("set-cookie")!.split(";")[0];
    const b = (await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password })))
      .headers.get("set-cookie")!.split(";")[0];

    expect(a).not.toBe(b);
    expect(await prisma.session.count({ where: { userId: seed.retail.id } })).toBe(2);

    await logout(new Request("http://localhost/api/auth/logout", { method: "POST", headers: { cookie: a } }));

    expect((await me(new Request("http://localhost/api/auth/me", { headers: { cookie: a } }))).status).toBe(401);
    expect((await me(new Request("http://localhost/api/auth/me", { headers: { cookie: b } }))).status).toBe(200);
    expect(await prisma.session.count({ where: { userId: seed.retail.id } })).toBe(1);
  });
```

Add `hashSessionToken` and `SESSION_COOKIE_NAME` to the `@/lib/auth` import at the top of the file.

- [ ] **Step 3: Run to verify they fail**

```bash
npx dotenv -e .env.test -- vitest run tests/api/auth.test.ts tests/unit/auth.test.ts
```
Expected: FAIL on the phone-login, timing, malformed-JSON, and code assertions.

- [ ] **Step 4: Create `lib/phone.ts`**

```ts
/** Iranian mobile numbers to E.164. Deliberately duplicates the logic in
 * prisma/legacy-import/normalize.ts rather than importing it — `app/` must not
 * depend on `prisma/legacy-import/`, which is a dev-seed-only pipeline. */
export function normalizeIranianMobile(raw: string): string {
  const trimmed = raw.replace(/[\s-]/g, "");
  if (trimmed.startsWith("+")) return trimmed;
  if (/^09\d{9}$/.test(trimmed)) return `+98${trimmed.slice(1)}`;
  if (/^9\d{9}$/.test(trimmed)) return `+98${trimmed}`;
  return trimmed; // leave anything unrecognised alone
}
```

- [ ] **Step 5: Create `lib/schemas/auth.ts` with the login schema**

```ts
import { z } from "zod";

export const loginSchema = z.object({
  /** Username OR phone number. Trimmed — mobile keyboards love a trailing space. */
  identifier: z.string().trim().min(3).max(50),
  password: z.string().min(1).max(100),
});
```

- [ ] **Step 6: Create `types/auth.ts` with `PublicUser` and its drift guard**

`PublicUser` is an **explicit interface**, not `ReturnType<typeof sanitizeUser>`. The deciding argument is the tripwire: with the one-liner, deleting a field from `sanitizeUser` compiles clean and silently breaks the frontend. With the assertion, `npm run typecheck` fails. `sanitizeUser` is an implementation detail — a field-picking function — and must not *be* the public contract.

```ts
import type { Role } from "@prisma/client";
import type { z } from "zod";
import type { sanitizeUser } from "@/lib/auth";
import type { loginSchema } from "@/lib/schemas/auth";

/** The ONLY user shape any endpoint returns. Wire types, not DB types:
 * Decimal -> number, DateTime -> ISO string. `passwordHash` is never present. */
export interface PublicUser {
  id: number;
  role: Role;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string;
  phoneVerified: boolean;
  nationalNumber: string | null;
  city: string | null;
  shopName: string | null;
  businessLicenseNumber: string | null;
  businessVerified: boolean;
  /** `number | null`, not `number`: the DB columns are non-nullable Decimals
   * defaulting to 0, but `toNumber` (lib/serializers.ts:3) is typed
   * `(value: unknown) => number | null`, so that's the shape actually on the
   * wire. The frontend must handle null. Verified — do not "tighten" this to
   * `number` or the drift assertion below will fail. */
  creditLimit: number | null;
  creditUsed: number | null;
  agentId: number | null;
  isActive: boolean;
  receiveNewsletters: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- compile-time drift guard: zero runtime emit ------------------------
// If sanitizeUser() and PublicUser ever disagree on a field's presence or
// type, `npm run typecheck` fails right here.
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type AssertTrue<T extends true> = T;
export type _PublicUserMatchesSanitizeUser = AssertTrue<Exact<PublicUser, ReturnType<typeof sanitizeUser>>>;

export type LoginRequest = z.infer<typeof loginSchema>;
export type LoginResponse = PublicUser;
export type MeResponse = PublicUser;
export type LogoutResponse = { loggedOut: true };
```

> **If `Exact<...>` fails on first compile**, the mismatch is real. Fix `PublicUser` to match `sanitizeUser`'s actual output; do **not** weaken the assertion. (The `creditLimit`/`creditUsed` nullability above is the one that catches people — it's already correct here.)

- [ ] **Step 7: Add `DUMMY_PASSWORD_HASH` to `lib/auth.ts`, after line 9**

```ts
/** A pre-computed bcrypt hash (cost 10, matching SALT_ROUNDS) of a random string
 * no user can hold as a password. Login compares against this when no user
 * matched, so an unknown identifier costs the same ~120ms as a known one.
 *
 * MUST stay a well-formed bcrypt hash: bcryptjs short-circuits to `false` in
 * ~0ms on a malformed one, silently restoring the enumeration oracle.
 * tests/unit/auth.test.ts asserts both the shape and the cost. */
export const DUMMY_PASSWORD_HASH = "$2a$10$c82gwyoY3ii53IZlsEFqluqdYhJIcEjneuk5V4B/SDaefEBG8chwm";
```

To regenerate instead of reusing this one:
```bash
node -e "console.log(require('bcryptjs').hashSync(require('crypto').randomBytes(32).toString('hex'), 10))"
```

- [ ] **Step 8: Replace `app/api/auth/login/route.ts`**

```ts
import { createSession, sanitizeUser, verifyPassword, setSessionCookie, DUMMY_PASSWORD_HASH } from "@/lib/auth";
import { ApiError, ok, parseJsonBody, withErrorHandling } from "@/lib/http";
import { normalizeIranianMobile } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/schemas/auth";
import type { LoginResponse } from "@/types/auth";

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { identifier, password } = await parseJsonBody(request, loginSchema);

    // Accept either spelling of an Iranian mobile. normalizeIranianMobile is a
    // no-op on anything that isn't one, so usernames pass through untouched.
    const normalized = normalizeIranianMobile(identifier);
    const phoneCandidates = normalized === identifier ? [identifier] : [identifier, normalized];

    const user = await prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { phoneNumber: { in: phoneCandidates } }] },
    });

    // Always run exactly one bcrypt compare, even with no matching user, so
    // response time is identical for "no such account" and "wrong password".
    // Without this, latency is a reliable user-enumeration oracle.
    const passwordMatches = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

    // Same status, message and code for both failures.
    if (!user || !passwordMatches) {
      throw ApiError.coded(401, "INVALID_CREDENTIALS", "Invalid credentials");
    }

    // Checked AFTER the password so a deactivated account isn't discoverable
    // without valid credentials.
    if (!user.isActive) {
      throw ApiError.coded(403, "ACCOUNT_DEACTIVATED", "This account has been deactivated");
    }

    const { token, session } = await createSession(user.id, request.headers.get("user-agent"));
    const response = ok<LoginResponse>(sanitizeUser(user), { message: "Login successful" });
    setSessionCookie(response, token, session.expiresAt);

    return response;
  });
}
```

`!user ||` is redundant at runtime (a null user always yields `passwordMatches === false`) but is required for TypeScript to narrow `user` below. Keep it.

- [ ] **Step 9: Run tests to verify they pass**

```bash
npm run typecheck && npm test
```
Expected: exit 0; ~197 tests, **0 failed**. Suite time grows to ~85 s (several new tests pay a 120 ms bcrypt cost). `testTimeout: 15000` is unaffected.

- [ ] **Step 10: Commit**

```bash
git add lib/auth.ts lib/phone.ts lib/schemas/auth.ts types/auth.ts app/api/auth/login/route.ts tests/api/auth.test.ts tests/unit/auth.test.ts
git commit -m "fix(auth): close the login timing oracle, normalize phone identifiers, 400 on malformed body"
graphify update .
```

---

## Task 4: Register hardening — AGENT escalation, 409 race, phone normalization

**Files:** Modify `app/api/auth/register/route.ts`, `lib/schemas/auth.ts`, `types/auth.ts`, `tests/api/auth.test.ts`

**Interfaces produced:** `registerSchema`, `RegisterRequest`, `RegisterResponse`.

> **On the P2002 race:** wrapping register in a `$transaction` does **not** fix it. At Postgres' default READ COMMITTED both transactions read "no existing user", both insert, and one violates the unique index at commit. The **unique index already prevents the duplicate**; the bug is purely that `P2002` isn't caught and translated to 409. Keep the pre-check (it yields the precise field name) and add the catch as the backstop. Both paths must emit identical status + code.

- [ ] **Step 1: Write the failing tests — `tests/api/auth.test.ts`, `describe("POST /api/auth/register")`**

```ts
  it("returns 409 DUPLICATE_ACCOUNT for a duplicate phoneNumber", async () => {
    const res = await register(jsonRequest({
      username: "brand.new", password: "Password@123", phoneNumber: "+989120000102",
    }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("DUPLICATE_ACCOUNT");
    expect(body.error.message).toContain("phoneNumber");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("returns 409 DUPLICATE_ACCOUNT for a duplicate email", async () => {
    await prisma.user.update({ where: { id: seed.retail.id }, data: { email: "taken@example.com" } });
    const res = await register(jsonRequest({
      username: "brand.new2", password: "Password@123",
      phoneNumber: "+989120000197", email: "taken@example.com",
    }));
    expect(res.status).toBe(409);
    expect((await res.json()).error.message).toContain("email");
  });

  it("rejects self-registration as ADMIN or AGENT", async () => {
    for (const [role, digit] of [["ADMIN", "5"], ["AGENT", "6"]] as const) {
      const res = await register(jsonRequest({
        username: `escalate.${role}`, password: "Password@123",
        phoneNumber: `+98912000019${digit}`, role,
      }));
      expect(res.status).toBe(400);
      expect((await res.json()).error.code).toBe("VALIDATION_FAILED");
      expect(await prisma.user.findUnique({ where: { username: `escalate.${role}` } })).toBeNull();
    }
  });

  it("returns 400 for a password under 6 characters", async () => {
    const res = await register(jsonRequest({
      username: "shorty", password: "abc12", phoneNumber: "+989120000194",
    }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.details.fieldErrors.password).toBeTruthy();
  });

  it("drops shopName/businessLicenseNumber for a non-WHOLESALE role", async () => {
    await register(jsonRequest({
      username: "retail.shop", password: "Password@123", phoneNumber: "+989120000193",
      role: "RETAIL", shopName: "Should Be Dropped", businessLicenseNumber: "LIC-999",
    }));
    const user = await prisma.user.findUniqueOrThrow({ where: { username: "retail.shop" } });
    expect(user.shopName).toBeNull();
    expect(user.businessLicenseNumber).toBeNull();
  });

  it("keeps shopName/businessLicenseNumber for WHOLESALE", async () => {
    await register(jsonRequest({
      username: "wholesale.shop", password: "Password@123", phoneNumber: "+989120000192",
      role: "WHOLESALE", shopName: "Hami Distribution", businessLicenseNumber: "LIC-123",
    }));
    const user = await prisma.user.findUniqueOrThrow({ where: { username: "wholesale.shop" } });
    expect(user.shopName).toBe("Hami Distribution");
  });

  it("rejects agentId on a non-WHOLESALE account", async () => {
    const res = await register(jsonRequest({
      username: "retail.agent", password: "Password@123", phoneNumber: "+989120000191",
      role: "RETAIL", agentId: seed.admin.id,
    }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toContain("WHOLESALE");
  });

  it("rejects an agentId that doesn't reference an active AGENT", async () => {
    const agent = await prisma.user.create({
      data: { username: "an.agent", phoneNumber: "+989120000190",
              passwordHash: "x", role: Role.AGENT, isActive: false },
    });
    const res = await register(jsonRequest({
      username: "ws.badagent", password: "Password@123", phoneNumber: "+989120000189",
      role: "WHOLESALE", agentId: agent.id,
    }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toContain("active AGENT");
  });

  it("normalizes an Iranian mobile to E.164 and rejects the other spelling as a duplicate", async () => {
    await register(jsonRequest({ username: "phone.norm", password: "Password@123", phoneNumber: "09121112233" }));
    const user = await prisma.user.findUniqueOrThrow({ where: { username: "phone.norm" } });
    expect(user.phoneNumber).toBe("+989121112233");

    const dup = await register(jsonRequest({
      username: "phone.norm2", password: "Password@123", phoneNumber: "+989121112233",
    }));
    expect(dup.status).toBe(409);
    expect((await dup.json()).error.code).toBe("DUPLICATE_ACCOUNT");
  });

  it("returns 400 MALFORMED_JSON for an unparseable body", async () => {
    const res = await register(rawRequest("http://localhost/api/auth/register", "{{"));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("MALFORMED_JSON");
  });
```

- [ ] **Step 2: Run to verify they fail**

```bash
npx dotenv -e .env.test -- vitest run tests/api/auth.test.ts
```

- [ ] **Step 3: Add `registerSchema` to `lib/schemas/auth.ts`**

```ts
import { Role } from "@prisma/client";
import { normalizeIranianMobile } from "@/lib/phone";

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(6).max(100),
  // .transform runs before the uniqueness pre-check and the create, so both
  // see the canonical form and 0912…/+98912… can never become two accounts.
  phoneNumber: z.string().trim().min(5).max(20).transform(normalizeIranianMobile),
  email: z.string().trim().email().max(255).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  // AGENT and ADMIN are provisioned out-of-band (seed script / admin API).
  // AGENT is a B2B sales-rep principal, not a self-service storefront role.
  role: z.enum([Role.RETAIL, Role.WHOLESALE]).optional(),
  shopName: z.string().max(200).optional(),
  businessLicenseNumber: z.string().max(100).optional(),
  nationalNumber: z.string().max(50).optional(),
  agentId: z.number().int().positive().optional(),
  referer: z.string().max(200).optional(),
});
```

Blast radius of dropping `AGENT`: **zero**. No test registers an AGENT — `admin-users.test.ts:92,96` promote via the admin PATCH, and `orders.test.ts:122` only exercises agentId validation. AGENTs keep coming from `prisma/seed.ts` and `PATCH /api/admin/users/[id]`.

- [ ] **Step 4: Update `app/api/auth/register/route.ts`**

Replace the body-read (`:27-34`) with `const input = await parseJsonBody(request, registerSchema);`, delete the now-unused inline schema, change the pre-check throw at `:55` to `ApiError.coded(409, "DUPLICATE_ACCOUNT", ...)`, and wrap the create:

```ts
import { Prisma, Role } from "@prisma/client";

/** Prisma reports the violated unique index in `meta.target`; on Postgres that's
 * an array of COLUMN names. username/email/phoneNumber have no @map, so column
 * names equal field names. Defensive about the shape anyway. */
function duplicateFieldFrom(error: Prisma.PrismaClientKnownRequestError): string {
  const target = (error.meta as { target?: unknown } | undefined)?.target;
  const first = Array.isArray(target) ? target[0] : target;
  return typeof first === "string" ? first : "account";
}
```

```ts
    let user;
    try {
      user = await prisma.user.create({ data: { /* unchanged */ } });
    } catch (error) {
      // The pre-check above is best-effort: two concurrent registrations can
      // both pass it. The unique index is what actually prevents the duplicate;
      // this turns its violation into the same 409 instead of a 500.
      // (A transaction would NOT help — at READ COMMITTED both txns read
      // "no existing user" and both insert.)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw ApiError.coded(
          409, "DUPLICATE_ACCOUNT",
          `An account with this ${duplicateFieldFrom(error)} already exists`,
        );
      }
      throw error;
    }
```

Type the success response `ok<RegisterResponse>(sanitizeUser(user), { message: "Account created" })`.

- [ ] **Step 5: Add the register types to `types/auth.ts`**

```ts
import type { registerSchema } from "@/lib/schemas/auth";
export type RegisterRequest = z.infer<typeof registerSchema>;
export type RegisterResponse = PublicUser;
```

Note `RegisterRequest` is the **output** type (post-transform) — `phoneNumber` is already normalized. For the frontend's input shape, `z.input<typeof registerSchema>` is the accurate one; document both in Task 9.

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm run typecheck && npm test
```
Expected: exit 0; ~207 tests, **0 failed**.

- [ ] **Step 7: Commit**

```bash
git add app/api/auth/register/route.ts lib/schemas/auth.ts types/auth.ts tests/api/auth.test.ts
git commit -m "fix(auth): block AGENT self-registration, normalize phones, turn duplicate races into 409"
graphify update .
```

---

## Task 5: Finish the contract types

**Files:** Modify `lib/schemas/auth.ts`, `types/auth.ts`, `app/api/auth/me/route.ts`, `app/api/auth/logout/route.ts`

**Interfaces produced:** `updateProfileSchema`, `changePasswordSchema`, and every remaining request/response type. Tasks 6 and 7 consume these.

**Why schemas are the source of truth for *requests* but not for *responses*:** for requests, the zod schema is the human-authored artifact the server actually enforces — deriving the TS type via `z.infer` removes a drift source at no risk. For responses, the declared interface must be the source of truth so that editing the implementation can't silently change the public contract. The asymmetry is deliberate.

- [ ] **Step 1: Add the remaining schemas to `lib/schemas/auth.ts`**

```ts
/** Self-service profile edits ONLY. Deliberately excludes role, isActive,
 * creditLimit, creditUsed, agentId, phoneNumber, username, businessVerified,
 * phoneVerified, nationalNumber, cardNumber, shopName, businessLicenseNumber
 * — see docs/api/auth.md for why each is admin-managed. */
export const updateProfileSchema = z
  .object({
    firstName: z.string().max(100).nullable(),
    lastName: z.string().max(100).nullable(),
    email: z.string().trim().email().max(255).nullable(),
    city: z.string().max(100).nullable(),
    receiveNewsletters: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(100),
    newPassword: z.string().min(6).max(100),
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must differ from the current one",
    path: ["newPassword"],
  });
```

`.partial()` over nullable fields yields `T | null | undefined`, which maps exactly onto Prisma's update semantics: **absent = don't touch, `null` = clear, value = set.** That three-state behaviour is contract and must be documented in Task 9.

- [ ] **Step 2: Add the remaining types to `types/auth.ts`**

```ts
import type { updateProfileSchema, changePasswordSchema } from "@/lib/schemas/auth";

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type UpdateProfileResponse = PublicUser;
export type ChangePasswordResponse = { passwordChanged: true; revokedSessions: number };
```

- [ ] **Step 3: Type the existing responses**

`app/api/auth/me/route.ts` → `ok<MeResponse>(sanitizeUser(user))`.
`app/api/auth/logout/route.ts` → `ok<LogoutResponse>({ loggedOut: true })`.

- [ ] **Step 4: Prove the drift guard actually fires**

Temporarily delete one field (e.g. `city`) from `sanitizeUser` in `lib/auth.ts`, then:
```bash
npm run typecheck
```
Expected: **FAILS** at `_PublicUserMatchesSanitizeUser` in `types/auth.ts`. Restore the field and re-run — expect exit 0. This step is the whole point of Task 5; do not skip it.

- [ ] **Step 5: Run tests and commit**

```bash
npm run typecheck && npm test
git add lib/schemas/auth.ts types/auth.ts app/api/auth/me/route.ts app/api/auth/logout/route.ts
git commit -m "feat(api): name the auth contract types and guard PublicUser against drift"
graphify update .
```

---

## Task 6: `PATCH /api/auth/me`

**Files:** Modify `app/api/auth/me/route.ts`; Create `tests/api/auth-profile.test.ts`

**Field policy** — self-editable: `firstName`, `lastName`, `city`, `email` (unique → 409), `receiveNewsletters`. Everything else is refused, and each for a reason worth recording:

| Refused | Why |
|---|---|
| `role`, `isActive` | privilege escalation / self-unban |
| `creditLimit`, `creditUsed` | financial, admin-set |
| `agentId` | assigns your own sales rep, affects B2B pricing |
| `phoneNumber`, `username` | **login identifiers**; `phoneNumber` is also the legacy-import join key and would need OTP re-verification (out of scope) |
| `businessVerified`, `phoneVerified` | verification state is a server assertion, not user input |
| `nationalNumber`, `businessLicenseNumber`, `shopName` | these are the *evidence* behind `businessVerified`; letting a verified user swap them decouples the flag from the data |
| `cardNumber` | refund destination — a fraud vector without re-auth |

- [ ] **Step 1: Write the failing tests — create `tests/api/auth-profile.test.ts`**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { GET as me, PATCH as updateMe } from "@/app/api/auth/me/route";
import { prisma } from "@/lib/prisma";
import { getRequest, jsonRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;
let cookie: string;

beforeEach(async () => {
  seed = await seedMinimal();
  cookie = await loginAs(seed.retail);
});

const URL = "http://localhost/api/auth/me";

describe("PATCH /api/auth/me", () => {
  it("updates the whitelisted fields and returns the sanitized user", async () => {
    const res = await updateMe(jsonRequest(URL, "PATCH", {
      firstName: "Ali", lastName: "Rezaei", city: "Tehran",
      email: "ali@example.com", receiveNewsletters: true,
    }, cookie));

    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data).toMatchObject({
      firstName: "Ali", lastName: "Rezaei", city: "Tehran",
      email: "ali@example.com", receiveNewsletters: true,
    });
    expect(Object.keys(data)).not.toContain("passwordHash");
  });

  it("leaves omitted fields untouched and clears a field sent as null", async () => {
    await updateMe(jsonRequest(URL, "PATCH", { firstName: "Ali", city: "Tehran" }, cookie));
    await updateMe(jsonRequest(URL, "PATCH", { city: null }, cookie));

    const user = await prisma.user.findUniqueOrThrow({ where: { id: seed.retail.id } });
    expect(user.firstName).toBe("Ali");   // untouched
    expect(user.city).toBeNull();         // explicitly cleared
  });

  it("ignores privileged fields entirely", async () => {
    const res = await updateMe(jsonRequest(URL, "PATCH", {
      firstName: "Ali",
      role: "ADMIN", isActive: false, creditLimit: 999999999,
      agentId: seed.admin.id, businessVerified: true,
      phoneNumber: "+989999999999", username: "hacked",
    }, cookie));

    expect(res.status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: seed.retail.id } });
    expect(user.role).toBe("RETAIL");
    expect(user.isActive).toBe(true);
    expect(Number(user.creditLimit)).toBe(0);
    expect(user.agentId).toBeNull();
    expect(user.businessVerified).toBe(false);
    expect(user.phoneNumber).toBe("+989120000102");
    expect(user.username).toBe("test.retail");
  });

  it("returns 409 DUPLICATE_ACCOUNT for another user's email", async () => {
    await prisma.user.update({ where: { id: seed.admin.id }, data: { email: "boss@example.com" } });
    const res = await updateMe(jsonRequest(URL, "PATCH", { email: "boss@example.com" }, cookie));
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("DUPLICATE_ACCOUNT");
  });

  it("allows re-submitting your OWN current email", async () => {
    await updateMe(jsonRequest(URL, "PATCH", { email: "mine@example.com" }, cookie));
    const res = await updateMe(jsonRequest(URL, "PATCH", { email: "mine@example.com", city: "Shiraz" }, cookie));
    expect(res.status).toBe(200);
  });

  it("returns 400 for an empty body, an invalid email, and malformed JSON", async () => {
    expect((await updateMe(jsonRequest(URL, "PATCH", {}, cookie))).status).toBe(400);
    expect((await updateMe(jsonRequest(URL, "PATCH", { email: "not-an-email" }, cookie))).status).toBe(400);

    const bad = await updateMe(new Request(URL, {
      method: "PATCH", headers: { "content-type": "application/json", cookie }, body: "{",
    }));
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.code).toBe("MALFORMED_JSON");
  });

  it("returns 401 AUTH_REQUIRED without a session", async () => {
    const res = await updateMe(jsonRequest(URL, "PATCH", { firstName: "Ali" }));
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("AUTH_REQUIRED");
  });

  it("refreshes the session cookie on the response (sliding expiry via withAuth)", async () => {
    const res = await updateMe(jsonRequest(URL, "PATCH", { firstName: "Ali" }, cookie));
    expect(res.headers.get("set-cookie")).toContain("Path=/");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx dotenv -e .env.test -- vitest run tests/api/auth-profile.test.ts
```
Expected: FAIL — `PATCH` is not exported from the route.

- [ ] **Step 3: Append `PATCH` to `app/api/auth/me/route.ts`** (keep the existing `GET`)

```ts
import { Prisma } from "@prisma/client";
import { sanitizeUser, withAuth } from "@/lib/auth";
import { ApiError, ok, parseJsonBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/schemas/auth";
import type { MeResponse, UpdateProfileResponse } from "@/types/auth";

export const GET = withAuth(async (_request, { user }) => ok<MeResponse>(sanitizeUser(user)));

// No inner withErrorHandling: withAuth already wraps the handler in it
// (lib/auth.ts:163), matching the sibling GET and logout routes.
export const PATCH = withAuth(async (request, { user }) => {
  const data = await parseJsonBody(request, updateProfileSchema);

  // Re-submitting your OWN current email must be a no-op, not a 409 —
  // hence the NOT clause.
  if (data.email) {
    const clash = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id: user.id } },
      select: { id: true },
    });
    if (clash) {
      throw ApiError.coded(409, "DUPLICATE_ACCOUNT", "An account with this email already exists");
    }
  }

  let updated;
  try {
    updated = await prisma.user.update({
      where: { id: user.id },
      // Explicit whitelist. zod already strips unknown keys, but spreading
      // parsed data into a Prisma update is one schema edit away from letting
      // `role` through — belt and braces on a privilege boundary.
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.city !== undefined ? { city: data.city } : {}),
        ...(data.receiveNewsletters !== undefined ? { receiveNewsletters: data.receiveNewsletters } : {}),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw ApiError.coded(409, "DUPLICATE_ACCOUNT", "An account with this email already exists");
    }
    throw error;
  }

  return ok<UpdateProfileResponse>(sanitizeUser(updated), { message: "Profile updated" });
});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run typecheck && npm test
```
Expected: exit 0; ~215 tests, **0 failed**.

- [ ] **Step 5: Commit**

```bash
git add app/api/auth/me/route.ts tests/api/auth-profile.test.ts
git commit -m "feat(auth): add PATCH /api/auth/me for self-service profile updates"
graphify update .
```

---

## Task 7: `POST /api/auth/change-password`

**Files:** Create `app/api/auth/change-password/route.ts`; Modify `tests/api/auth-profile.test.ts`

**Two decisions, both load-bearing:**

**It must revoke other sessions.** Session-list, revoke-all, refresh tokens and password reset are all out of scope — which leaves password change as **the only revocation lever a user has**. If it doesn't kill other sessions, then "I think someone got into my account, let me change my password" accomplishes nothing: the attacker's opaque cookie stays valid for its remaining sliding 30-day TTL, and every request they make *extends* it. **Keep the current session alive** — killing it bounces the user to the login screen right after a successful password change, and loses their cart.

**A wrong current password is `400 INVALID_CURRENT_PASSWORD`, not 401.** The session is valid; only the submitted field is wrong. A frontend will have a global "401 → clear state, redirect to login" interceptor (that's how you handle an expired opaque cookie), so a 401 here **signs the user out over a typo**. 403 is also wrong — frontends read it as "feature unavailable" and hide UI. This makes a rule worth stating in the contract doc: **401 from this API always means "your session is gone; re-authenticate," and nothing else ever returns 401.**

- [ ] **Step 1: Write the failing tests — append to `tests/api/auth-profile.test.ts`**

```ts
import { POST as changePassword } from "@/app/api/auth/change-password/route";

const CP_URL = "http://localhost/api/auth/change-password";
const LOGIN_URL = "http://localhost/api/auth/login";

describe("POST /api/auth/change-password", () => {
  it("changes the password; the old one stops working and the new one works", async () => {
    const res = await changePassword(jsonRequest(CP_URL, "POST", {
      currentPassword: seed.retail.password, newPassword: "NewPassword@456",
    }, cookie));
    expect(res.status).toBe(200);
    expect((await res.json()).data.passwordChanged).toBe(true);

    const old = await login(jsonRequest(LOGIN_URL, "POST", {
      identifier: seed.retail.username, password: seed.retail.password,
    }));
    expect(old.status).toBe(401);
    expect((await old.json()).error.code).toBe("INVALID_CREDENTIALS");

    const fresh = await login(jsonRequest(LOGIN_URL, "POST", {
      identifier: seed.retail.username, password: "NewPassword@456",
    }));
    expect(fresh.status).toBe(200);
  });

  it("revokes every OTHER session and keeps the current one alive", async () => {
    const otherCookie = await loginAs(seed.retail);
    expect(await prisma.session.count({ where: { userId: seed.retail.id } })).toBe(2);

    const res = await changePassword(jsonRequest(CP_URL, "POST", {
      currentPassword: seed.retail.password, newPassword: "NewPassword@456",
    }, cookie));
    expect((await res.json()).data.revokedSessions).toBe(1);

    expect(await prisma.session.count({ where: { userId: seed.retail.id } })).toBe(1);
    expect((await me(getRequest(URL, cookie))).status).toBe(200);        // current: alive
    expect((await me(getRequest(URL, otherCookie))).status).toBe(401);   // other: revoked
  });

  it("returns 400 INVALID_CURRENT_PASSWORD (not 401) for a wrong current password", async () => {
    const res = await changePassword(jsonRequest(CP_URL, "POST", {
      currentPassword: "not-my-password", newPassword: "NewPassword@456",
    }, cookie));

    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("INVALID_CURRENT_PASSWORD");

    // Nothing changed: password intact, session untouched.
    expect((await login(jsonRequest(LOGIN_URL, "POST", {
      identifier: seed.retail.username, password: seed.retail.password,
    }))).status).toBe(200);
    expect((await me(getRequest(URL, cookie))).status).toBe(200);
  });

  it("rejects a new password identical to the current one", async () => {
    const res = await changePassword(jsonRequest(CP_URL, "POST", {
      currentPassword: seed.retail.password, newPassword: seed.retail.password,
    }, cookie));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_FAILED");
  });

  it("rejects a new password under 6 characters", async () => {
    const res = await changePassword(jsonRequest(CP_URL, "POST", {
      currentPassword: seed.retail.password, newPassword: "abc12",
    }, cookie));
    expect(res.status).toBe(400);
    expect((await res.json()).error.details.fieldErrors.newPassword).toBeTruthy();
  });

  it("returns 401 AUTH_REQUIRED without a session and 400 MALFORMED_JSON on bad JSON", async () => {
    expect((await changePassword(jsonRequest(CP_URL, "POST", {
      currentPassword: "x", newPassword: "NewPassword@456",
    }))).status).toBe(401);

    const bad = await changePassword(new Request(CP_URL, {
      method: "POST", headers: { "content-type": "application/json", cookie }, body: "nope",
    }));
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.code).toBe("MALFORMED_JSON");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx dotenv -e .env.test -- vitest run tests/api/auth-profile.test.ts
```
Expected: FAIL — the route module doesn't exist.

- [ ] **Step 3: Create `app/api/auth/change-password/route.ts`**

```ts
import {
  getSessionTokenFromRequest, hashPassword, hashSessionToken, verifyPassword, withAuth,
} from "@/lib/auth";
import { ApiError, ok, parseJsonBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/schemas/auth";
import type { ChangePasswordResponse } from "@/types/auth";

export const POST = withAuth(async (request, { user }) => {
  const { currentPassword, newPassword } = await parseJsonBody(request, changePasswordSchema);

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    // 400, NOT 401: the session is valid, only the submitted field is wrong.
    // A 401 here would trip a frontend's global "session expired -> log out"
    // interceptor and sign the user out over a typo.
    throw ApiError.coded(400, "INVALID_CURRENT_PASSWORD", "Current password is incorrect");
  }

  const passwordHash = await hashPassword(newPassword);

  // Changing your password is the ONLY session-revocation lever this API gives
  // a user (no session list, no revoke-all, no password reset), so it must
  // actually revoke: every session EXCEPT the one making this request.
  const token = getSessionTokenFromRequest(request);
  const currentTokenHash = token ? hashSessionToken(token) : null;

  // One transaction: never leave the password changed with stale sessions alive.
  const [, revoked] = await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.session.deleteMany({
      where: {
        userId: user.id,
        // Defensive: withAuth guarantees a token, but if it were ever absent we
        // revoke EVERYTHING rather than leaving an attacker signed in.
        ...(currentTokenHash ? { NOT: { tokenHash: currentTokenHash } } : {}),
      },
    }),
  ]);

  return ok<ChangePasswordResponse>(
    { passwordChanged: true, revokedSessions: revoked.count },
    { message: "Password changed" },
  );
});
```

`withAuth`'s cookie refresh then re-sets the surviving cookie — correct, because that row was deliberately not deleted.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run typecheck && npm test
```
Expected: exit 0; ~221 tests, **0 failed**.

- [ ] **Step 5: Commit**

```bash
git add app/api/auth/change-password/route.ts tests/api/auth-profile.test.ts
git commit -m "feat(auth): add POST /api/auth/change-password with other-session revocation"
graphify update .
```

---

## Task 8: Prove a legacy-imported customer can log in

**Files:** Create `tests/api/auth-legacy-login.test.ts`

Build the user through the **real mapper** (`mapLegacyCustomer`), not a hand-written fixture — otherwise the test verifies your fixture, not the import.

**Why the normalized form is load-bearing:** the real legacy row has `username: "09923286434"` *and* `phone_number: "09923286434"`, which `mapLegacyCustomer` normalizes to `phoneNumber: "+989923286434"`. Legacy usernames **are** raw phone numbers. So logging in with `"09923286434"` would match the *username* branch and prove nothing. Only the normalized `"+989923286434"` — which cannot match any username — provably exercises the phone branch.

**No network, no legacy API calls, no writes.** The test constructs its own row locally.

- [ ] **Step 1: Write the test — create `tests/api/auth-legacy-login.test.ts`**

```ts
import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { prisma } from "@/lib/prisma";
import { IMPORTED_CUSTOMER_PASSWORD, mapLegacyCustomer } from "@/prisma/legacy-import/customers";
import type { LegacyCustomer } from "@/prisma/legacy-import/types";

/** Shape taken verbatim from prisma/legacy-import/customers.test.ts — a REAL
 * legacy row. `username` is the RAW phone while mapLegacyCustomer normalizes
 * phoneNumber to "+9899…", so logging in with the normalized form cannot match
 * the username branch. That is the entire point of this test. */
const rawLegacyCustomer: LegacyCustomer & { phone_number: string } = {
  id: 239,
  username: "09923286434",
  first_name: null, last_name: null, email: null,
  phone_number: "09923286434",
  national_number: null, card_number: null,
  is_active: true, verified: false, receive_newsletters: false,
  management_sms_notifications: false, management_email_notifications: false,
  referer: "google", creation_method: "website",
  date_joined: "2026-08-01T12:59:22.495122+03:30",
};

let userId: number;

beforeEach(async () => {
  const passwordHash = await bcrypt.hash(IMPORTED_CUSTOMER_PASSWORD, 10);
  const created = await prisma.user.create({ data: mapLegacyCustomer(rawLegacyCustomer, passwordHash) });
  userId = created.id;
});

function loginRequest(identifier: string, password: string) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
}

describe("legacy-imported customer login", () => {
  it("logs in by NORMALIZED +98 phone number with the imported password", async () => {
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(stored.phoneNumber).toBe("+989923286434");
    expect(stored.username).not.toBe(stored.phoneNumber); // the phone branch is the only match

    const res = await login(loginRequest("+989923286434", IMPORTED_CUSTOMER_PASSWORD));
    expect(res.status).toBe(200);

    const { data } = await res.json();
    expect(data.id).toBe(userId);
    expect(data.role).toBe("RETAIL");
    expect(res.headers.get("set-cookie")).toContain("session_token=");
    expect(await prisma.session.count({ where: { userId } })).toBe(1);
  });

  it("also accepts the raw 099… form the customer actually remembers", async () => {
    const res = await login(loginRequest("09923286434", IMPORTED_CUSTOMER_PASSWORD));
    expect(res.status).toBe(200);
    expect((await res.json()).data.id).toBe(userId);
  });

  it("rejects a wrong password with the same 401 as any other account", async () => {
    const res = await login(loginRequest("+989923286434", "not-the-imported-password"));
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("INVALID_CREDENTIALS");
  });
});
```

Verify the `LegacyCustomer` field names against `prisma/legacy-import/types.ts` before running — add any required field the interface has that this fixture omits.

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm run typecheck && npm test
```
Expected: exit 0; ~224 tests, **0 failed**.

- [ ] **Step 3: Commit**

```bash
git add tests/api/auth-legacy-login.test.ts
git commit -m "test(auth): prove a legacy-imported customer can log in by normalized phone"
graphify update .
```

---

## Task 9: The frontend contract doc

**Files:** Create `docs/api/auth.md`

Written **for the frontend engineer**, not as an architecture essay.

- [ ] **Step 1: Write `docs/api/auth.md` with these sections**

1. **Envelope** — `ApiSuccess<T>` / `ApiFailure` shapes, importable from `@/types/api`. State plainly: *branch on `error.code`, never on `error.message`; messages are not part of the contract and may be reworded or localized.*
2. **Session model** — opaque token, httpOnly `session_token`, `SameSite=lax`, `Path=/`, 30-day sliding TTL refreshed on every authenticated request. Same-origin only; `fetch` needs `credentials: "same-origin"` (spell it out even though it's the default). No `Authorization` header, no token in the body, no CSRF token. **Call out explicitly that `SameSite=Lax` is the only CSRF defense and is sufficient only while the frontend stays same-origin — moving it to a different origin invalidates the entire design.**
3. **401 means exactly one thing** — session gone; clear client state and redirect to login. Nothing else returns 401. A wrong current password in change-password is a **400**.
4. **Endpoint reference** — for each of `POST /register`, `POST /login`, `GET /me`, `PATCH /me`, `POST /change-password`, `POST /logout`: request type, response type, and a complete table of every `(status, code)` pair it can return.
5. **`PublicUser` field table** with wire types — dates are ISO 8601 strings; `passwordHash` is never present; `creditLimit`/`creditUsed` are `number | null` (serialized `Decimal`s — the frontend must handle null even though the DB columns default to 0).
6. **PATCH three-state semantics** — field absent = unchanged, `null` = cleared, value = set.
7. **Phone handling** — `09121112233`, `9121112233` and `+989121112233` all normalize to `+989121112233` on register and are all accepted as a login identifier.
8. **Known constraints & open decisions**:
   - Username login is **case-sensitive** and will stay that way. The unique index on `username` is case-sensitive, so `Alice` and `alice` can both exist; an insensitive lookup would pick one arbitrarily and could silently sign a user into the wrong account. Fixing it properly needs a citext or normalized-username column.
   - **No rate limiting.** The frontend must not assume the server throttles login attempts.
   - No password reset, no OTP, no email/phone verification enforcement (`phoneVerified` is never checked at login).
   - Expired session rows are never reaped (storage concern, not a security one — `resolveSession` rejects them correctly).
   - **19 non-auth routes still return 500 on a malformed JSON body** (see Follow-ups).
   - **Legacy password cutover is unresolved — see below.**

- [ ] **Step 2: Record the legacy cutover blocker in that doc, verbatim in substance**

Every legacy customer currently shares `IMPORTED_CUSTOMER_PASSWORD = "Imported@12345"`, a constant living in a tracked source file. That is fine for a dev database and **catastrophic the day this points at production data**. The old site has no user-login endpoint and exposes no password hashes on any read schema, so passwords genuinely cannot be migrated. Options, none yet chosen: forced OTP-based first login; a password-reset flow triggered at cutover; a one-time random per-user password delivered by SMS. OTP and password reset are both currently out of scope, which makes this **a hard prerequisite for any production cutover, not a nice-to-have.**

- [ ] **Step 3: Commit**

```bash
git add docs/api/auth.md
git commit -m "docs(api): write the auth contract for the frontend"
```

---

## Task 10: Real-HTTP verification through the dev server

Every one of the ~224 tests calls handlers as plain functions. That never exercises Next's file-system routing, real `Set-Cookie` serialization over the wire, the browser cookie round-trip, method dispatch (does `PATCH` on `/api/auth/me` actually route?), or the raw `Cookie` header path. This task closes that gap.

**Environment facts — internalize before running anything:**

| | |
|---|---|
| `next dev` reads | `.env` → `hami_site_api?schema=**public**` |
| `npm test` reads | `.env.test` → `hami_site_api?schema=**test**` |
| Overlap | **none** — different schemas, same database. The curl flow cannot corrupt the test schema. |
| Prerequisite | The `public` schema is already pushed. **Nothing to run.** The flow registers its own throwaway user. |
| ⚠️ `db:fresh` / `db:seed` | **Do not run.** See Global Constraints. |
| Side effect | one throwaway `users` row + a few `sessions` rows in the dev DB. Harmless. |
| Known oddity | if `app/layout.tsx` wasn't restored in Task 0, `/` errors. `/api/*` is unaffected. |

- [ ] **Step 1: Start the dev server through the preview tooling**

`.claude/launch.json` already defines it (`name: "hami-site"`, port 3000). Use `preview_start` with `{ name: "hami-site" }`, then `preview_logs` to confirm it compiled. **Do not** background a bare `npm run dev` from Bash — that orphans a process holding port 3000 with no log access.

- [ ] **Step 2: Run the flow**

```bash
cd /home/lain/lain_projects/hami-site/hami_site_api_routes
JAR="$(mktemp -t hami-cookies.XXXXXX)"; JAR2="$(mktemp -t hami-cookies2.XXXXXX)"
STAMP="$(date +%s)"; U="curltest.$STAMP"; PHONE="+9891$STAMP"
OLD="Password@123"; NEW="NewPassword@456"; API="http://localhost:3000/api"
CURL="curl -sS -w '\n-- HTTP %{http_code}\n'"

eval $CURL "$API/health"                                            # 200 healthy

# real Set-Cookie over the wire — expect lowercase `lax`, no Max-Age, no Secure
curl -sS -D - -o /dev/null -c "$JAR" -X POST "$API/auth/register" \
  -H 'content-type: application/json' \
  -d "{\"username\":\"$U\",\"password\":\"$OLD\",\"phoneNumber\":\"$PHONE\",\"email\":\"$U@example.com\"}" \
  | grep -i '^set-cookie'

eval $CURL -b "$JAR" "$API/auth/me"                                 # 200, no passwordHash

# malformed JSON must be 400 MALFORMED_JSON over real HTTP, not 500
eval $CURL -b "$JAR" -X PATCH "$API/auth/me" -H 'content-type: application/json' -d '{'

# PATCH actually routes (method dispatch is never tested by vitest)
eval $CURL -b "$JAR" -X PATCH "$API/auth/me" -H 'content-type: application/json' \
  -d '{"firstName":"Ali","city":"Tehran"}'                          # 200, firstName=Ali

eval $CURL -b "$JAR" -X PATCH "$API/auth/me" -H 'content-type: application/json' \
  -d '{"role":"ADMIN","isActive":false}'                            # 400 (all keys stripped)
eval $CURL -b "$JAR" "$API/auth/me"                                 # role still RETAIL

eval $CURL -b "$JAR" -X PATCH "$API/auth/me" -H 'content-type: application/json' \
  -d '{"email":"admin@mixin-shop.example"}'                         # 409 DUPLICATE_ACCOUNT

# THE URIError REGRESSION — only reachable over real HTTP.
# -H Cookie overrides -b, so read the token out of the jar.
TOKEN="$(awk '/session_token/{print $NF}' "$JAR")"
eval $CURL -H "Cookie: _ga=%zz; session_token=$TOKEN" "$API/auth/me"  # 200 (was 500)

curl -sS -D - -o /dev/null -b "$JAR" -c "$JAR" -X POST "$API/auth/logout" | grep -i '^set-cookie'
eval $CURL -b "$JAR" "$API/auth/me"                                 # 401 AUTH_REQUIRED

eval $CURL -c "$JAR" -X POST "$API/auth/login" -H 'content-type: application/json' \
  -d "{\"identifier\":\"$U\",\"password\":\"$OLD\"}"                # 200 (by username)
eval $CURL -b "$JAR" -X POST "$API/auth/logout"
eval $CURL -c "$JAR" -X POST "$API/auth/login" -H 'content-type: application/json' \
  -d "{\"identifier\":\"$PHONE\",\"password\":\"$OLD\"}"            # 200 (by phone)

# timing oracle, visible over the wire: both must be ~equal and both >~100ms
for id in "$U" "definitely.not.a.user.$STAMP"; do
  curl -sS -o /dev/null -w "$id -> %{http_code} in %{time_total}s\n" \
    -X POST "$API/auth/login" -H 'content-type: application/json' \
    -d "{\"identifier\":\"$id\",\"password\":\"wrong-password\"}"
done

eval $CURL -b "$JAR" -X POST "$API/auth/change-password" -H 'content-type: application/json' \
  -d "{\"currentPassword\":\"wrong\",\"newPassword\":\"$NEW\"}"     # 400 INVALID_CURRENT_PASSWORD

eval $CURL -c "$JAR2" -X POST "$API/auth/login" -H 'content-type: application/json' \
  -d "{\"identifier\":\"$U\",\"password\":\"$OLD\"}"
eval $CURL -b "$JAR" -c "$JAR" -X POST "$API/auth/change-password" -H 'content-type: application/json' \
  -d "{\"currentPassword\":\"$OLD\",\"newPassword\":\"$NEW\"}"      # 200 revokedSessions:1
eval $CURL -b "$JAR"  "$API/auth/me"                                # 200 current survived
eval $CURL -b "$JAR2" "$API/auth/me"                                # 401 other revoked

eval $CURL -X POST "$API/auth/login" -H 'content-type: application/json' \
  -d "{\"identifier\":\"$U\",\"password\":\"$OLD\"}"                # 401 old password dead
eval $CURL -c "$JAR" -X POST "$API/auth/login" -H 'content-type: application/json' \
  -d "{\"identifier\":\"$PHONE\",\"password\":\"$NEW\"}"            # 200 new password alive

rm -f "$JAR" "$JAR2"   # they hold a live session token in plaintext — always clean up
```

- [ ] **Step 3: Stop the server and report**

`preview_stop`. Report the actual observed status codes and the two timing numbers verbatim — if any step disagrees with its comment, that's a finding, not a rounding error. The throwaway `curltest.*` user can be left in the dev DB; deleting it is a write and needs explicit approval.

---

## Verification

**Per task:** `npm run typecheck` (exit 0) → `npm test` (**0 failed**) → commit → `graphify update .`. One test process at a time.

**End state:**
- ~30 test files / ~224 tests green, up from 27 / 172.
- `tsc --noEmit` clean, with a live tripwire that fails if `sanitizeUser` and `PublicUser` diverge.
- All five confirmed defects fixed, each pinned by a regression test.
- Task 10's curl flow passing against the real dev server, with the timing-oracle fix visible as two near-equal `time_total` values.
- CI (`.github/workflows/ci.yml`) green unchanged — it already runs `prisma generate` → `db:test:reset` → `typecheck` → `test` and needs no edits.

**Frontend readiness check.** After Task 9, a frontend engineer should be able to build login, registration, profile and password-change screens using only `docs/api/auth.md` plus `import type { PublicUser, LoginRequest, ApiResponse, ApiErrorCode } from "@/types/..."` — without reading a single route handler. If that's not true, the doc isn't done.

---

## Follow-ups (deliberately out of this slice)

1. **19 route files still 500 on a malformed JSON body.** `grep -rln "request.json()" app/api --include=route.ts` → 23 files, 4 fixed here. Replace the parse/throw dance with `parseJsonBody(request, X)`. One mechanical commit; makes `VALIDATION_FAILED` uniform API-wide.
2. **Extract the remaining ~30 inline zod schemas** into `lib/schemas/` and derive request types, same pattern as `lib/schemas/auth.ts`.
3. **`register` doesn't wrap `user.create` + `createSession`.** A failed session insert returns 500 while the account exists. Recoverable (the user can just log in), genuinely low priority — but unlike the P2002 race, this one *is* a real atomicity concern.
4. **Redundant `withErrorHandling` nested inside `withAuth`** in several admin routes (e.g. `app/api/admin/users/[id]/route.ts:25,39`). Harmless, but it makes readers think `withAuth` doesn't wrap. Cleanup + a comment on `withAuth`.
5. **`OtpCode` / `OtpPurpose` are dead models.** Either drop them from `prisma/schema.prisma` and `resetDb()`, or comment them as reserved for the out-of-scope OTP work.
6. **Rate limiting on login/register.** Currently unlimited credential stuffing, and bcrypt cost 10 doubles as a cheap CPU-exhaustion vector. An in-process limiter only works single-instance; a real fix needs Redis.
7. **Expired session rows are never deleted.** Storage concern, not security. A nightly reaper eventually becomes necessary.
8. **Legacy password cutover** — the blocker recorded in Task 9, Step 2.
