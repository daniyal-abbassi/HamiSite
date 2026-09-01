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

async function createRetailOrder() {
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
  return (await orderRes.json()).data;
}

async function initiatePayment(orderId: number) {
  const payRes = await pay(getRequest(`http://localhost/api/orders/${orderId}/pay`, retailCookie), {
    params: { id: String(orderId) },
  });
  if (payRes.status !== 200) {
    throw new Error(`pay failed with status ${payRes.status}`);
  }
  const { redirectUrl, authority } = (await payRes.json()).data;
  return { redirectUrl, authority };
}

async function createAndInitiatePayment() {
  const order = await createRetailOrder();
  const { redirectUrl, authority } = await initiatePayment(order.id);
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

describe("callback authority binding", () => {
  it("404s and leaves the order untouched when the Authority matches no Payment row", async () => {
    const { order } = await createAndInitiatePayment();
    const variantBefore = await prisma.productVariant.findUniqueOrThrow({ where: { id: seed.variant.id } });

    const res = await callback(
      getRequest(
        `http://localhost/api/payments/callback?Authority=fabricated-authority&Status=OK&orderId=${order.id}`,
      ),
    );
    expect(res.status).toBe(404);

    const untouched = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(untouched.paymentStatus).toBe(PaymentStatus.INITIATED);
    expect(untouched.status).toBe(order.status);

    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } });
    expect(payment.status).toBe(PaymentStatus.INITIATED);

    const variantAfter = await prisma.productVariant.findUniqueOrThrow({ where: { id: seed.variant.id } });
    expect(variantAfter.stock).toBe(variantBefore.stock);
  });

  it("settles the order bound to the authority, not the one named in the query string", async () => {
    const victim = await createAndInitiatePayment();
    const attacker = await createAndInitiatePayment();

    // The attacker replays their own authority while pointing orderId at the victim.
    const res = await callback(
      getRequest(
        `http://localhost/api/payments/callback?Authority=${attacker.authority}&Status=OK&orderId=${victim.order.id}`,
      ),
    );
    expect(res.status).toBe(400);

    const victimOrder = await prisma.order.findUniqueOrThrow({ where: { id: victim.order.id } });
    expect(victimOrder.paymentStatus).toBe(PaymentStatus.INITIATED);
  });

  it("resolves each stacked INITIATED payment independently by its own authority", async () => {
    const order = await createRetailOrder();

    const first = await initiatePayment(order.id);
    const second = await initiatePayment(order.id);
    expect(first.authority).not.toBe(second.authority);

    const payments = await prisma.payment.findMany({ where: { orderId: order.id } });
    expect(payments).toHaveLength(2);

    // Settle the second attempt; the first stays INITIATED and untouched.
    const res = await callback(
      getRequest(`http://localhost/api/payments/callback?Authority=${second.authority}&Status=OK`),
    );
    expect(res.status).toBe(200);

    const settled = await prisma.payment.findFirstOrThrow({ where: { authority: second.authority } });
    expect(settled.status).toBe(PaymentStatus.COMPLETED);

    const stillPending = await prisma.payment.findFirstOrThrow({ where: { authority: first.authority } });
    expect(stillPending.status).toBe(PaymentStatus.INITIATED);

    const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updatedOrder.paymentStatus).toBe(PaymentStatus.COMPLETED);
  });
});

