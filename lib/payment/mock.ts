import { randomBytes } from "node:crypto";
import type { PaymentGateway } from "@/lib/payment/gateway";

export const mockGateway: PaymentGateway = {
  async requestPayment({ orderId, callbackUrl }) {
    const authority = randomBytes(16).toString("hex");
    const base = new URL("/api/payments/mock-confirm", callbackUrl);
    base.searchParams.set("orderId", String(orderId));
    base.searchParams.set("authority", authority);

    return { redirectUrl: base.toString(), authority };
  },

  async verifyPayment({ authority, status }) {
    if (status !== "OK") {
      return { success: false };
    }

    return { success: true, refId: `MOCK-${authority.slice(0, 8)}` };
  },
};
