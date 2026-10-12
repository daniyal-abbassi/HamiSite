import { B2BPaymentTerm, CouponType, OrderStatus, PaymentStatus, Role, StockType } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { evaluateCoupon } from "@/lib/coupons";
import { ApiError, ok, parsePagination, withErrorHandling } from "@/lib/http";
import { orderListInclude, serializeOrderSummary } from "@/lib/orders";
import { ensureB2BTermAllowed, normalizePaymentTerm, resolveMatchingTier } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { revalidateHomepage } from "@/lib/revalidate-homepage";
import { serializeDate, toNumber } from "@/lib/serializers";
import { notifyAdminsNewOrder } from "@/lib/telegram-bot";

const createOrderSchema = z.object({
  agentId: z.number().int().positive().optional(),
  addressId: z.number().int().positive().optional(),

  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  province: z.string().optional(),
  city: z.string().min(1),
  addressText: z.string().min(1),
  postalCode: z.string().optional(),

  shippingMethodName: z.string().optional(),
  shippingPrice: z.number().min(0).optional(),
  customerNote: z.string().optional(),

  paymentTerm: z.string().optional(),
  paymentMethod: z.string().optional(),
  couponCode: z.string().optional(),

  items: z
    .array(
      z
        .object({
          productId: z.number().int().positive().optional(),
          variantId: z.number().int().positive().optional(),
          bundleId: z.number().int().positive().optional(),
          quantity: z.number().int().positive(),
        })
        .refine(
          (i) =>
            (i.productId !== undefined && i.productId > 0) ||
            (i.bundleId !== undefined && i.bundleId > 0),
          { message: "Either productId or bundleId must be provided" }
        )
    )
    .min(1),
});

function createOrderNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${datePart}-${rand}`;
}

export const GET = withAuth(async (request, { user }) => {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    const status = searchParams.get("status");

    const where = {
      userId: user.id,
      ...(status ? { status: status as OrderStatus } : {}),
    };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
        include: orderListInclude(),
      }),
    ]);

    const data = orders.map(serializeOrderSummary);

    return ok(data, {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      hasNextPage: pagination.page * pagination.pageSize < total,
    });
  });
});

export const POST = withAuth(async (request, { user }) => {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid request body", parsed.error.flatten());
    }

    const input = parsed.data;
    const paymentTerm = normalizePaymentTerm(input.paymentTerm ?? "CASH");

    ensureB2BTermAllowed(user.role, paymentTerm);

    if (input.agentId && user.role !== Role.WHOLESALE) {
      throw new ApiError(400, "agentId can only be set for WHOLESALE customer orders");
    }

    if (input.addressId) {
      const address = await prisma.address.findUnique({ where: { id: input.addressId }, select: { userId: true } });
      if (!address || address.userId !== user.id) {
        throw new ApiError(400, "Invalid addressId");
      }
    }

    if (input.agentId) {
      const agent = await prisma.user.findUnique({
        where: { id: input.agentId },
        select: { id: true, role: true, isActive: true },
      });
      if (!agent || !agent.isActive || agent.role !== Role.AGENT) {
        throw new ApiError(400, "Invalid agentId — must reference an active AGENT user");
      }
    }

    const bundleIds = [
      ...new Set(input.items.map((i) => i.bundleId).filter((b): b is number => Boolean(b))),
    ];

    if (bundleIds.length > 0) {
      if (user.role !== Role.WHOLESALE && user.role !== Role.AGENT && user.role !== Role.ADMIN) {
        throw new ApiError(403, "سبدهای همکار تنها برای همکاران عمده و نمایندگان قابل سفارش است");
      }
      if (paymentTerm !== B2BPaymentTerm.CASH) {
        throw new ApiError(
          400,
          "خرید سبدهای تخفیف‌دار همکار فقط به‌صورت نقدی و پرداخت آنی امکان‌پذیر است"
        );
      }
    }

    const productIds = [
      ...new Set(input.items.map((i) => i.productId).filter((p): p is number => Boolean(p))),
    ];
    const variantIds = [
      ...new Set(input.items.map((i) => i.variantId).filter((v): v is number => Boolean(v))),
    ];

    const [products, variants, bundles] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, price: true, brandId: true, mainCategoryId: true },
      }),
      prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: {
          id: true,
          productId: true,
          color: true,
          storage: true,
          price: true,
          stock: true,
          stockType: true,
          priceTiers: {
            where: { isActive: true, paymentMethod: paymentTerm },
            orderBy: { minQuantity: "desc" },
            select: {
              id: true,
              minQuantity: true,
              maxQuantity: true,
              calculatedPrice: true,
              discountPercent: true,
            },
          },
        },
      }),
      bundleIds.length > 0
        ? prisma.partnerBundle.findMany({
            where: { id: { in: bundleIds } },
            include: {
              items: {
                include: {
                  product: { select: { id: true, name: true, stock: true, stockType: true } },
                  variant: { select: { id: true, stock: true, stockType: true } },
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const productById = new Map(products.map((p) => [p.id, p]));
    const variantById = new Map(variants.map((v) => [v.id, v]));
    const bundleById = new Map(bundles.map((b) => [b.id, b]));

    let subtotal = 0;

    const preparedItems = input.items.map((item) => {
      // 1. Bundle Item
      if (item.bundleId) {
        const bundle = bundleById.get(item.bundleId);
        if (!bundle || !bundle.isActive) {
          throw new ApiError(404, `سبد همکار ${item.bundleId} یافت نشد یا غیرفعال است`);
        }

        // Quota check
        if (item.quantity > bundle.stock) {
          throw new ApiError(
            409,
            `سهمیه باقی‌مانده سبد «${bundle.title}» کافی نیست (موجودی: ${bundle.stock})`
          );
        }

        // Constituent base stock check
        for (const line of bundle.items) {
          const requiredPhysical = line.quantity * item.quantity;
          const availableStock = line.variant ? line.variant.stock : line.product.stock;
          const stockType = line.variant ? line.variant.stockType : line.product.stockType;

          if (stockType === StockType.OUT_OF_STOCK || stockType === StockType.CALL) {
            throw new ApiError(409, `کالای «${line.product.name}» در سبد «${bundle.title}» ناموجود است`);
          }

          if (stockType === StockType.LIMITED && requiredPhysical > availableStock) {
            throw new ApiError(
              409,
              `موجودی انبار برای کالای «${line.product.name}» جهت خرید ${item.quantity} عدد سبد کافی نیست`
            );
          }
        }

        const unitPrice = toNumber(bundle.price) ?? 0;
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        return {
          productId: null,
          variantId: null,
          bundleId: bundle.id,
          quantity: item.quantity,
          productName: bundle.title,
          variantName: null,
          price: unitPrice,
          compareAtPrice: toNumber(bundle.compareAtPrice) ?? null,
          discountAmount: 0,
          lineTotal,
          priceTierId: null,
        };
      }

      // 2. Standard Product Item
      const product = productById.get(item.productId!);
      if (!product) throw new ApiError(404, `Product ${item.productId} not found`);

      let unitPrice = toNumber(product.price) ?? 0;
      let compareAtPrice: number | null = null;
      let productName = product.name;
      let variantName: string | null = null;
      let priceTierId: number | null = null;

      if (item.variantId) {
        const variant = variantById.get(item.variantId);
        if (!variant || variant.productId !== product.id) {
          throw new ApiError(400, `Variant ${item.variantId} does not belong to product ${product.id}`);
        }

        // limited stock check
        if (variant.stockType === StockType.LIMITED && variant.stock < item.quantity) {
          throw new ApiError(409, `Insufficient stock for variant ${variant.id}`);
        }

        unitPrice = toNumber(variant.price) ?? unitPrice;
        variantName = [variant.color, variant.storage].filter(Boolean).join(" / ") || null;

        const tier = resolveMatchingTier({ quantity: item.quantity, paymentTerm, tiers: variant.priceTiers });
        if (tier) {
          unitPrice = toNumber(tier.calculatedPrice) ?? unitPrice;
          priceTierId = tier.id;
        }
      }

      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      return {
        productId: product.id,
        variantId: item.variantId ?? null,
        bundleId: null,
        quantity: item.quantity,
        productName,
        variantName,
        price: unitPrice,
        compareAtPrice,
        discountAmount: 0,
        lineTotal,
        priceTierId,
      };
    });

    let shippingPrice = input.shippingPrice ?? 0;
    let discountAmount = 0;
    let appliedCoupon: { id: number; code: string; name: string; type: CouponType } | null = null;

    if (input.couponCode) {
      const categoryIds = [...new Set(products.map((p) => p.mainCategoryId).filter((v): v is number => v !== null))];
      const brandIds = [...new Set(products.map((p) => p.brandId).filter((v): v is number => v !== null))];

      const couponResult = await evaluateCoupon({
        code: input.couponCode,
        userId: user.id,
        subtotal,
        shippingPrice,
        paymentMethod: input.paymentMethod,
        productIds,
        categoryIds,
        brandIds,
      });

      if (!couponResult.valid) {
        throw new ApiError(409, `Coupon "${input.couponCode}" cannot be applied: ${couponResult.reason}`, {
          code: couponResult.code,
          reason: couponResult.reason,
        });
      }

      discountAmount = couponResult.discountAmount;
      appliedCoupon = { id: couponResult.couponId, code: couponResult.code, name: couponResult.name, type: couponResult.type };

      if (couponResult.type === CouponType.SHIPPING_PRICE) {
        // Shipping-price coupons discount the shipping fee itself rather than
        // the merchandise subtotal.
        shippingPrice = Math.max(0, shippingPrice - discountAmount);
      }
    }

    const discountAppliedToSubtotal = appliedCoupon && appliedCoupon.type !== CouponType.SHIPPING_PRICE ? discountAmount : 0;
    const totalAmount = subtotal - discountAppliedToSubtotal + shippingPrice;

    // wholesale credit check for CREDIT_60_DAYS — evaluated against the
    // post-discount total so an applied coupon can bring an order back
    // under the customer's credit limit.
    if (paymentTerm === B2BPaymentTerm.CREDIT_60_DAYS && user.role === Role.WHOLESALE) {
      const creditLimit = toNumber(user.creditLimit) ?? 0;
      const creditUsed = toNumber(user.creditUsed) ?? 0;

      if (creditUsed + totalAmount > creditLimit) {
        throw new ApiError(409, "Credit limit exceeded", {
          creditLimit,
          creditUsed,
          requested: totalAmount,
        });
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: createOrderNumber(),
          userId: user.id,
          agentId: input.agentId,
          addressId: input.addressId,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.INITIATED,
          paymentMethod: input.paymentMethod ?? (paymentTerm === B2BPaymentTerm.CASH ? "card" : "credit"),
          paymentTerm,

          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          province: input.province,
          city: input.city,
          addressText: input.addressText,
          postalCode: input.postalCode,

          shippingMethodName: input.shippingMethodName,
          shippingPrice,
          customerNote: input.customerNote,
          subtotal,
          discountAmount,
          totalAmount,
          couponId: appliedCoupon?.id,

          items: {
            create: preparedItems.map((line) => ({
              productId: line.productId,
              variantId: line.variantId,
              bundleId: line.bundleId ?? null,
              productName: line.productName,
              variantName: line.variantName,
              quantity: line.quantity,
              price: line.price,
              compareAtPrice: line.compareAtPrice,
              discountAmount: line.discountAmount,
              lineTotal: line.lineTotal,
              priceTierId: line.priceTierId,
            })),
          },
        },
        include: {
          items: true,
          user: { select: { id: true, username: true, role: true } },
        },
      });

      for (const line of preparedItems) {
        if (line.variantId) {
          const variant = variantById.get(line.variantId);
          if (variant && variant.stockType === StockType.LIMITED) {
            await tx.productVariant.update({
              where: { id: line.variantId },
              data: { stock: { decrement: line.quantity } },
            });
          }
        } else if (line.bundleId) {
          const bundle = bundleById.get(line.bundleId);
          if (bundle) {
            // 1. Decrement bundle quota
            await tx.partnerBundle.update({
              where: { id: line.bundleId },
              data: { stock: { decrement: line.quantity } },
            });

            // 2. Decrement constituent products' warehouse stock
            for (const c of bundle.items) {
              const decrementUnits = c.quantity * line.quantity;
              if (c.variantId && c.variant?.stockType === StockType.LIMITED) {
                await tx.productVariant.update({
                  where: { id: c.variantId },
                  data: { stock: { decrement: decrementUnits } },
                });
              } else if (c.product?.stockType === StockType.LIMITED) {
                await tx.product.update({
                  where: { id: c.productId },
                  data: { stock: { decrement: decrementUnits } },
                });
              }
            }
          }
        }
      }

      if (paymentTerm === B2BPaymentTerm.CREDIT_60_DAYS && user.role === Role.WHOLESALE) {
        await tx.user.update({
          where: { id: user.id },
          data: { creditUsed: { increment: totalAmount } },
        });
      }

      if (appliedCoupon) {
        await tx.couponUsage.create({
          data: { couponId: appliedCoupon.id, userId: user.id, orderId: created.id },
        });
      }

      return created;
    });

    revalidateHomepage();

    // Trigger Telegram bot push alert to admins
    notifyAdminsNewOrder({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: `${input.firstName} ${input.lastName}`.trim(),
      phone: input.phone,
      totalAmount,
      itemCount: order.items.length,
      city: input.city,
    }).catch((err) => console.warn("Failed to dispatch Telegram order alert:", err));

    return ok(
      {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentTerm,
        customer: order.user,
        coupon: appliedCoupon,
        totals: {
          subtotal,
          shippingPrice,
          discountAmount,
          totalAmount,
        },
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.quantity,
          price: toNumber(item.price) ?? 0,
          lineTotal: toNumber(item.lineTotal) ?? 0,
        })),
        createdAt: serializeDate(order.createdAt),
      },
      { message: "Order created" },
    );
  });
});
