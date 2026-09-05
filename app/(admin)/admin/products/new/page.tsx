import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductForm } from "@/components/admin/products/ProductForm";

export default function AdminProductNewPage() {
  return (
    <>
      <AdminPageHeader index="۰۰۳" eyebrow="پنل مدیریت" title="ایجاد محصول جدید." />
      <ProductForm mode="new" />
    </>
  );
}