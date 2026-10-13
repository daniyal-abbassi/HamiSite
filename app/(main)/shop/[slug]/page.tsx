import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { RelatedProducts } from "@/components/shop/RelatedProducts";
import { catalogGeneratedAt, findProductBySlug } from "@/lib/catalog-db";
import { pageMetadata } from "@/lib/seo-metadata";
import { buildProductJsonLd, buildBreadcrumbJsonLd } from "@/lib/persian-seo";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProductBySlug(slug);
  if (!product) {
    return { title: "محصول یافت نشد | حامی همراه", robots: { index: false, follow: false } };
  }
  const description =
    product.description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 155) ||
    `مشخصات و وضعیت عرضه ${product.name} در فروشگاه حامی همراه مشهد؛ برای استعلام قیمت روز و راهنمای خرید با فروشگاه تماس بگیرید.`;
  return pageMetadata({
    title: product.name,
    description,
    path: `/shop/${encodeURIComponent(product.slug)}`,
  });
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
  const product = await findProductBySlug(slug);
  if (!product) notFound();
  const generatedAt = await catalogGeneratedAt();

  const productSchema = buildProductJsonLd({
    name: product.name,
    description:
      product.descriptionText ||
      product.description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ||
      product.name,
    slug: product.slug,
    images: product.images?.map((img) => img.url).filter(Boolean),
    price: product.price,
    currency: "IRT",
    inStock: Boolean(product.available),
    brandName: product.brand?.name,
    sku: String(product.id),
    categoryName: product.mainCategory?.name,
  });

  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: "خانه", path: "/" },
    { name: "فروشگاه", path: "/shop" },
    ...(product.mainCategory
      ? [{ name: product.mainCategory.name, path: `/categories/${encodeURIComponent(product.mainCategory.slug)}` }]
      : []),
    { name: product.name, path: `/shop/${encodeURIComponent(product.slug)}` },
  ]);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [productSchema, breadcrumbSchema],
  };

  return (
    <div className="container py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <ProductDetail product={product} generatedAt={generatedAt} />
      <RelatedProducts productId={product.id} />
    </div>
  );
}

