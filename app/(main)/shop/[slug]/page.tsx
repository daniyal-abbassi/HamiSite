import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { RelatedProducts } from "@/components/shop/RelatedProducts";
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
   * Read through the seam on the server, for two separate reasons. A missing
   * product must be an actual 404 rather than a client component printing «محصول
   * پیدا نشد» over a framework-default 200 (US3 scenario 9), and browsing must not
   * require an API round-trip (Constitution III) — this route used to prerender an
   * empty shell and fetch `/api/products/[slug]` after hydration.
   */
  const product = findProductBySlug(slug);
  if (!product) notFound();
  return (
    <div className="container py-10">
      <ProductDetail product={product} />
      <RelatedProducts productId={product.id} />
    </div>
  );
}
