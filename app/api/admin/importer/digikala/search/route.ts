import { Role } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { searchDigikala } from "@/lib/digikala";

export const GET = withAuth(
  async (request) =>
    withErrorHandling(async () => {
      const url = new URL(request.url);
      const query = url.searchParams.get("q")?.trim() ?? "";
      const page = parseInt(url.searchParams.get("page") ?? "1", 10) || 1;

      if (!query) {
        throw new ApiError(400, "پارامتر جست‌وجو (q) الزامی است");
      }

      const results = await searchDigikala(query, page);
      return ok(results);
    }),
  { roles: [Role.ADMIN] }
);

