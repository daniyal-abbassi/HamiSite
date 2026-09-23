import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogListing } from "@/components/shop/CatalogListing";
import { brandLabel } from "@/lib/product-identity";
import { listBrands, queryProducts } from "@/lib/catalog";
import { resolveSortKey } from "@/lib/content/shop";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function findBrand(slug: string) {
  const wanted = decodeURIComponent(slug).toLowerCase().trim();
  const brands = listBrands();
  return (
    brands.find((b) => b.slug === wanted) ??
    brands.find((b) => b.slug.toLowerCase() === wanted) ??
    brands.find((b) => b.name.toLowerCase().trim() === wanted) ??
    null
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const brand = findBrand(slug);
  if (!brand) return { title: "برند یافت نشد | حامی همراه" };
  const name = brandLabel(brand.name);
  return {
    title: `محصولات ${name}`,
    description: `${name} — فهرست محصولات این برند در فروشگاه حامی همراه، مشهد.`,
  };
}

/**
 * A brand's own page (FR-029). Read on the server through the seam. A slug that
 * matches no brand is a 404 rather than the entire catalogue behind a confident
 * label — the failure `lib/shop-filters.ts` exists to stop, at a new door.
 */
export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const brand = findBrand(slug);
  if (!brand) notFound();

  const view = {
    sort: resolveSortKey((await searchParams).sort as string | undefined),
    obtainable: (await searchParams).obtainable === "1",
  };
  const total = brand.productCount;
  const { data, total: shownTotal } = queryProducts({
    brandId: brand.id,
    purchasableOnly: view.obtainable,
    sort: view.sort || undefined,
    includeVariants: false,
    page: 1,
    pageSize: 60,
  });

  return (
    <CatalogListing
      eyebrow="BRAND"
      title={`محصولات ${brandLabel(brand.name)}`}
      description={`${brandLabel(brand.name)} — ${total} محصول از فروشگاه حضوری حامی همراه در مشهد.`}
      total={total}
      shownTotal={shownTotal}
      products={data}
      breadcrumb={[{ label: "فروشگاه", href: "/shop" }]}
      basePath={`/brands/${encodeURIComponent(brand.slug)}`}
      view={view}
    />
  );
}
