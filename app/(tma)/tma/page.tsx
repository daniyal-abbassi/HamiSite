"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TMAHeader } from "@/components/tma/TMAHeader";
import { DashboardMetrics } from "@/components/tma/DashboardMetrics";
import { OrderCard, type TMAOrderListItem } from "@/components/tma/OrderCard";
import { useTelegram } from "@/components/tma/TelegramProvider";
import { RefreshCw, ArrowLeft, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { type DashboardMetricsResult } from "@/lib/tma-service";

export default function TMADashboardPage() {
  const router = useRouter();
  const { haptic } = useTelegram();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetricsResult>({
    todayRevenue: 0,
    pendingCount: 0,
    todayCompletedCount: 0,
    lowStockAlerts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<TMAOrderListItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/tma/dashboard");
      const data = await res.json();
      if (data.ok) {
        setMetrics(data.metrics);
        setRecentOrders(data.recentOrders || []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    haptic.impact("light");
    fetchDashboard();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TMAHeader title="داشبورد حامی" subtitle="آمار زنده و سفارش‌های اخیر" />

      <div className="p-4 space-y-5 max-w-lg mx-auto w-full">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-300">خلاصه وضعیت امروز</span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-full active:scale-95 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>بروزرسانی</span>
          </button>
        </div>

        {/* Live Metrics */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 animate-pulse">
            <div className="col-span-2 h-32 bg-stone-900/60 rounded-2xl" />
            <div className="h-24 bg-stone-900/60 rounded-2xl" />
            <div className="h-24 bg-stone-900/60 rounded-2xl" />
          </div>
        ) : (
          <DashboardMetrics
            metrics={metrics}
            onPendingClick={() => router.push("/tma/orders?status=PENDING")}
            onAlertClick={() => router.push("/tma/products?stock=low")}
          />
        )}

        {/* Recent Orders Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-stone-100">سفارش‌های اخیر</h2>
            </div>
            <Link
              href="/tma/orders"
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
            >
              <span>مشاهده همه</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-stone-900/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-10 bg-stone-900/40 rounded-2xl border border-stone-800/80 p-6">
              <ShoppingBag className="w-8 h-8 text-stone-600 mx-auto mb-2" />
              <p className="text-xs text-stone-400">هنوز سفارشی در این دوره ثبت نشده است.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={() => router.push(`/tma/orders/${order.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

