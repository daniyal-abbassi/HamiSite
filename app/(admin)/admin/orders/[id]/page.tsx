import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OrderAdminDetailClient } from "@/components/admin/orders/OrderAdminDetailClient";

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  return (
    <>
      <AdminPageHeader index="۰۰۲" eyebrow="پنل مدیریت" title="جزئیات سفارش." />
      <OrderAdminDetailClient orderId={params.id} />
    </>
  );
}