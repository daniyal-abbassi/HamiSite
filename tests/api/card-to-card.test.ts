import { PaymentStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getSetting, PUT as putSetting } from "@/app/api/admin/settings/card-to-card/route";
import { POST as decidePayment } from "@/app/api/admin/orders/[id]/payment/route";
import { GET as listAdminOrders } from "@/app/api/admin/orders/route";
import { POST as createOrder } from "@/app/api/orders/route";
import { POST as pay } from "@/app/api/orders/[id]/pay/route";
import { GET as getManual } from "@/app/api/orders/[id]/manual-payment/route";
import { POST as reportPaid } from "@/app/api/orders/[id]/manual-payment/report/route";
import { CARD_TO_CARD_BANK } from "@/lib/payment/card-to-card";
import { prisma } from "@/lib/prisma";
import { setCardToCardEnabled } from "@/lib/site-settings";
import * as telegram from "@/lib/telegram-bot";
import { ctx, getRequest, jsonRequest, loginAs } from "../helpers/request";
import { seedMinimal, type SeedResult } from "../helpers/seed";

vi.mock("@/lib/telegram-bot", () => ({
  notifyAdminsNewOrder: vi.fn(async () => ({ sentCount: 0, failedCount: 0 })),
  notifyAdminsPaymentReported: vi.fn(async () => ({ sentCount: 1, failedCount: 0 })),
}));

let seed: SeedResult;
let retailCookie: string;
let wholesaleCookie: string;
let adminCookie: string;

beforeEach(async () => {
  vi.clearAllMocks();
  seed = await seedMinimal();
  retailCookie = await loginAs(seed.retail);
  wholesaleCookie = await loginAs(seed.wholesale);
  adminCookie = await loginAs(seed.admin);
});

async function placeOrder(cookie = retailCookie) {
  const res = await createOrder(jsonRequest("http://localhost/api/orders", "POST", {
    firstName: "Ali", lastName: "Retail", phone: "+989120000000", city: "Tehran", addressText: "123 Test St",
    items: [{ productId: seed.product.id, variantId: seed.variant.id, quantity: 1 }],
  }, cookie), ctx());
  expect(res.status).toBe(200);
  return (await res.json()).data.id as number;
}

const idCtx = (id: number) => ctx({ id: String(id) });
const post = (route: typeof pay, id: number, cookie: string) =>
  route(new Request(`http://localhost/api/orders/${id}`, { method: "POST", headers: { cookie, "x-hami-client": "web" } }), idCtx(id));
const adminPost = (id: number, action: "confirm" | "reject", cookie = adminCookie) =>
  decidePayment(jsonRequest(`http://localhost/api/admin/orders/${id}/payment`, "POST", { action }, cookie), idCtx(id));

describe("card-to-card mode and /pay", () => {
  it("diverts to the transfer page when on (default) and skips the gateway", async () => {
    const id = await placeOrder();
    const res = await post(pay, id, retailCookie);
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({ manual: true, orderId: id });
    expect(await prisma.payment.count({ where: { orderId: id } })).toBe(0);
  });

  it("uses the gateway when switched off", async () => {
    await setCardToCardEnabled(false);
    const id = await placeOrder();
    const res = await post(pay, id, retailCookie);
    expect((await res.json()).data.redirectUrl).toBeTruthy();
  });
});

describe("transfer details", () => {
  it("gives the owner the amount and bank details, nobody else", async () => {
    const id = await placeOrder();
    const res = await getManual(getRequest(`http://localhost/api/orders/${id}/manual-payment`, retailCookie), idCtx(id));
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data.bank).toEqual(CARD_TO_CARD_BANK);
    expect(data.amount).toBeGreaterThan(0);
    expect(data.paymentStatus).toBe("INITIATED");

    const other = await getManual(getRequest(`http://localhost/api/orders/${id}/manual-payment`, wholesaleCookie), idCtx(id));
    expect(other.status).toBe(403);
    expect((await getManual(getRequest("http://localhost/api/orders/999999/manual-payment", retailCookie), idCtx(999999))).status).toBe(404);
  });

  it("refuses when the mode is off or the order is already paid", async () => {
    const id = await placeOrder();
    await setCardToCardEnabled(false);
    expect((await getManual(getRequest("http://localhost/x", retailCookie), idCtx(id))).status).toBe(409);
    await setCardToCardEnabled(true);
    await prisma.order.update({ where: { id }, data: { paymentStatus: PaymentStatus.COMPLETED } });
    expect((await getManual(getRequest("http://localhost/x", retailCookie), idCtx(id))).status).toBe(409);
  });
});

