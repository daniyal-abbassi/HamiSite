"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiGetWithMeta } from "@/lib/api-client";
import { formatFaDate } from "@/lib/content/order";
import { formatToman, toFaDigits } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useSection } from "../useSection";
import { SectionEmpty, SectionSkeleton, SectionUnreadable } from "@/components/admin/states/SectionState";
import type { OrderSummary } from "@/types/store";

type NewestOrdersData = {
  orders: OrderSummary[];
  total: number;
};

/**
 * Newest orders — `GET /api/admin/orders?pageSize=6` via `apiGetWithMeta`, following the
 * `{ page, pageSize, total, hasNextPage }` convention (api-inventory.md §0). Display only
 * (R3): rows link to the existing order detail route, no per-order action.
 */
export function NewestOrdersSection() {
  const { state, data, onRetry } = useSection<NewestOrdersData>(
    async () => {
      const { data: orders, meta } = await apiGetWithMeta<OrderSummary[]>("/api/admin/orders?pageSize=6");
      const total = typeof meta?.total === "number" ? meta.total : 0;
      return { orders, total };
    },
    (d) => d.orders.length === 0,
  );

  if (state === "loading") return <SectionSkeleton className="h-64" />;
  if (state === "empty") {
    return <SectionEmpty title="هنوز سفارشی ثبت نشده است." />;
  }
  if (state === "unreadable") return <SectionUnreadable onRetry={onRetry} />;

  return (
    <section className="rounded-2xl border border-[#e3dbd2] bg-white p-5 shadow-[0_4px_16px_rgba(47,35,30,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-foreground">جدیدترین سفارش‌ها</h2>
        <Link
          href="/admin/orders"
          className="flex items-center gap-1 text-xs font-bold text-[#8a561f] transition-colors hover:underline"
        >
          همه سفارش‌ها
          <ArrowLeft className="size-3.5" />
        </Link>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{toFaDigits(data.total)} سفارش در کل</p>
      <div className="my-4 border-t border-[#e9e2db]" />

      <ul className="divide-y divide-[#eee8e2]">
        {data.orders.map((order) => (
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
                <StatusBadge value={order.paymentStatus} kind="payment" />
                <strong className="text-[13px] font-bold text-[#292326]">
                  {formatToman(order.totals.totalAmount)}
                </strong>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
