import { HistoryAction, Role, StockType } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { recordProductHistory } from "@/lib/productHistory";
import { serializeAdminProduct } from "@/lib/serializers";

const updateProductSchema = z
  .object({
    name: z.string().min(1),
    englishName: z.string(),
    slug: z.string().min(1),
    description: z.string(),
    analysis: z.string(),
    mainCategoryId: z.number().int().positive(),
    brandId: z.number().int().positive(),
    isDigital: z.boolean(),
    price: z.number().min(0),
    compareAtPrice: z.number().min(0),
    specialOffer: z.boolean(),
    specialOfferEnd: z.string().datetime(),
    costPerItem: z.number().min(0),
    batchSize: z.number().int().positive(),
    available: z.boolean(),
    showPrice: z.boolean(),
    hasVariants: z.boolean(),
    stock: z.number().int().min(0),
    stockType: z.nativeEnum(StockType),
    minOrderQuantity: z.number().int().positive(),
    maxOrderQuantity: z.number().int().positive(),
    guarantee: z.string(),
    seoTitle: z.string(),
    seoDescription: z.string(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid product id");
  }
  return id;
}

export const PATCH = withAuth<{ id: string }>(
  async (request, { user, params }) => {
    return withErrorHandling(async () => {
      const id = parseId(params.id);
      const body = await request.json();
      const parsed = updateProductSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, "Invalid request body", parsed.error.flatten());
      }

      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        throw new ApiError(404, "Product not found");
      }

      const input = parsed.data;
      if (input.slug && input.slug !== existing.slug) {
        const slugTaken = await prisma.product.findUnique({ where: { slug: input.slug }, select: { id: true } });
        if (slugTaken) {
          throw new ApiError(409, `A product with slug "${input.slug}" already exists`);
        }
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          ...input,
          specialOfferEnd: input.specialOfferEnd ? new Date(input.specialOfferEnd) : undefined,
        },
      });

      await recordProductHistory({
        productId: id,
        action: HistoryAction.UPDATED,
        field: "product",
        oldValue: serializeAdminProduct(existing),
        newValue: serializeAdminProduct(product),
        changedById: user.id,
      });

      return ok(serializeAdminProduct(product), { message: "Product updated" });
    });
  },
  { roles: [Role.ADMIN] },
);

export const DELETE = withAuth<{ id: string }>(
  async (_request, { user, params }) => {
    return withErrorHandling(async () => {
      const id = parseId(params.id);
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        throw new ApiError(404, "Product not found");
      }

      await recordProductHistory({
        productId: id,
        action: HistoryAction.DELETED,
        field: "product",
        oldValue: serializeAdminProduct(existing),
        changedById: user.id,
      });

      await prisma.product.delete({ where: { id } });

      return ok({ id }, { message: "Product deleted" });
    });
  },
  { roles: [Role.ADMIN] },
);
