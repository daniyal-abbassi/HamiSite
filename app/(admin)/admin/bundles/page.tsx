import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BundlesAdminClient } from "@/components/admin/bundles/BundlesAdminClient";

export const metadata = {
  title: "مدیریت سبدهای همکار | پنل مدیریت",
};

export default function AdminBundlesPage() {
  return (
    <>
      <AdminPageHeader index="۰۰۸" eyebrow="پنل مدیریت" title="مدیریت سبدهای اختصاصی همکار." />
      <BundlesAdminClient />
    </>
  );
}

