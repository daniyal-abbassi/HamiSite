import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductForm } from "@/components/admin/products/ProductForm";

export const metadata: Metadata = { title: "ویرایش محصول" };

export default function AdminProductEditPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { slug?: string };
}) {
  const productId = Number(params.id);
  // The detail API is keyed by slug; the list page passes the slug through the
  // URL so the form can prefill. Without it the form starts empty (PATCH-safe).
  return (
    <>
      <AdminPageHeader index="۰۰۳" eyebrow="پنل مدیریت" title="ویرایش محصول." />
      {Number.isInteger(productId) ? (
        <ProductForm mode="edit" productId={productId} slug={searchParams.slug} />
      ) : (
        <p className="text-sm text-destructive">شناسه محصول نامعتبر است.</p>
      )}
    </>
  );
}