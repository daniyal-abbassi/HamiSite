import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { findProductSlugById } from "@/lib/catalog";

export const metadata: Metadata = { title: "ویرایش محصول" };

export default async function AdminProductEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ slug?: string }>;
}) {
  const [{ id }, { slug: requestedSlug }] = await Promise.all([params, searchParams]);
  const productId = Number(id);
  const slug = requestedSlug ?? (Number.isInteger(productId) ? findProductSlugById(productId) ?? undefined : undefined);
  return (
    <>
      <AdminPageHeader index="۰۰۳" eyebrow="پنل مدیریت" title="ویرایش محصول." />
      {Number.isInteger(productId) ? (
        <ProductForm mode="edit" productId={productId} slug={slug} />
      ) : (
        <p className="text-sm text-destructive">شناسه محصول نامعتبر است.</p>
      )}
    </>
  );
}
