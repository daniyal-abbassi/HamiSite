import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EmptyState } from "@/components/admin/EmptyState";

export default function AdminCouponsPage() {
  return (
    <>
      <AdminPageHeader index="۰۰۷" eyebrow="پنل مدیریت" title="مدیریت کوپن‌ها." />
      <EmptyState title="مدیریت کوپن‌ها آماده‌سازی نشده است." description="این بخش به‌زودی در پنل مدیریت فعال می‌شود." />
    </>
  );
}