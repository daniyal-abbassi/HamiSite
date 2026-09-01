import type { PaymentGateway } from "@/lib/payment/gateway";

const REQUEST_URL = "https://api.zarinpal.com/pg/v4/payment/request.json";
const VERIFY_URL = "https://api.zarinpal.com/pg/v4/payment/verify.json";
const START_PAY_URL = "https://www.zarinpal.com/pg/StartPay";

function merchantId() {
  const id = process.env.ZARINPAL_MERCHANT_ID;
  if (!id) {
    throw new Error("ZARINPAL_MERCHANT_ID is not set");
  }
  return id;
}

export const zarinpalGateway: PaymentGateway = {
  async requestPayment({ amount, callbackUrl, description }) {
    const response = await fetch(REQUEST_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        merchant_id: merchantId(),
        // Zarinpal amounts are integer Toman/Rial; a fractional amount is rejected
        // outright, and request/verify must agree exactly, so round at the boundary.
        amount: Math.round(amount),
        callback_url: callbackUrl,
        description,
      }),
    });

    const payload = (await response.json()) as {
      data: { code: number; authority: string };
      errors: { message: string }[];
    };

    if (payload.data.code !== 100) {
      throw new Error(`Zarinpal payment request failed: ${payload.errors[0]?.message ?? `code ${payload.data.code}`}`);
    }

    return {
      redirectUrl: `${START_PAY_URL}/${payload.data.authority}`,
      authority: payload.data.authority,
    };
  },

  async verifyPayment({ authority, status, amount }) {
    if (status !== "OK") {
      return { success: false };
    }

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ merchant_id: merchantId(), amount: Math.round(amount), authority }),
    });

    const payload = (await response.json()) as { data: { code: number; ref_id: number }; errors: { message: string }[] };

    if (payload.data.code !== 100 && payload.data.code !== 101) {
      return { success: false };
    }

    return { success: true, refId: String(payload.data.ref_id) };
  },
};
