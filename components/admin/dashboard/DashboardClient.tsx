"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleDollarSign, Package, ReceiptText, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api-client";
import { formatFaDate, orderStatusLabels, orderStatusTone, paymentStatusLabels } from "@/lib/content/order";
import { formatToman } from "@/lib/utils";
import type { OrderSummary } from "@/types/store";

type Summary = {
  periodDays: number;
  totalOrders: number;
  totalRevenue: number;
  byStatus: { status: string; orderCount: number; revenue: number }[];
};

export function DashboardClient() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([apiGet<Summary>("/api/admin/reports/summary"), apiGet<OrderSummary[]>("/api/admin/orders?pageSize=8")])
      .then(([summaryData, ordersData]) => {
        if (cancelled) return;
        setSummary(summaryData);
        setRecentOrders(ordersData);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center text-sm text-destructive">
        در بارگذاری آمار خطایی رخ داد. صفحه را بازنشانی کنید.
      </div>
    );
  }

  if (!summary || !recentOrders) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl md:col-span-2" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const paidOrders = summary.byStatus
    .filter((row) => row.status === "COMPLETED" || row.status === "SHIPPING" || row.status === "PROCESSING")
    .reduce((sum, row) => sum + row.orderCount, 0);
  const avgOrder = summary.totalOrders > 0 ? Math.round(summary.totalRevenue / summary.totalOrders) : 0;
  const maxStatusCount = Math.max(1, ...summary.byStatus.map((row) => row.orderCount));

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="سفارش‌های ۳۰ روز اخیر" value={summary.totalOrders.toLocaleString("fa-IR")} icon={Package} accent="gold" />
        <StatCard label="درآمد ۳۰ روز اخیر" value={formatToman(summary.totalRevenue)} icon={CircleDollarSign} accent="green" />
        <StatCard label="میانگین مبلغ سفارش" value={formatToman(avgOrder)} icon={TrendingUp} />
        <StatCard label="سفارش‌های واریزشده" value={paidOrders.toLocaleString("fa-IR")} icon={ReceiptText} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Status breakdown */}
        <section className="rounded-2xl border border-line bg-ink-2/60 p-6 lg:col-span-2">
          <h2 className="text-sm font-black">تفکیک وضعیت سفارش‌ها</h2>
          <div className="brand-hairline my-4" />
          <div className="space-y-4">
            {summary.byStatus.map((row) => (
              <div key={row.status}>
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className={orderStatusTone(row.status)}>{orderStatusLabels[row.status] ?? row.status}</span>
                  <span className="font-mono text-muted-foreground">
                    {row.orderCount.toLocaleString("fa-IR")} — {formatToman(row.revenue)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full bg-gold/80 transition-all duration-500"
                    style={{ width: `${(row.orderCount / maxStatusCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {summary.byStatus.length === 0 && <p className="text-[13px] text-muted-foreground">اطلاعاتی برای نمایش نیست.</p>}
          </div>
        </section>

        {/* Recent orders */}
        <section className="rounded-2xl border border-line bg-ink-2/60 p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black">آخرین سفارش‌ها</h2>
            <Link href="/admin/orders" className="flex items-center gap-1 text-[12px] font-bold text-gold hover:underline">
              همه سفارش‌ها <ArrowLeft className="size-3.5" />
            </Link>
          </div>
          <div className="brand-hairline my-4" />

          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-muted-foreground">هنوز سفارشی ثبت نشده است.</p>
          ) : (
            <ul className="divide-y divide-line/70">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3.5 transition-colors hover:bg-foreground/5"
                  >
                    <span className="min-w-0">
                      <span className="block font-mono text-[13px] font-bold text-gold">{order.orderNumber}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                        {order.customer?.username ?? "—"} · {formatFaDate(order.createdAt)}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <StatusBadge value={order.status} kind="order" />
                      <StatusBadge value={order.paymentStatus} kind="payment" />
                      <strong className="font-mono text-[13px] text-foreground">{formatToman(order.totals.totalAmount)}</strong>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="text-[11px] text-muted-foreground/60">
        وضعیت پرداخت: {paymentStatusLabels.COMPLETED} · {paymentStatusLabels.FAILED} · {paymentStatusLabels.INITIATED}
      </p>
    </div>
  );
}