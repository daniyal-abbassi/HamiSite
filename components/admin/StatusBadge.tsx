import { orderStatusLabels, orderStatusTone, paymentStatusLabels, paymentStatusTones } from "@/lib/content/order";
import { cn } from "@/lib/utils";

type StatusKind = "order" | "payment" | "stock" | "user";

const stockLabels: Record<string, string> = {
  unlimited: "موجود",
  limited: "موجود محدود",
  out_of_stock: "ناموجود",
  call: "تماس بگیرید",
};

const stockTones: Record<string, string> = {
  unlimited: "text-emerald-400",
  limited: "text-aqua",
  out_of_stock: "text-destructive",
  call: "text-muted-foreground/80",
};

const orderStyles: Record<string, { badge: string; dot: string }> = {
  PENDING: { badge: "border-amber-200 bg-amber-50 text-amber-900", dot: "bg-amber-500" },
  PROCESSING: { badge: "border-sky-200 bg-sky-50 text-sky-900", dot: "bg-sky-500" },
  SHIPPING: { badge: "border-violet-200 bg-violet-50 text-violet-900", dot: "bg-violet-500" },
  COMPLETED: { badge: "border-emerald-200 bg-emerald-50 text-emerald-900", dot: "bg-emerald-500" },
  CANCELED: { badge: "border-slate-200 bg-slate-100 text-slate-700", dot: "bg-slate-500" },
  FAILED: { badge: "border-rose-200 bg-rose-50 text-rose-900", dot: "bg-rose-500" },
  REVERSED: { badge: "border-orange-200 bg-orange-50 text-orange-900", dot: "bg-orange-500" },
};

const paymentStyles: Record<string, { badge: string; dot: string }> = {
  INITIATED: { badge: "border-slate-200 bg-slate-50 text-slate-700", dot: "bg-slate-500" },
  SENT: { badge: "border-blue-200 bg-blue-50 text-blue-900", dot: "bg-blue-500" },
  COMPLETED: { badge: "border-emerald-200 bg-emerald-50 text-emerald-900", dot: "bg-emerald-500" },
  FAILED: { badge: "border-rose-200 bg-rose-50 text-rose-900", dot: "bg-rose-500" },
  REVERSED: { badge: "border-orange-200 bg-orange-50 text-orange-900", dot: "bg-orange-500" },
  EDITED: { badge: "border-violet-200 bg-violet-50 text-violet-900", dot: "bg-violet-500" },
};

const roleLabels: Record<string, string> = {
  ADMIN: "مدیر",
  WHOLESALE: "همکار عمده",
  AGENT: "نماینده",
  RETAIL: "خریدار",
};

/** Branded status pill for admin tables/detail — value-driven labels, tone
 * classes separated so the caller can override the shell. */
export function StatusBadge({ value, kind }: { value: string; kind: StatusKind }) {
  const label =
    kind === "order"
      ? (orderStatusLabels[value] ?? value)
      : kind === "payment"
        ? (paymentStatusLabels[value] ?? value)
        : kind === "stock"
          ? (stockLabels[value] ?? value)
          : (roleLabels[value] ?? value);

  const tone =
    kind === "order"
      ? orderStatusTone(value)
      : kind === "payment"
        ? (paymentStatusTones[value] ?? "text-muted-foreground")
        : kind === "stock"
          ? (stockTones[value] ?? "text-muted-foreground")
          : "text-aqua";
  const semanticStyle = kind === "order" ? orderStyles[value] : kind === "payment" ? paymentStyles[value] : undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold",
        semanticStyle?.badge ?? cn("border-line bg-foreground/5", tone),
      )}
    >
      <i className={cn("size-1.5 rounded-full", semanticStyle?.dot ?? (value === "COMPLETED" || value === "unlimited" ? "bg-emerald-500" : "bg-aqua"))} />
      {label}
    </span>
  );
}

/** Active/inactive pill (users, brands) plus the "status" eye. */
export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold",
        active ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400" : "border-destructive/40 bg-destructive/10 text-destructive",
      )}
    >
      <i className={cn("size-1.5 rounded-full", active ? "bg-emerald-400" : "bg-destructive")} aria-hidden="true" />
      {active ? "فعال" : "غیرفعال"}
    </span>
  );
}
