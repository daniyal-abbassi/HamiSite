import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as mockConfirm } from "@/app/api/payments/mock-confirm/route";
import { mockGateway } from "@/lib/payment/mock";
import { getPaymentGateway } from "@/lib/payment/gateway";

describe("mock payment gateway", () => {
  beforeEach(() => {
    vi.stubEnv("ZARINPAL_MERCHANT_ID", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requestPayment returns a redirect to the mock-confirm route with the order and authority encoded", async () => {
    const result = await mockGateway.requestPayment({
      orderId: 42,
      amount: 100000,
      callbackUrl: "http://localhost/api/payments/callback",
      description: "Order 42",
    });

    expect(result.authority).toMatch(/^[0-9a-f]{32}$/);
    expect(result.redirectUrl).toContain("/api/payments/mock-confirm");
    expect(result.redirectUrl).toContain(`orderId=42`);
    expect(result.redirectUrl).toContain(`authority=${result.authority}`);
  });

  it("verifyPayment succeeds only when status is OK", async () => {
    const success = await mockGateway.verifyPayment({ authority: "abc123", status: "OK", amount: 1000 });
    expect(success).toEqual({ success: true, refId: expect.stringContaining("MOCK-") });

    const failure = await mockGateway.verifyPayment({ authority: "abc123", status: "NOK", amount: 1000 });
    expect(failure).toEqual({ success: false });
  });

  it("getPaymentGateway returns the mock gateway when ZARINPAL_MERCHANT_ID is unset", async () => {
    expect(await getPaymentGateway()).toBe(mockGateway);
  });
});

describe("production gating", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("getPaymentGateway fails closed in production when ZARINPAL_MERCHANT_ID is unset", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ZARINPAL_MERCHANT_ID", "");

    await expect(getPaymentGateway()).rejects.toThrow(/ZARINPAL_MERCHANT_ID must be set in production/);
  });

  it("getPaymentGateway still returns the real gateway in production when the merchant id is set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ZARINPAL_MERCHANT_ID", "some-merchant-id");

    const { zarinpalGateway } = await import("@/lib/payment/zarinpal");
    expect(await getPaymentGateway()).toBe(zarinpalGateway);
  });

  it("mock-confirm 404s in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const res = await mockConfirm(
      new Request("http://localhost/api/payments/mock-confirm?authority=abc&orderId=1"),
    );
    expect(res.status).toBe(404);
    expect((await res.json()).error.message).toBe("Not found");
  });

  it("mock-confirm still redirects outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");

    const res = await mockConfirm(
      new Request("http://localhost/api/payments/mock-confirm?authority=abc&orderId=1"),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/api/payments/callback");
  });
});
