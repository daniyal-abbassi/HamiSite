import { StockType } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { checkBundleAvailability, bundleInclude } from "@/lib/bundles";
import { loadCartByUserId, serializeCart } from "@/lib/cart";
import { ApiError, ok, parseJsonBody, withErrorHandling } from "@/lib/http";
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
      bundle: {
        include: bundleInclude(),
      },
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
    const input = await parseJsonBody(request, updateItemSchema);

    const item = await loadItemWithStock(id, user.id);
    const { quantity } = input;

    if (item.bundleId && item.bundle) {
      if (!item.bundle.isActive) {
        throw new ApiError(409, "Bundle is no longer active");
      }
      const bundleLines = item.bundle.items.map((line) => ({
        quantity: line.quantity,
        stock: line.variant ? line.variant.stock : line.product.stock,
        stockType: line.variant ? line.variant.stockType : line.product.stockType,
      }));
      const availability = checkBundleAvailability(item.bundle.stock, bundleLines);
      if (!availability.isAvailable || quantity > availability.maxPurchasableUnits) {
        throw new ApiError(409, "Insufficient bundle stock", {
          available: availability.maxPurchasableUnits,
          requested: quantity,
        });
      }
    } else if (item.product) {
      const stockType = item.variant?.stockType ?? item.product.stockType;
      const stock = item.variant?.stock ?? item.product.stock;

      if (stockType === StockType.OUT_OF_STOCK) {
        throw new ApiError(409, "Product is out of stock");
      }

      if (stockType === StockType.LIMITED && quantity > stock) {
        throw new ApiError(409, "Insufficient stock", { available: stock, requested: quantity });
      }
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
