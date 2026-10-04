import { HistoryAction, Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({ stock: z.number().int().min(0), reason: z.string().trim().min(1) });
export const PATCH = withAuth<{ id: string }>(async (request, { params, user }) => withErrorHandling(async () => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Invalid variant id");
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) throw new ApiError(400, "Invalid request body", parsed.error.flatten());
  const current = await prisma.productVariant.findUnique({ where: { id }, select: { id: true, productId: true, stock: true } });
  if (!current) throw new ApiError(404, "Variant not found");
  const variant = await prisma.$transaction(async (tx) => {
    const updated = await tx.productVariant.update({ where: { id }, data: { stock: parsed.data.stock } });
    await tx.product.update({ where: { id: current.productId }, data: { stock: parsed.data.stock } });
    await tx.productHistory.create({ data: {
      productId: current.productId, variantId: id, action: HistoryAction.UPDATED, field: "stock",
      oldValue: current.stock, newValue: { stock: parsed.data.stock, reason: parsed.data.reason }, changedById: user.id,
    } });
    return updated;
  });
  return ok({ ...variant, price: variant.price.toNumber(), compareAtPrice: variant.compareAtPrice?.toNumber() ?? null }, { message: "Stock updated" });
}), { roles: [Role.ADMIN] });
