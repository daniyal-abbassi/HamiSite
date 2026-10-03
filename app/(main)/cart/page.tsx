import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/CartPageClient";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "سبد خرید",
  description: "سبد خرید فروشگاه حامی همراه.",
};

export default function CartPage() {
  return (
    <div className="container py-10">
      <PageHeader page="cart" eyebrow="سبد خرید" title="بازبینی" accent="سفارش." />
      <CartPageClient />
    </div>
  );
}
