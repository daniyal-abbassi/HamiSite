import { Role } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { executeApplicationDecision } from "@/lib/partner-applications";
import { adminDecisionSchema } from "@/lib/schemas/admin-partners";

interface RouteParams {
  id: string;
}

export const POST = withAuth<RouteParams>(
  async (request, { params, user }) =>
    withErrorHandling(async () => {
      const id = parseInt(params.id, 10);
      if (isNaN(id) || id <= 0) {
        throw ApiError.coded(400, "BAD_REQUEST", "شناسه درخواست نامعتبر است");
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        throw ApiError.coded(400, "BAD_REQUEST", "فرمت داده‌های ارسالی نامعتبر است");
      }

      const parsed = adminDecisionSchema.safeParse(body);
      if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => i.message).join("، ");
        throw ApiError.coded(400, "VALIDATION_FAILED", issues || "اطلاعات ارسالی نامعتبر است");
      }

      const result = await executeApplicationDecision(id, parsed.data, user.id);

      const message =
        parsed.data.action === "APPROVE"
          ? "درخواست با موفقیت تأیید و دسترسی عمده‌فروشی همکار فعال شد."
          : "درخواست همکاری با موفقیت رد شد.";

      return ok(result, { message });
    }),
  { roles: [Role.ADMIN] }
);

