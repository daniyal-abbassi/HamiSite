import { StockType } from "@prisma/client";
import { z } from "zod";
import { loadCartByUserId, serializeCart } from "@/lib/cart";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/serializers";

const addItemSchema = z.object({
  userId: z.number().int().positive(),
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().optional(),
  quantity: z.number().int().positive().default(1),
});

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsed = addItemSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid request body", parsed.error.flatten());
    }

    const input = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true } });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, price: true, available: true, stock: true, stockType: true },
    });

    if (!product || !product.available) {
      throw new ApiError(404, "Product not found or unavailable");
    }

    let unitPrice = toNumber(product.price) ?? 0;
    let stockType = product.stockType;
    let stock = product.stock;

    if (input.variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: input.variantId },
        select: { id: true, productId: true, price: true, stock: true, stockType: true },
      });

      if (!variant || variant.productId !== product.id) {
        throw new ApiError(400, `Variant ${input.variantId} does not belong to product ${product.id}`);
      }

      unitPrice = toNumber(variant.price) ?? unitPrice;
      stockType = variant.stockType;
      stock = variant.stock;
    }

    const cart = await prisma.cart.upsert({
      where: { userId: input.userId },
      update: {},
      create: { userId: input.userId },
    });

    // A composite `findUnique` can't express `variantId: null` at the type
    // level for a nullable column, so we look this up with `findFirst`
    // instead — the `@@unique([cartId, productId, variantId])` constraint
    // still guarantees at most one match.
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: input.productId,
        variantId: input.variantId ?? null,
      },
    });

    const requestedQuantity = (existingItem?.quantity ?? 0) + input.quantity;

    if (stockType === StockType.LIMITED && requestedQuantity > stock) {
      throw new ApiError(409, "Insufficient stock", { available: stock, requested: requestedQuantity });
    }

    if (stockType === StockType.OUT_OF_STOCK) {
      throw new ApiError(409, "Product is out of stock");
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: requestedQuantity, unitPrice },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: input.productId,
          variantId: input.variantId,
          quantity: input.quantity,
          unitPrice,
        },
      });
    }

    const updatedCart = await loadCartByUserId(input.userId);

    return ok(serializeCart(updatedCart, input.userId), { message: "Item added to cart" });
  });
}
