import { OrderStatus, PaymentStatus } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { POST as createOrder } from "@/app/api/orders/route";
import { GET as getOrder } from "@/app/api/orders/[id]/route";
import { POST as pay } from "@/app/api/orders/[id]/pay/route";
import { prisma } from "@/lib/prisma";
import { ctx, getRequest, jsonRequest, loginAs } from "../helpers/request";
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
    ), ctx());
  return (await res.json()).data;
}

describe("POST /api/orders/[id]/pay", () => {
  it("creates an INITIATED Payment row and returns a redirect URL", async () => {
    const order = await createRetailOrder();

    const res = await pay(getRequest(`http://localhost/api/orders/${order.id}/pay`, retailCookie), ctx({ id: String(order.id) }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.redirectUrl).toContain("/api/payments/mock-confirm");

    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } });
    expect(payment.status).toBe(PaymentStatus.INITIATED);
    expect(payment.userId).toBe(seed.retail.id);
  });

  it("403s when the order belongs to another user", async () => {
    const order = await createRetailOrder();

    const res = await pay(getRequest(`http://localhost/api/orders/${order.id}/pay`, wholesaleCookie), ctx({ id: String(order.id) }));
    expect(res.status).toBe(403);
  });

  it("404s for a nonexistent order", async () => {
    const res = await pay(getRequest("http://localhost/api/orders/999999/pay", retailCookie), ctx({ id: "999999" }));
    expect(res.status).toBe(404);
  });

  it("rejects gateway initiation for wholesale credit orders", async () => {
    const order = (await (
      await createOrder(
        jsonRequest("http://localhost/api/orders", "POST", {
          firstName: "Wholesale",
          lastName: "Buyer",
          phone: "+989120000000",
          city: "Mashhad",
          addressText: "456 Credit St",
          paymentTerm: "CREDIT_60_DAYS",
          items: [{ productId: seed.product.id, variantId: seed.variant.id, quantity: 1 }],
        }, wholesaleCookie), ctx())
    ).json()).data;

    const res = await pay(getRequest(`http://localhost/api/orders/${order.id}/pay`, wholesaleCookie), ctx({ id: String(order.id) }));
    expect(res.status).toBe(409);
    expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(0);
  });

  it("keeps an abandoned gateway order accessible and retryable by its owner", async () => {
    const order = await createRetailOrder();
    const firstAttempt = await pay(
      getRequest(`http://localhost/api/orders/${order.id}/pay`, retailCookie),
      ctx({ id: String(order.id) }),
    );
    expect(firstAttempt.status).toBe(200);

    const reopened = await getOrder(
      getRequest(`http://localhost/api/orders/${order.id}`, retailCookie),
      ctx({ id: String(order.id) }),
    );
    expect(reopened.status).toBe(200);
    expect((await reopened.json()).data.paymentStatus).toBe(PaymentStatus.INITIATED);

    const retry = await pay(
      getRequest(`http://localhost/api/orders/${order.id}/pay`, retailCookie),
      ctx({ id: String(order.id) }),
    );
    expect(retry.status).toBe(200);
    expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(2);
  });

  it("persists the gateway authority on the Payment row", async () => {
    const order = await createRetailOrder();

    const res = await pay(getRequest(`http://localhost/api/orders/${order.id}/pay`, retailCookie), ctx({ id: String(order.id) }));
    const { authority } = (await res.json()).data;

    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } });
    expect(payment.authority).toBe(authority);
    expect(authority).toBeTruthy();
  });

  it("settles a zero-total cash order without requesting the gateway", async () => {
    const order = await createRetailOrder();
    await prisma.order.update({ where: { id: order.id }, data: { totalAmount: 0 } });

    const res = await pay(getRequest(`http://localhost/api/orders/${order.id}/pay`, retailCookie), ctx({ id: String(order.id) }));
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({ free: true, orderId: order.id });

    const settled = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(settled.paymentStatus).toBe(PaymentStatus.COMPLETED);
    expect(settled.status).toBe(OrderStatus.PROCESSING);
    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } });
    expect(payment.status).toBe(PaymentStatus.COMPLETED);
    expect(payment.authority).toBeNull();
    expect(payment.amount.toNumber()).toBe(0);
  });

  it("rejects a negative stored total before contacting the gateway", async () => {
    const order = await createRetailOrder();
    await prisma.order.update({ where: { id: order.id }, data: { totalAmount: -1 } });
    const res = await pay(getRequest(`http://localhost/api/orders/${order.id}/pay`, retailCookie), ctx({ id: String(order.id) }));
    expect(res.status).toBe(500);
    expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(0);
  });

  it("409s and creates no new Payment row when the order is already paid", async () => {
    const order = await createRetailOrder();
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: PaymentStatus.COMPLETED, status: OrderStatus.PROCESSING },
    });

    const res = await pay(getRequest(`http://localhost/api/orders/${order.id}/pay`, retailCookie), ctx({ id: String(order.id) }));
    expect(res.status).toBe(409);

    const payments = await prisma.payment.findMany({ where: { orderId: order.id } });
    expect(payments).toHaveLength(0);
  });

  it("409s and creates no new Payment row when the order is in a terminal state", async () => {
    const order = await createRetailOrder();
    await prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.CANCELED } });

    const res = await pay(getRequest(`http://localhost/api/orders/${order.id}/pay`, retailCookie), ctx({ id: String(order.id) }));
    expect(res.status).toBe(409);

    const payments = await prisma.payment.findMany({ where: { orderId: order.id } });
    expect(payments).toHaveLength(0);
  });
});
