"use client";

import React, { useState } from "react";
import { Drawer } from "vaul";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { useTelegram } from "./TelegramProvider";
import { getAllowedNextOrderStatuses } from "@/lib/tma-service";
import { orderStatusLabels } from "@/lib/content/order";
import { Check, Truck, Clock, Ban, Loader2, X } from "lucide-react";
import { toFaDigits } from "@/lib/utils";

interface OrderStatusSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  orderNumber: string;
  currentStatus: string;
  initialTrackingCode?: string | null;
  onStatusUpdated: (newStatus: string, trackingCode?: string) => void;
}

const STATUS_ICONS: Record<string, any> = {
  PROCESSING: Clock,
  SHIPPING: Truck,
  COMPLETED: Check,
  CANCELED: Ban,
};

const STATUS_COLORS: Record<string, string> = {
  PROCESSING: "bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20",
  SHIPPING: "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20",
  COMPLETED: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20",
  CANCELED: "bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20",
};

export function OrderStatusSheet({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  currentStatus,
  initialTrackingCode = "",
  onStatusUpdated,
}: OrderStatusSheetProps) {
  const { haptic } = useTelegram();
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState(initialTrackingCode || "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allowedStatuses = getAllowedNextOrderStatuses(currentStatus);

  const handleUpdateStatus = async (status: string) => {
    setLoadingStatus(status);
    setErrorMessage(null);
    haptic.impact("medium");

    try {
      const res = await fetch(`/api/tma/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          trackingCode: status === "SHIPPING" ? trackingCode : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "خطا در به‌روزرسانی وضعیت");
      }

      haptic.notification("success");
      onStatusUpdated(status, trackingCode);
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      haptic.notification("error");
      setErrorMessage(err.message || "خطا در برقراری ارتباط با سرور");
    } finally {
      setLoadingStatus(null);
    }
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity" />
        <Drawer.Content className="fixed bottom-0 inset-x-0 z-50 bg-[#12070A] border-t border-stone-800 rounded-t-3xl max-h-[85vh] flex flex-col focus:outline-hidden text-stone-100">
          {/* Grab Handle */}
          <div className="w-12 h-1.5 bg-stone-700/60 rounded-full mx-auto my-3" />

          <div className="p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-stone-100">تغییر وضعیت سفارش</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  سفارش شماره <span className="font-mono text-amber-300">{toFaDigits(orderNumber)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <OrderStatusBadge status={currentStatus} size="sm" />
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {/* If shipping is an option or selected, allow entering tracking code */}
            {allowedStatuses.includes("SHIPPING" as any) && (
              <div className="mb-4">
                <label className="block text-xs text-stone-300 mb-1.5 font-medium">
                  کد رهگیری پستی / بارنامه (اختیاری):
                </label>
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="مثال: ۲۴ رقمی پست پیشتاز یا کد پیک"
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-400 font-mono"
                  dir="ltr"
                />
              </div>
            )}

            <div className="space-y-2.5 mb-6">
              <div className="text-xs font-medium text-stone-400 mb-2">عملیات سریع:</div>

              {allowedStatuses.length === 0 ? (
                <div className="text-xs text-stone-400 text-center py-4 bg-stone-900/60 rounded-xl border border-stone-800">
                  این سفارش در وضعیت نهایی است و امکان تغییر خودکار ندارد.
                </div>
              ) : (
                allowedStatuses.map((status) => {
                  const Icon = STATUS_ICONS[status] || Check;
                  const colorClass = STATUS_COLORS[status] || "bg-stone-800 text-stone-200";
                  const label = orderStatusLabels[status] || status;
                  const isLoading = loadingStatus === status;

                  return (
                    <button
                      key={status}
                      disabled={loadingStatus !== null}
                      onClick={() => handleUpdateStatus(status)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all active:scale-[0.98] ${colorClass}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-black/20">
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-xs font-semibold">تغییر به {label}</span>
                      </div>
                      <span className="text-[11px] opacity-80">ثبت فوری</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

