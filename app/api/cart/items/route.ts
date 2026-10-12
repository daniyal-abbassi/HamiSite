import { Role, StockType } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { loadCartByUserId, serializeCart } from "@/lib/cart";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/serializers";

const addItemSchema = z
  .object({
    productId: z.number().int().positive().optional(),
    variantId: z.number().int().positive().optional(),
    bundleId: z.number().int().positive().optional(),
    quantity: z.number().int().positive().default(1),
  })
  .refine(
    (data) =>
      (data.productId !== undefined && data.productId > 0) ||
      (data.bundleId !== undefined && data.bundleId > 0),
    {
      message: "حداقل یکی از شناسه‌های کالا یا سبد باید ارسال شود",
    }
  );

export const POST = withAuth(async (request, { user }) => {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsed = addItemSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "اطلاعات ارسالی نامعتبر است", parsed.error.flatten());
    }

    const input = parsed.data;

    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    // -------------------------------------------------------------
    // Case 1: Adding a Partner Bundle
    // -------------------------------------------------------------
    if (input.bundleId) {
      // Role Gating: Wholesale, Agent, or Admin only
      if (user.role !== Role.WHOLESALE && user.role !== Role.AGENT && user.role !== Role.ADMIN) {
        throw new ApiError(403, "سبدهای همکار تنها برای همکاران عمده و نمایندگان قابل خرید است");
      }

      const bundle = await prisma.partnerBundle.findUnique({
        where: { id: input.bundleId },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, available: true, stock: true, stockType: true },
              },
              variant: {
                select: { id: true, stock: true, stockType: true },
              },
            },
          },
        },
      });

      if (!bundle || !bundle.isActive) {
        throw new ApiError(404, "سبد همکار مورد نظر یافت نشد یا غیرفعال است");
      }

      const existingBundleItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          bundleId: input.bundleId,
        },
      });

      const requestedBundleQuantity = (existingBundleItem?.quantity ?? 0) + input.quantity;

      // 1. Check bundle quota
      if (requestedBundleQuantity > bundle.stock) {
        throw new ApiError(409, "تعداد سهمیه باقی‌مانده این سبد کافی نیست", {
          available: bundle.stock,
          requested: requestedBundleQuantity,
        });
      }

      // 2. Check constituent products' base warehouse stock
      for (const line of bundle.items) {
        const requiredPhysicalUnits = line.quantity * requestedBundleQuantity;
        const availablePhysicalStock = line.variant ? line.variant.stock : line.product.stock;
        const stockType = line.variant ? line.variant.stockType : line.product.stockType;

        if (stockType === StockType.OUT_OF_STOCK || stockType === StockType.CALL) {
          throw new ApiError(409, `کالای «${line.product.name}» در انبار موجود نیست`);
        }

        if (stockType === StockType.LIMITED && requiredPhysicalUnits > availablePhysicalStock) {
          throw new ApiError(
            409,
            `موجودی انبار برای کالای «${line.product.name}» جهت تامین این تعداد سبد کافی نیست`
          );
        }
      }

      const unitPrice = toNumber(bundle.price) ?? 0;

      if (existingBundleItem) {
        await prisma.cartItem.update({
          where: { id: existingBundleItem.id },
          data: { quantity: requestedBundleQuantity, unitPrice },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            bundleId: input.bundleId,
            productId: null,
            variantId: null,
            quantity: input.quantity,
            unitPrice,
          },
        });
      }

      const updatedCart = await loadCartByUserId(user.id);
      return ok(serializeCart(updatedCart, user.id), { message: "سبد به سفارش شما اضافه شد" });
    }

    // -------------------------------------------------------------
    // Case 2: Standard Catalog Product
    // -------------------------------------------------------------
    const product = await prisma.product.findUnique({
      where: { id: input.productId! },
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

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: input.productId!,
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
          productId: input.productId!,
          variantId: input.variantId,
          quantity: input.quantity,
          unitPrice,
        },
      });
    }

    const updatedCart = await loadCartByUserId(user.id);

    return ok(serializeCart(updatedCart, user.id), { message: "Item added to cart" });
  });
});
