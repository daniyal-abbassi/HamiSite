import { Role } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { bundleInclude, serializePartnerBundle } from "@/lib/bundles";
import { ok, parsePagination, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(
  async (request) =>
    withErrorHandling(async () => {
      const { searchParams } = new URL(request.url);
      const pagination = parsePagination(searchParams);

      const where = {
        isActive: true,
      };

      const [total, bundles] = await Promise.all([
        prisma.partnerBundle.count({ where }),
        prisma.partnerBundle.findMany({
          where,
          include: bundleInclude(),
          orderBy: { createdAt: "desc" },
          skip: (pagination.page - 1) * pagination.pageSize,
          take: pagination.pageSize,
        }),
      ]);

      const data = bundles.map(serializePartnerBundle);

      return ok(data, {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        hasNextPage: pagination.page * pagination.pageSize < total,
      });
    }),
  { roles: [Role.WHOLESALE, Role.AGENT, Role.ADMIN] }
);

