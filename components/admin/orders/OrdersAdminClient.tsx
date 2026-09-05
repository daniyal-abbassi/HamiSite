"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGetWithMeta } from "@/lib/api-client";
import { formatFaDate } from "@/lib/content/order";
import { formatToman } from "@/lib/utils";
import type { OrderSummary } from "@/types/store";

const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPING", "COMPLETED", "CANCELED", "FAILED", "REVERSED"] as const;
const PAGE_SIZE = 20;

export function OrdersAdminClient() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [meta, setMeta] = useState<{ total: number; hasNextPage: boolean } | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (targetPage: number, targetStatus: string) => {
    setOrders(null);
    setFailed(false);
    try {
      const params = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE) });
      if (targetStatus) params.set("status", targetStatus);
      const { data, meta: responseMeta } = await apiGetWithMeta<OrderSummary[]>(`/api/admin/orders?${params.toString()}`);
      setOrders(data);
      setMeta({
        total: Number(responseMeta?.total) || 0,
        hasNextPage: Boolean(responseMeta?.hasNextPage),
      });
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load(page, status);
  }, [load, page, status]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          aria-label="فیلتر وضعیت سفارش"
          className="w-44"
        >
          <option value="">همه وضعیت‌ها</option>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
        {meta && <span className="font-mono text-[11px] text-muted-foreground/70">{meta.total.toLocaleString("fa-IR")} سفارش</span>}
      </div>

      {failed ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-10 text-center">
          <p className="text-sm text-destructive">در بارگذاری سفارش‌ها خطایی رخ داد.</p>
          <button type="button" onClick={() => void load(page, status)} className="flex items-center gap-1.5 text-xs font-bold text-gold">
            <RotateCcw className="size-3.5" /> تلاش دوباره
          </button>
        </div>
      ) : !orders ? (
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-12 text-center text-sm text-muted-foreground">
          سفارشی با این فیلتر پیدا نشد.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-ink-2/60 font-mono text-[10px] font-bold tracking-[0.1em] text-muted-foreground/80">
                  <th className="px-4 py-3 text-start">شماره</th>
                  <th className="px-4 py-3 text-start">مشتری</th>
                  <th className="hidden px-4 py-3 text-start md:table-cell">تاریخ</th>
                  <th className="hidden px-4 py-3 text-start lg:table-cell">اقلام</th>
                  <th className="px-4 py-3 text-start">وضعیت</th>
                  <th className="px-4 py-3 text-start">پرداخت</th>
                  <th className="px-4 py-3 text-end">مبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-foreground/5">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-[13px] font-bold text-gold hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground/85">{order.customer?.username ?? "—"}</td>
                    <td className="hidden px-4 py-3 text-[12px] text-muted-foreground md:table-cell">{formatFaDate(order.createdAt)}</td>
                    <td className="hidden px-4 py-3 font-mono text-[12px] text-muted-foreground lg:table-cell">
                      {order.items.length.toLocaleString("fa-IR")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={order.status} kind="order" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={order.paymentStatus} kind="payment" />
                    </td>
                    <td className="px-4 py-3 text-end font-mono text-[13px] font-bold text-foreground">
                      {formatToman(order.totals.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={meta?.total ?? 0} hasNextPage={meta?.hasNextPage ?? false} onPageChange={setPage} />
          <p className="mt-3 text-center text-xs">
            <Link href="/admin" className="flex items-center justify-center gap-1 text-[12px] font-bold text-gold hover:underline">
              <ArrowLeft className="size-3.5" /> بازگشت به داشبورد
            </Link>
          </p>
        </>
      )}
    </div>
  );
}