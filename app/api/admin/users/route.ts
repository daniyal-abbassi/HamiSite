import { Role } from "@prisma/client";
import { sanitizeUser, withAuth } from "@/lib/auth";
import { ok, parsePagination, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(
  async (request) => {
    return withErrorHandling(async () => {
      const { searchParams } = new URL(request.url);
      const pagination = parsePagination(searchParams);
      const role = searchParams.get("role");

      const where = role ? { role: role as Role } : {};

      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.take,
        }),
      ]);

      return ok(users.map(sanitizeUser), {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        hasNextPage: pagination.page * pagination.pageSize < total,
      });
    });
  },
  { roles: [Role.ADMIN] },
);
