# Authorization Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the hole where cart, address, and order routes trust a client-supplied `userId` — every one of them derives the acting user from the authenticated session instead, and item/address/order sub-resources gain ownership checks so a guessable numeric ID can't be used to read or mutate another user's data.

**Architecture:** Every route touching user-scoped data is wrapped in `withAuth` from `lib/auth.ts` (built in the prior plan) and reads `user.id`/`user.role` from `ctx.user` instead of `request.body.userId` / `?userId=`. Sub-resource routes addressed by their own numeric ID (a cart item, an address, an order) additionally verify the row's owning `userId` matches `ctx.user.id` before returning or mutating it, returning `404` (not `403`) so existence isn't leaked to non-owners. Coupon validation stays a public, unauthenticated-allowed endpoint but resolves the acting user from an *optional* session via `getOptionalSessionUser` for user-scoped usage-limit checks, rather than trusting a client-supplied `userId` in the body.

**Tech Stack:** Same as the prior plan — Next.js 14 App Router, Prisma, Zod, Vitest against the real Postgres test DB.

## Global Constraints

- Depends on **Plan 1 (`2026-08-12-auth-sessions.md`)**: `withAuth`, `getOptionalSessionUser`, `SESSION_COOKIE_NAME`, the Vitest harness, and `seedMinimal()` must already exist and pass their own tests before starting here.
- No route in this plan trusts a client-supplied `userId` from query string or request body for anything that determines *whose* data is read or written. Every regression test in this plan proves that explicitly: send a spoofed `userId` belonging to another seeded user and assert the response is scoped to the *authenticated* user instead.
- Ownership violations on ID-addressed sub-resources (cart items, addresses, single orders) return `404`, not `403` — don't confirm another user's resource exists.
- Public, unauthenticated routes (`products`, `categories`, `brands`, `health`) are untouched by this plan. Coupon validation (`/api/coupons/validate`) stays public too — only its `userId` source changes.
- Reuse `ApiError`/`ok`/`withErrorHandling` from `lib/http.ts` exactly as the existing routes already do.

---

## File Structure

