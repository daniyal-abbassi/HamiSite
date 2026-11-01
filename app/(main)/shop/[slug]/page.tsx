import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { RelatedProducts } from "@/components/shop/RelatedProducts";
import { catalogGeneratedAt, findProductBySlug } from "@/lib/catalog-db";
import { pageMetadata } from "@/lib/seo-metadata";
import { buildProductJsonLd, buildBreadcrumbJsonLd } from "@/lib/persian-seo";
import { isPurchasable } from "@/lib/product-identity";
import { escapeJsonLd } from "@/lib/security/xss";
import "@/components/shop/product-detail.css";

type Params = Promise<{ slug: string }>;

// Metadata and the page resolve the same product during one render request.
// Prisma batches the two identical reads into one SQL IN query, but still
// materializes and serializes the record twice without request-scoped caching.
const productForRequest = cache((slug: string) => findProductBySlug(slug));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await productForRequest(slug);
  if (!product) notFound();
  // Use the pre-stripped plain-text description, not the raw HTML one — the
  // HTML field's entities (e.g. &zwnj;) were already escaped once on import,
  // so a second escape+strip pass here left the literal string "&zwnj;"
  // visible in SERP snippets and social-share previews.
  const description =
    product.descriptionText?.replace(/\s+/g, " ").trim().slice(0, 155) ||
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
  const product = await productForRequest(slug);
  if (!product) notFound();
  const generatedAt = await catalogGeneratedAt();
  const purchasable = isPurchasable(product);

  const productSchema = buildProductJsonLd({
    name: product.name,
    description:
      product.descriptionText ||
      product.description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ||
      product.name,
    slug: product.slug,
    images: product.images?.map((img) => img.url).filter(Boolean),
    // Deliberately still gated on `purchasable`, not just "has a price > 0":
    // ~56 catalog rows carry a known-placeholder price (see the import's own
    // data_quality_warnings) and are not purchasable today. Widening this to
    // show a price for any non-purchasable row would surface those fake
    // prices to Google. Fix the underlying data first, then relax this gate.
    price: purchasable && product.price > 0 ? product.price : undefined,
    inStock: purchasable ? true : undefined,
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

  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <div className="pdp">
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(structuredData) }}
      />
      <ProductDetail product={product} generatedAt={generatedAt} />
      <div className="pdp-wrap pdp-related">
        <RelatedProducts productId={product.id} />
      </div>
    </div>
  );
}
