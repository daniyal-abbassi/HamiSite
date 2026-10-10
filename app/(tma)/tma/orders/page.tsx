"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TMAHeader } from "@/components/tma/TMAHeader";
import { OrderCard, type TMAOrderListItem } from "@/components/tma/OrderCard";
import { useTelegram } from "@/components/tma/TelegramProvider";
import { Search, Filter, ShoppingBag, X } from "lucide-react";
import { orderStatusLabels } from "@/lib/content/order";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { key: "ALL", label: "همه" },
  { key: "PENDING", label: "در انتظار" },
  { key: "PROCESSING", label: "پردازش" },
  { key: "SHIPPING", label: "ارسال شده" },
  { key: "COMPLETED", label: "تحویل شده" },
  { key: "CANCELED", label: "لغو شده" },
];

export default function TMAOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";

  const { haptic } = useTelegram();

  const [orders, setOrders] = useState<TMAOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/tma/orders?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Orders fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = (status: string) => {
    haptic.selection();
    setSelectedStatus(status);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TMAHeader title="سفارش‌های فروشگاه" subtitle="فیلتر و بررسی سریع سفارش‌ها" />

      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جست‌وجو با شماره سفارش، نام مشتری یا موبایل..."
            className="w-full bg-stone-900/90 border border-stone-800 rounded-2xl pl-10 pr-10 py-3 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-400/80 transition-all"
          />
          <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 rounded-full text-stone-400 hover:text-stone-200 absolute left-3 top-2.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Horizontal Scrolling Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_FILTERS.map((f) => {
            const isActive = selectedStatus === f.key;
            return (
              <button
                key={f.key}
                onClick={() => handleStatusChange(f.key)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
                  isActive
                    ? "bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-xs scale-102"
                    : "bg-stone-900/60 text-stone-400 border-stone-800 hover:text-stone-300"
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Order Cards List */}
        {loading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-stone-900/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-stone-900/30 rounded-2xl border border-stone-800/80 p-6">
            <ShoppingBag className="w-10 h-10 text-stone-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-stone-200">سفارشی یافت نشد</h3>
            <p className="text-xs text-stone-400 mt-1">
              با فیلتر یا عبارت جست‌وجوی انتخابی سفارشی ثبت نشده است.
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {orders.map((order) => (
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
  );
}

