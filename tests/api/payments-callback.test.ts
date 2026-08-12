import { OrderStatus, PaymentStatus } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { POST as createOrder } from "@/app/api/orders/route";
import { POST as pay } from "@/app/api/orders/[id]/pay/route";
import { GET as callback } from "@/app/api/payments/callback/route";
import { GET as mockConfirm } from "@/app/api/payments/mock-confirm/route";
import { prisma } from "@/lib/prisma";
import { getRequest, jsonRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

let seed: SeedResult;
let retailCookie: string;

beforeEach(async () => {
  seed = await seedMinimal();
  retailCookie = await loginAs(seed.retail);
});

async function createAndInitiatePayment() {
  const orderRes = await createOrder(
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
  const order = (await orderRes.json()).data;

  const payRes = await pay(getRequest(`http://localhost/api/orders/${order.id}/pay`, retailCookie), {
    params: { id: String(order.id) },
  });
  const { redirectUrl, authority } = (await payRes.json()).data;

  return { order, redirectUrl, authority };
}

describe("mock-confirm -> callback happy path", () => {
  it("auto-succeeds, completing the payment and moving the order to PROCESSING", async () => {
    const { order, redirectUrl } = await createAndInitiatePayment();

    const confirmRes = await mockConfirm(getRequest(redirectUrl));
    expect(confirmRes.status).toBe(302);
    const location = confirmRes.headers.get("location")!;
    expect(location).toContain("/api/payments/callback");
    expect(location).toContain("Status=OK");

    const callbackRes = await callback(getRequest(location));
    expect(callbackRes.status).toBe(200);

    const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updatedOrder.paymentStatus).toBe(PaymentStatus.COMPLETED);
    expect(updatedOrder.status).toBe(OrderStatus.PROCESSING);

    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } });
    expect(payment.status).toBe(PaymentStatus.COMPLETED);
  });

  it("fails and restocks when mock-confirm is called with ?fail=true", async () => {
    const { order, redirectUrl } = await createAndInitiatePayment();
    const variantBefore = await prisma.productVariant.findUniqueOrThrow({ where: { id: seed.variant.id } });

    const confirmRes = await mockConfirm(getRequest(`${redirectUrl}&fail=true`));
    const location = confirmRes.headers.get("location")!;
    expect(location).toContain("Status=NOK");

    const callbackRes = await callback(getRequest(location));
    expect(callbackRes.status).toBe(200);

    const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updatedOrder.paymentStatus).toBe(PaymentStatus.FAILED);
    expect(updatedOrder.status).toBe(OrderStatus.FAILED);

    const variantAfter = await prisma.productVariant.findUniqueOrThrow({ where: { id: seed.variant.id } });
    expect(variantAfter.stock).toBe(variantBefore.stock + 1);

    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } });
    expect(payment.status).toBe(PaymentStatus.FAILED);
  });

  it("404s the callback for an unknown orderId", async () => {
    const res = await callback(getRequest("http://localhost/api/payments/callback?Authority=x&Status=OK&orderId=999999"));
    expect(res.status).toBe(404);
  });
});
