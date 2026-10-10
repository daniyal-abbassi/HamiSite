"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { OrderStatusBadge } from "@/components/tma/OrderStatusBadge";
import { OrderStatusSheet } from "@/components/tma/OrderStatusSheet";
import { useTelegram } from "@/components/tma/TelegramProvider";
import { formatToman, toFaDigits } from "@/lib/utils";
import { formatFaDate } from "@/lib/content/order";
import {
  Phone,
  MapPin,
  Truck,
  ArrowRight,
  Package,
  Clock,
  Sparkles,
  CreditCard,
  FileText,
} from "lucide-react";

export default function TMAOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { haptic } = useTelegram();

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      const res = await fetch(`/api/tma/orders/${id}`);
      const data = await res.json();
      if (data.ok) {
        setOrder(data.order);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const handleStatusUpdated = (newStatus: string, trackingCode?: string) => {
    setOrder((prev: any) =>
      prev
        ? {
            ...prev,
            status: newStatus,
            trackingCode: trackingCode || prev.trackingCode,
          }
        : prev
    );
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <div className="h-12 bg-stone-900 rounded-2xl animate-pulse" />
        <div className="h-40 bg-stone-900 rounded-2xl animate-pulse" />
        <div className="h-48 bg-stone-900 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center text-stone-300">
        <p>سفارش مورد نظر یافت نشد.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-stone-800 rounded-xl text-xs"
        >
          بازگشت
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0B0204]/90 backdrop-blur-md border-b border-stone-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              haptic.selection();
              router.back();
            }}
            className="p-1 rounded-full text-stone-400 hover:text-stone-200"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-stone-100 font-mono">
              {toFaDigits(order.orderNumber)}
            </h1>
            <p className="text-[11px] text-stone-400">{formatFaDate(order.createdAt)}</p>
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto w-full pb-28">
        {/* Status Action CTA */}
        <div className="bg-gradient-to-r from-amber-500/15 to-stone-900 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-300 font-medium">وضعیت فعلی</div>
            <div className="text-sm font-bold text-stone-100 mt-0.5">
              امکان تغییر وضعیت و ثبت کد رهگیری
            </div>
          </div>
          <button
            onClick={() => {
              haptic.impact("medium");
              setSheetOpen(true);
            }}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl text-xs active:scale-95 transition-all shadow-md"
          >
            تغییر وضعیت
          </button>
        </div>

        {/* Customer Information Card */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
          <div className="text-xs font-bold text-stone-300 flex items-center gap-1.5 border-b border-stone-800/80 pb-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>مشخصات تحویل‌گیرنده</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400">نام و نام خانوادگی:</span>
            <span className="font-semibold text-stone-100">{order.customerName}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400">شماره تماس:</span>
            <a
              href={`tel:${order.phone}`}
              className="text-amber-400 font-mono font-medium flex items-center gap-1 hover:underline dir-ltr"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{toFaDigits(order.phone)}</span>
            </a>
          </div>

          <div className="text-xs space-y-1 pt-1 border-t border-stone-800/40">
            <span className="text-stone-400">نشانی ارسال:</span>
            <p className="text-stone-200 leading-relaxed font-normal">
              {[order.province, order.city, order.addressText].filter(Boolean).join("، ")}
            </p>
            {order.postalCode && (
              <div className="text-[11px] text-stone-400 font-mono mt-1">
                کد پستی: {toFaDigits(order.postalCode)}
              </div>
            )}
          </div>

          {order.trackingCode && (
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs flex items-center justify-between">
              <span className="text-indigo-300 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                کد رهگیری مرسوله:
              </span>
              <span className="font-mono text-stone-100 font-bold dir-ltr">
                {order.trackingCode}
              </span>
            </div>
          )}

          {order.customerNote && (
            <div className="p-2.5 rounded-xl bg-stone-800/60 border border-stone-700/40 text-xs">
              <span className="text-stone-400 block mb-0.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                یادداشت مشتری:
              </span>
              <p className="text-stone-200 text-xs">{order.customerNote}</p>
            </div>
          )}
        </div>

        {/* Order Items Card */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
          <div className="text-xs font-bold text-stone-300 flex items-center gap-1.5 border-b border-stone-800/80 pb-2">
            <Package className="w-4 h-4 text-amber-400" />
            <span>اقلام سفارش ({toFaDigits(order.items.length)} قلم)</span>
          </div>

          <div className="divide-y divide-stone-800/60">
            {order.items.map((item: any) => (
              <div key={item.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div className="flex-1">
                  <div className="font-medium text-stone-100 leading-tight">
                    {item.productName}
                  </div>
                  {item.variantDesc && (
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      {item.variantDesc}
                    </div>
                  )}
                  <div className="text-[11px] text-stone-400 mt-1">
                    {toFaDigits(item.quantity)} عدد × {formatToman(item.unitPrice)}
                  </div>
                </div>
                <div className="font-semibold text-amber-300">
                  {formatToman(item.totalPrice)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary Card */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="text-xs font-bold text-stone-300 flex items-center gap-1.5 border-b border-stone-800/80 pb-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>صورتحساب مالی</span>
          </div>

          <div className="flex justify-between text-stone-400">
            <span>مجموع اقلام:</span>
            <span>{formatToman(order.subtotal)}</span>
          </div>

          <div className="flex justify-between text-stone-400">
            <span>هزینه ارسال ({order.shippingMethodName || "پست"}):</span>
            <span>{formatToman(order.shippingPrice)}</span>
          </div>

          {order.discountAmount > 0 && (
            <div className="flex justify-between text-rose-400">
              <span>تخفیف:</span>
              <span>- {formatToman(order.discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-stone-100 font-bold pt-2 border-t border-stone-800/80 text-sm">
            <span>مبلغ پرداختی کل:</span>
            <span className="text-amber-400 font-black">{formatToman(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Quick Status Bottom Sheet */}
      <OrderStatusSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        orderId={order.id}
        orderNumber={order.orderNumber}
        currentStatus={order.status}
        initialTrackingCode={order.trackingCode}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
}

