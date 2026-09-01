import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a Toman amount for the fa-IR locale, e.g. ۱۲٬۵۰۰٬۰۰۰ تومان */
export function formatToman(amount: number | string | null | undefined) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "قیمت فروشگاه";
  return `${value.toLocaleString("fa-IR")} تومان`;
}

/** Convert Latin digits to Persian digits for editorial labels */
export function toFaDigits(input: string | number) {
  return String(input).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}
