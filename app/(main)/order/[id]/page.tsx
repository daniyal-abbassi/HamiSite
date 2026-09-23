import type { Metadata } from "next";
import { OrderDetailClient } from "@/components/order/OrderDetailClient";

export const metadata: Metadata = {
  title: "جزئیات سفارش",
  description: "پیگیری سفارش در فروشگاه حامی همراه.",
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="container py-10">
      <header className="mb-8">
        <div className="section-label">
          <span>۰۰۳</span>
          <i />
          <p>سفارش</p>
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-normal md:text-3xl">
          پیگیری <em className="font-black not-italic text-aqua">سفارش.</em>
        </h1>
      </header>
      <OrderDetailClient orderId={id} />
    </div>
  );
}
