import { HistoryAction, Prisma, Role, StockType } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({ color: z.string().optional(), storage: z.string().optional(), guarantee: z.string().optional(),
  price: z.number().min(0), compareAtPrice: z.number().min(0).optional(), stock: z.number().int().min(0).optional(),
  stockType: z.enum(["UNLIMITED", "LIMITED", "OUT_OF_STOCK", "CALL", "unlimited", "limited", "out_of_stock", "call"]).optional(),
  barcode: z.string().optional(), productIdentifier: z.string().optional(), isDefault: z.boolean().optional() });
const idOf = (raw: string) => { const value = Number(raw); if (!Number.isInteger(value) || value <= 0) throw new ApiError(400, "Invalid product id"); return value; };
const normalizedStock = (raw?: string) => raw ? raw.toUpperCase() as StockType : undefined;
const asVariant = (variant: { id: number; color: string | null; storage: string | null; guarantee: string | null; price: Prisma.Decimal; compareAtPrice: Prisma.Decimal | null; stock: number; stockType: StockType; barcode: string | null; productIdentifier: string | null; isDefault: boolean; options: Prisma.JsonValue }) => ({
  id: variant.id, color: variant.color, storage: variant.storage, guarantee: variant.guarantee,
  price: variant.price.toNumber(), compareAtPrice: variant.compareAtPrice?.toNumber() ?? null,
  stock: variant.stock, stockType: variant.stockType.toLowerCase(), barcode: variant.barcode,
  productIdentifier: variant.productIdentifier, isDefault: variant.isDefault, options: variant.options,
});

export const POST = withAuth<{ id: string }>(async (request, { params, user }) => withErrorHandling(async () => {
  const productId = idOf(params.id);
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) throw new ApiError(400, "Invalid request body", parsed.error.flatten());
  const input = parsed.data;
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, stock: true, stockType: true } });
  if (!product) throw new ApiError(404, "Product not found");
  const existingCount = await prisma.productVariant.count({ where: { productId } });
  const options: Record<string, string> = {};
  if (input.color) options["رنگ"] = input.color;
  if (input.storage) options["حافظه"] = input.storage;
  const variant = await prisma.$transaction(async (tx) => {
    const makeDefault = input.isDefault ?? existingCount === 0;
    if (makeDefault) await tx.productVariant.updateMany({ where: { productId }, data: { isDefault: false } });
    const created = await tx.productVariant.create({ data: {
      productId, color: input.color, storage: input.storage, options: options as Prisma.InputJsonValue,
      guarantee: input.guarantee, price: input.price, compareAtPrice: input.compareAtPrice,
      stock: input.stock ?? 0, stockType: normalizedStock(input.stockType) ?? product.stockType,
      barcode: input.barcode || null, productIdentifier: input.productIdentifier || null, isDefault: makeDefault,
    } });
    await tx.product.update({ where: { id: productId }, data: {
      hasVariants: true, ...(input.stock === undefined ? {} : { stock: input.stock }),
      ...(input.stockType === undefined ? {} : { stockType: normalizedStock(input.stockType) }),
    } });
    await tx.productHistory.create({ data: {
      productId, variantId: created.id, action: HistoryAction.CREATED, field: "variant",
      newValue: { color: input.color ?? null, storage: input.storage ?? null, price: input.price, stock: created.stock },
      changedById: user.id,
    } });
    return created;
  });
  return ok(asVariant(variant), { message: "Variant created" });
}), { roles: [Role.ADMIN] });
