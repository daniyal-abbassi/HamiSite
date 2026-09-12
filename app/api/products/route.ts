import { z } from "zod";
import { queryProducts } from "@/lib/catalog";
import { ApiError, ok, parsePagination, withErrorHandling } from "@/lib/http";

/**
 * Product listing, served from the JSON catalogue export rather than Prisma.
 *
 * The query contract and the response shape are unchanged from the database
 * version — see lib/catalog.ts for why, and `route.prisma.bak` beside this file
 * for the implementation it replaced. Swapping back is a file rename.
 */
const querySchema = z.object({
  q: z.string().optional(),
  brandId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  stockType: z.enum(["unlimited", "limited", "out_of_stock", "call"]).optional(),
  specialOffer: z.enum(["true", "false"]).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "special"]).optional(),
  paymentTerm: z.string().optional(),
  quantity: z.coerce.number().int().positive().optional(),
  role: z.enum(["RETAIL", "WHOLESALE", "AGENT", "ADMIN"]).optional(),
  includeVariants: z.enum(["true", "false"]).optional(),
});

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);

    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      throw new ApiError(400, "Invalid query parameters", parsed.error.flatten());
    }
    const input = parsed.data;

    const { data, total } = queryProducts({
      q: input.q,
      brandId: input.brandId,
      categoryId: input.categoryId,
      stockType: input.stockType,
      specialOffer: input.specialOffer ? input.specialOffer === "true" : undefined,
      minPrice: input.minPrice,
      maxPrice: input.maxPrice,
      sort: input.sort,
      includeVariants: input.includeVariants !== "false",
      page: pagination.page,
      pageSize: pagination.pageSize,
    });

    return ok(data, {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      hasNextPage: pagination.page * pagination.pageSize < total,
    });
  });
}