- `lib/auth.ts` — no changes; `getOptionalSessionUser` already exists from Plan 1. (If it doesn't, stop and finish Plan 1 first.)
- `app/api/cart/route.ts` — modify: `GET`/`DELETE` wrapped in `withAuth`, drop the `userId` query param.
- `app/api/cart/items/route.ts` — modify: `POST` wrapped in `withAuth`, drop `userId` from the body schema.
- `app/api/cart/items/[id]/route.ts` — modify: `PATCH`/`DELETE` wrapped in `withAuth`, add ownership check.
- `app/api/addresses/route.ts` — modify: `GET`/`POST` wrapped in `withAuth`, drop `userId`.
- `app/api/addresses/[id]/route.ts` — modify: `GET`/`PATCH`/`DELETE` wrapped in `withAuth`, add ownership check.
- `app/api/orders/route.ts` — modify: `GET`/`POST` wrapped in `withAuth`, drop `userId`, reuse `ctx.user` instead of a redundant `prisma.user.findUnique`.
- `app/api/orders/[id]/route.ts` — modify: `GET` wrapped in `withAuth` with an owner-or-admin check; `PATCH` restricted to `withAuth({ roles: [Role.ADMIN] })` (its full status/payment mutation power belongs to admins — the dedicated `/api/admin/orders/[id]/status` route lands in the Admin API plan and may retire this one; for now it's simply access-controlled).
- `app/api/coupons/validate/route.ts` — modify: drop `userId` from the body schema, resolve it from `getOptionalSessionUser`.
- `tests/api/cart.test.ts`, `tests/api/addresses.test.ts`, `tests/api/orders.test.ts`, `tests/api/coupons.test.ts` — new.
- `tests/helpers/request.ts` — new. Shared login-and-get-cookie helper reused across all the test files above.

## Task 1: Shared test login helper

**Files:**
- Create: `tests/helpers/request.ts`
- Test: covered indirectly by every later task's tests using it.

**Interfaces:**
- Produces: `loginAs(user: { username: string; password: string }): Promise<string>` — returns a `Cookie:` header value.

This is a small, pure test-infra addition with no independent "feature" to red/green — it's exercised for the first time in Task 2. Write it now so every later task can use it immediately.

- [ ] **Step 1: Implement**

```ts
import { POST as login } from "@/app/api/auth/login/route";

export async function loginAs(user: { username: string; password: string }) {
  const res = await login(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: user.username, password: user.password }),
    }),
  );

  if (res.status !== 200) {
    throw new Error(`loginAs failed with status ${res.status}`);
  }

  return res.headers.get("set-cookie")!.split(";")[0];
}

export function jsonRequest(url: string, method: string, body: unknown, cookie?: string) {
  return new Request(url, {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

export function getRequest(url: string, cookie?: string) {
  return new Request(url, { headers: cookie ? { cookie } : {} });
}
</br>
```

Remove the stray `</br>` — it isn't real code, just close the file after `getRequest`.

- [ ] **Step 2: Commit**

```bash
git add tests/helpers/request.ts
git commit -m "test: add shared login/request helpers for authorization tests"
```

---

## Task 2: Harden cart routes

**Files:**
- Modify: `app/api/cart/route.ts`
- Modify: `app/api/cart/items/route.ts`
- Modify: `app/api/cart/items/[id]/route.ts`
- Test: `tests/api/cart.test.ts`

**Interfaces:**
- Consumes: `withAuth` (Plan 1), `loadCartByUserId`/`serializeCart` (existing, unchanged), `loginAs`/`jsonRequest`/`getRequest` (Task 1), `seedMinimal` (Plan 1).

- [ ] **Step 1: Write the failing tests**

`tests/api/cart.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { DELETE as clearCart, GET as getCart } from "@/app/api/cart/route";
import { POST as addItem } from "@/app/api/cart/items/route";
import { DELETE as removeItem, PATCH as updateItem } from "@/app/api/cart/items/[id]/route";
import { prisma } from "@/lib/prisma";
import { getRequest, jsonRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;
let retailCookie: string;
let wholesaleCookie: string;

beforeEach(async () => {
  seed = await seedMinimal();
  retailCookie = await loginAs(seed.retail);
  wholesaleCookie = await loginAs(seed.wholesale);
});

describe("cart authorization", () => {
  it("GET /api/cart ignores a spoofed userId and scopes to the session", async () => {
    const res = await getCart(getRequest(`http://localhost/api/cart?userId=${seed.wholesale.id}`, retailCookie));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.userId).toBe(seed.retail.id);
  });

  it("GET /api/cart returns 401 without a session", async () => {
    const res = await getCart(getRequest("http://localhost/api/cart"));
    expect(res.status).toBe(401);
  });

  it("POST /api/cart/items ignores a spoofed userId in the body", async () => {
    const res = await addItem(
      jsonRequest(
        "http://localhost/api/cart/items",
        "POST",
        { userId: seed.wholesale.id, productId: seed.product.id, variantId: seed.variant.id, quantity: 1 },
        retailCookie,
      ),
    );
    expect(res.status).toBe(200);

    const cart = await prisma.cart.findUniqueOrThrow({ where: { userId: seed.retail.id } });
    const items = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
    expect(items).toHaveLength(1);

    const wholesaleCart = await prisma.cart.findUnique({ where: { userId: seed.wholesale.id } });
    expect(wholesaleCart).toBeNull();
  });

  it("a user cannot PATCH another user's cart item", async () => {
    await addItem(
      jsonRequest(
        "http://localhost/api/cart/items",
        "POST",
        { productId: seed.product.id, variantId: seed.variant.id, quantity: 1 },
        retailCookie,
      ),
    );
    const cart = await prisma.cart.findUniqueOrThrow({ where: { userId: seed.retail.id } });
    const item = await prisma.cartItem.findFirstOrThrow({ where: { cartId: cart.id } });

    const res = await updateItem(
      jsonRequest(`http://localhost/api/cart/items/${item.id}`, "PATCH", { quantity: 2 }, wholesaleCookie),
      { params: { id: String(item.id) } },
    );
    expect(res.status).toBe(404);
  });

  it("a user cannot DELETE another user's cart item", async () => {
    await addItem(
      jsonRequest(
        "http://localhost/api/cart/items",
        "POST",
        { productId: seed.product.id, variantId: seed.variant.id, quantity: 1 },
        retailCookie,
      ),
    );
    const cart = await prisma.cart.findUniqueOrThrow({ where: { userId: seed.retail.id } });
    const item = await prisma.cartItem.findFirstOrThrow({ where: { cartId: cart.id } });

    const res = await removeItem(getRequest(`http://localhost/api/cart/items/${item.id}`, wholesaleCookie), {
      params: { id: String(item.id) },
    });
    expect(res.status).toBe(404);

    const stillThere = await prisma.cartItem.findUnique({ where: { id: item.id } });
    expect(stillThere).not.toBeNull();
  });

  it("DELETE /api/cart clears only the session user's cart", async () => {
    await addItem(
      jsonRequest(
        "http://localhost/api/cart/items",
        "POST",
        { productId: seed.product.id, variantId: seed.variant.id, quantity: 1 },
        retailCookie,
      ),
    );
    const res = await clearCart(getRequest("http://localhost/api/cart", retailCookie));
    expect(res.status).toBe(200);
    const cart = await prisma.cart.findUniqueOrThrow({ where: { userId: seed.retail.id } });
    const items = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
    expect(items).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- tests/api/cart.test.ts`
Expected: FAIL — routes still read `userId` from the query/body and return `400`/wrong-scoped data instead of `401`/`404`.

- [ ] **Step 3: Implement — `app/api/cart/route.ts`**

Replace the whole file:

```ts
import { loadCartByUserId, serializeCart } from "@/lib/cart";
import { withAuth } from "@/lib/auth";
import { ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(async (_request, { user }) => {
  const cart = await loadCartByUserId(user.id);
  return ok(serializeCart(cart, user.id));
});

export const DELETE = withAuth(async (_request, { user }) => {
  const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  const emptyCart = await loadCartByUserId(user.id);
  return ok(serializeCart(emptyCart, user.id), { message: "Cart cleared" });
});
```

`withErrorHandling` is imported but unused directly in this file now (`withAuth` wraps it internally) — drop it from the import.

- [ ] **Step 4: Implement — `app/api/cart/items/route.ts`**

Change the schema (drop `userId`, lines 8–13):

```ts
const addItemSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().optional(),
  quantity: z.number().int().positive().default(1),
});
```

Replace the handler (lines 15–108):

```ts
export const POST = withAuth(async (request, { user }) => {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsed = addItemSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid request body", parsed.error.flatten());
    }

    const input = parsed.data;

    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, price: true, available: true, stock: true, stockType: true },
    });

    if (!product || !product.available) {
      throw new ApiError(404, "Product not found or unavailable");
    }

    let unitPrice = toNumber(product.price) ?? 0;
    let stockType = product.stockType;
    let stock = product.stock;

    if (input.variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: input.variantId },
        select: { id: true, productId: true, price: true, stock: true, stockType: true },
      });

      if (!variant || variant.productId !== product.id) {
        throw new ApiError(400, `Variant ${input.variantId} does not belong to product ${product.id}`);
      }

      unitPrice = toNumber(variant.price) ?? unitPrice;
      stockType = variant.stockType;
      stock = variant.stock;
    }

    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: input.productId,
        variantId: input.variantId ?? null,
      },
    });

    const requestedQuantity = (existingItem?.quantity ?? 0) + input.quantity;

    if (stockType === StockType.LIMITED && requestedQuantity > stock) {
      throw new ApiError(409, "Insufficient stock", { available: stock, requested: requestedQuantity });
    }

    if (stockType === StockType.OUT_OF_STOCK) {
      throw new ApiError(409, "Product is out of stock");
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: requestedQuantity, unitPrice },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: input.productId,
          variantId: input.variantId,
          quantity: input.quantity,
          unitPrice,
        },
      });
    }

    const updatedCart = await loadCartByUserId(user.id);

    return ok(serializeCart(updatedCart, user.id), { message: "Item added to cart" });
  });
});
```

Update the import line (line 4) to add `withAuth`:

```ts
import { withAuth } from "@/lib/auth";
import { loadCartByUserId, serializeCart } from "@/lib/cart";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/serializers";
```

- [ ] **Step 5: Implement — `app/api/cart/items/[id]/route.ts`**

Add an ownership check inside `loadItemWithStock` (it already loads `cart: { select: { userId: true } }`, so just compare after the existing not-found check, lines 29–33):

```ts
async function loadItemWithStock(id: number, ownerId: number) {
  const item = await prisma.cartItem.findUnique({
    where: { id },
    include: {
      cart: { select: { userId: true } },
      product: { select: { id: true, stock: true, stockType: true } },
      variant: { select: { id: true, stock: true, stockType: true } },
    },
  });

  if (!item || item.cart.userId !== ownerId) {
    throw new ApiError(404, "Cart item not found");
  }

  return item;
}
```

Update `PATCH` and `DELETE` to be `withAuth`-wrapped and pass `user.id` through:

```ts
export const PATCH = withAuth<{ id: string }>(async (request, { user, params }) => {
  return withErrorHandling(async () => {
    const id = parseId(params.id);
    const body = await request.json();
    const parsed = updateItemSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid request body", parsed.error.flatten());
    }

    const item = await loadItemWithStock(id, user.id);
    const { quantity } = parsed.data;

    const stockType = item.variant?.stockType ?? item.product.stockType;
    const stock = item.variant?.stock ?? item.product.stock;

    if (stockType === StockType.OUT_OF_STOCK) {
      throw new ApiError(409, "Product is out of stock");
    }

    if (stockType === StockType.LIMITED && quantity > stock) {
      throw new ApiError(409, "Insufficient stock", { available: stock, requested: quantity });
    }

    await prisma.cartItem.update({ where: { id }, data: { quantity } });

    const updatedCart = await loadCartByUserId(user.id);

    return ok(serializeCart(updatedCart, user.id), { message: "Cart item updated" });
  });
});

