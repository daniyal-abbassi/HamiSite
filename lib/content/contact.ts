/**
 * Verified store contact facts.
 *
 * The phone number is user-confirmed (2026-09-19) and the WhatsApp order
 * numbers were supplied by the owner for the homepage film (2026-11-02). These
 * are the only contact facts in the repo, so every tel: link and phone display
 * MUST import from here. Do not invent an address, email, or social handle anywhere: until a
 * fact arrives confirmed, link to the destinations that exist
 * (`#store-experience`, `/partners`).
 *
 * `phoneHref` uses the international form (+98…) because dialers normalize
 * it reliably regardless of the user's locale; `phoneDisplay` is Persian
 * digits for the RTL interface.
 */
export const storeContact = {
  phoneHref: "tel:+989331214000",
  phoneDisplay: "۰۹۳۳ ۱۲۱ ۴۰۰۰",
  /** Confirmed in-store hours copy (matches StoreExperience). */
  hours: "همه‌روزه از ساعت ۹:۳۰ تا ۲۱:۳۰",
  /** Latin digits, in the order the homepage film burns them in. */
  whatsappNumbers: ["09331214000", "09153313001"],
} as const;
