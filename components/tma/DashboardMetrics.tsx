"use client";

import React from "react";
import { TrendingUp, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatToman, toFaDigits } from "@/lib/utils";
import { type DashboardMetricsResult } from "@/lib/tma-service";

interface DashboardMetricsProps {
  metrics: DashboardMetricsResult;
  onAlertClick?: () => void;
  onPendingClick?: () => void;
}

export function DashboardMetrics({
  metrics,
  onAlertClick,
  onPendingClick,
}: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 1. Today's Revenue (Spans 2 columns for primary prominence) */}
      <div className="col-span-2 bg-gradient-to-br from-amber-500/10 via-stone-900 to-stone-950 border border-amber-500/25 rounded-2xl p-4.5 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            فروش تایید شده امروز
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-medium">
            زنده
          </span>
        </div>
        <div className="text-2xl font-black text-amber-300 tracking-tight">
          {formatToman(metrics.todayRevenue)}
        </div>
        <p className="text-[11px] text-stone-400 mt-1">
          {toFaDigits(metrics.todayCompletedCount)} سفارش موفق ثبت شده در طول روز
        </p>
      </div>

      {/* 2. Pending Orders Needing Triage */}
      <div
        onClick={onPendingClick}
        className="bg-stone-900/90 border border-stone-800 hover:border-amber-500/40 active:scale-[0.98] transition-all rounded-2xl p-3.5 cursor-pointer shadow-md"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
          {metrics.pendingCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </div>
        <div className="text-xl font-bold text-stone-100">
          {toFaDigits(metrics.pendingCount)}
        </div>
        <div className="text-xs text-stone-400 mt-0.5">نیازمند اقدام</div>
      </div>

      {/* 3. Stock & Availability Alerts */}
      <div
        onClick={onAlertClick}
        className="bg-stone-900/90 border border-stone-800 hover:border-rose-500/40 active:scale-[0.98] transition-all rounded-2xl p-3.5 cursor-pointer shadow-md"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          {metrics.lowStockAlerts > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              هشدار
            </span>
          )}
        </div>
        <div className="text-xl font-bold text-stone-100">
          {toFaDigits(metrics.lowStockAlerts)}
        </div>
        <div className="text-xs text-stone-400 mt-0.5">اتمام / ناموجود</div>
      </div>
    </div>
  );
}

