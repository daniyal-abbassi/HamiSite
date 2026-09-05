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
  limited: "text-gold",
  out_of_stock: "text-destructive",
  call: "text-muted-foreground/80",
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
          : "text-gold";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-foreground/5 px-2.5 py-1 text-[11px] font-bold",
        tone,
      )}
    >
      <i className={cn("size-1.5 rounded-full", value === "COMPLETED" || value === "unlimited" ? "bg-emerald-400" : "bg-gold")} />
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