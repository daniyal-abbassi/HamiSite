import { prisma } from "@/lib/prisma";
import { serializeStockType, toNumber } from "@/lib/serializers";

export function cartInclude() {
  return {
    items: {
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            available: true,
            stockType: true,
            stock: true,
            images: {
              where: { isDefault: true },
              take: 1,
              select: { url: true, altText: true },
            },
          },
        },
        variant: {
          select: {
            id: true,
            color: true,
            storage: true,
            price: true,
            stock: true,
            stockType: true,
          },
        },
      },
      orderBy: { createdAt: "asc" as const },
    },
  };
}

export async function loadCartByUserId(userId: number) {
  return prisma.cart.findUnique({
    where: { userId },
    include: cartInclude(),
  });
}

type LoadedCart = Awaited<ReturnType<typeof loadCartByUserId>>;

export function serializeCart(cart: LoadedCart, userId: number) {
  const items = cart?.items ?? [];

  const serializedItems = items.map((item) => {
    const unitPrice = toNumber(item.unitPrice) ?? 0;
    const currentUnitPrice = toNumber(item.variant?.price ?? item.product.price) ?? 0;
    const image = item.product.images[0] ?? null;

    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice,
      currentUnitPrice,
      priceChanged: currentUnitPrice !== unitPrice,
      lineTotal: unitPrice * item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        available: item.product.available,
        stockType: serializeStockType(item.product.stockType),
        image,
      },
      variant: item.variant
        ? {
            id: item.variant.id,
            color: item.variant.color,
            storage: item.variant.storage,
            price: toNumber(item.variant.price),
            stock: item.variant.stock,
            stockType: serializeStockType(item.variant.stockType),
          }
        : null,
    };
  });

  const subtotal = serializedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = serializedItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: cart?.id ?? null,
    userId,
    items: serializedItems,
    itemCount,
    subtotal,
    updatedAt: cart?.updatedAt.toISOString() ?? null,
  };
}
