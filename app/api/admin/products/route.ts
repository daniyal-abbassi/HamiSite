import { HistoryAction, Role, StockType } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, parsePagination, withErrorHandling } from "@/lib/http";
import { queryProducts } from "@/lib/catalog-db";
import { prisma } from "@/lib/prisma";
import { revalidateHomepage } from "@/lib/revalidate-homepage";

const productInput = z.object({
  name: z.string().trim().min(1), englishName: z.string().optional(), slug: z.string().trim().min(1),
  description: z.string().optional(), analysis: z.string().optional(), mainCategoryId: z.number().int().positive().optional(),
  brandId: z.number().int().positive().optional(), isDigital: z.boolean().optional(), price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(), specialOffer: z.boolean().optional(), specialOfferEnd: z.string().optional(),
  costPerItem: z.number().min(0).optional(),
  batchSize: z.number().int().positive().optional(), available: z.boolean().optional(), showPrice: z.boolean().optional(),
  hasVariants: z.boolean().optional(), stock: z.number().int().min(0).optional(),
  stockType: z.enum(["UNLIMITED", "LIMITED", "OUT_OF_STOCK", "CALL", "unlimited", "limited", "out_of_stock", "call"]).optional(),
  minOrderQuantity: z.number().int().positive().optional(), maxOrderQuantity: z.number().int().positive().optional(),
  guarantee: z.string().optional(), seoTitle: z.string().optional(), seoDescription: z.string().optional(),
  specs: z.array(z.object({ name: z.string().trim().min(1), value: z.string().trim().min(1) })).optional(),
  images: z.array(z.object({
    url: z.string().url(),
    altText: z.string().optional(),
    isDefault: z.boolean().optional(),
    order: z.number().int().optional(),
  })).optional(),
});

export const GET = withAuth(async (request) => withErrorHandling(async () => {
  const { searchParams } = new URL(request.url);
  const pagination = parsePagination(searchParams);
  const q = searchParams.get("q") ?? undefined;
  const result = await queryProducts({ q, page: pagination.page, pageSize: pagination.pageSize, includeVariants: false });
  return ok(result.data, { page: pagination.page, pageSize: pagination.pageSize, total: result.total, hasNextPage: pagination.page * pagination.pageSize < result.total });
}), { roles: [Role.ADMIN] });

export const POST = withAuth(async (request, { user }) => withErrorHandling(async () => {
  const parsed = productInput.safeParse(await request.json());
  if (!parsed.success) throw new ApiError(400, "Invalid request body", parsed.error.flatten());
  const input = parsed.data;
  if (input.mainCategoryId && !await prisma.category.findUnique({ where: { id: input.mainCategoryId }, select: { id: true } })) throw new ApiError(400, "Invalid category id");
  if (input.brandId && !await prisma.brand.findUnique({ where: { id: input.brandId }, select: { id: true } })) throw new ApiError(400, "Invalid brand id");
  const state = (input.stockType ?? "CALL").toUpperCase() as StockType;
  try {
    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({ data: {
        name: input.name, englishName: input.englishName, slug: input.slug, description: input.description,
        descriptionText: input.description, analysis: input.analysis, mainCategoryId: input.mainCategoryId,
        brandId: input.brandId, isDigital: input.isDigital, price: input.price, compareAtPrice: input.compareAtPrice,
        specialOffer: input.specialOffer, specialOfferEnd: input.specialOfferEnd ? new Date(input.specialOfferEnd) : undefined,
        costPerItem: input.costPerItem,
        batchSize: input.batchSize, available: input.available ?? false, showPrice: input.showPrice ?? true,
        stock: input.stock, stockType: state, minOrderQuantity: input.minOrderQuantity,
        maxOrderQuantity: input.maxOrderQuantity, guarantee: input.guarantee, seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        specs: input.specs ? input.specs : undefined,
        images: input.images && input.images.length > 0 ? {
          create: input.images.map((img, idx) => ({
            url: img.url,
            altText: img.altText ?? input.name,
            isDefault: img.isDefault ?? idx === 0,
            order: img.order ?? idx,
          })),
        } : undefined,
      }, select: { id: true, slug: true, price: true } });
      await tx.productHistory.create({ data: {
        productId: product.id, action: HistoryAction.CREATED, field: "product",
        newValue: { name: input.name, slug: product.slug, price: input.price }, changedById: user.id,
      } });
      return product;
    });
    revalidateHomepage();
    return ok({ ...created, price: created.price.toNumber() }, { message: "Product created" });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") throw new ApiError(409, `A product with slug "${input.slug}" already exists`);
    throw error;
  }
}), { roles: [Role.ADMIN] });
