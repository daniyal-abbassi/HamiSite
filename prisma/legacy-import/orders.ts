import { OrderStatus, PaymentStatus, B2BPaymentTerm, Role, type PrismaClient } from "@prisma/client";
import type { LegacyOrder, LegacyOrderPayment } from "./types";
import { normalizePhoneNumber, IMPORTED_CUSTOMER_PASSWORD } from "./customers";
import bcrypt from "bcryptjs";

export function mapOrderStatus(value: string): OrderStatus {
  switch (value) {
    case "processing":
      return OrderStatus.PROCESSING;
    case "finished":
      return OrderStatus.COMPLETED;
    case "canceled":
      return OrderStatus.CANCELED;
    default:
      throw new Error(`Unknown legacy order status: ${value}`);
  }
}

export function mapPaymentStatusFromOrder(value: string): PaymentStatus {
  switch (value) {
    case "pending":
      return PaymentStatus.INITIATED;
    case "paid":
      return PaymentStatus.COMPLETED;
    default:
      throw new Error(`Unknown legacy order payment_status: ${value}`);
  }
}

export function mapPaymentStatus(value: string): PaymentStatus {
  switch (value) {
    case "initiated":
      return PaymentStatus.INITIATED;
    case "sent":
      return PaymentStatus.SENT;
    case "completed":
      return PaymentStatus.COMPLETED;
    case "failed":
      return PaymentStatus.FAILED;
    default:
      throw new Error(`Unknown legacy order-payment status: ${value}`);
  }
}

export function legacyOrderNumber(legacyOrderId: number): string {
  return `LEGACY-${legacyOrderId}`;
}

export function computeOrderTotals(raw: LegacyOrder): { subtotal: number; shippingPrice: number; totalAmount: number } {
  const subtotal = raw.items.reduce((sum, item) => sum + item.total_price, 0);
  const totalAmount = raw.final_price;
  const shippingPrice = Math.max(0, totalAmount - subtotal);
  return { subtotal, shippingPrice, totalAmount };
}

async function resolveOrderUserId(prisma: PrismaClient, raw: LegacyOrder, userIdMap: Map<string, number>): Promise<number> {
  const normalizedPhone = normalizePhoneNumber(raw.customer_phone);
  const existing = userIdMap.get(normalizedPhone);
  if (existing) return existing;

  const [firstName, ...rest] = raw.customer_name.split(" ");
  const passwordHash = await bcrypt.hash(IMPORTED_CUSTOMER_PASSWORD, 10);
  const created = await prisma.user.upsert({
    where: { phoneNumber: normalizedPhone },
    update: {},
    create: {
      role: Role.RETAIL,
      username: normalizedPhone,
      phoneNumber: normalizedPhone,
      passwordHash,
      firstName: firstName ?? null,
      lastName: rest.length > 0 ? rest.join(" ") : null,
    },
  });

  userIdMap.set(normalizedPhone, created.id);
  return created.id;
}

async function resolveOrderAddressId(prisma: PrismaClient, raw: LegacyOrder, userId: number): Promise<number | null> {
  if (!raw.shipping_address) return null;

  const existing = await prisma.address.findFirst({ where: { userId, address: raw.shipping_address } });
  if (existing) return existing.id;

  const isFirstForUser = (await prisma.address.count({ where: { userId } })) === 0;

  const created = await prisma.address.create({
    data: {
      userId,
      firstName: raw.shipping_first_name,
      lastName: raw.shipping_last_name,
      phoneNumber: raw.shipping_phone_number,
      province: raw.shipping_province,
      city: raw.shipping_city ?? "",
      address: raw.shipping_address,
      postalCode: raw.shipping_zip_code,
      isDefault: isFirstForUser,
    },
  });

  return created.id;
}

