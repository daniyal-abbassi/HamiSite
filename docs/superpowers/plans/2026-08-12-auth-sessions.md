# Auth & Sessions Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the no-op login/register with real, revocable, cookie-based sessions, and ship the `withAuth` wrapper every later plan depends on — plus the Vitest + real-Postgres test harness the whole backend-completion phase uses.

**Architecture:** A new `Session` table stores only a SHA-256 hash of a random 32-byte token; the raw token is the httpOnly cookie value. `lib/auth.ts` gains token/hash helpers, `createSession`, `getSessionUser`/`getOptionalSessionUser`, and a `withAuth(handler, { roles? })` wrapper composed with the existing `withErrorHandling`. Login/register set the cookie on success; a new logout route deletes the session row and clears it; a new `/api/auth/me` route returns the current user. Session cookies are read by manually parsing the `Cookie` header (not `next/headers`'s `cookies()`, which requires Next's request-scoped async context and breaks the project's test strategy of importing route handlers and invoking them directly) and written via `NextResponse.cookies.set()`/`.delete()`, which operate on the response instance itself and work identically in tests and in a real server.

**Tech Stack:** Next.js 14 App Router route handlers, Prisma 5 / PostgreSQL, Zod, bcryptjs (existing), Vitest 4 + dotenv-cli against a real Postgres test database (no mocked Prisma).

## Global Constraints

- Reuse existing conventions exactly: `ApiError`/`ok`/`fail`/`withErrorHandling`/`parsePagination` from `lib/http.ts`, Zod schemas per route, Prisma singleton from `lib/prisma.ts`.
- Sessions: 30-day expiry, **sliding** — every authenticated request that resolves a valid session bumps `expiresAt`. Cookie is `httpOnly`, `secure` in production, `sameSite: "lax"`.
- Only the token **hash** is ever stored server-side; the raw token exists only in the cookie.
- Tests run against a **real Postgres test database** (`DATABASE_URL` as loaded from `.env.test`), never mocked Prisma — this project's order/session logic relies on `prisma.$transaction` with dependent reads/writes that mocks would fake unfaithfully.
- Next.js route handlers are tested by importing them directly (`import { POST } from '@/app/api/auth/login/route'`) and invoking with a constructed `Request` — no real HTTP server. This is why cookie handling must avoid `next/headers`.
- Out of scope for this plan: SMS OTP (the `OtpCode`/`OtpPurpose` models stay unused), admin API, payments, authorization hardening of cart/orders/addresses (that's the next plan, which depends on this one).

---

## File Structure

- `prisma/schema.prisma` — add `Session` model + `sessions Session[]` relation on `User`.
- `vitest.config.ts` — new. Vitest config with `@/*` path alias matching `tsconfig.json`, node environment.
- `.env.test` — new, gitignored. Test database connection string.
- `.gitignore` — add `.env.test`.
- `package.json` — add `vitest`, `dotenv-cli` devDependencies; add `test`, `test:watch`, `db:test:reset` scripts.
- `tests/setup.ts` — new. Global `beforeEach` that truncates all tables (real Postgres, not mocks).
- `tests/helpers/db.ts` — new. `resetDb()`.
- `tests/helpers/seed.ts` — new. `seedMinimal()` — a couple of users per role, one product+variant, one coupon.
- `tests/helpers/request.ts` — new. `buildRequest()`, `cookieFromSetCookie()` — construct `Request` objects and pull a session cookie out of a `Set-Cookie` response header for chaining "log in, then call an authed route" in tests.
- `lib/auth.ts` — add session token/hash helpers, `SESSION_COOKIE_NAME`, `createSession`, `getSessionUser`, `getOptionalSessionUser`, `withAuth`.
- `app/api/auth/login/route.ts` — modify: create session + set cookie on success.
- `app/api/auth/register/route.ts` — modify: create session + set cookie on success.
- `app/api/auth/logout/route.ts` — new.
- `app/api/auth/me/route.ts` — new.
- `tests/unit/auth.test.ts`, `tests/unit/withAuth.test.ts`, `tests/api/auth.test.ts` — new.

## Task 1: `Session` model + migration

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `prisma.session` Prisma Client model with fields `id, userId, tokenHash, userAgent, createdAt, expiresAt`, unique on `tokenHash`.

This is a schema/infra task with no application code to unit-test yet — verified by a successful migration instead of a red/green test cycle.

- [ ] **Step 1: Add the `Session` model**

Add to `prisma/schema.prisma`, directly after the `Address` model (before the `BRANDS & CATEGORIES` section comment, around line 210):

```prisma
model Session {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String   @unique
  userAgent String?
  createdAt DateTime @default(now())
  expiresAt DateTime

  @@index([userId])
  @@index([expiresAt])
  @@map("sessions")
}
```

And add the back-relation on `User` (in the relations block, right after `cart Cart?` around line 156):

```prisma
  sessions        Session[]
```

- [ ] **Step 2: Validate the schema**

Run: `npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 3: Generate and apply the migration**

Run: `npx prisma migrate dev --name add_session`
Expected: a new folder under `prisma/migrations/`, ending with `Your database is now in sync with your schema.` and the Prisma Client regenerated.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add Session model for cookie-based auth"
```

---

## Task 2: Vitest test infrastructure against a real Postgres test database

**Files:**
- Create: `vitest.config.ts`
- Create: `.env.test`
- Modify: `.gitignore`
- Modify: `package.json`
- Create: `tests/helpers/db.ts`
- Create: `tests/helpers/seed.ts`
- Create: `tests/setup.ts`
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Produces: `resetDb(): Promise<void>` from `tests/helpers/db.ts`.
- Produces: `seedMinimal(): Promise<SeedResult>` from `tests/helpers/seed.ts`, where
  ```ts
  type SeedResult = {
    admin: { id: number; username: string; password: string };
    retail: { id: number; username: string; password: string };
    wholesale: { id: number; username: string; password: string; creditLimit: number };
    product: { id: number; slug: string; price: number };
    variant: { id: number; price: number; stock: number };
    coupon: { id: number; code: string };
  };
  ```
  Later plans' tests use these fixed fixtures instead of re-deriving IDs.

- [ ] **Step 1: Install dependencies**

```bash
npm install --save-dev vitest@^4.1.10 dotenv-cli@^11.0.0
```

- [ ] **Step 2: Add `.env.test` and gitignore it**

Create `.env.test`:

```bash
DATABASE_URL="postgresql://hami_app:hami_app_pw@127.0.0.1:5432/hami_site_api?schema=test"
```

> **Environment note (deviates from the plan's original placeholder):** this project's actual dev role (`hami_app`) has no `CREATEDB` privilege, so a separate test *database* isn't available — this uses a separate Postgres *schema* (`test`) on the same database/role instead, which `hami_app` can create/drop freely. Confirmed working before this task started.

Add to `.gitignore` (it currently contains `node_modules/`, `dist/`, `.next/`, `.env`, `*.log`):

```
.env.test
```

- [ ] **Step 3: Add `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

`fileParallelism: false` matters: every test file shares one real Postgres database, so test files must not run concurrently against it.

- [ ] **Step 4: Add npm scripts**

In `package.json`, add to `"scripts"`:

```json
    "test": "dotenv -e .env.test -- vitest run",
    "test:watch": "dotenv -e .env.test -- vitest",
    "db:test:reset": "dotenv -e .env.test -- prisma db push --force-reset --accept-data-loss"
```

> **Environment note (deviates from the plan's original `prisma migrate reset`):** this project's migration history is incomplete for replay — the whole schema was originally applied via `prisma db push` (not `prisma migrate`), and Task 1 found `hami_app` also lacks the shadow-database privilege `migrate dev`/`migrate reset` need, so only a single (Session-only) migration file exists. Replaying just that against an empty schema would create the `sessions` table alone and silently drop every other table. `prisma db push --force-reset` sidesteps migration history entirely — it syncs the *current* `schema.prisma` directly, which is exactly what a disposable test schema needs, and matches this project's own pre-existing `db:fresh` script (`package.json`), which uses the identical pattern for the dev database.

- [ ] **Step 5: Create the test schema and reset it**

```bash
npm run db:test:reset
```

Expected: Prisma reports `Your database is now in sync with your Prisma schema` against the `test` schema.

- [ ] **Step 6: `tests/helpers/db.ts` — `resetDb()`**

```ts
import { prisma } from "@/lib/prisma";

export async function resetDb() {
  await prisma.$transaction([
    prisma.couponUsage.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.productHistory.deleteMany(),
    prisma.priceTier.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.productTag.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.product.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.category.deleteMany(),
    prisma.brand.deleteMany(),
    prisma.address.deleteMany(),
    prisma.session.deleteMany(),
    prisma.otpCode.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
```

Order matters: children before parents, matching the FK graph in `prisma/schema.prisma` (e.g. `OrderItem` before `Order`, `Order` before `User`).

- [ ] **Step 7: `tests/helpers/seed.ts` — `seedMinimal()`**

```ts
import { CouponType, Role, StockType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function seedMinimal() {
  const password = "Password@123";
  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.create({
    data: {
      username: "test.admin",
      phoneNumber: "+989120000101",
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const retail = await prisma.user.create({
    data: {
      username: "test.retail",
      phoneNumber: "+989120000102",
      passwordHash,
      role: Role.RETAIL,
      isActive: true,
    },
  });

  const wholesale = await prisma.user.create({
    data: {
      username: "test.wholesale",
      phoneNumber: "+989120000103",
      passwordHash,
      role: Role.WHOLESALE,
      isActive: true,
      creditLimit: 100_000_000,
    },
  });

  const product = await prisma.product.create({
    data: {
      name: "Test Phone",
      slug: "test-phone",
      price: 1_000_000,
      available: true,
      stockType: StockType.LIMITED,
      stock: 50,
      hasVariants: true,
    },
  });

  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      color: "black",
      storage: "128GB",
      price: 1_200_000,
      stock: 20,
      stockType: StockType.LIMITED,
      isDefault: true,
    },
  });

  const coupon = await prisma.coupon.create({
    data: {
      name: "Test Coupon",
      code: "TEST10",
      type: CouponType.PERCENT_BASED,
      amount: 10,
      isActive: true,
    },
  });

  return {
    admin: { id: admin.id, username: admin.username, password },
    retail: { id: retail.id, username: retail.username, password },
    wholesale: { id: wholesale.id, username: wholesale.username, password, creditLimit: 100_000_000 },
    product: { id: product.id, slug: product.slug, price: 1_000_000 },
    variant: { id: variant.id, price: 1_200_000, stock: 20 },
    coupon: { id: coupon.id, code: coupon.code },
  };
}

export type SeedResult = Awaited<ReturnType<typeof seedMinimal>>;
```

- [ ] **Step 8: `tests/setup.ts`**

```ts
import { beforeEach } from "vitest";
import { resetDb } from "./helpers/db";

beforeEach(async () => {
  await resetDb();
});
```

- [ ] **Step 9: Write the smoke test**

`tests/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { seedMinimal } from "./helpers/seed";

describe("test infrastructure", () => {
  it("resets and seeds a real Postgres test database", async () => {
    const beforeSeed = await prisma.user.count();
    expect(beforeSeed).toBe(0);

    const seed = await seedMinimal();

    expect(seed.admin.username).toBe("test.admin");
    const afterSeed = await prisma.user.count();
    expect(afterSeed).toBe(3);
  });

  it("truncates between tests (proves beforeEach ran)", async () => {
    const count = await prisma.user.count();
    expect(count).toBe(0);
  });
});
```

- [ ] **Step 10: Run it**

Run: `npm run test`
Expected: 2 passed (both `tests/smoke.test.ts` cases). If it fails with a connection error, confirm Postgres is reachable at the URL in `.env.test` and that `npm run db:test:reset` (Step 5) succeeded.

- [ ] **Step 11: Commit**

```bash
git add vitest.config.ts .env.test .gitignore package.json package-lock.json tests/
git commit -m "test: add Vitest infrastructure against a real Postgres test database"
```

---

## Task 3: Session token/hash helpers in `lib/auth.ts`

**Files:**
- Modify: `lib/auth.ts`
- Test: `tests/unit/auth.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `SESSION_COOKIE_NAME: string`, `SESSION_TTL_MS: number`, `generateSessionToken(): string`, `hashSessionToken(token: string): string` from `lib/auth.ts`.

- [ ] **Step 1: Write the failing test**

`tests/unit/auth.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { generateSessionToken, hashSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_MS } from "@/lib/auth";

describe("session token helpers", () => {
  it("generates a 64-char hex token that differs each call", () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });

  it("hashes deterministically and differently per token", () => {
    const token = generateSessionToken();
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).not.toBe(token);
    expect(hashSessionToken(generateSessionToken())).not.toBe(hashSessionToken(token));
  });

  it("exposes the cookie name and a 30-day TTL", () => {
    expect(SESSION_COOKIE_NAME).toBe("session_token");
    expect(SESSION_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/auth.test.ts`
Expected: FAIL — `generateSessionToken` is not exported from `@/lib/auth`.

- [ ] **Step 3: Implement**

Add to the top of `lib/auth.ts` (after the existing imports, before `const SALT_ROUNDS = 10;`):

```ts
import { randomBytes, createHash } from "node:crypto";
```

Add after the existing `verifyPassword` function (after line 13):

```ts
export const SESSION_COOKIE_NAME = "session_token";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function generateSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/auth.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts tests/unit/auth.test.ts
git commit -m "feat: add session token generation and hashing helpers"
```

---

## Task 4: `createSession`, `getSessionUser`, `getOptionalSessionUser`, `withAuth`

**Files:**
- Modify: `lib/auth.ts`
- Test: `tests/unit/withAuth.test.ts`

**Interfaces:**
- Consumes: `SESSION_COOKIE_NAME`, `generateSessionToken`, `hashSessionToken` (Task 3); `seedMinimal` (Task 2); `prisma` from `lib/prisma.ts`.
- Produces:
  ```ts
  function createSession(userId: number, userAgent?: string | null): Promise<{ token: string; session: Session }>;
  function getSessionUser(request: Request): Promise<User | null>;
  function getOptionalSessionUser(request: Request): Promise<User | null>; // alias of getSessionUser, kept as a distinct named export for call-site clarity in Plan 2
  function withAuth<Params = undefined>(
    handler: (request: Request, ctx: { user: User; params: Params }) => Promise<NextResponse>,
    options?: { roles?: Role[] }
  ): (request: Request, routeCtx?: { params: Params }) => Promise<NextResponse>;
  ```
  `withAuth`'s returned function has the exact shape Next.js App Router route handlers need (`(request, { params })`), so later plans use it as `export const GET = withAuth(async (request, { user, params }) => { ... });`.

- [ ] **Step 1: Write the failing test**

`tests/unit/withAuth.test.ts`:

```ts
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE_NAME, withAuth } from "@/lib/auth";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;

beforeEach(async () => {
  seed = await seedMinimal();
});

function requestWithCookie(token?: string) {
  return new Request("http://localhost/api/test", {
    headers: token ? { cookie: `${SESSION_COOKIE_NAME}=${token}` } : {},
  });
}

describe("withAuth", () => {
  it("returns 401 with no cookie", async () => {
    const handler = withAuth(async () => NextResponse.json({ ok: true }));
    const res = await handler(requestWithCookie());
    expect(res.status).toBe(401);
  });

  it("returns 401 for an unknown or expired token", async () => {
    const handler = withAuth(async () => NextResponse.json({ ok: true }));
    const res = await handler(requestWithCookie("not-a-real-token"));
    expect(res.status).toBe(401);

    const { token } = await createSession(seed.retail.id);
    await prisma.session.updateMany({
      where: { userId: seed.retail.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const expiredRes = await handler(requestWithCookie(token));
    expect(expiredRes.status).toBe(401);
  });

  it("returns 403 for a deactivated account", async () => {
    await prisma.user.update({ where: { id: seed.retail.id }, data: { isActive: false } });
    const { token } = await createSession(seed.retail.id);
    const handler = withAuth(async () => NextResponse.json({ ok: true }));
    const res = await handler(requestWithCookie(token));
    expect(res.status).toBe(403);
  });

  it("returns 403 when roles don't include the user's role", async () => {
    const { token } = await createSession(seed.retail.id);
    const handler = withAuth(async () => NextResponse.json({ ok: true }), { roles: [Role.ADMIN] });
    const res = await handler(requestWithCookie(token));
    expect(res.status).toBe(403);
  });

  it("calls the handler with the resolved user on success and bumps expiresAt", async () => {
    const { token, session } = await createSession(seed.admin.id);
    const handler = withAuth(async (_req, { user }) => NextResponse.json({ id: user.id, role: user.role }));
    const res = await handler(requestWithCookie(token));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ id: seed.admin.id, role: Role.ADMIN });

    const updated = await prisma.session.findUniqueOrThrow({ where: { id: session.id } });
    expect(updated.expiresAt.getTime()).toBeGreaterThan(session.expiresAt.getTime());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/withAuth.test.ts`
Expected: FAIL — `createSession`/`withAuth` are not exported from `@/lib/auth`.

- [ ] **Step 3: Implement**

Add to `lib/auth.ts`, after the code added in Task 3, before the closing `sanitizeUser` block stays where it is — append at the end of the file:

```ts
import { NextResponse } from "next/server";
import { Role, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/http";

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((pair) => {
      const [key, ...rest] = pair.trim().split("=");
      return [key, decodeURIComponent(rest.join("="))];
    }),
  );
}

export async function createSession(userId: number, userAgent?: string | null) {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const session = await prisma.session.create({
    data: { userId, tokenHash, userAgent: userAgent ?? null, expiresAt },
  });

  return { token, session };
}

async function resolveSessionUser(request: Request): Promise<User | null> {
  const cookies = parseCookies(request.headers.get("cookie"));
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({ where: { tokenHash }, include: { user: true } });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });

  return session.user;
}

/** Requires a valid session; callers should treat a null return as "not authenticated". */
export async function getSessionUser(request: Request): Promise<User | null> {
  return resolveSessionUser(request);
}

/** Same resolution as getSessionUser but named for call sites where auth is optional (e.g. coupon validation). */
export async function getOptionalSessionUser(request: Request): Promise<User | null> {
  return resolveSessionUser(request);
}

type AuthedHandler<Params> = (
  request: Request,
  ctx: { user: User; params: Params },
) => Promise<NextResponse>;

export function withAuth<Params = undefined>(
  handler: AuthedHandler<Params>,
  options?: { roles?: Role[] },
) {
  return async (request: Request, routeCtx?: { params: Params }) => {
    return withErrorHandling(async () => {
      const user = await getSessionUser(request);
      if (!user) {
        throw new ApiError(401, "Authentication required");
      }
      if (!user.isActive) {
        throw new ApiError(403, "Account deactivated");
      }
      if (options?.roles && !options.roles.includes(user.role)) {
        throw new ApiError(403, "Forbidden");
      }

      return handler(request, { user, params: routeCtx?.params as Params });
    });
  };
}
```

Also add `withErrorHandling` to the existing `@/lib/http` import at the top of `lib/auth.ts` (it currently only imports `toNumber` from `@/lib/serializers`) — the file now needs:

```ts
import { ApiError, withErrorHandling } from "@/lib/http";
```

(remove the duplicate `import { ApiError } from "@/lib/http";` added above in favor of this single combined import).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/withAuth.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts tests/unit/withAuth.test.ts
git commit -m "feat: add createSession, getSessionUser and withAuth"
```

---

## Task 5: Login and register create sessions and set the cookie

**Files:**
- Modify: `app/api/auth/login/route.ts`
- Modify: `app/api/auth/register/route.ts`
- Test: `tests/api/auth.test.ts`

**Interfaces:**
- Consumes: `createSession`, `SESSION_COOKIE_NAME`, `SESSION_TTL_MS` (Task 4); `sanitizeUser`, `hashPassword`, `verifyPassword` (existing).

- [ ] **Step 1: Write the failing test**

`tests/api/auth.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;

beforeEach(async () => {
  seed = await seedMinimal();
});

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/auth/x", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  it("sets a session cookie and creates a Session row on success", async () => {
    const res = await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password }));
    expect(res.status).toBe(200);

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie).toContain("HttpOnly");

    const sessionCount = await prisma.session.count({ where: { userId: seed.retail.id } });
    expect(sessionCount).toBe(1);
  });

  it("returns 401 and sets no cookie on wrong password", async () => {
    const res = await login(jsonRequest({ identifier: seed.retail.username, password: "wrong-password" }));
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});

describe("POST /api/auth/register", () => {
  it("creates the user, a Session row, and sets the cookie", async () => {
    const res = await register(
      jsonRequest({ username: "new.customer", password: "Password@123", phoneNumber: "+989120000199" }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain(`${SESSION_COOKIE_NAME}=`);

    const user = await prisma.user.findUniqueOrThrow({ where: { username: "new.customer" } });
    const sessionCount = await prisma.session.count({ where: { userId: user.id } });
    expect(sessionCount).toBe(1);
  });

  it("returns 409 for a duplicate username without creating a session", async () => {
    const res = await register(
      jsonRequest({ username: seed.retail.username, password: "Password@123", phoneNumber: "+989120000198" }),
    );
    expect(res.status).toBe(409);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/api/auth.test.ts`
Expected: FAIL — no `set-cookie` header is present yet.

- [ ] **Step 3: Implement — login route**

In `app/api/auth/login/route.ts`, change the import (line 2) from:

```ts
import { sanitizeUser, verifyPassword } from "@/lib/auth";
```

to:

```ts
import { createSession, sanitizeUser, verifyPassword, SESSION_COOKIE_NAME, SESSION_TTL_MS } from "@/lib/auth";
```

Replace the final line of the handler (line 44, `return ok(sanitizeUser(user), { message: "Login successful" });`) with:

```ts
    const { token, session } = await createSession(user.id, request.headers.get("user-agent"));
    const response = ok(sanitizeUser(user), { message: "Login successful" });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
    });

    return response;
```

Note `SESSION_TTL_MS` is imported but unused directly here — remove it from the import if your editor flags unused imports; it's only needed by `createSession` internally. (Import just `createSession`, `sanitizeUser`, `verifyPassword`, `SESSION_COOKIE_NAME`.)

- [ ] **Step 4: Implement — register route**

In `app/api/auth/register/route.ts`, change the import (line 3) from:

```ts
import { hashPassword, sanitizeUser } from "@/lib/auth";
```

to:

```ts
import { createSession, hashPassword, sanitizeUser, SESSION_COOKIE_NAME } from "@/lib/auth";
```

Replace the final line (line 94, `return ok(sanitizeUser(user), { message: "Account created" });`) with:

```ts
    const { token, session } = await createSession(user.id, request.headers.get("user-agent"));
    const response = ok(sanitizeUser(user), { message: "Account created" });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
    });

    return response;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- tests/api/auth.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add app/api/auth/login/route.ts app/api/auth/register/route.ts tests/api/auth.test.ts
git commit -m "feat: create a session and set the cookie on login and register"
```

---

## Task 6: Logout

**Files:**
- Create: `app/api/auth/logout/route.ts`
- Test: `tests/api/auth.test.ts` (append)

**Interfaces:**
- Consumes: `withAuth`, `SESSION_COOKIE_NAME`, `hashSessionToken` (Task 3/4).

- [ ] **Step 1: Write the failing test**

Append to `tests/api/auth.test.ts`:

```ts
import { POST as logout } from "@/app/api/auth/logout/route";

describe("POST /api/auth/logout", () => {
  it("deletes the session row and clears the cookie", async () => {
    const loginRes = await login(jsonRequest({ identifier: seed.retail.username, password: seed.retail.password }));
    const cookie = loginRes.headers.get("set-cookie")!.split(";")[0];

    const res = await logout(new Request("http://localhost/api/auth/logout", { method: "POST", headers: { cookie } }));
    expect(res.status).toBe(200);

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/session_token=;/);

    const sessionCount = await prisma.session.count({ where: { userId: seed.retail.id } });
    expect(sessionCount).toBe(0);
  });

  it("returns 401 without a session cookie", async () => {
    const res = await logout(new Request("http://localhost/api/auth/logout", { method: "POST" }));
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/api/auth.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/auth/logout/route'`.

- [ ] **Step 3: Implement**

Create `app/api/auth/logout/route.ts`:

```ts
import { hashSessionToken, ok, SESSION_COOKIE_NAME, withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const POST = withAuth(async (request) => {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  const token = match ? decodeURIComponent(match[1]) : null;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }

  const response = ok({ loggedOut: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
});
```

Note: `ok` is re-exported from `lib/http.ts`, not `lib/auth.ts` — fix the import to:

```ts
import { hashSessionToken, SESSION_COOKIE_NAME, withAuth } from "@/lib/auth";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/api/auth.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add app/api/auth/logout/route.ts tests/api/auth.test.ts
git commit -m "feat: add POST /api/auth/logout"
```

---

## Task 7: `GET /api/auth/me`

**Files:**
- Create: `app/api/auth/me/route.ts`
- Test: `tests/api/auth.test.ts` (append)

**Interfaces:**
- Consumes: `withAuth` (Task 4), `sanitizeUser` (existing).

- [ ] **Step 1: Write the failing test**

Append to `tests/api/auth.test.ts`:

```ts
import { GET as me } from "@/app/api/auth/me/route";

describe("GET /api/auth/me", () => {
  it("returns the sanitized current user", async () => {
    const loginRes = await login(jsonRequest({ identifier: seed.admin.username, password: seed.admin.password }));
    const cookie = loginRes.headers.get("set-cookie")!.split(";")[0];

    const res = await me(new Request("http://localhost/api/auth/me", { headers: { cookie } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.username).toBe(seed.admin.username);
    expect(body.data.passwordHash).toBeUndefined();
  });

  it("returns 401 without a session", async () => {
    const res = await me(new Request("http://localhost/api/auth/me"));
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/api/auth.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/auth/me/route'`.

- [ ] **Step 3: Implement**

Create `app/api/auth/me/route.ts`:

```ts
import { sanitizeUser, withAuth } from "@/lib/auth";
import { ok } from "@/lib/http";

export const GET = withAuth(async (_request, { user }) => {
  return ok(sanitizeUser(user));
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/api/auth.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Run the full suite**

Run: `npm run test`
Expected: all tests across `tests/smoke.test.ts`, `tests/unit/auth.test.ts`, `tests/unit/withAuth.test.ts`, `tests/api/auth.test.ts` pass (18 tests total).

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/api/auth/me/route.ts tests/api/auth.test.ts
git commit -m "feat: add GET /api/auth/me"
```

---

## Self-Review Notes

- **Spec coverage:** §1 Data model (Task 1) ✓. §2 Auth & sessions — `withAuth` (Task 4), login/register/logout/me (Tasks 5–7) ✓. §6 Testing infra prerequisite (Task 2) ✓. §3 (hardening existing routes) and §4/§5 (admin API, payments) are explicitly the next plans, not this one.
- **No placeholders:** every step has runnable code; no "add error handling" style steps.
- **Type consistency:** `withAuth`'s `ctx.user` is the raw Prisma `User` (not sanitized) throughout — `/me` is the only place that calls `sanitizeUser` on it, matching how later plans need `role`/`creditLimit`/`isActive` on `ctx.user` directly.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-12-auth-sessions.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
