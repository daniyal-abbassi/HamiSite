"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Truck } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { ApiClientError, apiGet, apiPatch } from "@/lib/api-client";
import { formatFaDateTime, formatFaDate, paymentStatusTones } from "@/lib/content/order";
import { formatToman } from "@/lib/utils";
import type { OrderDetail } from "@/types/store";

const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPING", "COMPLETED", "CANCELED", "FAILED", "REVERSED"] as const;
const TERMINAL_STATUSES = ["CANCELED", "FAILED", "REVERSED"];

export function OrderAdminDetailClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [nextStatus, setNextStatus] = useState<string>("");
  const [trackingCode, setTrackingCode] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const data = await apiGet<OrderDetail>(`/api/orders/${orderId}`);
      setOrder(data);
      setNextStatus(data.status);
      setTrackingCode(data.shipping.trackingCode ?? "");
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.status === 404) {
        setFailed(true);
      } else {
        setError(apiErrorToFa(cause));
      }
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus() {
    if (!order || !nextStatus) return;
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      const updated = await apiPatch<OrderDetail>(`/api/admin/orders/${orderId}/status`, {
        status: nextStatus,
        ...(trackingCode.trim() !== "" ? { trackingCode: trackingCode.trim() } : {}),
      });
      setOrder(updated);
      setSavedMessage("وضعیت سفارش به‌روزرسانی شد.");
    } catch (cause) {
      setError(apiErrorToFa(cause));
    } finally {
      setSaving(false);
    }
  }

  if (failed) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-12 text-center text-sm text-destructive">
        سفارش پیدا نشد یا به آن دسترسی ندارید.
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    );
  }

  const isTerminal = TERMINAL_STATUSES.includes(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-line bg-ink-2/60 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground/70">ORDER</p>
            <h2 className="mt-1 font-mono text-xl font-black text-gold">{order.orderNumber}</h2>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              ثبت‌شده در {formatFaDateTime(order.createdAt)} · توسط {order.customer?.username ?? "—"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={order.status} kind="order" />
            <StatusBadge value={order.paymentStatus} kind="payment" />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
        {savedMessage && (
          <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-400">
            {savedMessage}
          </p>
        )}
      </div>

      {/* Status update */}
      <section className="rounded-2xl border border-line bg-ink-2/60 p-6">
        <h3 className="flex items-center gap-2 text-sm font-black">
          <Truck className="size-4 text-gold" />
          تغییر وضعیت سفارش
        </h3>
        <div className="brand-hairline my-4" />

        {isTerminal ? (
          <p className="text-[13px] text-muted-foreground">
            این سفارش در وضعیت پایانی ({order.status}) قرار دارد و قابل تغییر نیست.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="nextStatus" className="mb-1.5 block text-[11px] font-bold text-foreground/80">
                وضعیت جدید
              </label>
              <Select id="nextStatus" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
                {ORDER_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="trackingCode" className="mb-1.5 block text-[11px] font-bold text-foreground/80">
                کد رهگیری پستی (اختیاری)
              </label>
              <Input
                id="trackingCode"
                value={trackingCode}
                onChange={(event) => setTrackingCode(event.target.value)}
                placeholder="مثلاً ۸۷۴۲۳۱…"
                className="h-11"
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={() => void updateStatus()} loading={saving}>
                <Check className="size-4" />
                ذخیره وضعیت
              </Button>
              {order.shipping.trackingCode && (
                <span className="ms-3 font-mono text-[12px] text-gold">رهگیری فعلی: {order.shipping.trackingCode}</span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Items + totals */}
      <div className="rounded-2xl border border-line bg-ink-2/60 p-6">
        <h3 className="text-sm font-black">اقلام سفارش</h3>
        <div className="brand-hairline my-4" />
        <ul className="divide-y divide-line/70">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-3 text-[13px]">
              <span className="min-w-0">
                <span className="block font-bold">{item.productName}</span>
                {item.variantName && <span className="block text-[11px] text-muted-foreground">{item.variantName}</span>}
                <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                  {item.quantity.toLocaleString("fa-IR")} × {formatToman(item.price)}
                </span>
              </span>
              <strong className="shrink-0 font-mono text-[13px] text-gold">{formatToman(item.lineTotal)}</strong>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">جمع کالاها</dt>
            <dd className="font-mono">{formatToman(order.totals.subtotal)}</dd>
          </div>
          {order.totals.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <dt>تخفیف {order.coupon ? `(${order.coupon.code})` : ""}</dt>
              <dd className="font-mono">−{formatToman(order.totals.discountAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">ارسال</dt>
            <dd className="font-mono">{order.shipping.shippingPrice === 0 ? "رایگان" : formatToman(order.shipping.shippingPrice)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2.5 text-base">
            <dt className="font-black">مبلغ کل</dt>
            <dd className="font-black text-gold">{formatToman(order.totals.totalAmount)}</dd>
          </div>
        </dl>
      </div>

      {/* Address + payments */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-ink-2/60 p-6 text-[13px]">
          <h3 className="text-sm font-black">مشتری و آدرس</h3>
          <div className="brand-hairline my-4" />
          {order.address ? (
            <address className="not-italic leading-7 text-muted-foreground">
              <strong className="block text-foreground">
                {[order.address.firstName, order.address.lastName].filter(Boolean).join(" ") || "—"}
              </strong>
              {order.address.phoneNumber && <span className="block font-mono text-[12px]">{order.address.phoneNumber}</span>}
              <span className="block">
                {order.address.province ? `${order.address.province}، ` : ""}
                {order.address.city}، {order.address.address}
              </span>
              {order.address.postalCode && <span className="block font-mono text-[12px]">کد پستی: {order.address.postalCode}</span>}
            </address>
          ) : (
            <p className="text-muted-foreground">آدرس ذخیره‌ای درج نشده (تحویل حضوری؟).</p>
          )}
          <div className="mt-3 border-t border-line pt-3 text-[12px] text-muted-foreground">
            <p>نام کاربری: <span className="font-mono text-foreground/80">{order.customer?.username ?? "—"}</span></p>
            <p>موبایل: <span className="font-mono text-foreground/80">{order.customer?.phoneNumber ?? "—"}</span></p>
            {order.customerNote && <p className="mt-2">یادداشت: {order.customerNote}</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-ink-2/60 p-6">
          <h3 className="text-sm font-black">تاریخچه پرداخت</h3>
          <div className="brand-hairline my-4" />
          {order.payments.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">هنوز پرداختی ثبت نشده است.</p>
          ) : (
            <ul className="space-y-3">
              {order.payments.map((payment) => (
                <li key={payment.id} className="flex items-start justify-between gap-2 text-[12px]">
                  <span>
                    <span className="block font-mono">{payment.transactionNumber}</span>
                    <span className="block text-[11px] text-muted-foreground">{formatFaDate(payment.createdAt)}</span>
                  </span>
                  <span className="text-end">
                    <strong className="block font-mono">{formatToman(payment.amount)}</strong>
                    <span className={`text-[11px] font-bold ${paymentStatusTones[payment.status] ?? "text-muted-foreground"}`}>
                      {payment.status}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-center text-xs">
        <Link href="/admin/orders" className="flex items-center justify-center gap-1 text-[12px] font-bold text-gold hover:underline">
          <ArrowLeft className="size-3.5" /> بازگشت به فهرست سفارش‌ها
        </Link>
      </p>
    </div>
  );
}