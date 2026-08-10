import { B2BPaymentTerm, Role } from "@prisma/client";
import { ApiError } from "@/lib/http";

export type ResolveTierInput = {
  quantity: number;
  paymentTerm: B2BPaymentTerm;
  tiers: {
    id: number;
    minQuantity: number;
    maxQuantity: number | null;
    calculatedPrice: unknown;
    discountPercent: unknown;
  }[];
};

export function resolveMatchingTier(input: ResolveTierInput) {
  const { quantity, paymentTerm, tiers } = input;

  const eligible = tiers.filter((tier) => {
    const minOk = quantity >= tier.minQuantity;
    const maxOk = tier.maxQuantity === null || quantity <= tier.maxQuantity;
    return minOk && maxOk;
  });

  if (eligible.length === 0) {
    return null;
  }

  // choose the most specific/highest minQuantity bracket
  return eligible.sort((a, b) => b.minQuantity - a.minQuantity)[0];
}

export function normalizePaymentTerm(value: string | null): B2BPaymentTerm {
  const normalized = (value ?? "CASH").toUpperCase();

  if (normalized === B2BPaymentTerm.CASH) return B2BPaymentTerm.CASH;
  if (normalized === B2BPaymentTerm.CREDIT_60_DAYS) return B2BPaymentTerm.CREDIT_60_DAYS;

  throw new ApiError(400, "Invalid paymentTerm. Use CASH or CREDIT_60_DAYS.");
}

export function ensureB2BTermAllowed(role: Role, paymentTerm: B2BPaymentTerm) {
  if (paymentTerm === B2BPaymentTerm.CREDIT_60_DAYS && role !== Role.WHOLESALE) {
    throw new ApiError(403, "CREDIT_60_DAYS is allowed only for WHOLESALE users.");
  }
}
