import { beforeEach, describe, expect, it } from "vitest";
import { GET as listOrders, POST as createOrder } from "@/app/api/orders/route";
import { GET as getOrder, PATCH as patchOrder } from "@/app/api/orders/[id]/route";
import { prisma } from "@/lib/prisma";
import { ctx, getRequest, jsonRequest, loginAs } from "../helpers/request";
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
      jsonRequest("http://localhost/api/orders", "POST", orderPayload({ userId: seed.wholesale.id }), retailCookie), ctx());
    expect(res.status).toBe(200);

    const order = await prisma.order.findFirstOrThrow({ where: { orderNumber: (await res.clone().json()).data.orderNumber } });
    expect(order.userId).toBe(seed.retail.id);
  });

  it("GET /api/orders ignores a spoofed userId and only returns the session user's orders", async () => {
    await createOrder(jsonRequest("http://localhost/api/orders", "POST", orderPayload(), retailCookie), ctx());
    await createOrder(jsonRequest("http://localhost/api/orders", "POST", orderPayload(), wholesaleCookie), ctx());

    const res = await listOrders(getRequest(`http://localhost/api/orders?userId=${seed.wholesale.id}`, retailCookie), ctx());
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].customer.id).toBe(seed.retail.id);
  });

  it("a user cannot GET another user's order by id", async () => {
    const created = await (
      await createOrder(jsonRequest("http://localhost/api/orders", "POST", orderPayload(), retailCookie), ctx())
    ).json();

    const res = await getOrder(getRequest(`http://localhost/api/orders/${created.data.id}`, wholesaleCookie), ctx({ id: String(created.data.id) }));
    expect(res.status).toBe(404);
  });

  it("an admin can GET any order by id", async () => {
    const created = await (
      await createOrder(jsonRequest("http://localhost/api/orders", "POST", orderPayload(), retailCookie), ctx())
    ).json();

    const res = await getOrder(getRequest(`http://localhost/api/orders/${created.data.id}`, adminCookie), ctx({ id: String(created.data.id) }));
    expect(res.status).toBe(200);
  });

  it("guest cannot GET or PATCH an order", async () => {
    const created = await (
      await createOrder(jsonRequest("http://localhost/api/orders", "POST", orderPayload(), retailCookie), ctx())
    ).json();

    const getRes = await getOrder(getRequest(`http://localhost/api/orders/${created.data.id}`), ctx({ id: String(created.data.id) }));
    expect(getRes.status).toBe(401);

    const patchRes = await patchOrder(
      jsonRequest(`http://localhost/api/orders/${created.data.id}`, "PATCH", { status: "PROCESSING" }),
      ctx({ id: String(created.data.id) }),
    );
    expect(patchRes.status).toBe(401);
  });

  it("a non-admin cannot PATCH an order's status", async () => {
    const created = await (
      await createOrder(jsonRequest("http://localhost/api/orders", "POST", orderPayload(), retailCookie), ctx())
    ).json();

    const res = await patchOrder(
      jsonRequest(`http://localhost/api/orders/${created.data.id}`, "PATCH", { status: "PROCESSING" }, retailCookie),
      ctx({ id: String(created.data.id) }),
    );
    expect(res.status).toBe(403);
  });

  it("customer B cannot PATCH customer A's order status and record remains unchanged", async () => {
    const created = await (
      await createOrder(jsonRequest("http://localhost/api/orders", "POST", orderPayload(), retailCookie), ctx())
    ).json();

    const res = await patchOrder(
      jsonRequest(`http://localhost/api/orders/${created.data.id}`, "PATCH", { status: "PROCESSING" }, wholesaleCookie),
      ctx({ id: String(created.data.id) }),
    );
    expect(res.status).toBe(403);

    // Verify record in database was untouched
    const orderInDb = await prisma.order.findUniqueOrThrow({ where: { id: created.data.id } });
    expect(orderInDb.status).toBe("PENDING");
  });

  it("an admin can PATCH an order's status", async () => {
    const created = await (
      await createOrder(jsonRequest("http://localhost/api/orders", "POST", orderPayload(), retailCookie), ctx())
    ).json();

    const res = await patchOrder(
      jsonRequest(`http://localhost/api/orders/${created.data.id}`, "PATCH", { status: "PROCESSING" }, adminCookie),
      ctx({ id: String(created.data.id) }),
    );
    expect(res.status).toBe(200);
  });

  it("POST /api/orders rejects an addressId that doesn't belong to the caller", async () => {
    const victimAddress = await prisma.address.create({
      data: {
        userId: seed.wholesale.id,
        city: "Mashhad",
        address: "Victim Secret St 1",
      },
    });

    const res = await createOrder(
      jsonRequest(
        "http://localhost/api/orders",
        "POST",
        orderPayload({ addressId: victimAddress.id }),
        retailCookie,
      ), ctx());
    expect(res.status).toBe(400);

    const ordersWithVictimAddress = await prisma.order.findMany({ where: { addressId: victimAddress.id } });
    expect(ordersWithVictimAddress).toHaveLength(0);
  });

  it("POST /api/orders rejects an agentId that doesn't reference an active AGENT user", async () => {
    const res = await createOrder(
      jsonRequest(
        "http://localhost/api/orders",
        "POST",
        orderPayload({ agentId: seed.retail.id }),
        wholesaleCookie,
      ), ctx());
    expect(res.status).toBe(400);

    const ordersWithBadAgent = await prisma.order.findMany({ where: { agentId: seed.retail.id } });
    expect(ordersWithBadAgent).toHaveLength(0);
  });
});

describe("order payment", () => {
  it("keeps an empty postal code empty and records no payment before the gateway step", async () => {
    const response = await createOrder(
      jsonRequest("http://localhost/api/orders", "POST", orderPayload(), wholesaleCookie), ctx());
    expect(response.status).toBe(200);
    const created = (await response.json()).data;

    const persistedOrder = await prisma.order.findUniqueOrThrow({ where: { id: created.id } });
    expect(persistedOrder.postalCode).toBeNull();
    expect(persistedOrder.paymentMethod).toBe("card");
    expect(await prisma.payment.count({ where: { orderId: created.id } })).toBe(0);
  });
});
