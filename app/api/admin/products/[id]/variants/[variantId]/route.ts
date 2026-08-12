import { HistoryAction, Role, StockType } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { recordProductHistory } from "@/lib/productHistory";
import { serializeAdminVariant } from "@/lib/serializers";

const updateVariantSchema = z
  .object({
    color: z.string(),
    storage: z.string(),
    guarantee: z.string(),
    price: z.number().min(0),
    compareAtPrice: z.number().min(0),
    stock: z.number().int().min(0),
    stockType: z.nativeEnum(StockType),
    barcode: z.string(),
    productIdentifier: z.string(),
    isDefault: z.boolean(),
    imageId: z.number().int().positive(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

function parseId(raw: string, label: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `Invalid ${label} id`);
  }
  return id;
}

async function loadOwnedVariant(productId: number, variantId: number) {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant || variant.productId !== productId) {
    throw new ApiError(404, "Variant not found");
  }
  return variant;
}

export const PATCH = withAuth<{ id: string; variantId: string }>(
  async (request, { user, params }) => {
    return withErrorHandling(async () => {
      const productId = parseId(params.id, "product");
      const variantId = parseId(params.variantId, "variant");
      const body = await request.json();
      const parsed = updateVariantSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, "Invalid request body", parsed.error.flatten());
      }

      const existing = await loadOwnedVariant(productId, variantId);

      const variant = await prisma.$transaction(async (tx) => {
        if (parsed.data.isDefault) {
          await tx.productVariant.updateMany({
            where: { productId, isDefault: true, id: { not: variantId } },
            data: { isDefault: false },
          });
        }
        return tx.productVariant.update({ where: { id: variantId }, data: parsed.data });
      });

      await recordProductHistory({
        productId,
        variantId,
        action: HistoryAction.UPDATED,
        field: "variant",
        oldValue: serializeAdminVariant(existing),
        newValue: serializeAdminVariant(variant),
        changedById: user.id,
      });

      return ok(serializeAdminVariant(variant), { message: "Variant updated" });
    });
  },
  { roles: [Role.ADMIN] },
);

export const DELETE = withAuth<{ id: string; variantId: string }>(
  async (_request, { user, params }) => {
    return withErrorHandling(async () => {
      const productId = parseId(params.id, "product");
      const variantId = parseId(params.variantId, "variant");

      const existing = await loadOwnedVariant(productId, variantId);

      await recordProductHistory({
        productId,
        variantId,
        action: HistoryAction.DELETED,
        field: "variant",
        oldValue: serializeAdminVariant(existing),
        changedById: user.id,
      });

      await prisma.productVariant.delete({ where: { id: variantId } });

      return ok({ id: variantId }, { message: "Variant deleted" });
    });
  },
  { roles: [Role.ADMIN] },
);
