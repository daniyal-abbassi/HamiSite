import { Role } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { rankProductSuggestions } from "@/lib/admin-product-suggestions";

export const GET = withAuth(async (request) => withErrorHandling(async () => {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (!query) return ok([]);

  const products = await prisma.product.findMany({
    select: { id: true, name: true, englishName: true, slug: true },
  });
  return ok(rankProductSuggestions(products, query));
}), { roles: [Role.ADMIN] });
