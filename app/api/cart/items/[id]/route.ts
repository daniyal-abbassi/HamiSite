import { StockType } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { loadCartByUserId, serializeCart } from "@/lib/cart";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const updateItemSchema = z.object({
  quantity: z.number().int().positive(),
});

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid cart item id");
  }
  return id;
}

async function loadItemWithStock(id: number, ownerId: number) {
  const item = await prisma.cartItem.findUnique({
    where: { id },
    include: {
      cart: { select: { userId: true } },
      product: { select: { id: true, stock: true, stockType: true } },
      variant: { select: { id: true, stock: true, stockType: true } },
    },
  });

  if (!item || item.cart.userId !== ownerId) {
    throw new ApiError(404, "Cart item not found");
  }

  return item;
}

export const PATCH = withAuth<{ id: string }>(async (request, { user, params }) => {
  return withErrorHandling(async () => {
    const id = parseId(params.id);
    const body = await request.json();
    const parsed = updateItemSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid request body", parsed.error.flatten());
    }

    const item = await loadItemWithStock(id, user.id);
    const { quantity } = parsed.data;

    const stockType = item.variant?.stockType ?? item.product.stockType;
    const stock = item.variant?.stock ?? item.product.stock;

    if (stockType === StockType.OUT_OF_STOCK) {
      throw new ApiError(409, "Product is out of stock");
    }

    if (stockType === StockType.LIMITED && quantity > stock) {
      throw new ApiError(409, "Insufficient stock", { available: stock, requested: quantity });
    }

    await prisma.cartItem.update({ where: { id }, data: { quantity } });

    const updatedCart = await loadCartByUserId(user.id);

    return ok(serializeCart(updatedCart, user.id), { message: "Cart item updated" });
  });
});

export const DELETE = withAuth<{ id: string }>(async (_request, { user, params }) => {
  return withErrorHandling(async () => {
    const id = parseId(params.id);
    await loadItemWithStock(id, user.id);

    await prisma.cartItem.delete({ where: { id } });

    const updatedCart = await loadCartByUserId(user.id);

    return ok(serializeCart(updatedCart, user.id), { message: "Cart item removed" });
  });
});
