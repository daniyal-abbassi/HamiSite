/**
 * Merchant-verified facts — the only claims about the business the UI may render.
 *
 * `lib/content/contact.ts` holds the same guarantee for contact details. This
 * module holds the rest, and it exists so a claim has exactly one source: the
 * reason «گارانتی رسمی» and «ضمانت اصالت ۱۰۰٪» could sit on 189 cards was that
 * each was typed into a component, where no one could audit it against the data.
 *
 * FR-006 admits four trust facts and nothing else. FR-001 requires every other
 * claim to trace to a catalog record — and the catalog has no guarantee field
 * (`lib/catalog.ts:170` emits `guarantee: null` for all 311 variants), so a
 * warranty sentence here is a *storefront-wide* fact and must never be rendered
 * as though it came from the product.
 */

/**
 * Confirmed by the owner on 2026-09-23, with the wording supplied verbatim.
 * Recorded in `specs/001-premium-rtl-storefront/notes/owner-decisions.md` §1.
 */
export const storeWarranty = {
  label: "گارانتی ۱۸ ماهه شرکتی",
} as const;

/** FR-006's closed list. Anything not in this list is not a claim the site may make. */
export const trustFacts = [
  { key: "history", label: "بیست سال سابقه در بازار موبایل مشهد" },
  { key: "store", label: "فروشگاه حضوری در مشهد" },
  { key: "redmi", label: "نمایندگی رسمی ردمی با ضمانت رادمان پج" },
  { key: "tch", label: "نماینده رسمی تی سی اچ در منطقه" },
] as const;
