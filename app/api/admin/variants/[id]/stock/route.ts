import { HistoryAction, Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { recordProductHistory } from "@/lib/productHistory";
import { serializeAdminVariant } from "@/lib/serializers";

const stockAdjustmentSchema = z.object({
  stock: z.number().int().min(0),
  reason: z.string().min(1),
});

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid variant id");
  }
  return id;
}

export const PATCH = withAuth<{ id: string }>(
  async (request, { user, params }) => {
    return withErrorHandling(async () => {
      const variantId = parseId(params.id);
      const body = await request.json();
      const parsed = stockAdjustmentSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, "Invalid request body", parsed.error.flatten());
      }

      const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!variant) {
        throw new ApiError(404, "Variant not found");
      }

      const updated = await prisma.productVariant.update({
        where: { id: variantId },
        data: { stock: parsed.data.stock },
      });

      await recordProductHistory({
        productId: variant.productId,
        variantId,
        action: HistoryAction.UPDATED,
        field: "stock",
        oldValue: { stock: variant.stock, reason: parsed.data.reason },
        newValue: { stock: updated.stock, reason: parsed.data.reason },
        changedById: user.id,
      });

      return ok(serializeAdminVariant(updated), { message: "Stock adjusted" });
    });
  },
  { roles: [Role.ADMIN] },
);
