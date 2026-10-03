"use client";

import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import { formatFaDate } from "@/lib/content/order";
import { formatToman, toFaDigits } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useSection } from "../useSection";
import { needsAction, windowLabel, type SummaryData } from "./derive";
import { SectionEmpty, SectionSkeleton, SectionUnreadable } from "@/components/admin/states/SectionState";
import type { OrderSummary } from "@/types/store";

type NeedsActionData = {
  summary: SummaryData;
  pending: OrderSummary[];
};

/**
 * Needs action — the count from `reports/summary.byStatus` over PENDING + PROCESSING +
 * SHIPPING (the states a human moves an order through), plus the six newest pending
 * orders. Display only: no status-change control (R3 — the PATCH validates no transition
 * and the cancel path has restock/credit side effects). Rows link to the existing order
 * detail route in the same tab.
 */
export function NeedsActionSection() {
  const { state, data, onRetry } = useSection<NeedsActionData>(
    async () => {
      const [summary, pending] = await Promise.all([
        apiGet<SummaryData>("/api/admin/reports/summary"),
        apiGet<OrderSummary[]>("/api/admin/orders?status=PENDING&pageSize=6"),
      ]);
      return { summary, pending };
    },
    (d) => needsAction(d.summary.byStatus) === 0 && d.pending.length === 0,
  );

  if (state === "loading") return <SectionSkeleton className="h-64" />;
  if (state === "empty") {
    return (
      <SectionEmpty
        title="سفارشی نیازمند اقدام نیست"
        description="همه سفارش‌ها در وضعیت پایانی هستند."
      />
    );
  }
  if (state === "unreadable") return <SectionUnreadable onRetry={onRetry} />;

  const basis = windowLabel(data.summary.periodDays);
  const count = needsAction(data.summary.byStatus);

  return (
    <section className="rounded-2xl border border-[#e3dbd2] bg-white p-5 shadow-[0_4px_16px_rgba(47,35,30,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-black text-foreground">سفارش‌های نیازمند اقدام</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {basis} · در انتظار، در حال پردازش و ارسال‌شده
          </p>
        </div>
        <span className="shrink-0 text-3xl font-black text-champagne">{toFaDigits(count)}</span>
      </div>
      <div className="my-4 border-t border-[#e9e2db]" />

      {data.pending.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted-foreground">سفارش در انتظاری وجود ندارد.</p>
      ) : (
        <ul className="divide-y divide-[#eee8e2]">
          <li className="px-2 py-2 text-[11px] font-bold text-muted-foreground">جدیدترین سفارش‌های در انتظار</li>
          {data.pending.map((order) => (
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
      )}
    </section>
  );
}
