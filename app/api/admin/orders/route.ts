import { OrderStatus, Role } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { ok, parsePagination, withErrorHandling } from "@/lib/http";
import { orderListInclude, serializeOrderSummary } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(
  async (request) => {
    return withErrorHandling(async () => {
      const { searchParams } = new URL(request.url);
      const pagination = parsePagination(searchParams);
      const userIdParam = searchParams.get("userId");
      const status = searchParams.get("status");
      const userId = userIdParam ? Number(userIdParam) : undefined;

      const where = {
        ...(userId ? { userId } : {}),
        ...(status ? { status: status as OrderStatus } : {}),
      };

      const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.take,
          include: orderListInclude(),
        }),
      ]);

      return ok(orders.map(serializeOrderSummary), {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        hasNextPage: pagination.page * pagination.pageSize < total,
      });
    });
  },
  { roles: [Role.ADMIN] },
);
