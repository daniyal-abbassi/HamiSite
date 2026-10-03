import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CouponsAdminClient } from "@/components/admin/coupons/CouponsAdminClient";

export default function AdminCouponsPage() {
  return (
    <>
      <AdminPageHeader index="۰۰۷" eyebrow="پنل مدیریت" title="مدیریت کوپن‌ها." />
      <CouponsAdminClient />
    </>
  );
}
