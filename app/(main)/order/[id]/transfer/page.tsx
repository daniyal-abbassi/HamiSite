import type { Metadata } from "next";
import { TransferClient } from "@/components/order/TransferClient";

export const metadata: Metadata = {
  title: "پرداخت کارت‌به‌کارت",
  description: "پرداخت سفارش به‌صورت کارت‌به‌کارت در فروشگاه حامی همراه.",
  robots: { index: false, follow: false },
};

export default async function TransferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="container py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-black tracking-normal md:text-3xl">
          پرداخت <em className="font-black not-italic text-aqua">کارت‌به‌کارت.</em>
        </h1>
      </header>
      <TransferClient orderId={id} />
    </div>
  );
}
