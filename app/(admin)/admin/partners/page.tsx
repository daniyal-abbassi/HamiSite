import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PartnersAdminClient } from "@/components/admin/partners/PartnersAdminClient";

export const metadata = {
  title: "درخواست‌های همکاری عمده | پنل مدیریت",
};

export default function AdminPartnersPage() {
  return (
    <>
      <AdminPageHeader
        index="۰۰۹"
        eyebrow="پنل مدیریت"
        title="بررسی و احراز هویت همکاران عمده."
      />
      <PartnersAdminClient />
    </>
  );
}