export const DELETE = withAuth<{ id: string }>(async (_request, { user, params }) => {
  return withErrorHandling(async () => {
    const id = parseId(params.id);
    await loadItemWithStock(id, user.id);

    await prisma.cartItem.delete({ where: { id } });

    const updatedCart = await loadCartByUserId(user.id);

    return ok(serializeCart(updatedCart, user.id), { message: "Cart item removed" });
  });
});
```

Add `withAuth` to the imports and `loadCartByUserId`/`serializeCart` from `@/lib/cart` (not previously imported in this file):

```ts
import { StockType } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { loadCartByUserId, serializeCart } from "@/lib/cart";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run test -- tests/api/cart.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 7: Commit**

```bash
git add app/api/cart tests/api/cart.test.ts
git commit -m "fix: derive cart userId from the session instead of the client"
```

---

## Task 3: Harden address routes

**Files:**
- Modify: `app/api/addresses/route.ts`
- Modify: `app/api/addresses/[id]/route.ts`
- Test: `tests/api/addresses.test.ts`

**Interfaces:**
- Consumes: `withAuth` (Plan 1), `loginAs`/`jsonRequest`/`getRequest` (Task 1).

- [ ] **Step 1: Write the failing tests**

`tests/api/addresses.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { GET as listAddresses, POST as createAddress } from "@/app/api/addresses/route";
import {
  DELETE as deleteAddress,
  GET as getAddress,
  PATCH as patchAddress,
} from "@/app/api/addresses/[id]/route";
import { prisma } from "@/lib/prisma";
import { getRequest, jsonRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;
let retailCookie: string;
let wholesaleCookie: string;

beforeEach(async () => {
  seed = await seedMinimal();
  retailCookie = await loginAs(seed.retail);
  wholesaleCookie = await loginAs(seed.wholesale);
});

async function createRetailAddress() {
  const res = await createAddress(
    jsonRequest(
      "http://localhost/api/addresses",
      "POST",
      { userId: seed.wholesale.id, city: "Tehran", address: "123 Test St" },
      retailCookie,
    ),
  );
  return res;
}

describe("address authorization", () => {
  it("POST ignores a spoofed userId and creates the address for the session user", async () => {
    const res = await createRetailAddress();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.userId).toBe(seed.retail.id);
  });

  it("GET (list) ignores a spoofed userId query param", async () => {
    await createRetailAddress();
    const res = await listAddresses(getRequest(`http://localhost/api/addresses?userId=${seed.wholesale.id}`, retailCookie));
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].userId).toBe(seed.retail.id);
  });

  it("another user cannot GET/PATCH/DELETE this address by id", async () => {
    const created = await (await createRetailAddress()).json();
    const id = created.data.id;

    const getRes = await getAddress(getRequest(`http://localhost/api/addresses/${id}`, wholesaleCookie), {
      params: { id: String(id) },
    });
    expect(getRes.status).toBe(404);

    const patchRes = await patchAddress(
      jsonRequest(`http://localhost/api/addresses/${id}`, "PATCH", { city: "Mashhad" }, wholesaleCookie),
      { params: { id: String(id) } },
    );
    expect(patchRes.status).toBe(404);

    const deleteRes = await deleteAddress(getRequest(`http://localhost/api/addresses/${id}`, wholesaleCookie), {
      params: { id: String(id) },
    });
    expect(deleteRes.status).toBe(404);

    const stillThere = await prisma.address.findUnique({ where: { id } });
    expect(stillThere).not.toBeNull();
  });

  it("the owner can GET/PATCH/DELETE their own address", async () => {
    const created = await (await createRetailAddress()).json();
    const id = created.data.id;

    const patchRes = await patchAddress(
      jsonRequest(`http://localhost/api/addresses/${id}`, "PATCH", { city: "Mashhad" }, retailCookie),
      { params: { id: String(id) } },
    );
    expect(patchRes.status).toBe(200);

    const deleteRes = await deleteAddress(getRequest(`http://localhost/api/addresses/${id}`, retailCookie), {
      params: { id: String(id) },
    });
    expect(deleteRes.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- tests/api/addresses.test.ts`
Expected: FAIL — routes are still unauthenticated and ownership-blind.

- [ ] **Step 3: Implement — `app/api/addresses/route.ts`**

Drop `userId` from `createAddressSchema` (lines 5–17):

```ts
const createAddressSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  province: z.string().optional(),
  city: z.string().min(1),
  address: z.string().min(1),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDefault: z.boolean().optional(),
});
```

Replace `GET` (lines 19–40):

```ts
export const GET = withAuth(async (_request, { user }) => {
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return ok(addresses, { total: addresses.length });
});
```

Replace `POST` (lines 42–90), swapping every `input.userId` for `user.id` and dropping the now-redundant user-exists lookup (the session already guarantees the user exists and is active):

```ts
export const POST = withAuth(async (request, { user }) => {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsed = createAddressSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid request body", parsed.error.flatten());
    }

    const input = parsed.data;

    const existingCount = await prisma.address.count({ where: { userId: user.id } });
    const shouldBeDefault = input.isDefault === true || existingCount === 0;

    const address = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId: user.id,
          firstName: input.firstName,
          lastName: input.lastName,
          phoneNumber: input.phoneNumber,
          province: input.province,
          city: input.city,
          address: input.address,
          postalCode: input.postalCode,
          latitude: input.latitude,
          longitude: input.longitude,
          isDefault: shouldBeDefault,
        },
      });
    });

    return ok(address, { message: "Address created" });
  });
});
```

Update imports at the top of the file:

```ts
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
```

- [ ] **Step 4: Implement — `app/api/addresses/[id]/route.ts`**

Wrap all three handlers in `withAuth<{ id: string }>` and add an ownership check right after each existing not-found check. Replace `GET` (lines 26–37):

```ts
export const GET = withAuth<{ id: string }>(async (_request, { user, params }) => {
  return withErrorHandling(async () => {
    const id = parseId(params.id);

    const address = await prisma.address.findUnique({ where: { id } });
    if (!address || address.userId !== user.id) {
      throw new ApiError(404, "Address not found");
    }

    return ok(address);
  });
});
```

Replace `PATCH` (lines 39–83):

```ts
export const PATCH = withAuth<{ id: string }>(async (request, { user, params }) => {
  return withErrorHandling(async () => {
    const id = parseId(params.id);
    const body = await request.json();
    const parsed = updateAddressSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid request body", parsed.error.flatten());
    }

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      throw new ApiError(404, "Address not found");
    }

    const input = parsed.data;

    const address = await prisma.$transaction(async (tx) => {
      if (input.isDefault === true) {
        await tx.address.updateMany({
          where: { userId: existing.userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          phoneNumber: input.phoneNumber,
          province: input.province,
          city: input.city,
          address: input.address,
          postalCode: input.postalCode,
          latitude: input.latitude,
          longitude: input.longitude,
          isDefault: input.isDefault,
        },
      });
    });

    return ok(address, { message: "Address updated" });
  });
});
```

Replace `DELETE` (lines 85–111):

```ts
export const DELETE = withAuth<{ id: string }>(async (_request, { user, params }) => {
  return withErrorHandling(async () => {
    const id = parseId(params.id);

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      throw new ApiError(404, "Address not found");
    }

    await prisma.address.delete({ where: { id } });

    if (existing.isDefault) {
      const nextDefault = await prisma.address.findFirst({
        where: { userId: existing.userId },
        orderBy: { createdAt: "desc" },
      });

      if (nextDefault) {
        await prisma.address.update({ where: { id: nextDefault.id }, data: { isDefault: true } });
      }
    }

    return ok({ id }, { message: "Address deleted" });
  });
});
```

Add `withAuth` to the imports:

```ts
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- tests/api/addresses.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add app/api/addresses tests/api/addresses.test.ts
git commit -m "fix: derive address userId from the session and add ownership checks"
```

---

## Task 4: Harden order routes

**Files:**
- Modify: `app/api/orders/route.ts`
- Modify: `app/api/orders/[id]/route.ts`
- Test: `tests/api/orders.test.ts`

**Interfaces:**
- Consumes: `withAuth` (Plan 1), `Role` from `@prisma/client`.

- [ ] **Step 1: Write the failing tests**

`tests/api/orders.test.ts`:

```ts
import { Role } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { GET as listOrders, POST as createOrder } from "@/app/api/orders/route";
import { GET as getOrder, PATCH as patchOrder } from "@/app/api/orders/[id]/route";
import { prisma } from "@/lib/prisma";
import { getRequest, jsonRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;
let retailCookie: string;
let wholesaleCookie: string;
let adminCookie: string;

beforeEach(async () => {
  seed = await seedMinimal();
  retailCookie = await loginAs(seed.retail);
  wholesaleCookie = await loginAs(seed.wholesale);
  adminCookie = await loginAs(seed.admin);
});

function orderPayload(overrides: Record<string, unknown> = {}) {
  return {
    firstName: "Ali",
    lastName: "Retail",
    phone: "+989120000000",
    city: "Tehran",
    addressText: "123 Test St",
    items: [{ productId: seed.product.id, variantId: seed.variant.id, quantity: 1 }],
    ...overrides,
  };
}

describe("order authorization", () => {
  it("POST /api/orders ignores a spoofed userId and creates the order for the session user", async () => {
    const res = await createOrder(
      jsonRequest("http://localhost/api/orders", "POST", orderPayload({ userId: seed.wholesale.id }), retailCookie),
    );
    expect(res.status).toBe(200);

    const order = await prisma.order.findFirstOrThrow({ where: { orderNumber: (await res.clone().json()).data.orderNumber } });
    expect(order.userId).toBe(seed.retail.id);
  });

  it("GET /api/orders ignores a spoofed userId and only returns the session user's orders", async () => {
    await createOrder(jsonRequest("http://localhost/api/orders", "POST", orderPayload(), retailCookie));
    await createOrder(jsonRequest("http://localhost/api/orders", "POST", orderPayload(), wholesaleCookie));

    const res = await listOrders(getRequest(`http://localhost/api/orders?userId=${seed.wholesale.id}`, retailCookie));
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].customer.id).toBe(seed.retail.id);
  });

  it("a user cannot GET another user's order by id", async () => {
    const created = await (
      await createOrder(jsonRequest("http://localhost/api/orders", "POST", orderPayload(), retailCookie))
    ).json();

    const res = await getOrder(getRequest(`http://localhost/api/orders/${created.data.id}`, wholesaleCookie), {
      params: { id: String(created.data.id) },
    });
    expect(res.status).toBe(404);
  });

  it("an admin can GET any order by id", async () => {
    const created = await (
      await createOrder(jsonRequest("http://localhost/api/orders", "POST", orderPayload(), retailCookie))
    ).json();

    const res = await getOrder(getRequest(`http://localhost/api/orders/${created.data.id}`, adminCookie), {
      params: { id: String(created.data.id) },
    });
    expect(res.status).toBe(200);
  });

  it("a non-admin cannot PATCH an order's status", async () => {
    const created = await (
      await createOrder(jsonRequest("http://localhost/api/orders", "POST", orderPayload(), retailCookie))
    ).json();

    const res = await patchOrder(
      jsonRequest(`http://localhost/api/orders/${created.data.id}`, "PATCH", { status: "PROCESSING" }, retailCookie),
      { params: { id: String(created.data.id) } },
    );
    expect(res.status).toBe(403);
  });

  it("an admin can PATCH an order's status", async () => {
    const created = await (
      await createOrder(jsonRequest("http://localhost/api/orders", "POST", orderPayload(), retailCookie))
    ).json();

    const res = await patchOrder(
      jsonRequest(`http://localhost/api/orders/${created.data.id}`, "PATCH", { status: "PROCESSING" }, adminCookie),
      { params: { id: String(created.data.id) } },
    );
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- tests/api/orders.test.ts`
Expected: FAIL — routes are unauthenticated and `userId`-driven today.

- [ ] **Step 3: Implement — `app/api/orders/route.ts`**

Drop `userId` from `createOrderSchema` (line 11, delete `userId: z.number().int().positive(),`).

Replace `GET` (lines 48–83):

```ts
export const GET = withAuth(async (request, { user }) => {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    const status = searchParams.get("status");

    const where = {
      userId: user.id,
      ...(status ? { status: status as OrderStatus } : {}),
    };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
        include: orderListInclude(),
      }),
    ]);

    const data = orders.map(serializeOrderSummary);

    return ok(data, {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      hasNextPage: pagination.page * pagination.pageSize < total,
    });
  });
});
```

In `POST` (lines 85–359), remove the redundant user lookup (lines 97–104) and replace every `user.id`/`user.role`/`user.creditLimit`/`user.creditUsed` reference with the `user` from `withAuth`'s `ctx` (same field names — `getSessionUser` returns the full Prisma `User` row, so nothing about the shape changes). Wrap the handler:

```ts
export const POST = withAuth(async (request, { user }) => {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid request body", parsed.error.flatten());
    }

    const input = parsed.data;
    const paymentTerm = normalizePaymentTerm(input.paymentTerm ?? "CASH");

    ensureB2BTermAllowed(user.role, paymentTerm);

    if (input.agentId && user.role !== Role.WHOLESALE) {
      throw new ApiError(400, "agentId can only be set for WHOLESALE customer orders");
    }

    // ... unchanged from here: productIds/variantIds lookup, preparedItems,
    // coupon evaluation, credit check, and the prisma.$transaction block —
    // every `user.id` in that unchanged body already refers to this `user`
    // parameter, so no further edits are needed there.
  });
});
```

The comment marks a large unchanged middle section for the implementer's clarity — copy the existing body of `POST` from the original file starting at `const productIds = [...new Set(...)]` (original line 112) through the final `return ok(...)` (original line 357) verbatim into that spot, since it already references `user.id`/`user.role`/`user.creditLimit`/`user.creditUsed`, which now come from `withAuth`'s `ctx.user` instead of the deleted local lookup.

Update the imports at the top of the file to add `withAuth`:

```ts
import { B2BPaymentTerm, CouponType, OrderStatus, PaymentStatus, Role, StockType } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { evaluateCoupon } from "@/lib/coupons";
import { ApiError, ok, parsePagination, withErrorHandling } from "@/lib/http";
import { orderListInclude, serializeOrderSummary } from "@/lib/orders";
import { ensureB2BTermAllowed, normalizePaymentTerm, resolveMatchingTier } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { serializeDate, toNumber } from "@/lib/serializers";
```

- [ ] **Step 4: Implement — `app/api/orders/[id]/route.ts`**

Replace `GET` (lines 26–52) with an owner-or-admin check:

```ts
export const GET = withAuth<{ id: string }>(async (_request, { user, params }) => {
  return withErrorHandling(async () => {
    const id = parseId(params.id);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        ...orderListInclude(),
        agent: { select: { id: true, username: true, role: true } },
        address: true,
        coupon: { select: { id: true, code: true, name: true, type: true } },
      },
    });

    if (!order || (order.userId !== user.id && user.role !== Role.ADMIN)) {
      throw new ApiError(404, "Order not found");
    }

    return ok({
      ...serializeOrderSummary(order),
      agent: order.agent,
      address: order.address,
      coupon: order.coupon,
      customerNote: order.customerNote,
    });
  });
});
```

Replace the `PATCH` export signature (line 54) to restrict it to admins — the body of the handler is unchanged, only the wrapping changes:

```ts
export const PATCH = withAuth<{ id: string }>(
  async (request, { params }) => {
    return withErrorHandling(async () => {
      // ... unchanged: the entire existing PATCH body (original lines 56–127)
      // stays exactly as-is here — it never referenced a client-supplied
      // userId to begin with, only the order id from params.
    });
  },
  { roles: [Role.ADMIN] },
);
```

Copy the original `PATCH` handler body verbatim (original lines 56–127, from `const id = parseId(params.id);` through the final `return ok(serializeOrderSummary(updated), { message: "Order updated" });`) into that spot.

Add `withAuth` to the imports:

```ts
import { OrderStatus, PaymentStatus, Role, StockType } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { orderListInclude, serializeOrderSummary, TERMINAL_CANCEL_STATUSES } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/serializers";
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- tests/api/orders.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add app/api/orders tests/api/orders.test.ts
git commit -m "fix: derive order userId from the session and restrict status PATCH to admins"
```

---

## Task 5: Harden coupon validation

**Files:**
- Modify: `app/api/coupons/validate/route.ts`
- Test: `tests/api/coupons.test.ts`

**Interfaces:**
- Consumes: `getOptionalSessionUser` (Plan 1).

- [ ] **Step 1: Write the failing test**

`tests/api/coupons.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { POST as validateCoupon } from "@/app/api/coupons/validate/route";
import { prisma } from "@/lib/prisma";
import { jsonRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;

beforeEach(async () => {
  seed = await seedMinimal();
});

describe("coupon validation authorization", () => {
  it("works unauthenticated, without a userId in the body", async () => {
    const res = await validateCoupon(
      jsonRequest("http://localhost/api/coupons/validate", "POST", { code: seed.coupon.code, subtotal: 100000 }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.valid).toBe(true);
  });

  it("ignores a spoofed userId and uses the session user for usage-limit checks", async () => {
    await prisma.coupon.update({ where: { id: seed.coupon.id }, data: { usageLimitPerUser: 1 } });
    await prisma.couponUsage.create({ data: { couponId: seed.coupon.id, userId: seed.retail.id } });

    const cookie = await loginAs(seed.retail);
    const res = await validateCoupon(
      jsonRequest(
        "http://localhost/api/coupons/validate",
        "POST",
        { code: seed.coupon.code, subtotal: 100000, userId: seed.wholesale.id },
        cookie,
      ),
    );
    const body = await res.json();
    expect(body.data.valid).toBe(false);
    expect(body.data.reason).toMatch(/maximum number of times/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/api/coupons.test.ts`
Expected: FAIL — the route still reads `userId` from the body, so the spoofed-vs-real-usage distinction the second test checks doesn't hold.

- [ ] **Step 3: Implement**

Drop `userId` from `validateSchema` (line 7, delete `userId: z.number().int().positive().optional(),`).

Replace the handler (lines 16–42):

```ts
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsed = validateSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid request body", parsed.error.flatten());
    }

    const sessionUser = await getOptionalSessionUser(request);

    const result = await evaluateCoupon({ ...parsed.data, userId: sessionUser?.id });

    return ok(
      result.valid
        ? {
            valid: true,
            coupon: { id: result.couponId, code: result.code, name: result.name, type: result.type },
            discountAmount: result.discountAmount,
          }
        : {
            valid: false,
            reason: result.reason,
            coupon: { id: result.couponId, code: result.code, name: result.name, type: result.type },
            discountAmount: 0,
          },
    );
  });
}
```

Add `getOptionalSessionUser` to the imports:

```ts
import { z } from "zod";
import { getOptionalSessionUser } from "@/lib/auth";
import { evaluateCoupon } from "@/lib/coupons";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/api/coupons.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npm run test`
Expected: all tests across every plan-1 and plan-2 test file pass.

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/coupons/validate/route.ts tests/api/coupons.test.ts
git commit -m "fix: resolve coupon validation's userId from an optional session"
```

---

## Self-Review Notes

- **Spec coverage:** §3 "Hardening existing routes" — cart ✓ (Task 2), addresses ✓ (Task 3), orders ✓ (Task 4), coupon validation resolves the session user instead of a client-supplied id ✓ (Task 5). Public routes (products/categories/brands/health) correctly untouched.
- **No placeholders:** two steps (order `POST`/`PATCH` bodies) explicitly say "copy verbatim" rather than silently eliding logic — that's a deliberate call-out that the *unchanged* business logic must be preserved exactly, not a TBD; the changed lines around it are fully specified.
- **Type consistency:** `withAuth<Params>`'s `ctx.user` is the Prisma `User` type from Plan 1 throughout — every route in this plan reads `user.id`/`user.role` off it, matching that plan's produced interface exactly.
- **Regression proof:** every task's tests include at least one "spoofed `userId` is ignored" assertion, per this plan's own Global Constraints.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-12-authorization-hardening.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
