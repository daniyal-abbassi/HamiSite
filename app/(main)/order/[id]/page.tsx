import type { Metadata } from "next";
import { OrderDetailClient } from "@/components/order/OrderDetailClient";

export const metadata: Metadata = {
  title: "جزئیات سفارش",
  description: "پیگیری سفارش در فروشگاه حامی همراه.",
};

export default function OrderPage({ params }: { params: { id: string } }) {
  return (
    <div className="container py-10">
      <header className="mb-8">
        <div className="section-label">
          <span>۰۰۳</span>
          <i />
          <p>سفارش</p>
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight md:text-3xl">
          پیگیری <em className="font-black not-italic text-gold">سفارش.</em>
        </h1>
      </header>
      <OrderDetailClient orderId={params.id} />
    </div>
  );
}
