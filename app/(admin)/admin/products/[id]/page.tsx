import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductForm } from "@/components/admin/products/ProductForm";

export const metadata: Metadata = { title: "ویرایش محصول" };

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  return (
    <>
      <AdminPageHeader index="۰۰۳" eyebrow="پنل مدیریت" title="ویرایش محصول." />
      {Number.isInteger(productId) && productId > 0 ? (
        <ProductForm mode="edit" productId={productId} />
      ) : (
        <p className="text-sm text-destructive">شناسه محصول نامعتبر است.</p>
      )}
    </>
  );
}
