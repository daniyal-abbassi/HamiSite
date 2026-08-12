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

export async function getPaymentGateway(): Promise<PaymentGateway> {
  // Deferred imports so a test that only needs one gateway doesn't pay for
  // constructing the other, and so this stays a pure env-var switch.
  if (process.env.ZARINPAL_MERCHANT_ID) {
    const { zarinpalGateway } = await import("@/lib/payment/zarinpal");
    return zarinpalGateway;
  }

  const { mockGateway } = await import("@/lib/payment/mock");
  return mockGateway;
}
