import type { Metadata } from "next";
import { OrdersListClient } from "@/components/order/OrdersListClient";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "سفارش‌های من",
  description: "تاریخچه سفارش‌های شما در فروشگاه حامی همراه.",
};

export default function OrdersPage() {
  return (
    <div className="container py-10">
      <PageHeader page="orders" eyebrow="حساب کاربری" title="سفارش‌های" accent="من." />
      <OrdersListClient />
    </div>
  );
}
