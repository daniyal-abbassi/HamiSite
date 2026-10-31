export type ResolveTierInput = {
  quantity: number;
  tiers: {
    id: number;
    minQuantity: number;
    maxQuantity: number | null;
    calculatedPrice: unknown;
    discountPercent: unknown;
  }[];
};

export function resolveMatchingTier(input: ResolveTierInput) {
  const { quantity, tiers } = input;

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
