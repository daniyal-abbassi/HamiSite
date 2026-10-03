import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a Toman amount for the fa-IR locale, e.g. ۱۲٬۵۰۰٬۰۰۰ تومان */
export function formatToman(amount: number | string | null | undefined) {
  /*
   * `Number(null)` is `0`, which is finite — so without this line a caller that
   * passes null gets «۰ تومان» printed where the record holds no price at all.
   * That is exactly what FR-003 forbids, and the shop's list view did it for
   * five records. `undefined` already fell through to the guard below because
   * `Number(undefined)` is NaN, which is why the hole went unnoticed.
   */
  if (amount === null || amount === "" || amount === undefined) return "قیمت فروشگاه";
  const value = Number(amount);
  if (!Number.isFinite(value)) return "قیمت فروشگاه";
  return `${value.toLocaleString("fa-IR")} تومان`;
}

/** Convert Latin digits to Persian digits for editorial labels */
export function toFaDigits(input: string | number) {
  return String(input).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}