describe("callback idempotency", () => {
  it("does not double-apply when the same successful callback arrives twice", async () => {
    const { order, redirectUrl } = await createAndInitiatePayment();
    const variantBefore = await prisma.productVariant.findUniqueOrThrow({ where: { id: seed.variant.id } });

    const confirmRes = await mockConfirm(getRequest(redirectUrl));
    const location = confirmRes.headers.get("location")!;

    const firstRes = await callback(getRequest(location));
    expect(firstRes.status).toBe(200);

    const secondRes = await callback(getRequest(location));
    // The payment is no longer INITIATED, so nothing resolves by that authority.
    expect(secondRes.status).toBe(404);

    const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updatedOrder.paymentStatus).toBe(PaymentStatus.COMPLETED);
    expect(updatedOrder.status).toBe(OrderStatus.PROCESSING);

    const variantAfter = await prisma.productVariant.findUniqueOrThrow({ where: { id: seed.variant.id } });
    expect(variantAfter.stock).toBe(variantBefore.stock);

    const payments = await prisma.payment.findMany({ where: { orderId: order.id } });
    expect(payments).toHaveLength(1);
    expect(payments[0].status).toBe(PaymentStatus.COMPLETED);
  });

  it("does not restock a settled order when a later failing callback arrives for a second attempt", async () => {
    const order = await createRetailOrder();

    const first = await initiatePayment(order.id);
    const second = await initiatePayment(order.id);

    // First attempt succeeds and settles the order.
    const okRes = await callback(
      getRequest(`http://localhost/api/payments/callback?Authority=${first.authority}&Status=OK`),
    );
    expect(okRes.status).toBe(200);

    const variantAfterSuccess = await prisma.productVariant.findUniqueOrThrow({ where: { id: seed.variant.id } });

    // Second, stale attempt fails afterwards — this must NOT restock or flip the order.
    const failRes = await callback(
      getRequest(`http://localhost/api/payments/callback?Authority=${second.authority}&Status=NOK`),
    );
    expect(failRes.status).toBe(200);

    const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updatedOrder.paymentStatus).toBe(PaymentStatus.COMPLETED);
    expect(updatedOrder.status).toBe(OrderStatus.PROCESSING);

    const variantAfterFail = await prisma.productVariant.findUniqueOrThrow({ where: { id: seed.variant.id } });
    expect(variantAfterFail.stock).toBe(variantAfterSuccess.stock);

    const staleAttempt = await prisma.payment.findFirstOrThrow({ where: { authority: second.authority } });
    expect(staleAttempt.status).toBe(PaymentStatus.FAILED);
  });

  it("does not re-transition an order already FAILED by a sibling attempt when a later success arrives", async () => {
    const order = await createRetailOrder();

    const first = await initiatePayment(order.id);
    const second = await initiatePayment(order.id);

    // The FAILURE resolves first: the order is still open, so this legitimately
    // restocks and moves the order to FAILED.
    const failRes = await callback(
      getRequest(`http://localhost/api/payments/callback?Authority=${first.authority}&Status=NOK`),
    );
    expect(failRes.status).toBe(200);

    const failedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(failedOrder.status).toBe(OrderStatus.FAILED);
    const variantAfterRestock = await prisma.productVariant.findUniqueOrThrow({ where: { id: seed.variant.id } });

    // The SUCCESS for the sibling attempt lands afterwards. The order is already
    // in a terminal state, so it must not be moved to PROCESSING — doing so
    // would keep the stock/credit the failure just gave back.
    const okRes = await callback(
      getRequest(`http://localhost/api/payments/callback?Authority=${second.authority}&Status=OK`),
    );
    expect(okRes.status).toBe(200);
    expect((await okRes.json()).data.orderAlreadySettled).toBe(true);

    const finalOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(finalOrder.status).toBe(OrderStatus.FAILED);
    expect(finalOrder.paymentStatus).toBe(PaymentStatus.FAILED);

    // No further stock movement from the second callback in either direction.
    const variantFinal = await prisma.productVariant.findUniqueOrThrow({ where: { id: seed.variant.id } });
    expect(variantFinal.stock).toBe(variantAfterRestock.stock);

    // Accepted edge case: the money really was captured, so the Payment row
    // itself stays recorded as COMPLETED even though the order did not move.
    const capturedAttempt = await prisma.payment.findFirstOrThrow({ where: { authority: second.authority } });
    expect(capturedAttempt.status).toBe(PaymentStatus.COMPLETED);
  });
});
