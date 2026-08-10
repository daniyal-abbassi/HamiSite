import { B2BPaymentTerm, OrderStatus, PaymentStatus, Role, StockType } from "@prisma/client";
import { z } from "zod";
import { ApiError, ok, parsePagination, withErrorHandling } from "@/lib/http";
import { ensureB2BTermAllowed, normalizePaymentTerm, resolveMatchingTier } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { serializeDate, toNumber } from "@/lib/serializers";

const createOrderSchema = z.object({
  userId: z.number().int().positive(),
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

  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        variantId: z.number().int().positive().optional(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

function createOrderNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${datePart}-${rand}`;
}

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);

    const userIdParam = searchParams.get("userId");
    const status = searchParams.get("status");

    const userId = userIdParam ? Number(userIdParam) : undefined;

    const where = {
      ...(userId ? { userId } : {}),
      ...(status ? { status: status as OrderStatus } : {}),
    };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
        include: {
          items: {
            select: {
              id: true,
              productId: true,
              variantId: true,
              productName: true,
              variantName: true,
              quantity: true,
              price: true,
              discountAmount: true,
              lineTotal: true,
            },
          },
          payments: {
            select: {
              id: true,
              transactionNumber: true,
              amount: true,
              method: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
          user: { select: { id: true, username: true, role: true, phoneNumber: true } },
        },
      }),
    ]);

    const data = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      customer: order.user,
      shipping: {
        methodName: order.shippingMethodName,
        shippingPrice: toNumber(order.shippingPrice) ?? 0,
        trackingCode: order.trackingCode,
      },
      totals: {
        subtotal: toNumber(order.subtotal) ?? 0,
        discountAmount: toNumber(order.discountAmount) ?? 0,
        taxAmount: toNumber(order.taxAmount) ?? 0,
        totalAmount: toNumber(order.totalAmount) ?? 0,
      },
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        price: toNumber(item.price) ?? 0,
        discountAmount: toNumber(item.discountAmount) ?? 0,
        lineTotal: toNumber(item.lineTotal) ?? 0,
      })),
      payments: order.payments.map((payment) => ({
        id: payment.id,
        transactionNumber: payment.transactionNumber,
        amount: toNumber(payment.amount) ?? 0,
        method: payment.method,
        status: payment.status,
        createdAt: payment.createdAt.toISOString(),
      })),
    }));

    return ok(data, {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      hasNextPage: pagination.page * pagination.pageSize < total,
    });
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, "Invalid request body", parsed.error.flatten());
    }

    const input = parsed.data;
    const paymentTerm = normalizePaymentTerm(input.paymentTerm ?? "CASH");

    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, role: true, creditLimit: true, creditUsed: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new ApiError(404, "Active user not found");
    }

    ensureB2BTermAllowed(user.role as Role, paymentTerm);

    if (input.agentId && user.role !== Role.WHOLESALE) {
      throw new ApiError(400, "agentId can only be set for WHOLESALE customer orders");
    }

    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const variantIds = [...new Set(input.items.map((i) => i.variantId).filter((v): v is number => Boolean(v)))];

    const [products, variants] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, price: true } }),
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
    ]);

    const productById = new Map(products.map((p) => [p.id, p]));
    const variantById = new Map(variants.map((v) => [v.id, v]));

    let subtotal = 0;

    const preparedItems = input.items.map((item) => {
      const product = productById.get(item.productId);
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

    const shippingPrice = input.shippingPrice ?? 0;
    const totalAmount = subtotal + shippingPrice;

    // wholesale credit check for CREDIT_60_DAYS
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
          totalAmount,

          items: {
            create: preparedItems.map((line) => ({
              productId: line.productId,
              variantId: line.variantId,
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
        }
      }

      if (paymentTerm === B2BPaymentTerm.CREDIT_60_DAYS && user.role === Role.WHOLESALE) {
        await tx.user.update({
          where: { id: user.id },
          data: { creditUsed: { increment: totalAmount } },
        });
      }

      return created;
    });

    return ok(
      {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentTerm,
        customer: order.user,
        totals: {
          subtotal,
          shippingPrice,
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
}
