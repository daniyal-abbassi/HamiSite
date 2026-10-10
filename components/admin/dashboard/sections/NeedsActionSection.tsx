"use client";

import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import { formatFaDate } from "@/lib/content/order";
import { formatToman, toFaDigits } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useSection } from "../useSection";
import { useDashboardSummary } from "../DashboardSummaryProvider";
import { needsAction, windowLabel } from "./derive";
import { SectionEmpty, SectionSkeleton, SectionUnreadable } from "@/components/admin/states/SectionState";
import type { OrderSummary } from "@/types/store";

/**
 * Needs action — the count from `reports/summary.byStatus` over PENDING + PROCESSING +
 * SHIPPING (the states a human moves an order through), plus the six newest pending
 * orders. Display only: no status-change control (R3 — the PATCH validates no transition
 * and the cancel path has restock/credit side effects). Rows link to the existing order
 * detail route in the same tab.
 */
export function NeedsActionSection() {
  const summary = useDashboardSummary();
  const pending = useSection<OrderSummary[]>(
    () => apiGet<OrderSummary[]>("/api/admin/orders?status=PENDING&pageSize=6"),
    (orders) => orders.length === 0,
  );

  if (summary.state === "loading" && pending.state === "loading") return <SectionSkeleton className="h-64" />;
  if (summary.state === "empty" && pending.state === "empty") {
    return (
      <SectionEmpty
        title="سفارشی نیازمند اقدام نیست"
        description="همه سفارش‌ها در وضعیت پایانی هستند."
      />
    );
  }
  const basis = summary.state === "real" ? windowLabel(summary.data.periodDays) : null;
  const count = summary.state === "real" ? needsAction(summary.data.byStatus) : null;

  return (
    <section className="rounded-2xl border border-[#e3dbd2] bg-white p-5 shadow-[0_4px_16px_rgba(47,35,30,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-black text-foreground">سفارش‌های نیازمند اقدام</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {basis ? `${basis} · ` : ""}در انتظار، در حال پردازش و ارسال‌شده
          </p>
        </div>
        {count === null ? <span className="shrink-0 text-3xl font-black text-muted-foreground">—</span> : <span className="shrink-0 text-3xl font-black text-champagne">{toFaDigits(count)}</span>}
      </div>
      {summary.state === "loading" && <SectionSkeleton className="my-3 h-10" />}
      {summary.state === "empty" && <p className="mt-2 text-xs text-muted-foreground">در این بازه سفارشی ثبت نشده است.</p>}
      {summary.state === "unreadable" && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive" role="alert">
          <span>خواندن شمار سفارش‌ها ناموفق بود.</span>
          <button type="button" onClick={summary.onRetry} className="min-h-10 font-bold underline underline-offset-4">تلاش دوباره</button>
        </div>
      )}
      <div className="my-4 border-t border-[#e9e2db]" />

      {pending.state === "loading" ? <SectionSkeleton className="h-36" /> : null}
      {pending.state === "unreadable" ? <SectionUnreadable onRetry={pending.onRetry} /> : null}
      {pending.state === "empty" ? (
        <p className="py-6 text-center text-[13px] text-muted-foreground">سفارش در انتظاری وجود ندارد.</p>
      ) : pending.state === "real" ? (
        <ul className="divide-y divide-[#eee8e2]">
          <li className="px-2 py-2 text-[11px] font-bold text-muted-foreground">جدیدترین سفارش‌های در انتظار</li>
          {pending.data.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg px-2 py-3 transition-colors hover:bg-[#f7f3ee]"
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-[#8a561f]">{order.orderNumber}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {order.customer?.username ?? "—"} · {formatFaDate(order.createdAt)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <StatusBadge value={order.status} kind="order" />
                  <strong className="text-[13px] font-bold text-[#292326]">
                    {formatToman(order.totals.totalAmount)}
                  </strong>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
