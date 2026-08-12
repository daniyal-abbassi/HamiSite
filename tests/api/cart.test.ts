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
