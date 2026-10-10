import { OrderStatus } from "@prisma/client";

export interface RawOrderForMetrics {
  id: number;
  totalAmount: number | string | { toNumber?: () => number } | any;
  status: string;
  paymentStatus: string;
  createdAt: Date;
}

export interface DashboardMetricsResult {
  todayRevenue: number;
  pendingCount: number;
  todayCompletedCount: number;
  lowStockAlerts: number;
}

/**
 * Calculates dashboard metrics for the Telegram Mini App
 */
export function calculateDashboardMetrics(
  orders: RawOrderForMetrics[],
  lowStockAlerts: number = 0,
  referenceDate: Date = new Date()
): DashboardMetricsResult {
  const startOfDay = new Date(referenceDate);
  startOfDay.setHours(0, 0, 0, 0);

  let todayRevenue = 0;
  let pendingCount = 0;
  let todayCompletedCount = 0;

  for (const order of orders) {
    const orderDate = new Date(order.createdAt);
    const isToday = orderDate >= startOfDay;

    const amountNum =
      typeof order.totalAmount?.toNumber === "function"
        ? order.totalAmount.toNumber()
        : Number(order.totalAmount || 0);

    // Count pending triage orders (across all recent days until triaged)
    if (order.status === "PENDING" || order.status === "PROCESSING") {
      pendingCount++;
    }

    if (isToday) {
      if (order.status === "COMPLETED") {
        todayCompletedCount++;
      }

      // Add revenue if order is completed or processing and payment is settled/valid
      if (
        (order.paymentStatus === "COMPLETED" || order.status === "COMPLETED") &&
        order.status !== "CANCELED" &&
        order.status !== "FAILED" &&
        order.status !== "REVERSED"
      ) {
        todayRevenue += amountNum;
      }
    }
  }

  return {
    todayRevenue,
    pendingCount,
    todayCompletedCount,
    lowStockAlerts,
  };
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELED", "FAILED"],
  PROCESSING: ["SHIPPING", "COMPLETED", "CANCELED"],
  SHIPPING: ["COMPLETED", "REVERSED"],
  COMPLETED: ["REVERSED"],
  CANCELED: ["PENDING"], // allow admin re-opening in edge cases
  FAILED: ["PENDING"],
  REVERSED: [],
};

/**
 * Validates whether an order status change is permitted
 */
export function isValidOrderStatusTransition(
  currentStatus: OrderStatus | string,
  newStatus: OrderStatus | string
): boolean {
  if (currentStatus === newStatus) return false;
  const allowed = ALLOWED_TRANSITIONS[currentStatus as OrderStatus];
  if (!allowed) return false;
  return allowed.includes(newStatus as OrderStatus);
}

/**
 * Returns allowed next statuses for UI action buttons
 */
export function getAllowedNextOrderStatuses(currentStatus: OrderStatus | string): OrderStatus[] {
  return ALLOWED_TRANSITIONS[currentStatus as OrderStatus] || [];
}

export interface ProductQuickUpdatePayload {
  available?: boolean;
  stock?: number;
  price?: number;
  compareAtPrice?: number | null;
}

export interface VariantQuickUpdatePayload {
  variantId: number;
  stock?: number;
  price?: number;
  compareAtPrice?: number | null;
}

export function validateProductQuickUpdate(payload: ProductQuickUpdatePayload): {
  valid: boolean;
  data?: ProductQuickUpdatePayload;
  error?: string;
} {
  const data: ProductQuickUpdatePayload = {};

  if (payload.available !== undefined) {
    data.available = Boolean(payload.available);
  }

  if (payload.stock !== undefined) {
    if (typeof payload.stock !== "number" || isNaN(payload.stock) || payload.stock < 0) {
      return { valid: false, error: "موجودی نمی‌تواند منفی باشد" };
    }
    data.stock = Math.floor(payload.stock);
  }

  if (payload.price !== undefined) {
    if (typeof payload.price !== "number" || isNaN(payload.price) || payload.price < 0) {
      return { valid: false, error: "قیمت معتبر نیست" };
    }
    data.price = payload.price;
  }

  if (payload.compareAtPrice !== undefined) {
    if (payload.compareAtPrice !== null) {
      if (typeof payload.compareAtPrice !== "number" || isNaN(payload.compareAtPrice) || payload.compareAtPrice < 0) {
        return { valid: false, error: "قیمت خط‌خورده نامعتبر است" };
      }
      if (payload.price !== undefined && payload.compareAtPrice < payload.price) {
        return { valid: false, error: "قیمت خط‌خورده نباید از قیمت اصلی کمتر باشد" };
      }
    }
    data.compareAtPrice = payload.compareAtPrice;
  }

  return { valid: true, data };
}

export function validateVariantQuickUpdate(payload: VariantQuickUpdatePayload): {
  valid: boolean;
  data?: VariantQuickUpdatePayload;
  error?: string;
} {
  if (!payload.variantId || typeof payload.variantId !== "number") {
    return { valid: false, error: "شناسه تنوع محصول الزامی است" };
  }

  const sub = validateProductQuickUpdate({
    stock: payload.stock,
    price: payload.price,
    compareAtPrice: payload.compareAtPrice,
  });

  if (!sub.valid) {
    return { valid: false, error: sub.error };
  }

  return {
    valid: true,
    data: {
      variantId: payload.variantId,
      ...sub.data,
    },
  };
}
