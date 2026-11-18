import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CardToCardSwitch } from "@/components/admin/dashboard/CardToCardSwitch";
import { DashboardClient } from "@/components/admin/dashboard/DashboardClient";

export default function AdminDashboardPage() {
  return (
    <>
      <AdminPageHeader index="۰۰۱" eyebrow="پنل مدیریت" title="داشبورد عملیات." />
      <CardToCardSwitch />
      <DashboardClient />
    </>
  );
}