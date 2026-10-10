import { HistoryAction, Prisma, Role, StockType } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { revalidateHomepage } from "@/lib/revalidate-homepage";

const schema = z.object({ color: z.string(), storage: z.string(), guarantee: z.string(), price: z.number().min(0),
  compareAtPrice: z.number().min(0), stock: z.number().int().min(0),
  stockType: z.enum(["UNLIMITED", "LIMITED", "OUT_OF_STOCK", "CALL", "unlimited", "limited", "out_of_stock", "call"]), barcode: z.string(),
  productIdentifier: z.string(), isDefault: z.boolean(), imageId: z.number().int().positive().nullable() }).partial().refine((data) => Object.keys(data).length > 0);
const idOf = (raw: string, label: string) => { const value = Number(raw); if (!Number.isInteger(value) || value <= 0) throw new ApiError(400, `Invalid ${label} id`); return value; };

export const PATCH = withAuth<{ id: string; variantId: string }>(async (request, { params, user }) => withErrorHandling(async () => {
  const productId = idOf(params.id, "product"), variantId = idOf(params.variantId, "variant");
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) throw new ApiError(400, "Invalid request body", parsed.error.flatten());
  const input = parsed.data;
  const current = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
  if (!current) throw new ApiError(404, "Variant not found");
  if (input.imageId != null) {
    const image = await prisma.productImage.findFirst({ where: { id: input.imageId, productId }, select: { id: true } });
    if (!image) throw new ApiError(400, "Variant image must belong to this product");
  }
  const options = current.options && typeof current.options === "object" && !Array.isArray(current.options) ? current.options as Record<string, unknown> : {};
  if (input.color !== undefined) options["رنگ"] = input.color;
  if (input.storage !== undefined) options["حافظه"] = input.storage;
  const updated = await prisma.$transaction(async (tx) => {
    if (input.isDefault) await tx.productVariant.updateMany({ where: { productId }, data: { isDefault: false } });
    const variant = await tx.productVariant.update({ where: { id: variantId }, data: {
      color: input.color, storage: input.storage, options: options as Prisma.InputJsonValue,
      guarantee: input.guarantee, price: input.price, compareAtPrice: input.compareAtPrice === undefined ? undefined : input.compareAtPrice || null,
      stock: input.stock, stockType: input.stockType === undefined ? undefined : input.stockType.toUpperCase() as StockType,
      barcode: input.barcode === undefined ? undefined : input.barcode || null,
      productIdentifier: input.productIdentifier === undefined ? undefined : input.productIdentifier || null,
      imageId: input.imageId,
      isDefault: input.isDefault,
    }, include: { image: { select: { url: true } } } });
    await tx.product.update({ where: { id: productId }, data: {
      ...(input.stock === undefined ? {} : { stock: input.stock }),
      ...(input.stockType === undefined ? {} : { stockType: input.stockType.toUpperCase() as StockType }),
    } });
    if (input.imageId !== undefined && input.imageId !== current.imageId) {
      await tx.productHistory.create({ data: {
        productId,
        variantId,
        action: HistoryAction.UPDATED,
        field: "imageId",
        oldValue: current.imageId == null ? Prisma.JsonNull : current.imageId,
        newValue: input.imageId == null ? Prisma.JsonNull : input.imageId,
        changedById: user.id,
      } });
    }
    return variant;
  });
  revalidateHomepage();
  return ok({ ...updated, imageUrl: updated.image?.url ?? null, price: updated.price.toNumber(), compareAtPrice: updated.compareAtPrice?.toNumber() ?? null }, { message: "Variant updated" });
}), { roles: [Role.ADMIN] });

export const DELETE = withAuth<{ id: string; variantId: string }>(async (_request, { params }) => withErrorHandling(async () => {
  const productId = idOf(params.id, "product"), variantId = idOf(params.variantId, "variant");
  const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId }, select: { id: true, isDefault: true } });
  if (!variant) throw new ApiError(404, "Variant not found");
  await prisma.$transaction(async (tx) => {
    await tx.productVariant.delete({ where: { id: variantId } });
    const remaining = await tx.productVariant.findMany({ where: { productId }, orderBy: { id: "asc" }, select: { id: true } });
    if (!remaining.length) await tx.product.update({ where: { id: productId }, data: { hasVariants: false } });
    else if (variant.isDefault) await tx.productVariant.update({ where: { id: remaining[0].id }, data: { isDefault: true } });
  });
  revalidateHomepage();
  return ok({ id: variantId }, { message: "Variant deleted" });
}), { roles: [Role.ADMIN] });
