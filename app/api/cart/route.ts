import { loadCartByUserId, serializeCart } from "@/lib/cart";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

function parseUserId(searchParams: URLSearchParams) {
  const userIdParam = searchParams.get("userId");
  if (!userIdParam) {
    throw new ApiError(400, "userId query parameter is required");
  }

  const userId = Number(userIdParam);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new ApiError(400, "userId must be a positive integer");
  }

  return userId;
}

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const userId = parseUserId(searchParams);

    const cart = await loadCartByUserId(userId);

    return ok(serializeCart(cart, userId));
  });
}

export async function DELETE(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const userId = parseUserId(searchParams);

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    const emptyCart = await loadCartByUserId(userId);

    return ok(serializeCart(emptyCart, userId), { message: "Cart cleared" });
  });
}
