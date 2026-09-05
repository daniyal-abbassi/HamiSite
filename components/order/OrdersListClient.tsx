"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { ApiClientError, apiGet, apiGetWithMeta } from "@/lib/api-client";
import { formatFaDate, orderStatusLabels, orderStatusTone, paymentStatusLabels, paymentStatusTones } from "@/lib/content/order";
import { formatToman, toFaDigits } from "@/lib/utils";
import type { OrderSummary } from "@/types/store";

type Meta = { page: number; pageSize: number; total: number; hasNextPage: boolean };

export function OrdersListClient() {
  const router = useRouter();
  const { status } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [failed, setFailed] = useState(false);

  const load = useCallback(
    async (targetPage: number) => {
      setOrders(null);
      setFailed(false);
      try {
        const { data, meta: responseMeta } = await apiGetWithMeta<OrderSummary[]>(`/api/orders?page=${targetPage}&pageSize=10`);
        setOrders(data);
        setMeta({
          page: Number(responseMeta?.page) || targetPage,
          pageSize: Number(responseMeta?.pageSize) || 10,
          total: Number(responseMeta?.total) || 0,
          hasNextPage: Boolean(responseMeta?.hasNextPage),
        });
      } catch (cause) {
        if (cause instanceof ApiClientError && (cause.code === "AUTH_REQUIRED" || cause.status === 401)) {
          router.replace("/login?next=/orders");
          return;
        }
        setFailed(true);
      }
    },
    [router],
  );

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login?next=/orders");
      return;
    }
    if (status === "authenticated") void load(page);
  }, [status, page, load, router]);

  if (status === "loading" || (status === "authenticated" && orders === null && !failed)) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (status === "guest") return null; // redirecting

  if (failed) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-sm text-destructive">در بارگذاری سفارش‌ها مشکلی پیش آمد.</p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => void load(page)}>
          تلاش دوباره
        </Button>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="glass mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl p-10 text-center">
        <PackageOpen className="size-10 text-gold/60" />
        <h2 className="text-lg font-black">هنوز سفارشی ثبت نکرده‌اید</h2>
        <Link href="/shop">
          <Button variant="oxblood">شروع خرید</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/order/${order.id}`}
            className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5 transition-transform duration-slow hover:-translate-y-0.5"
          >
            <span className="min-w-0">
              <span className="block font-mono text-sm font-black text-gold">{order.orderNumber}</span>
              <span className="mt-1 block text-[11px] text-muted-foreground">{formatFaDate(order.createdAt)}</span>
            </span>
            <span className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className={`rounded-full border border-line bg-foreground/5 px-3 py-1 font-bold ${orderStatusTone(order.status)}`}>
                {orderStatusLabels[order.status] ?? order.status}
              </span>
              <span className={`rounded-full border border-line bg-foreground/5 px-3 py-1 font-bold ${paymentStatusTones[order.paymentStatus] ?? "text-muted-foreground"}`}>
                {paymentStatusLabels[order.paymentStatus] ?? order.paymentStatus}
              </span>
              <strong className="font-mono text-sm text-foreground">{formatToman(order.totals.totalAmount)}</strong>
              <ArrowLeft className="size-4 text-gold" />
            </span>
          </Link>
        ))}
      </div>

      {meta && meta.total > meta.pageSize && (
        <div className="mt-6 flex items-center justify-center gap-4 text-xs">
          <Button variant="ghost" size="sm" disabled={meta.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            قبلی
          </Button>
          <span className="font-mono text-muted-foreground">
            صفحه {toFaDigits(meta.page)} از {toFaDigits(Math.max(1, Math.ceil(meta.total / meta.pageSize)))}
          </span>
          <Button variant="ghost" size="sm" disabled={!meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>
            بعدی
          </Button>
        </div>
      )}
    </div>
  );
}
