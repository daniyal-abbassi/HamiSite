import { catalogGeneratedAt } from "@/lib/catalog";

/**
 * FR-055 — how current this information is.
 *
 * The catalogue is a dated snapshot (2026-09-09) and the owner has confirmed its
 * availability figures are stale, so a price or a stock label shown without any
 * indication of age invites a shopper to assume it is live. The obligation is the
 * requirement; the form here is deliberately small — one quiet line wherever a
 * price or an availability state decides something.
 *
 * The date renders through `Intl` in the `fa-IR` locale, which is what FR-061
 * demands and what makes it a Persian (Jalali) date with no hand-rolled calendar
 * arithmetic anywhere.
 */
export function DataCurrencyNote({ className = "" }: { className?: string }) {
  const generatedAt = catalogGeneratedAt();
  if (!generatedAt) return null;

  let label: string;
  try {
    label = new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(new Date(generatedAt));
  } catch {
    // An unparseable date is not a reason to state a wrong one.
    return null;
  }

  return (
    <p className={className}>
      <span className="text-muted-foreground">
        قیمت‌ها و وضعیت موجودی از فهرست فروشگاه، به تاریخ{" "}
        <time dateTime={generatedAt}>{label}</time>
      </span>
    </p>
  );
}
