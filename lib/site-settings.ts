import { prisma } from "@/lib/prisma";

const CARD_TO_CARD_KEY = "payment.cardToCard";

/**
 * Whether checkout shows the card-to-card transfer page instead of the gateway.
 * A missing row or a failed read means ON: while the gateway is down the manual
 * path is the safe failure, and an unmigrated table must not break checkout.
 */
export async function getCardToCardEnabled(): Promise<boolean> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: CARD_TO_CARD_KEY } });
    return row ? row.value !== "off" : true;
  } catch {
    return true;
  }
}

export async function setCardToCardEnabled(enabled: boolean): Promise<void> {
  const value = enabled ? "on" : "off";
  await prisma.siteSetting.upsert({
    where: { key: CARD_TO_CARD_KEY },
    create: { key: CARD_TO_CARD_KEY, value },
    update: { value },
  });
}
