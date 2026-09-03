import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopBanner } from "@/components/shop/ShopBanner";
import { ShopClient } from "@/components/shop/ShopClient";

export const metadata: Metadata = {
  title: "فروشگاه | حامی همراه",
  description: "خرید موبایل، لوازم جانبی و محصولات دیجیتال از فروشگاه حامی همراه — آنلاین و حضوری.",
};

export default function ShopPage() {
  return (
    <>
      <ShopBanner />
      <div className="container py-10">
        <header className="mb-8">
          <div className="section-label">
            <span>۰۰۱</span>
            <i />
            <p>فروشگاه حامی همراه</p>
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight md:text-3xl">
            همه محصولات، <em className="font-black not-italic text-gold">یک‌جا.</em>
          </h1>
        </header>
        {/* useSearchParams inside ShopClient requires a Suspense boundary for prerendering */}
        <Suspense fallback={null}>
          <ShopClient />
        </Suspense>
      </div>
    </>
  );
}
