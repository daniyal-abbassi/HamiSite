import { Role } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/serializers";

export const GET = withAuth(
  async () => {
    return withErrorHandling(async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const grouped = await prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { _all: true },
        _sum: { totalAmount: true },
      });

      const byStatus = grouped.map((row) => ({
        status: row.status,
        orderCount: row._count._all,
        revenue: toNumber(row._sum.totalAmount) ?? 0,
      }));

      const totalOrders = byStatus.reduce((sum, row) => sum + row.orderCount, 0);
      const totalRevenue = byStatus.reduce((sum, row) => sum + row.revenue, 0);

      return ok({ periodDays: 30, totalOrders, totalRevenue, byStatus });
    });
  },
  { roles: [Role.ADMIN] },
);
