import React from "react";
import Script from "next/script";
import type { Metadata, Viewport } from "next";
import { TelegramProvider } from "@/components/tma/TelegramProvider";
import { TMABottomNav } from "@/components/tma/TMABottomNav";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0B0204",
};

export const metadata: Metadata = {
  title: "پنل مدیریت سریع حامی | مینی‌اپ تلگرام",
  description: "داشبورد اختصاصی مدیریت سفارش‌ها، وضعیت کالاها و گزارشات لحظه‌ای فروشگاه حامی همراه",
};

export default function TMALayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      <div className="min-h-screen bg-[#0B0204] text-stone-100 flex flex-col font-sans antialiased selection:bg-amber-500/20">
        <TelegramProvider>
          <main className="flex-1 pb-24 overflow-x-hidden">
            {children}
          </main>
          <TMABottomNav />
        </TelegramProvider>
      </div>
    </>
  );
}

