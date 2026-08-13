import { describe, it, expect } from "vitest";
import { mapOrderStatus, mapPaymentStatusFromOrder, mapPaymentStatus, computeOrderTotals, legacyOrderNumber } from "./orders";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import type { LegacyOrder } from "./types";

describe("mapOrderStatus", () => {
  it("maps the 3 observed legacy statuses", () => {
    expect(mapOrderStatus("processing")).toBe(OrderStatus.PROCESSING);
    expect(mapOrderStatus("finished")).toBe(OrderStatus.COMPLETED);
    expect(mapOrderStatus("canceled")).toBe(OrderStatus.CANCELED);
  });

  it("throws on an unmapped status", () => {
    expect(() => mapOrderStatus("bogus")).toThrow(/Unknown legacy order status/);
  });
});

describe("mapPaymentStatusFromOrder", () => {
  it("maps the 2 observed legacy order payment_status values", () => {
    expect(mapPaymentStatusFromOrder("pending")).toBe(PaymentStatus.INITIATED);
    expect(mapPaymentStatusFromOrder("paid")).toBe(PaymentStatus.COMPLETED);
  });
});

describe("mapPaymentStatus", () => {
  it("maps all 4 observed legacy order-payment status values", () => {
    expect(mapPaymentStatus("initiated")).toBe(PaymentStatus.INITIATED);
    expect(mapPaymentStatus("sent")).toBe(PaymentStatus.SENT);
    expect(mapPaymentStatus("completed")).toBe(PaymentStatus.COMPLETED);
    expect(mapPaymentStatus("failed")).toBe(PaymentStatus.FAILED);
  });
});

describe("legacyOrderNumber", () => {
  it("prefixes the legacy order id", () => {
    expect(legacyOrderNumber(4641)).toBe("LEGACY-4641");
  });
});

describe("computeOrderTotals", () => {
  const raw: LegacyOrder = {
    id: 4641,
    customer_name: "علی ملایی",
    customer_phone: "09112721836",
    status: "finished",
    payment_method: "online",
    payment_status: "paid",
    psp: "zarinpal",
    creation_date: "2026-07-25T11:11:08.477127+03:30",
    shipping_method_name: "MAH X",
    final_price: 45350000,
    referer: "Torob",
    shipping_tracking_code: "10010058232817",
    shipping_first_name: "علی",
    shipping_last_name: "ملایی",
    shipping_phone_number: "09112721836",
    shipping_address: "Golestan",
    shipping_province: "گلستان",
    shipping_city: "آزاد شهر",
    shipping_zip_code: "4964117418",
    items: [
      { id: 1, product_id: 64, product_name: "Galaxy A16", variant_id: 344, variant_name: "Galaxy A16 - سبز", quantity: 1, price: 45000000, compare_at_price: 45450000, total_price: 45000000, weight: null },
    ],
  };

  it("derives subtotal from items, shippingPrice from the final_price gap", () => {
    expect(computeOrderTotals(raw)).toEqual({ subtotal: 45000000, shippingPrice: 350000, totalAmount: 45350000 });
  });

  it("clamps shippingPrice to 0 when final_price is less than the item subtotal", () => {
    expect(computeOrderTotals({ ...raw, final_price: 44000000 })).toEqual({ subtotal: 45000000, shippingPrice: 0, totalAmount: 44000000 });
  });
});
