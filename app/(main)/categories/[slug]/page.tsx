import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogListing } from "@/components/shop/CatalogListing";
import { categorySubtreeCounts, descendantCategoryIds, listCategories, queryProducts } from "@/lib/catalog";
import { resolveSortKey } from "@/lib/content/shop";
import { normalizeSlug } from "@/lib/shop-filters";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function findCategory(slug: string) {
  const decoded = decodeURIComponent(slug);
  const wanted = normalizeSlug(decoded);
  const categories = listCategories();
  return (
    categories.find((c) => c.slug === decoded) ??
    categories.find((c) => normalizeSlug(c.slug) === wanted) ??
    categories.find((c) => normalizeSlug(c.name) === wanted) ??
    null
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const category = findCategory(slug);
  if (!category) return { title: "دسته یافت نشد | حامی همراه" };
  return {
    title: category.name,
    description: `${category.name} — فهرست این دسته از فروشگاه حامی همراه، مشهد.`,
  };
}

/**
 * A category's own page (FR-029).
 *
 * It lists the category **and everything filed below it**, which is the reason this
 * route exists instead of another link to the filter: the export files phones under
 * brand-shaped children of «موبایل و تبلت» rather than under the parent, so an exact
 * category match — correct for a filter — would hand a shopper an empty page for any
 * parent. Two semantics, deliberately kept apart; see `categorySubtreeId` in
 * `lib/catalog.ts`.
 */
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const category = findCategory(slug);
  if (!category) notFound();

  const view = {
    sort: resolveSortKey((await searchParams).sort as string | undefined),
    obtainable: (await searchParams).obtainable === "1",
  };
  const total = categorySubtreeCounts().get(category.id) ?? 0;
  // An empty category is not a destination; it is a dead door (FR-028, SC-014).
  // The number that decides this is the one the doorway promised, not the one a
  // control left behind — «nothing buyable in stock today» is an answer, not a 404.
  if (total === 0) notFound();

  const { data, total: shownTotal } = queryProducts({
    categorySubtreeId: category.id,
    purchasableOnly: view.obtainable,
    sort: view.sort || undefined,
    includeVariants: false,
    page: 1,
    pageSize: 60,
  });

  const subCount = descendantCategoryIds(category.id).size - 1;

  return (
    <CatalogListing
      eyebrow="CATEGORY"
      title={category.name}
      description={
        subCount > 0
          ? `${total} محصول در این دسته و ${subCount} زیردستهٔ آن.`
          : `${total} محصول در دستهٔ ${category.name}.`
      }
      total={total}
      shownTotal={shownTotal}
      products={data}
      breadcrumb={[{ label: "فروشگاه", href: "/shop" }]}
      basePath={`/categories/${encodeURIComponent(category.slug)}`}
      view={view}
    />
  );
}
