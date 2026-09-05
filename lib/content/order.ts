/** Persian order-status labels — branch on the enum VALUE, never on message text. */
export const orderStatusLabels: Record<string, string> = {
  PENDING: "در انتظار پرداخت",
  PROCESSING: "در حال پردازش",
  SHIPPING: "ارسال شده",
  COMPLETED: "تحویل شده",
  CANCELED: "لغو شده",
  FAILED: "ناموفق",
  REVERSED: "برگشت خورده",
};

export const paymentStatusLabels: Record<string, string> = {
  INITIATED: "شروع نشده",
  SENT: "در انتظار تأیید",
  COMPLETED: "پرداخت شده",
  FAILED: "پرداخت ناموفق",
  REVERSED: "برگشت خورده",
  EDITED: "ویرایش شده",
};

/** Tone classes per payment status — green for settled, red for failed, gold otherwise. */
export const paymentStatusTones: Record<string, string> = {
  COMPLETED: "text-emerald-400",
  FAILED: "text-destructive",
  REVERSED: "text-destructive",
  INITIATED: "text-gold",
  SENT: "text-gold",
  EDITED: "text-muted-foreground",
};

export function orderStatusTone(status: string): string {
  if (status === "COMPLETED") return "text-emerald-400";
  if (status === "CANCELED" || status === "FAILED" || status === "REVERSED") return "text-destructive";
  if (status === "SHIPPING") return "text-gold";
  return "text-foreground/70";
}

/** Shipping methods the storefront offers. The order API accepts
 * shippingMethodName + shippingPrice verbatim, so the menu is frontend-owned. */
export const shippingOptions = [
  { key: "post", label: "پست پیشتاز", price: 65000, note: "۲ تا ۴ روز کاری" },
  { key: "mashhad-peon", label: "پیک مشهد", price: 30000, note: "تحویل همان روز — مشهد" },
  { key: "pickup", label: "تحویل حضوری", price: 0, note: "فروشگاه حامی همراه — مشهد" },
] as const;

export type ShippingOptionKey = (typeof shippingOptions)[number]["key"];

export const paymentTermLabels: Record<string, string> = {
  CASH: "پرداخت نقدی (درگاه آنلاین)",
  CREDIT_60_DAYS: "اعتبار ۶۰ روزه (همکار عمده)",
};

/** ISO string → Persian date, e.g. ۱۴۰۴/۰۶/۱۴ */
export function formatFaDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fa-IR");
}

export function formatFaDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toLocaleDateString("fa-IR")} — ${date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}`;
}
