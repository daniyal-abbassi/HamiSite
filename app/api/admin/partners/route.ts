import { Role } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { ok, withErrorHandling } from "@/lib/http";
import { listPartnerApplications } from "@/lib/partner-applications";
import { adminPartnerListQuerySchema } from "@/lib/schemas/admin-partners";

export const GET = withAuth(
  async (request) =>
    withErrorHandling(async () => {
      const { searchParams } = new URL(request.url);

      const parsedQuery = adminPartnerListQuerySchema.parse({
        page: searchParams.get("page") ?? undefined,
        limit: searchParams.get("limit") ?? undefined,
        status: searchParams.get("status") ?? undefined,
        entityType: searchParams.get("entityType") ?? undefined,
        search: searchParams.get("search") ?? searchParams.get("q") ?? undefined,
      });

      const result = await listPartnerApplications(parsedQuery);
      return ok(result);
    }),
  { roles: [Role.ADMIN] }
);
