import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductsAdminClient } from "@/components/admin/products/ProductsAdminClient";

export default function AdminProductsPage() {
  return (
    <>
      <AdminPageHeader index="۰۰۳" eyebrow="پنل مدیریت" title="مدیریت محصولات." />
      <ProductsAdminClient />
    </>
  );
}