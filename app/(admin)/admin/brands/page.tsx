import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BrandsAdminClient } from "@/components/admin/brands/BrandsAdminClient";

export default function AdminBrandsPage() {
  return (
    <>
      <AdminPageHeader index="۰۰۶" eyebrow="پنل مدیریت" title="مدیریت برندها." />
      <BrandsAdminClient />
    </>
  );
}