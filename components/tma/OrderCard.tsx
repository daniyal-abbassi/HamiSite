"use client";

import React from "react";
import { formatToman, toFaDigits } from "@/lib/utils";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { ChevronLeft, Package, Phone } from "lucide-react";
import { formatFaDate } from "@/lib/content/order";
import { useTelegram } from "./TelegramProvider";

export interface TMAOrderListItem {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  city?: string;
  province?: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  itemCount?: number;
  shippingMethodName?: string | null;
}

interface OrderCardProps {
  order: TMAOrderListItem;
  onClick: () => void;
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  const { haptic } = useTelegram();

  return (
    <div
      onClick={() => {
        haptic.selection();
        onClick();
      }}
      className="bg-stone-900/90 hover:bg-stone-850 active:scale-[0.99] border border-stone-800 rounded-2xl p-4 transition-all cursor-pointer shadow-sm relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div>
          <div className="text-sm font-bold text-stone-100 flex items-center gap-2">
            <span>{order.customerName || "مشتری مهمان"}</span>
          </div>
          <div className="text-xs text-stone-400 mt-0.5 flex items-center gap-2">
            <span className="font-mono text-stone-400">{toFaDigits(order.orderNumber)}</span>
            <span>•</span>
            <span>{formatFaDate(order.createdAt)}</span>
          </div>
        </div>
        <OrderStatusBadge status={order.status} size="sm" />
      </div>

      <div className="flex items-center justify-between pt-2.5 border-t border-stone-800/80 text-xs">
        <div className="flex items-center gap-3 text-stone-300">
          <span className="font-semibold text-amber-300 text-sm">
            {formatToman(order.totalAmount)}
          </span>
          {order.itemCount !== undefined && order.itemCount > 0 && (
            <span className="text-stone-400 text-[11px] flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              {toFaDigits(order.itemCount)} قلم
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-stone-400">
          <span className="text-[11px]">جزئیات</span>
          <ChevronLeft className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

