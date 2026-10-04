import { HistoryAction, Prisma, Role, StockType } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { findProductBySlug, findProductSlugById } from "@/lib/catalog-db";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().trim().min(1), englishName: z.string().nullable(), slug: z.string().trim().min(1), description: z.string().nullable(), analysis: z.string().nullable(),
  mainCategoryId: z.number().int().positive().nullable(), brandId: z.number().int().positive().nullable(), isDigital: z.boolean(), price: z.number().min(0),
  compareAtPrice: z.number().min(0).nullable(), costPerItem: z.number().min(0).nullable(), specialOffer: z.boolean(), specialOfferEnd: z.string().nullable(), batchSize: z.number().int().positive(),
  available: z.boolean(), showPrice: z.boolean(), hasVariants: z.boolean(), stock: z.number().int().min(0),
  stockType: z.enum(["UNLIMITED", "LIMITED", "OUT_OF_STOCK", "CALL", "unlimited", "limited", "out_of_stock", "call"]),
  minOrderQuantity: z.number().int().positive().nullable(), maxOrderQuantity: z.number().int().positive().nullable(), guarantee: z.string().nullable(),
  seoTitle: z.string().nullable(), seoDescription: z.string().nullable(),
}).partial().refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Invalid product id");
  return id;
}

export const GET = withAuth<{ id: string }>(async (_request, { params }) => withErrorHandling(async () => {
  const slug = await findProductSlugById(parseId(params.id));
  const product = slug ? await findProductBySlug(slug) : null;
  if (!product) throw new ApiError(404, "Product not found");
  return ok(product);
}), { roles: [Role.ADMIN] });

export const PATCH = withAuth<{ id: string }>(async (request, { params, user }) => withErrorHandling(async () => {
  const id = parseId(params.id);
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) throw new ApiError(400, "Invalid request body", parsed.error.flatten());
  const input = parsed.data;
  const current = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
  if (!current) throw new ApiError(404, "Product not found");
  if (input.mainCategoryId != null && !await prisma.category.findUnique({ where: { id: input.mainCategoryId }, select: { id: true } })) throw new ApiError(400, "Invalid category id");
  if (input.brandId != null && !await prisma.brand.findUnique({ where: { id: input.brandId }, select: { id: true } })) throw new ApiError(400, "Invalid brand id");
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({ where: { id }, data: {
        name: input.name, englishName: input.englishName, slug: input.slug,
        description: input.description, descriptionText: input.description,
        analysis: input.analysis,
        ...(input.mainCategoryId === undefined ? {} : { mainCategory: input.mainCategoryId === null ? { disconnect: true } : { connect: { id: input.mainCategoryId } } }),
        ...(input.brandId === undefined ? {} : { brand: input.brandId === null ? { disconnect: true } : { connect: { id: input.brandId } } }),
        isDigital: input.isDigital, price: input.price, compareAtPrice: input.compareAtPrice,
        specialOffer: input.specialOffer,
        specialOfferEnd: input.specialOfferEnd === undefined ? undefined : input.specialOfferEnd ? new Date(input.specialOfferEnd) : null,
        batchSize: input.batchSize, available: input.available, showPrice: input.showPrice,
        costPerItem: input.costPerItem,
        hasVariants: input.hasVariants, stock: input.stock,
        stockType: input.stockType === undefined ? undefined : input.stockType.toUpperCase() as StockType,
        minOrderQuantity: input.minOrderQuantity, maxOrderQuantity: input.maxOrderQuantity,
        guarantee: input.guarantee, seoTitle: input.seoTitle, seoDescription: input.seoDescription,
      }, select: { id: true, slug: true, price: true } });
      if (input.price !== undefined && current.variants.length) {
        const selected = current.variants.find((variant) => variant.isDefault) ?? current.variants[0];
        await tx.productVariant.update({ where: { id: selected.id }, data: {
          price: input.price,
          compareAtPrice: input.compareAtPrice === undefined ? undefined : input.compareAtPrice || null,
        } });
      }
      for (const [field, newValue] of Object.entries(input)) {
        const oldValue = (current as unknown as Record<string, unknown>)[field];
        const serializedOldValue = oldValue instanceof Prisma.Decimal ? oldValue.toNumber()
          : oldValue instanceof Date ? oldValue.toISOString() : oldValue;
        await tx.productHistory.create({ data: {
          productId: id, action: HistoryAction.UPDATED, field,
          oldValue: serializedOldValue === undefined ? Prisma.JsonNull : serializedOldValue as Prisma.InputJsonValue,
          newValue: newValue === undefined ? Prisma.JsonNull : newValue as Prisma.InputJsonValue,
          changedById: user.id,
        } });
      }
      return product;
    });
    return ok({ ...updated, price: updated.price.toNumber() }, { message: "Product updated" });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") throw new ApiError(409, "A product with this slug already exists");
    throw error;
  }
}), { roles: [Role.ADMIN] });

export const DELETE = withAuth<{ id: string }>(async (_request, { params }) => withErrorHandling(async () => {
  const id = parseId(params.id);
  if (!await prisma.product.findUnique({ where: { id }, select: { id: true } })) throw new ApiError(404, "Product not found");
  try {
    await prisma.product.delete({ where: { id } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && ["P2003", "P2014"].includes(String(error.code))) {
      throw new ApiError(409, "This product is still referenced by business records and cannot be deleted");
    }
    throw error;
  }
  return ok({ id }, { message: "Product deleted" });
}), { roles: [Role.ADMIN] });
