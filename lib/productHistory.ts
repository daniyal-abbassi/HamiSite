import { HistoryAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function recordProductHistory(input: {
  productId: number;
  variantId?: number | null;
  action: HistoryAction;
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
  changedById: number;
}) {
  await prisma.productHistory.create({
    data: {
      productId: input.productId,
      variantId: input.variantId ?? null,
      action: input.action,
      field: input.field,
      oldValue: input.oldValue === undefined ? Prisma.JsonNull : (input.oldValue as Prisma.InputJsonValue),
      newValue: input.newValue === undefined ? Prisma.JsonNull : (input.newValue as Prisma.InputJsonValue),
      changedById: input.changedById,
    },
  });
}
