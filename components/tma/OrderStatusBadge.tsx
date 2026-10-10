"use client";

import React from "react";
import { orderStatusLabels } from "@/lib/content/order";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: {
    bg: "bg-amber-500/15 border-amber-500/30",
    text: "text-amber-300",
    dot: "bg-amber-400",
  },
  PROCESSING: {
    bg: "bg-sky-500/15 border-sky-500/30",
    text: "text-sky-300",
    dot: "bg-sky-400 animate-pulse",
  },
  SHIPPING: {
    bg: "bg-indigo-500/15 border-indigo-500/30",
    text: "text-indigo-300",
    dot: "bg-indigo-400",
  },
  COMPLETED: {
    bg: "bg-emerald-500/15 border-emerald-500/30",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  CANCELED: {
    bg: "bg-rose-500/15 border-rose-500/30",
    text: "text-rose-300",
    dot: "bg-rose-400",
  },
  FAILED: {
    bg: "bg-rose-500/15 border-rose-500/30",
    text: "text-rose-300",
    dot: "bg-rose-400",
  },
  REVERSED: {
    bg: "bg-stone-500/15 border-stone-500/30",
    text: "text-stone-300",
    dot: "bg-stone-400",
  },
};

export function OrderStatusBadge({ status, size = "md" }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const label = orderStatusLabels[status] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        config.bg,
        config.text,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {label}
    </span>
  );
}

