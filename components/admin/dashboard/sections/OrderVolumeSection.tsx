"use client";

import { apiGet } from "@/lib/api-client";
import { toFaDigits } from "@/lib/utils";
import { useSection } from "../useSection";
import { windowLabel, type SummaryData } from "./derive";
import { SectionEmpty, SectionSkeleton, SectionUnreadable } from "@/components/admin/states/SectionState";

/**
 * Order volume — the route's `totalOrders`, printed with its real basis: it includes
 * cancelled orders. Saying so on the card is what makes the figure honest (C5,
 * data-model.md:55).
 */
export function OrderVolumeSection() {
  const { state, data, onRetry } = useSection<SummaryData>(
    () => apiGet<SummaryData>("/api/admin/reports/summary"),
    (summary) => summary.byStatus.length === 0,
  );

  if (state === "loading") return <SectionSkeleton className="h-28" />;
  if (state === "empty") {
    return <SectionEmpty title="داده‌ای برای نمایش نیست" description="در این بازه سفارشی ثبت نشده است." />;
  }
  if (state === "unreadable") return <SectionUnreadable onRetry={onRetry} />;

  const basis = windowLabel(data.periodDays);

  return (
    <section className="rounded-2xl border border-[#e3dbd2] bg-white p-5 shadow-[0_4px_16px_rgba(47,35,30,0.05)]">
      <p className="text-xs text-muted-foreground">سفارش‌های {basis}</p>
      <p className="mt-2 text-2xl font-black text-[#292326]">{toFaDigits(data.totalOrders)}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">شامل سفارش‌های لغوشده</p>
    </section>
  );
}
