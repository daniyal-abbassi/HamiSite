import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "تسویه حساب",
  description: "تسویه حساب و ثبت نهایی سفارش در فروشگاه حامی همراه.",
};

export default function CheckoutPage() {
  return (
    <div className="container py-10">
      <header className="mb-8">
        <div className="section-label">
          <span>۰۰۲</span>
          <i />
          <p>تسویه حساب</p>
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight md:text-3xl">
          تکمیل <em className="font-black not-italic text-gold">خرید.</em>
        </h1>
      </header>
      <CheckoutClient />
    </div>
  );
}
