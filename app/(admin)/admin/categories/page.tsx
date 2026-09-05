import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CategoriesAdminClient } from "@/components/admin/categories/CategoriesAdminClient";

export default function AdminCategoriesPage() {
  return (
    <>
      <AdminPageHeader index="۰۰۵" eyebrow="پنل مدیریت" title="مدیریت دسته‌بندی‌ها." />
      <CategoriesAdminClient />
    </>
  );
}