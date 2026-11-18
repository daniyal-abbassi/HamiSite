import { OrderStatus, PaymentStatus, Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, parsePagination, withErrorHandling } from "@/lib/http";
import { orderListInclude, serializeOrderSummary } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(
  async (request) => {
    return withErrorHandling(async () => {
      const { searchParams } = new URL(request.url);
      const pagination = parsePagination(searchParams);
      const userIdParam = searchParams.get("userId");
      const statusParam = searchParams.get("status");
      const paymentStatusParam = searchParams.get("paymentStatus");

      let userId: number | undefined;
      if (userIdParam !== null) {
        userId = Number(userIdParam);
        if (!Number.isInteger(userId) || userId <= 0) {
          throw new ApiError(400, "Invalid userId");
        }
      }

      let status: OrderStatus | undefined;
      if (statusParam !== null) {
        const parsedStatus = z.nativeEnum(OrderStatus).safeParse(statusParam);
        if (!parsedStatus.success) {
          throw new ApiError(400, "Invalid status");
        }
        status = parsedStatus.data;
      }

      let paymentStatus: PaymentStatus | undefined;
      if (paymentStatusParam !== null) {
        const parsedPaymentStatus = z.nativeEnum(PaymentStatus).safeParse(paymentStatusParam);
        if (!parsedPaymentStatus.success) {
          throw new ApiError(400, "Invalid paymentStatus");
        }
        paymentStatus = parsedPaymentStatus.data;
      }

      const where = {
        ...(userId ? { userId } : {}),
        ...(status ? { status } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
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
