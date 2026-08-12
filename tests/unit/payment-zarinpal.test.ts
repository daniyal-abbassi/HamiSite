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
          amount: 250000,
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

  it("requestPayment throws when Zarinpal returns a non-100 code", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { code: -9, authority: "" }, errors: [{ message: "Invalid amount" }] }),
    });

    await expect(
      zarinpalGateway.requestPayment({
        orderId: 7,
        amount: 0,
        callbackUrl: "http://localhost/api/payments/callback",
        description: "Order 7",
      }),
    ).rejects.toThrow(/Invalid amount/);
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
        body: JSON.stringify({ merchant_id: "test-merchant-id", amount: 250000, authority: "A0000..." }),
      }),
    );
    expect(result).toEqual({ success: true, refId: "987654321" });
  });

  it("verifyPayment reports failure without calling Zarinpal when status is not OK", async () => {
    const result = await zarinpalGateway.verifyPayment({ authority: "A0000...", status: "NOK", amount: 250000 });
    expect(result).toEqual({ success: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
