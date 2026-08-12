import { PaymentStatus } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { POST as createOrder } from "@/app/api/orders/route";
import { POST as pay } from "@/app/api/orders/[id]/pay/route";
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

async function createRetailOrder() {
  const res = await createOrder(
    jsonRequest(
      "http://localhost/api/orders",
      "POST",
      {
        firstName: "Ali",
        lastName: "Retail",
        phone: "+989120000000",
        city: "Tehran",
        addressText: "123 Test St",
        items: [{ productId: seed.product.id, variantId: seed.variant.id, quantity: 1 }],
      },
      retailCookie,
    ),
  );
  return (await res.json()).data;
}

describe("POST /api/orders/[id]/pay", () => {
  it("creates an INITIATED Payment row and returns a redirect URL", async () => {
    const order = await createRetailOrder();

    const res = await pay(getRequest(`http://localhost/api/orders/${order.id}/pay`, retailCookie), {
      params: { id: String(order.id) },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.redirectUrl).toContain("/api/payments/mock-confirm");

    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } });
    expect(payment.status).toBe(PaymentStatus.INITIATED);
    expect(payment.userId).toBe(seed.retail.id);
  });

  it("403s when the order belongs to another user", async () => {
    const order = await createRetailOrder();

    const res = await pay(getRequest(`http://localhost/api/orders/${order.id}/pay`, wholesaleCookie), {
      params: { id: String(order.id) },
    });
    expect(res.status).toBe(403);
  });

  it("404s for a nonexistent order", async () => {
    const res = await pay(getRequest("http://localhost/api/orders/999999/pay", retailCookie), {
      params: { id: "999999" },
    });
    expect(res.status).toBe(404);
  });
});
