import { loadCartByUserId, serializeCart } from "@/lib/cart";
import { withAuth } from "@/lib/auth";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(async (_request, { user }) => {
  const cart = await loadCartByUserId(user.id);
  return ok(serializeCart(cart, user.id));
});

export const DELETE = withAuth(async (_request, { user }) => {
  const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  const emptyCart = await loadCartByUserId(user.id);
  return ok(serializeCart(emptyCart, user.id), { message: "Cart cleared" });
});
