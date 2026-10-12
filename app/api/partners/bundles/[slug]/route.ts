import { Role } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { bundleInclude, serializePartnerBundle } from "@/lib/bundles";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  slug: string;
}

export const GET = withAuth<RouteParams>(
  async (_request, { params }) =>
    withErrorHandling(async () => {
      const slug = decodeURIComponent(params.slug);

      const bundle = await prisma.partnerBundle.findFirst({
        where: { slug, isActive: true },
        include: bundleInclude(),
      });

      if (!bundle) {
        throw new ApiError(404, "سبد همکار مورد نظر یافت نشد یا غیرفعال است");
      }

      return ok(serializePartnerBundle(bundle));
    }),
  { roles: [Role.WHOLESALE, Role.AGENT, Role.ADMIN] }
);

