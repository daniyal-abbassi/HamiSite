import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopBanner } from "@/components/shop/ShopBanner";
import { ShopClient } from "@/components/shop/ShopClient";
import { stockedRootCategorySlugs } from "@/lib/shop-category-tiles";

export const metadata: Metadata = {
/* The template in app/layout.tsx appends the brand: «فروشگاه | حامی همراه». */
  title: "فروشگاه",
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
            همه محصولات، <em className="font-black not-italic text-aqua">یک‌جا.</em>
          </h1>
        </header>
        {/* useSearchParams inside ShopClient requires a Suspense boundary for prerendering */}
        <Suspense fallback={null}>
          <ShopClient tileSlugs={stockedRootCategorySlugs()} />
        </Suspense>
      </div>
    </>
  );
}
