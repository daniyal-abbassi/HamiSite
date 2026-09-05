import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UsersAdminClient } from "@/components/admin/users/UsersAdminClient";

export default function AdminUsersPage() {
  return (
    <>
      <AdminPageHeader index="۰۰۴" eyebrow="پنل مدیریت" title="مدیریت کاربران." />
      <UsersAdminClient />
    </>
  );
}