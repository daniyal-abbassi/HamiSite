import type { Metadata } from "next";
import { OrdersListClient } from "@/components/order/OrdersListClient";

export const metadata: Metadata = {
  title: "سفارش‌های من",
  description: "تاریخچه سفارش‌های شما در فروشگاه حامی همراه.",
};

export default function OrdersPage() {
  return (
    <div className="container py-10">
      <header className="mb-8">
        <div className="section-label">
          <span>۰۰۴</span>
          <i />
          <p>حساب کاربری</p>
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight md:text-3xl">
          سفارش‌های <em className="font-black not-italic text-gold">من.</em>
        </h1>
      </header>
      <OrdersListClient />
    </div>
  );
}
