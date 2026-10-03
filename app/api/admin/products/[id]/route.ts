import { Role, StockType } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { findProductBySlug, findProductSlugById } from "@/lib/catalog-db";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().trim().min(1), englishName: z.string(), slug: z.string().trim().min(1), description: z.string(), analysis: z.string(),
  mainCategoryId: z.number().int().positive(), brandId: z.number().int().positive(), isDigital: z.boolean(), price: z.number().min(0),
  compareAtPrice: z.number().min(0), specialOffer: z.boolean(), specialOfferEnd: z.string(), batchSize: z.number().int().positive(),
  available: z.boolean(), showPrice: z.boolean(), hasVariants: z.boolean(), stock: z.number().int().min(0),
  stockType: z.enum(["UNLIMITED", "LIMITED", "OUT_OF_STOCK", "CALL", "unlimited", "limited", "out_of_stock", "call"]),
  minOrderQuantity: z.number().int().positive(), maxOrderQuantity: z.number().int().positive(), guarantee: z.string(),
  seoTitle: z.string(), seoDescription: z.string(),
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

export const PATCH = withAuth<{ id: string }>(async (request, { params }) => withErrorHandling(async () => {
  const id = parseId(params.id);
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) throw new ApiError(400, "Invalid request body", parsed.error.flatten());
  const input = parsed.data;
  const current = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
  if (!current) throw new ApiError(404, "Product not found");
  if (input.mainCategoryId != null && !await prisma.category.findUnique({ where: { id: input.mainCategoryId }, select: { id: true } })) throw new ApiError(400, "Invalid category id");
  if (input.brandId != null && !await prisma.brand.findUnique({ where: { id: input.brandId }, select: { id: true } })) throw new ApiError(400, "Invalid brand id");
  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: {
        name: input.name, englishName: input.englishName, slug: input.slug,
        description: input.description, descriptionText: input.description,
        analysis: input.analysis,
        ...(input.mainCategoryId === undefined ? {} : { mainCategory: { connect: { id: input.mainCategoryId } } }),
        ...(input.brandId === undefined ? {} : { brand: { connect: { id: input.brandId } } }),
        isDigital: input.isDigital, price: input.price, compareAtPrice: input.compareAtPrice,
        specialOffer: input.specialOffer,
        specialOfferEnd: input.specialOfferEnd === undefined ? undefined : input.specialOfferEnd ? new Date(input.specialOfferEnd) : null,
        batchSize: input.batchSize, available: input.available, showPrice: input.showPrice,
        hasVariants: input.hasVariants, stock: input.stock,
        stockType: input.stockType === undefined ? undefined : input.stockType.toUpperCase() as StockType,
        minOrderQuantity: input.minOrderQuantity, maxOrderQuantity: input.maxOrderQuantity,
        guarantee: input.guarantee, seoTitle: input.seoTitle, seoDescription: input.seoDescription,
      } });
      if (input.price !== undefined && current.variants.length) {
        const selected = current.variants.find((variant) => variant.isDefault) ?? current.variants[0];
        await tx.productVariant.update({ where: { id: selected.id }, data: {
          price: input.price,
          compareAtPrice: input.compareAtPrice === undefined ? undefined : input.compareAtPrice || null,
        } });
      }
    });
    return ok({ id, slug: input.slug ?? current.slug }, { message: "Product updated" });
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
