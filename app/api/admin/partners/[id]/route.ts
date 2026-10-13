import { Role } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { getPartnerApplicationDetail } from "@/lib/partner-applications";

interface RouteParams {
  id: string;
}

export const GET = withAuth<RouteParams>(
  async (_request, { params }) =>
    withErrorHandling(async () => {
      const id = parseInt(params.id, 10);
      if (isNaN(id) || id <= 0) {
        throw ApiError.coded(400, "BAD_REQUEST", "شناسه درخواست نامعتبر است");
      }

      const detail = await getPartnerApplicationDetail(id);
      return ok(detail);
    }),
  { roles: [Role.ADMIN] }
);

