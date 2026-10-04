import type { PaymentGateway } from "@/lib/payment/gateway";

const PRODUCTION_API = "https://api.zarinpal.com/pg/v4/payment";
const SANDBOX_API = "https://sandbox.zarinpal.com/pg/v4/payment";
const PRODUCTION_START_PAY = "https://www.zarinpal.com/pg/StartPay";
const SANDBOX_START_PAY = "https://sandbox.zarinpal.com/pg/StartPay";
const REQUEST_TIMEOUT_MS = 10000;

function merchantId() {
  const id = process.env.ZARINPAL_MERCHANT_ID?.trim();
  if (!id) {
    throw new Error("ZARINPAL_MERCHANT_ID is not set");
  }
  return id;
}

export function tomanToRial(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Payment amount must be positive and finite");
  const rial = Math.round(amount * 10);
  if (!Number.isSafeInteger(rial) || rial <= 0) throw new Error("Payment amount exceeds supported precision");
  return rial;
}

function endpoints() {
  return process.env.ZARINPAL_SANDBOX === "true"
    ? { api: SANDBOX_API, startPay: SANDBOX_START_PAY }
    : { api: PRODUCTION_API, startPay: PRODUCTION_START_PAY };
}

function responseData(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") throw new Error("Invalid Zarinpal response");
  if ("data" in payload && payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data as Record<string, unknown>;
  }
  if ("errors" in payload && Array.isArray(payload.errors)) {
    const first = payload.errors[0];
    if (first && typeof first === "object" && "code" in first && typeof first.code === "number") {
      return { code: first.code };
    }
  }
  throw new Error("Invalid Zarinpal response data");
}

async function post(path: "request.json" | "verify.json", body: Record<string, unknown>) {
  const response = await fetch(`${endpoints().api}/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Zarinpal HTTP ${response.status}`);
  return responseData(await response.json());
}

export const zarinpalGateway: PaymentGateway = {
  async requestPayment({ amount, callbackUrl, description }) {
    const data = await post("request.json", {
      merchant_id: merchantId(),
      amount: tomanToRial(amount),
      callback_url: callbackUrl,
      description,
    });
    if (data.code !== 100 || typeof data.authority !== "string" || !data.authority) {
      throw new Error(`Zarinpal payment request rejected: ${String(data.code ?? "invalid response")}`);
    }

    return {
      redirectUrl: `${endpoints().startPay}/${encodeURIComponent(data.authority)}`,
      authority: data.authority,
    };
  },

  async verifyPayment({ authority, status, amount }) {
    if (status !== "OK") {
      return { success: false };
    }

    const data = await post("verify.json", {
      merchant_id: merchantId(),
      amount: tomanToRial(amount),
      authority,
    });
    if (typeof data.code !== "number") throw new Error("Invalid Zarinpal verification code");
    if (data.code !== 100 && data.code !== 101) return { success: false };
    if ((typeof data.ref_id !== "number" || !Number.isSafeInteger(data.ref_id)) &&
        (typeof data.ref_id !== "string" || !/^\d+$/.test(data.ref_id))) {
      throw new Error("Invalid Zarinpal reference id");
    }
    return { success: true, refId: String(data.ref_id) };
  },
};