describe("I have paid", () => {
  it("records one report and sends one alert, however often it is tapped", async () => {
    const id = await placeOrder();
    const first = await post(reportPaid, id, retailCookie);
    expect((await first.json()).data).toEqual({ paymentStatus: "SENT", alreadyReported: false });
    const again = await post(reportPaid, id, retailCookie);
    expect((await again.json()).data.alreadyReported).toBe(true);

    expect((await prisma.order.findUniqueOrThrow({ where: { id } })).paymentStatus).toBe("SENT");
    const rows = await prisma.payment.findMany({ where: { orderId: id } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ method: "card-to-card", status: "SENT", authority: null });
    expect(telegram.notifyAdminsPaymentReported).toHaveBeenCalledTimes(1);
  });

  it("sends one alert and one row for two simultaneous taps", async () => {
    const id = await placeOrder();
    const results = await Promise.all([post(reportPaid, id, retailCookie), post(reportPaid, id, retailCookie)]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect(await prisma.payment.count({ where: { orderId: id } })).toBe(1);
    expect(telegram.notifyAdminsPaymentReported).toHaveBeenCalledTimes(1);
  });

  it("keeps the report when the alert cannot be delivered", async () => {
    vi.mocked(telegram.notifyAdminsPaymentReported).mockRejectedValueOnce(new Error("telegram down"));
    const id = await placeOrder();
    const res = await post(reportPaid, id, retailCookie);
    expect(res.status).toBe(200);
    expect((await prisma.order.findUniqueOrThrow({ where: { id } })).paymentStatus).toBe("SENT");
    expect(await prisma.payment.count({ where: { orderId: id } })).toBe(1);
  });

  it("rejects another user and a paid order", async () => {
    const id = await placeOrder();
    expect((await post(reportPaid, id, wholesaleCookie)).status).toBe(403);
    expect(await prisma.payment.count({ where: { orderId: id } })).toBe(0);
    await prisma.order.update({ where: { id }, data: { paymentStatus: PaymentStatus.COMPLETED } });
    expect((await post(reportPaid, id, retailCookie)).status).toBe(409);
  });
});

describe("admin verdict", () => {
  it("confirm settles a reported order like the gateway does", async () => {
    const id = await placeOrder();
    await post(reportPaid, id, retailCookie);
    const res = await adminPost(id, "confirm");
    expect(res.status).toBe(200);
    const order = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(order).toMatchObject({ paymentStatus: "COMPLETED", status: "PROCESSING" });
    expect((await prisma.payment.findFirstOrThrow({ where: { orderId: id } })).status).toBe("COMPLETED");
    expect((await adminPost(id, "confirm")).status).toBe(409);
  });

  it("confirm works for an order the customer never reported", async () => {
    const id = await placeOrder();
    expect((await adminPost(id, "confirm")).status).toBe(200);
    const rows = await prisma.payment.findMany({ where: { orderId: id } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ method: "card-to-card", status: "COMPLETED" });
  });

  it("reject returns the order to unpaid and lets the customer report again", async () => {
    const id = await placeOrder();
    await post(reportPaid, id, retailCookie);
    expect((await adminPost(id, "reject")).status).toBe(200);
    expect((await prisma.order.findUniqueOrThrow({ where: { id } })).paymentStatus).toBe("INITIATED");
    expect((await prisma.payment.findFirstOrThrow({ where: { orderId: id } })).status).toBe("FAILED");
    expect((await adminPost(id, "reject")).status).toBe(409);
    expect((await (await post(reportPaid, id, retailCookie)).json()).data.alreadyReported).toBe(false);
  });

  it("is admin only and refuses a closed order", async () => {
    const id = await placeOrder();
    expect((await adminPost(id, "confirm", retailCookie)).status).toBe(403);
    await prisma.order.update({ where: { id }, data: { status: "CANCELED" } });
    expect((await adminPost(id, "confirm")).status).toBe(409);
  });

  it("lists only reported orders when filtered by payment status", async () => {
    const reported = await placeOrder();
    await placeOrder();
    await post(reportPaid, reported, retailCookie);
    const res = await listAdminOrders(getRequest("http://localhost/api/admin/orders?paymentStatus=SENT", adminCookie), ctx());
    const { data } = await res.json();
    expect(data.map((o: { id: number }) => o.id)).toEqual([reported]);
    expect((await listAdminOrders(getRequest("http://localhost/api/admin/orders?paymentStatus=NOPE", adminCookie), ctx())).status).toBe(400);
  });
});

describe("owner switch", () => {
  it("reads on by default, flips off and on, and is admin only", async () => {
    expect((await (await getSetting(getRequest("http://localhost/s", adminCookie), ctx())).json()).data.enabled).toBe(true);
    const off = await putSetting(jsonRequest("http://localhost/s", "PUT", { enabled: false }, adminCookie), ctx());
    expect((await off.json()).data.enabled).toBe(false);
    expect((await (await getSetting(getRequest("http://localhost/s", adminCookie), ctx())).json()).data.enabled).toBe(false);
    expect((await putSetting(jsonRequest("http://localhost/s", "PUT", { enabled: false }, retailCookie), ctx())).status).toBe(403);
    expect((await putSetting(jsonRequest("http://localhost/s", "PUT", { enabled: "yes" }, adminCookie), ctx())).status).toBe(400);
  });
});
