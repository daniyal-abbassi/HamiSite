"use client";

import { formatToman } from "@/lib/utils";
import { useDashboardSummary } from "../DashboardSummaryProvider";
import { avgPaidOrder, paidRevenue, windowLabel } from "./derive";
import { SectionEmpty, SectionSkeleton, SectionUnreadable } from "@/components/admin/states/SectionState";

/**
 * Takings — `paidRevenue` (revenue over every status except the terminal-cancel set)
 * with `avgPaidOrder` beside it. Deliberately NOT the route's `totalRevenue`, which
 * includes cancelled orders (data-model.md:54). The window label comes from the API's
 * own `periodDays`, never a hardcoded «۳۰».
 */
export function TakingsSection() {
  const { state, data, onRetry } = useDashboardSummary();

  if (state === "loading") return <SectionSkeleton className="h-28" />;
  if (state === "empty") {
    return <SectionEmpty title="داده‌ای برای نمایش نیست" description="در این بازه سفارشی ثبت نشده است." />;
  }
  if (state === "unreadable") return <SectionUnreadable onRetry={onRetry} />;

  const basis = windowLabel(data.periodDays);

  return (
    <section className="rounded-2xl border border-[#e3dbd2] bg-white p-5 shadow-[0_4px_16px_rgba(47,35,30,0.05)]">
      <p className="text-xs text-muted-foreground">درآمد پرداخت‌شدهٔ {basis}</p>
      <p className="mt-2 truncate text-2xl font-black text-emerald-700">{formatToman(paidRevenue(data.byStatus))}</p>
      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
        میانگین سفارش پرداخت‌شده: {formatToman(avgPaidOrder(data.byStatus))} · لغوشده، ناموفق و
        برگشت‌خورده حساب نشده‌اند
      </p>
    </section>
  );
}
