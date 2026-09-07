import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OrderAdminDetailClient } from "@/components/admin/orders/OrderAdminDetailClient";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <AdminPageHeader index="۰۰۲" eyebrow="پنل مدیریت" title="جزئیات سفارش." />
      <OrderAdminDetailClient orderId={id} />
    </>
  );
}