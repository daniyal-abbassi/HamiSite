import type { Metadata } from "next";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { findProductBySlug } from "@/lib/catalog";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = findProductBySlug(slug);
  if (!product) {
    return { title: "محصول یافت نشد | حامی همراه" };
  }
  const description =
    product.description?.replace(/<[^>]+>/g, " ").trim().slice(0, 155) ||
    "مشخصات، قیمت و خرید محصول از فروشگاه حامی همراه — با پشتیبانی از خرید عمده.";
  return {
    title: product.name,
    description,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  return (
    <div className="container py-10">
      <ProductDetail slug={slug} />
    </div>
  );
}
