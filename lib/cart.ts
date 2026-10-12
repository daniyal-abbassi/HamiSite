import { prisma } from "@/lib/prisma";
import { serializeStockType, toNumber } from "@/lib/serializers";
import type { Cart, CartItem } from "@/types/store";

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
        bundle: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    available: true,
                    stock: true,
                    stockType: true,
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
              orderBy: { order: "asc" as const },
            },
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

export function serializeCart(cart: LoadedCart, userId: number): Cart {
  const items = cart?.items ?? [];

  const serializedItems: CartItem[] = items.map((item) => {
    const unitPrice = toNumber(item.unitPrice) ?? 0;

    // Bundle Cart Item
    if (item.bundleId && item.bundle) {
      const currentUnitPrice = toNumber(item.bundle.price) ?? 0;
      const image = item.bundle.imageUrl ? { url: item.bundle.imageUrl, altText: item.bundle.title } : null;

      return {
        id: item.id,
        productId: null,
        variantId: null,
        bundleId: item.bundleId,
        isBundle: true,
        bundleTitle: item.bundle.title,
        bundleSlug: item.bundle.slug,
        bundleItems: item.bundle.items.map((line) => ({
          productId: line.productId,
          productName: line.product.name,
          variantId: line.variantId,
          variantName: [line.variant?.color, line.variant?.storage].filter(Boolean).join(" - ") || null,
          quantity: line.quantity,
          totalQuantity: line.quantity * item.quantity,
        })),
        quantity: item.quantity,
        unitPrice,
        currentUnitPrice,
        priceChanged: currentUnitPrice !== unitPrice,
        lineTotal: unitPrice * item.quantity,
        product: {
          id: 0,
          name: item.bundle.title,
          slug: item.bundle.slug,
          available: item.bundle.isActive,
          stockType: "limited",
          image,
        },
        variant: null,
      };
    }

    // Standard Product Cart Item
    const currentUnitPrice = toNumber(item.variant?.price ?? item.product?.price) ?? 0;
    const image = item.product?.images?.[0] ?? null;

    return {
      id: item.id,
      productId: item.productId ?? 0,
      variantId: item.variantId,
      bundleId: null,
      isBundle: false,
      quantity: item.quantity,
      unitPrice,
      currentUnitPrice,
      priceChanged: currentUnitPrice !== unitPrice,
      lineTotal: unitPrice * item.quantity,
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            available: item.product.available,
            stockType: serializeStockType(item.product.stockType),
            image,
          }
        : null,
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
