import type { Metadata } from "next";
import { ProductDetail } from "@/components/shop/ProductDetail";

export const metadata: Metadata = {
  title: "جزئیات محصول",
  description: "مشخصات، قیمت و خرید محصول از فروشگاه حامی همراه — با پشتیبانی از خرید عمده.",
};

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="container py-10">
      <ProductDetail slug={slug} />
    </div>
  );
}
