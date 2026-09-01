import { HistoryAction, Role, StockType } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { recordProductHistory } from "@/lib/productHistory";
import { serializeAdminVariant } from "@/lib/serializers";

const createVariantSchema = z.object({
  color: z.string().optional(),
  storage: z.string().optional(),
  guarantee: z.string().optional(),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  stockType: z.nativeEnum(StockType).optional(),
  barcode: z.string().optional(),
  productIdentifier: z.string().optional(),
  isDefault: z.boolean().optional(),
  imageId: z.number().int().positive().optional(),
});

function parseId(raw: string, label: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `Invalid ${label} id`);
  }
  return id;
}

export const POST = withAuth<{ id: string }>(
  async (request, { user, params }) => {
    return withErrorHandling(async () => {
      const productId = parseId(params.id, "product");
      const body = await request.json();
      const parsed = createVariantSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, "Invalid request body", parsed.error.flatten());
      }

      const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
      if (!product) {
        throw new ApiError(404, "Product not found");
      }

      const variant = await prisma.$transaction(async (tx) => {
        if (parsed.data.isDefault) {
          await tx.productVariant.updateMany({ where: { productId, isDefault: true }, data: { isDefault: false } });
        }

        const created = await tx.productVariant.create({ data: { productId, ...parsed.data } });
        await tx.product.update({ where: { id: productId }, data: { hasVariants: true } });
        return created;
      });

      await recordProductHistory({
        productId,
        variantId: variant.id,
        action: HistoryAction.CREATED,
        field: "variant",
        newValue: serializeAdminVariant(variant),
        changedById: user.id,
      });

      return ok(serializeAdminVariant(variant), { message: "Variant created" });
    });
  },
  { roles: [Role.ADMIN] },
);
