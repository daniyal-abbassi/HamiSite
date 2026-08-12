export type PaymentGateway = {
  requestPayment(input: {
    orderId: number;
    amount: number;
    callbackUrl: string;
    description: string;
  }): Promise<{ redirectUrl: string; authority: string }>;

  verifyPayment(input: { authority: string; status: string; amount: number }): Promise<{
    success: boolean;
    refId?: string;
  }>;
};

export function getPaymentGateway(): PaymentGateway {
  // Deferred imports so a test that only needs one gateway doesn't pay for
  // constructing the other, and so this stays a pure env-var switch.
  if (process.env.ZARINPAL_MERCHANT_ID) {
    const { zarinpalGateway } = require("@/lib/payment/zarinpal") as typeof import("@/lib/payment/zarinpal");
    return zarinpalGateway;
  }

  const { mockGateway } = require("@/lib/payment/mock") as typeof import("@/lib/payment/mock");
  return mockGateway;
}
