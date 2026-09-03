export const SHOP_PAGE_SIZE = 12;

export const sortOptions = [
  { key: "newest", label: "جدیدترین" },
  { key: "price-asc", label: "ارزان‌ترین" },
  { key: "price-desc", label: "گران‌ترین" },
  { key: "special", label: "پیشنهاد ویژه" },
] as const;

export type SortKey = (typeof sortOptions)[number]["key"];

export const stockOptions = [
  { key: "", label: "همه" },
  { key: "unlimited", label: "موجود" },
  { key: "limited", label: "موجود محدود" },
  { key: "out_of_stock", label: "ناموجود" },
  { key: "call", label: "تماس بگیرید" },
] as const;

export const stockLabels: Record<string, string> = {
  unlimited: "موجود",
  limited: "موجود محدود",
  out_of_stock: "ناموجود",
  call: "تماس بگیرید",
};
