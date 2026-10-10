"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Package } from "lucide-react";
import { useTelegram } from "./TelegramProvider";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/tma",
    label: "داشبورد",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/tma/orders",
    label: "سفارش‌ها",
    icon: ShoppingBag,
    exact: false,
  },
  {
    href: "/tma/products",
    label: "کالاها",
    icon: Package,
    exact: false,
  },
];

export function TMABottomNav() {
  const pathname = usePathname();
  const { haptic } = useTelegram();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#0B0204]/90 backdrop-blur-md border-t border-stone-800/80 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 px-6">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (!isActive) {
                  haptic.selection();
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 relative",
                isActive
                  ? "text-amber-300 font-semibold scale-105"
                  : "text-stone-400 hover:text-stone-200"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  isActive ? "bg-amber-400/10 text-amber-300" : "text-stone-400"
                )}
              >
                <Icon className="w-5 h-5 stroke-[1.8]" />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

