import { OrderStatus } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { POST as createOrder } from "@/app/api/orders/route";
import { GET as listAdminOrders } from "@/app/api/admin/orders/route";
import { PATCH as updateStatus } from "@/app/api/admin/orders/[id]/status/route";
import { prisma } from "@/lib/prisma";
import { getRequest, jsonRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;
let adminCookie: string;
let retailCookie: string;

beforeEach(async () => {
  seed = await seedMinimal();
  adminCookie = await loginAs(seed.admin);
  retailCookie = await loginAs(seed.retail);
});

function orderPayload() {
  return {
    firstName: "Ali",
    lastName: "Retail",
    phone: "+989120000000",
    city: "Tehran",
    addressText: "123 Test St",
    items: [{ productId: seed.product.id, variantId: seed.variant.id, quantity: 1 }],
  };
}

describe("admin orders", () => {
  it("403s listing for a non-admin", async () => {
    const res = await listAdminOrders(getRequest("http://localhost/api/admin/orders", retailCookie));
    expect(res.status).toBe(403);
  });

  it("lists orders across all users", async () => {
    await createOrder(jsonRequest("http://localhost/api/orders", "POST", orderPayload(), retailCookie));

    const res = await listAdminOrders(getRequest("http://localhost/api/admin/orders", adminCookie));
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].customer.id).toBe(seed.retail.id);
  });

  it("filters by userId and status", async () => {
    await createOrder(jsonRequest("http://localhost/api/orders", "POST", orderPayload(), retailCookie));

    const res = await listAdminOrders(
      getRequest(`http://localhost/api/admin/orders?userId=${seed.retail.id}&status=PENDING`, adminCookie),
    );
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it("403s a status update for a non-admin", async () => {
    const created = await (await createOrder(jsonRequest("http://localhost/api/orders", "POST", orderPayload(), retailCookie))).json();

    const res = await updateStatus(
      jsonRequest(`http://localhost/api/admin/orders/${created.data.id}/status`, "PATCH", { status: "PROCESSING" }, retailCookie),
      { params: { id: String(created.data.id) } },
    );
    expect(res.status).toBe(403);
  });

  it("transitions status and restocks a LIMITED variant on cancel", async () => {
    const created = await (await createOrder(jsonRequest("http://localhost/api/orders", "POST", orderPayload(), retailCookie))).json();
    const variantBefore = await prisma.productVariant.findUniqueOrThrow({ where: { id: seed.variant.id } });

    const res = await updateStatus(
      jsonRequest(`http://localhost/api/admin/orders/${created.data.id}/status`, "PATCH", { status: "CANCELED" }, adminCookie),
      { params: { id: String(created.data.id) } },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe(OrderStatus.CANCELED);

    const variantAfter = await prisma.productVariant.findUniqueOrThrow({ where: { id: seed.variant.id } });
    expect(variantAfter.stock).toBe(variantBefore.stock + 1);
  });
});
