import type { Metadata } from "next";
import { ProductDetail } from "@/components/shop/ProductDetail";

export const metadata: Metadata = {
  title: "جزئیات محصول",
  description: "مشخصات، قیمت و خرید محصول از فروشگاه حامی همراه — با پشتیبانی از خرید عمده.",
};

export default function ProductPage({ params }: { params: { slug: string } }) {
  return (
    <div className="container py-10">
      <ProductDetail slug={params.slug} />
    </div>
  );
}
