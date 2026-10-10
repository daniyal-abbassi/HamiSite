import { Role } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { fetchDigikalaProduct } from "@/lib/digikala";

export const GET = withAuth(
  async (request) =>
    withErrorHandling(async () => {
      const url = new URL(request.url);
      const idOrInput = url.searchParams.get("id")?.trim() ?? "";

      if (!idOrInput) {
        throw new ApiError(400, "شناسه یا لینک محصول دیجی‌کالا (id) الزامی است");
      }

      try {
        const product = await fetchDigikalaProduct(idOrInput);
        return ok(product);
      } catch (err: any) {
        throw new ApiError(404, err?.message || "محصول در دیجی‌کالا یافت نشد");
      }
    }),
  { roles: [Role.ADMIN] }
);

