import { Role } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { ok, withErrorHandling } from "@/lib/http";
import { getPendingApplicationsCount } from "@/lib/partner-applications";

export const GET = withAuth(
  async () =>
    withErrorHandling(async () => {
      const pendingCount = await getPendingApplicationsCount();
      return ok({ pendingCount });
    }),
  { roles: [Role.ADMIN] }
);
