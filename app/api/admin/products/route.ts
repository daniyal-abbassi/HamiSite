import { Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, parsePagination, withErrorHandling } from "@/lib/http";
import { updateCatalog } from "@/lib/catalog-store";
import { queryProducts } from "@/lib/catalog";

const productInput = z.object({
  name: z.string().trim().min(1), englishName: z.string().optional(), slug: z.string().trim().min(1),
  description: z.string().optional(), analysis: z.string().optional(), mainCategoryId: z.number().int().positive().optional(),
  brandId: z.number().int().positive().optional(), isDigital: z.boolean().optional(), price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(), specialOffer: z.boolean().optional(), specialOfferEnd: z.string().optional(),
  batchSize: z.number().int().positive().optional(), available: z.boolean().optional(), showPrice: z.boolean().optional(),
  hasVariants: z.boolean().optional(), stock: z.number().int().min(0).optional(), stockType: z.string().optional(),
  minOrderQuantity: z.number().int().positive().optional(), maxOrderQuantity: z.number().int().positive().optional(),
  guarantee: z.string().optional(), seoTitle: z.string().optional(), seoDescription: z.string().optional(),
});

export const GET = withAuth(async (request) => withErrorHandling(async () => {
  const { searchParams } = new URL(request.url);
  const pagination = parsePagination(searchParams);
  const q = searchParams.get("q") ?? undefined;
  const result = queryProducts({ q, page: pagination.page, pageSize: pagination.pageSize, includeVariants: true });
  return ok(result.data, { page: pagination.page, pageSize: pagination.pageSize, total: result.total, hasNextPage: pagination.page * pagination.pageSize < result.total });
}), { roles: [Role.ADMIN] });

export const POST = withAuth(async (request) => withErrorHandling(async () => {
  const parsed = productInput.safeParse(await request.json());
  if (!parsed.success) throw new ApiError(400, "Invalid request body", parsed.error.flatten());
  const input = parsed.data;
  const product = await updateCatalog((catalog) => {
    if (catalog.products.some((item) => item.slug === input.slug)) throw new ApiError(409, `A product with slug "${input.slug}" already exists`);
    const category = catalog.categories.find((item) => item.id === input.mainCategoryId);
    const brand = catalog.brands.find((item) => item.id === input.brandId);
    if (input.mainCategoryId && !category) throw new ApiError(400, "Invalid category id");
    if (input.brandId && !brand) throw new ApiError(400, "Invalid brand id");
    const id = Math.max(0, ...catalog.products.map((item) => item.id)) + 1;
    const stockType = (input.stockType ?? "CALL").toLowerCase();
    const created = {
      id, name: input.name, english_name: input.englishName ?? null, slug: input.slug, description_html: input.description ?? null,
      description_text: input.description ?? null, analysis: input.analysis ?? null, kind: null, is_digital: input.isDigital ?? false,
      show_price: input.showPrice,
      guarantee: input.guarantee ?? null, seo: { title: input.seoTitle ?? null, description: input.seoDescription ?? null },
      shipping: { batch_size: input.batchSize ?? 1 }, brand: brand ? { id: brand.id, name: brand.name } : null,
      category: category ? { id: category.id, name: category.name } : null, other_categories: [], tags: [], price: input.price,
      compare_at_price: input.compareAtPrice ?? null, special_offer: input.specialOffer ?? false, special_offer_end: input.specialOfferEnd ?? null,
      stock: { state: stockType, available: input.available ?? true, purchasable: input.available ?? true, quantity: input.stock ?? 0,
        min_order_quantity: input.minOrderQuantity ?? null, max_order_quantity: input.maxOrderQuantity ?? null },
      primary_image: null, images: [], has_variants: false, variants: [], specs: [], updated_at: new Date().toISOString(),
    };
    catalog.products.push(created);
    return { id, slug: created.slug };
  });
  return ok(product, { message: "Product created" });
}), { roles: [Role.ADMIN] });
