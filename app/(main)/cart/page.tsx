import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/CartPageClient";

export const metadata: Metadata = {
  title: "سبد خرید",
  description: "سبد خرید فروشگاه حامی همراه.",
};

export default function CartPage() {
  return (
    <div className="container py-10">
      <header className="mb-8">
        <div className="section-label">
          <span>۰۰۱</span>
          <i />
          <p>سبد خرید</p>
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight md:text-3xl">
          بازبینی <em className="font-black not-italic text-gold">سفارش.</em>
        </h1>
      </header>
      <CartPageClient />
    </div>
  );
}
