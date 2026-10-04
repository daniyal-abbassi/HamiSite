import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { zarinpalGateway } from "@/lib/payment/zarinpal";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("ZARINPAL_MERCHANT_ID", "test-merchant-id");
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("zarinpal gateway", () => {
  it("requestPayment posts the request shape Zarinpal expects and returns the StartPay redirect", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { code: 100, authority: "A00000000000000000000000000012345" }, errors: [] }),
    });

    const result = await zarinpalGateway.requestPayment({
      orderId: 7,
      amount: 250000,
      callbackUrl: "http://localhost/api/payments/callback",
      description: "Order 7",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.zarinpal.com/pg/v4/payment/request.json",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          merchant_id: "test-merchant-id",
          amount: 2500000,
          callback_url: "http://localhost/api/payments/callback",
          description: "Order 7",
        }),
      }),
    );
    expect(result).toEqual({
      redirectUrl: "https://www.zarinpal.com/pg/StartPay/A00000000000000000000000000012345",
      authority: "A00000000000000000000000000012345",
    });
  });

  it("converts Toman to integer Rial on both request and verify", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { code: 100, authority: "A1" }, errors: [] }),
    });

    await zarinpalGateway.requestPayment({
      orderId: 7,
      amount: 250000.04,
      callbackUrl: "http://localhost/api/payments/callback",
      description: "Order 7",
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).amount).toBe(2500000);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { code: 100, ref_id: 1 }, errors: [] }),
    });

    await zarinpalGateway.verifyPayment({ authority: "A1", status: "OK", amount: 250000.04 });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).amount).toBe(2500000);
  });

  it("requestPayment throws when Zarinpal returns a non-100 code", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { code: -9, authority: "" }, errors: [{ message: "Invalid amount" }] }),
    });

    await expect(
      zarinpalGateway.requestPayment({
        orderId: 7,
        amount: 250000,
        callbackUrl: "http://localhost/api/payments/callback",
        description: "Order 7",
      }),
    ).rejects.toThrow(/rejected/);
  });

  it("verifyPayment posts the verify shape and reports success on code 100 or 101", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { code: 100, ref_id: 987654321 }, errors: [] }),
    });

    const result = await zarinpalGateway.verifyPayment({ authority: "A0000...", status: "OK", amount: 250000 });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.zarinpal.com/pg/v4/payment/verify.json",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ merchant_id: "test-merchant-id", amount: 2500000, authority: "A0000..." }),
      }),
    );
    expect(result).toEqual({ success: true, refId: "987654321" });
  });

  it("verifyPayment reports failure without calling Zarinpal when status is not OK", async () => {
    const result = await zarinpalGateway.verifyPayment({ authority: "A0000...", status: "NOK", amount: 250000 });
    expect(result).toEqual({ success: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts already-verified code 101 and rejects definite provider errors", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { code: 101, ref_id: 12345 }, errors: [] }),
    });
    await expect(zarinpalGateway.verifyPayment({ authority: "A1", status: "OK", amount: 10 }))
      .resolves.toEqual({ success: true, refId: "12345" });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], errors: [{ code: -21, message: "Invalid payment" }] }),
    });
    await expect(zarinpalGateway.verifyPayment({ authority: "A1", status: "OK", amount: 10 }))
      .resolves.toEqual({ success: false });
  });

  it("uses sandbox API and StartPay hosts when requested", async () => {
    vi.stubEnv("ZARINPAL_SANDBOX", "true");
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { code: 100, authority: "A1" }, errors: [] }),
    });
    const result = await zarinpalGateway.requestPayment({
      orderId: 7, amount: 10, callbackUrl: "https://example.com/api/payments/callback", description: "Order 7",
    });
    expect(fetchMock.mock.calls[0][0]).toBe("https://sandbox.zarinpal.com/pg/v4/payment/request.json");
    expect(result.redirectUrl).toBe("https://sandbox.zarinpal.com/pg/StartPay/A1");
  });

  it("rejects malformed successful responses and transport failures", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: { code: 100 }, errors: [] }) });
    await expect(zarinpalGateway.requestPayment({
      orderId: 7, amount: 10, callbackUrl: "https://example.com/callback", description: "Order 7",
    })).rejects.toThrow(/rejected/);

    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(zarinpalGateway.verifyPayment({ authority: "A1", status: "OK", amount: 10 }))
      .rejects.toThrow(/HTTP 503/);
  });
});
