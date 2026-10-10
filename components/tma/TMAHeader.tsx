"use client";

import React from "react";
import { useTelegram } from "./TelegramProvider";
import { ShieldCheck, Sparkles } from "lucide-react";

interface TMAHeaderProps {
  title?: string;
  subtitle?: string;
}

export function TMAHeader({ title = "حامی همراه", subtitle = "مدیریت سریع فروشگاه" }: TMAHeaderProps) {
  const { user } = useTelegram();

  return (
    <header className="sticky top-0 z-40 bg-[#0B0204]/90 backdrop-blur-md border-b border-stone-800/80 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 p-[1px] shadow-sm">
          <div className="w-full h-full bg-[#0B0204] rounded-[11px] flex items-center justify-center text-amber-300">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h1 className="text-sm font-bold text-stone-100 tracking-tight flex items-center gap-1.5">
            {title}
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-[11px] text-stone-400">{subtitle}</p>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-1.5 bg-stone-900/80 border border-stone-800 px-2.5 py-1 rounded-full text-[11px] text-stone-300">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-medium truncate max-w-[100px]">
            {user.first_name || user.username || "مدیر"}
          </span>
        </div>
      )}
    </header>
  );
}

