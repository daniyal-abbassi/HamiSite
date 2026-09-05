const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFa(input: number | string): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

export function formatToman(value: number): string {
  return toFa(Math.round(value).toLocaleString("en-US"));
}

/** Compact representation e.g. ۱۱۸٫۵ میلیون */
export function formatCompactToman(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    const str = Number.isInteger(m) ? String(m) : m.toFixed(1);
    return `${toFa(str).replace(".", "٫")} میلیون`;
  }
  return formatToman(value);
}

export function pad2(n: number) {
  return toFa(String(n).padStart(2, "0"));
}

export function stockLabel(stock: number) {
  if (stock <= 0) return { text: "ناموجود", tone: "out" as const };
  if (stock <= 5) return { text: `فقط ${toFa(stock)} عدد باقی مانده`, tone: "low" as const };
  return { text: "موجود در انبار", tone: "ok" as const };
}
