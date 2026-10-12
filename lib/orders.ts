import { B2BPaymentTerm, OrderStatus, Prisma, Role, StockType } from "@prisma/client";
import { toNumber } from "@/lib/serializers";

export function orderListInclude() {
  return {
    items: {
      select: {
        id: true,
        productId: true,
        variantId: true,
        bundleId: true,
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
      orderBy: { createdAt: "desc" as const },
    },
    user: { select: { id: true, username: true, role: true, phoneNumber: true } },
  };
}

type ListedOrder = Prisma.OrderGetPayload<{ include: ReturnType<typeof orderListInclude> }>;

export function serializeOrderSummary(order: ListedOrder) {
  return {
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
      bundleId: item.bundleId,
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
  };
}

// Statuses that represent a "closed" order — once reached, stock decrements
// and B2B credit usage from placing the order should be reversed if the
// order moves here from a still-open status.
export const TERMINAL_CANCEL_STATUSES = ["CANCELED", "FAILED", "REVERSED"] as const;

export async function applyOrderStatusTransition(
  tx: Prisma.TransactionClient,
  order: {
    id: number;
    status: OrderStatus;
    paymentTerm: B2BPaymentTerm;
    totalAmount: Prisma.Decimal;
    items: {
      productId?: number | null;
      variantId?: number | null;
      bundleId?: number | null;
      quantity: number;
      variant?: { stockType: StockType } | null;
    }[];
    user: { id: number; role: Role };
  },
  nextStatus: OrderStatus,
) {
  const isCurrentlyClosed = TERMINAL_CANCEL_STATUSES.includes(order.status as (typeof TERMINAL_CANCEL_STATUSES)[number]);
  const willBecomeClosed = TERMINAL_CANCEL_STATUSES.includes(nextStatus as (typeof TERMINAL_CANCEL_STATUSES)[number]);
  const shouldRestock = !isCurrentlyClosed && willBecomeClosed;
  const shouldReverseCredit =
    shouldRestock && order.paymentTerm === B2BPaymentTerm.CREDIT_60_DAYS && order.user.role === Role.WHOLESALE;

  if (shouldRestock) {
    for (const item of order.items) {
      // 1. Regular Product/Variant Restock
      if (item.variantId && item.variant?.stockType === StockType.LIMITED) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }

      // 2. Partner Bundle Restock
      if (item.bundleId) {
        // Restore bundle quota
        await tx.partnerBundle.update({
          where: { id: item.bundleId },
          data: { stock: { increment: item.quantity } },
        });

        // Restore constituent products' physical stock
        const bundle = await tx.partnerBundle.findUnique({
          where: { id: item.bundleId },
          include: {
            items: {
              include: {
                product: { select: { id: true, stockType: true } },
                variant: { select: { id: true, stockType: true } },
              },
            },
          },
        });

        if (bundle) {
          for (const line of bundle.items) {
            const restockUnits = line.quantity * item.quantity;
            if (line.variantId && line.variant?.stockType === StockType.LIMITED) {
              await tx.productVariant.update({
                where: { id: line.variantId },
                data: { stock: { increment: restockUnits } },
              });
            } else if (line.product?.stockType === StockType.LIMITED) {
              await tx.product.update({
                where: { id: line.productId },
                data: { stock: { increment: restockUnits } },
              });
            }
          }
        }
      }
    }
  }

  if (shouldReverseCredit) {
    const currentUser = await tx.user.findUniqueOrThrow({
      where: { id: order.user.id },
      select: { creditUsed: true },
    });
    const reversalAmount = toNumber(order.totalAmount) ?? 0;
    const newCreditUsed = Math.max(0, (toNumber(currentUser.creditUsed) ?? 0) - reversalAmount);

    await tx.user.update({
      where: { id: order.user.id },
      data: { creditUsed: newCreditUsed },
    });
  }
}
