import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateTmaRequest } from "@/lib/tma-api-auth";
import { calculateDashboardMetrics } from "@/lib/tma-service";

export async function GET(req: NextRequest) {
  const auth = authenticateTmaRequest(req);
  if (!auth.ok) return auth.response;

  try {
    // 1. Fetch recent orders (last 30 days) for metrics calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        orderNumber: true,
        firstName: true,
        lastName: true,
        phone: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Count low stock products & variants (stock <= 2 or available false)
    const [lowStockProductsCount, lowStockVariantsCount] = await Promise.all([
      prisma.product.count({
        where: {
          OR: [{ available: false }, { stock: { lte: 2 } }],
        },
      }),
      prisma.productVariant.count({
        where: {
          stock: { lte: 2 },
        },
      }),
    ]);

    const totalStockAlerts = lowStockProductsCount + lowStockVariantsCount;

    // 3. Compute metrics using tested pure logic
    const metrics = calculateDashboardMetrics(orders, totalStockAlerts);

    // 4. Return top 5 recent orders for quick dashboard triage
    const recentOrders = orders.slice(0, 5).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: `${o.firstName} ${o.lastName}`.trim(),
      phone: o.phone,
      totalAmount: Number(o.totalAmount),
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt.toISOString(),
    }));

    return NextResponse.json({
      ok: true,
      metrics,
      recentOrders,
    });
  } catch (error) {
    console.error("TMA Dashboard API Error:", error);
    return NextResponse.json(
      { ok: false, error: "DASHBOARD_ERROR", message: "خطا در بارگذاری آمار داشبورد." },
      { status: 500 }
    );
  }
}