export async function importOrders(
  prisma: PrismaClient,
  orders: LegacyOrder[],
  payments: LegacyOrderPayment[],
  userIdMap: Map<string, number>,
  productIdMap: Map<number, number>,
  variantIdMap: Map<number, number>
): Promise<void> {
  const orderIdMap = new Map<number, number>();

  for (const raw of orders) {
    const userId = await resolveOrderUserId(prisma, raw, userIdMap);
    const addressId = await resolveOrderAddressId(prisma, raw, userId);
    const { subtotal, shippingPrice, totalAmount } = computeOrderTotals(raw);
    const orderNumber = legacyOrderNumber(raw.id);

    const order = await prisma.order.upsert({
      where: { orderNumber },
      update: {
        userId,
        addressId,
        status: mapOrderStatus(raw.status),
        paymentStatus: mapPaymentStatusFromOrder(raw.payment_status),
        paymentMethod: raw.payment_method,
        paymentTerm: B2BPaymentTerm.CASH,
        firstName: raw.shipping_first_name ?? raw.customer_name,
        lastName: raw.shipping_last_name ?? "",
        phone: raw.shipping_phone_number ?? raw.customer_phone,
        province: raw.shipping_province,
        city: raw.shipping_city ?? "",
        addressText: raw.shipping_address ?? "",
        postalCode: raw.shipping_zip_code,
        shippingMethodName: raw.shipping_method_name,
        shippingPrice,
        trackingCode: raw.shipping_tracking_code,
        subtotal,
        totalAmount,
        referer: raw.referer,
      },
      create: {
        orderNumber,
        userId,
        addressId,
        status: mapOrderStatus(raw.status),
        paymentStatus: mapPaymentStatusFromOrder(raw.payment_status),
        paymentMethod: raw.payment_method,
        paymentTerm: B2BPaymentTerm.CASH,
        firstName: raw.shipping_first_name ?? raw.customer_name,
        lastName: raw.shipping_last_name ?? "",
        phone: raw.shipping_phone_number ?? raw.customer_phone,
        province: raw.shipping_province,
        city: raw.shipping_city ?? "",
        addressText: raw.shipping_address ?? "",
        postalCode: raw.shipping_zip_code,
        shippingMethodName: raw.shipping_method_name,
        shippingPrice,
        trackingCode: raw.shipping_tracking_code,
        subtotal,
        totalAmount,
        referer: raw.referer,
        createdAt: new Date(raw.creation_date),
      },
    });

    orderIdMap.set(raw.id, order.id);

    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    for (const item of raw.items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.product_id !== null ? productIdMap.get(item.product_id) ?? null : null,
          variantId: item.variant_id !== null ? variantIdMap.get(item.variant_id) ?? null : null,
          productName: item.product_name,
          variantName: item.variant_name,
          quantity: item.quantity,
          price: item.price,
          compareAtPrice: item.compare_at_price,
          discountAmount: 0,
          lineTotal: item.total_price,
        },
      });
    }
  }

  await importPayments(prisma, payments, orderIdMap, userIdMap, orders);
}

async function importPayments(
  prisma: PrismaClient,
  payments: LegacyOrderPayment[],
  orderIdMap: Map<number, number>,
  userIdMap: Map<string, number>,
  orders: LegacyOrder[]
): Promise<void> {
  const orderById = new Map(orders.map((o) => [o.id, o]));

  for (const raw of payments) {
    const orderId = orderIdMap.get(raw.order_id);
    const legacyOrder = orderById.get(raw.order_id);
    if (!orderId || !legacyOrder) {
      console.warn(`Skipping legacy payment ${raw.id}: no matching imported order for legacy order_id ${raw.order_id}`);
      continue;
    }

    const userId = userIdMap.get(normalizePhoneNumber(legacyOrder.customer_phone));
    if (!userId) {
      console.warn(`Skipping legacy payment ${raw.id}: no matching imported user for order ${raw.order_id}`);
      continue;
    }

    const transactionNumber = `LEGACY-${raw.mixin_transaction_number}`;

    await prisma.payment.upsert({
      where: { transactionNumber },
      update: {
        orderId,
        userId,
        amount: raw.price,
        method: raw.method,
        methodDisplay: raw.method_display,
        psp: raw.psp,
        pspDisplay: raw.psp_display,
        cardNumber: raw.card_number,
        status: mapPaymentStatus(raw.status),
      },
      create: {
        orderId,
        userId,
        transactionNumber,
        authority: null,
        amount: raw.price,
        method: raw.method,
        methodDisplay: raw.method_display,
        psp: raw.psp,
        pspDisplay: raw.psp_display,
        cardNumber: raw.card_number,
        status: mapPaymentStatus(raw.status),
        createdAt: new Date(raw.creation_date),
      },
    });
  }
}
