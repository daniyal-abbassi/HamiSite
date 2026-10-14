import React from "react";
import Script from "next/script";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { TelegramProvider } from "@/components/tma/TelegramProvider";
import { TMABottomNav } from "@/components/tma/TMABottomNav";
import { SkipLink } from "@/components/common/SkipLink";

export const metadata: Metadata = {
  title: "پنل مدیریت سریع حامی | مینی‌اپ تلگرام",
  description: "داشبورد اختصاصی مدیریت سفارش‌ها، وضعیت کالاها و گزارشات لحظه‌ای فروشگاه حامی همراه",
};

export default async function TMALayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        nonce={nonce}
        strategy="afterInteractive"
      />
      <div className="min-h-screen bg-[#0B0204] text-stone-100 flex flex-col font-sans antialiased selection:bg-amber-500/20">
        <SkipLink />
        <TelegramProvider>
          <main id="main" tabIndex={-1} className="flex-1 pb-24 overflow-x-hidden focus:outline-none">
            {children}
          </main>
          <TMABottomNav />
        </TelegramProvider>
      </div>
    </>
  );
}
