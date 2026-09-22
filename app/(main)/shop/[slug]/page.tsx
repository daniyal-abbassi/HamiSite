import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    "مشخصات، قیمت و وضعیت موجودی محصول از فروشگاه حامی همراه.";
  return {
    title: product.name,
    description,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  /*
   * Resolved on the server so a missing product is an actual 404. It used to
   * render a client component that fetched, printed «محصول پیدا نشد» and left a
   * framework-default 200 behind — so a dead product link looked alive to
   * anything that does not run JavaScript, and US3 scenario 9 was unmet.
   */
  if (!findProductBySlug(slug)) notFound();
  return (
    <div className="container py-10">
      <ProductDetail slug={slug} />
    </div>
  );
}
