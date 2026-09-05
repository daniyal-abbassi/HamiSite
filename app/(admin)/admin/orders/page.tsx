import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OrdersAdminClient } from "@/components/admin/orders/OrdersAdminClient";

export default function AdminOrdersPage() {
  return (
    <>
      <AdminPageHeader index="۰۰۲" eyebrow="پنل مدیریت" title="مدیریت سفارش‌ها." />
      <OrdersAdminClient />
    </>
  );
}