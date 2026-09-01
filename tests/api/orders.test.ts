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
      ),
    );
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
      ),
    );
    expect(res.status).toBe(400);

    const ordersWithBadAgent = await prisma.order.findMany({ where: { agentId: seed.retail.id } });
    expect(ordersWithBadAgent).toHaveLength(0);
  });
});

describe("B2B credit reversal keys off persisted paymentTerm", () => {
  it("a WHOLESALE CASH order with a spoofed paymentMethod:'credit' does not decrement creditUsed when canceled", async () => {
    const created = await (
      await createOrder(
        jsonRequest(
          "http://localhost/api/orders",
          "POST",
          orderPayload({ paymentTerm: "CASH", paymentMethod: "credit" }),
          wholesaleCookie,
        ),
      )
    ).json();

    const afterCreate = await prisma.user.findUniqueOrThrow({ where: { id: seed.wholesale.id } });
    expect(Number(afterCreate.creditUsed)).toBe(0);

    const res = await patchOrder(
      jsonRequest(`http://localhost/api/orders/${created.data.id}`, "PATCH", { status: "CANCELED" }, adminCookie),
      { params: { id: String(created.data.id) } },
    );
    expect(res.status).toBe(200);

    const afterCancel = await prisma.user.findUniqueOrThrow({ where: { id: seed.wholesale.id } });
    expect(Number(afterCancel.creditUsed)).toBe(0);
  });

  it("a genuine CREDIT_60_DAYS order's creditUsed increment is reversed on cancellation", async () => {
    const created = await (
      await createOrder(
        jsonRequest("http://localhost/api/orders", "POST", orderPayload({ paymentTerm: "CREDIT_60_DAYS" }), wholesaleCookie),
      )
    ).json();

    const afterCreate = await prisma.user.findUniqueOrThrow({ where: { id: seed.wholesale.id } });
    expect(Number(afterCreate.creditUsed)).toBeGreaterThan(0);
    const totalAmount = Number(afterCreate.creditUsed);

    const res = await patchOrder(
      jsonRequest(`http://localhost/api/orders/${created.data.id}`, "PATCH", { status: "CANCELED" }, adminCookie),
      { params: { id: String(created.data.id) } },
    );
    expect(res.status).toBe(200);

    const afterCancel = await prisma.user.findUniqueOrThrow({ where: { id: seed.wholesale.id } });
    expect(Number(afterCancel.creditUsed)).toBe(0);
    expect(totalAmount).toBeGreaterThan(0);
  });

  it("canceling a CASH order never drives creditUsed negative", async () => {
    const created = await (
      await createOrder(
        jsonRequest(
          "http://localhost/api/orders",
          "POST",
          orderPayload({ paymentTerm: "CASH", paymentMethod: "credit" }),
          wholesaleCookie,
        ),
      )
    ).json();

    const res = await patchOrder(
      jsonRequest(`http://localhost/api/orders/${created.data.id}`, "PATCH", { status: "CANCELED" }, adminCookie),
      { params: { id: String(created.data.id) } },
    );
    expect(res.status).toBe(200);

    const afterCancel = await prisma.user.findUniqueOrThrow({ where: { id: seed.wholesale.id } });
    expect(Number(afterCancel.creditUsed)).toBeGreaterThanOrEqual(0);
  });
});
