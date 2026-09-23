import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "تسویه حساب",
  description: "تسویه حساب و ثبت نهایی سفارش در فروشگاه حامی همراه.",
};

export default function CheckoutPage() {
  return (
    <div className="container py-10">
      <PageHeader page="checkout" eyebrow="تسویه حساب" title="تکمیل" accent="خرید." />
      <CheckoutClient />
    </div>
  );
}
