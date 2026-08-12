import { Role } from "@prisma/client";
import { z } from "zod";
import { sanitizeUser, withAuth } from "@/lib/auth";
import { ApiError, ok, parsePagination, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(
  async (request) => {
    return withErrorHandling(async () => {
      const { searchParams } = new URL(request.url);
      const pagination = parsePagination(searchParams);
      const roleParam = searchParams.get("role");

      let role: Role | undefined;
      if (roleParam !== null) {
        const parsedRole = z.nativeEnum(Role).safeParse(roleParam);
        if (!parsedRole.success) {
          throw new ApiError(400, "Invalid role");
        }
        role = parsedRole.data;
      }

      const where = role ? { role } : {};

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
