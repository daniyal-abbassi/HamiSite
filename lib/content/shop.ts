export const SHOP_PAGE_SIZE = 12;

export const sortOptions = [
  { key: "newest", label: "جدیدترین" },
  { key: "price-asc", label: "ارزان‌ترین" },
  { key: "price-desc", label: "گران‌ترین" },
  { key: "special", label: "پیشنهاد ویژه" },
] as const;

export type SortKey = (typeof sortOptions)[number]["key"];

/**
 * A URL can carry anything, so the sort key arriving from one is checked against
 * the list this shop actually sorts by rather than cast. An unrecognised value is
 * no sort, which is the same outcome as no parameter.
 */
export function resolveSortKey(value: string | null | undefined): SortKey | "" {
  return sortOptions.some((option) => option.key === value) ? (value as SortKey) : "";
}

/*
 * «قابل خرید» is the question a shopper is actually asking, and it is the merchant's
 * `purchasable` flag — not a shelf state. The list used to offer «موجود»
 * (`stock=unlimited`), which matched zero records in the export: the most useful
 * filter on the page was a dead control. `unlimited` is removed rather than kept,
 * because a value matching nothing today will match something arbitrary the moment
 * the export starts emitting it. See FR-022 and `contracts/shop-url.md`.
 */
export const stockOptions = [
  { key: "", label: "همه" },
  { key: "purchasable", label: "قابل خرید" },
  { key: "limited", label: "موجود محدود" },
  { key: "out_of_stock", label: "ناموجود" },
  { key: "call", label: "تماس بگیرید" },
] as const;

export const stockLabels: Record<string, string> = {
  // Rendered only on records whose state really is unlimited; see stockOptions for
  // why it is no longer offered as a filter.
  unlimited: "موجود",
  limited: "موجود محدود",
  out_of_stock: "ناموجود",
  call: "تماس بگیرید",
};
