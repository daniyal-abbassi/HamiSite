/** Payment method name stored on manual `Payment` rows. */
export const CARD_TO_CARD_METHOD = "card-to-card";

/**
 * The shop's account for card-to-card transfers (Bank Mellat). Served only by
 * `GET /api/orders/:id/manual-payment` to the owner of an unpaid order — never
 * import this from a client component. Changing it needs a release.
 */
export const CARD_TO_CARD_BANK = {
  bankName: "بانک ملت",
  cardNumber: "6104 3387 9323 1370",
  accountNumber: "2401092980",
  iban: "IR78 0120 0100 0000 2401 0929 80",
  holder: "اسماعیل عباسی",
} as const;
