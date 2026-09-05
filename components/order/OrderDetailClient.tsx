"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, MapPin, PackageCheck, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { ApiClientError, apiGet, apiPost } from "@/lib/api-client";
import { formatFaDate, formatFaDateTime, orderStatusLabels, orderStatusTone, paymentStatusLabels, paymentStatusTones } from "@/lib/content/order";
import { formatToman } from "@/lib/utils";
import type { OrderDetail, PaymentInitiation } from "@/types/store";

const TERMINAL_STATUSES = ["CANCELED", "FAILED", "REVERSED"];

function Badge({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-foreground/5 px-3 py-1 text-[11px] font-bold ${tone}`}>
      {label}
    </span>
  );
}

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { status } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setOrder(await apiGet<OrderDetail>(`/api/orders/${orderId}`));
    } catch (cause) {
      if (cause instanceof ApiClientError && (cause.code === "AUTH_REQUIRED" || cause.status === 401)) {
        router.replace(`/login?next=${encodeURIComponent(`/order/${orderId}`)}`);
        return;
      }
      setFailed(true);
      setError(apiErrorToFa(cause, "سفارش پیدا نشد یا به آن دسترسی ندارید."));
    } finally {
      setLoading(false);
    }
  }, [orderId, router, reloadKey]);

  useEffect(() => {
    if (status === "guest") {
      router.replace(`/login?next=${encodeURIComponent(`/order/${orderId}`)}`);
      return;
    }
    if (status === "authenticated") void load();
  }, [status, load, orderId, router]);

  async function pay() {
    setPaying(true);
    setError(null);
    try {
      const payment = await apiPost<PaymentInitiation>(`/api/orders/${orderId}/pay`);
      window.location.href = payment.redirectUrl;
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.code === "AUTH_REQUIRED") {
        router.replace(`/login?next=${encodeURIComponent(`/order/${orderId}`)}`);
        return;
      }
      setError(apiErrorToFa(cause));
      setPaying(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (status === "guest") return null; // redirecting

  if (failed || !order) {
    return (
      <div className="glass mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl p-10 text-center">
        <TriangleAlert className="size-9 text-destructive" />
        <h2 className="text-lg font-black">سفارش یافت نشد</h2>
        <p className="text-sm text-muted-foreground">{error ?? "به این سفارش دسترسی ندارید."}</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
            <RotateCcw className="size-4" />
            تلاش دوباره
          </Button>
          <Link href="/shop">
            <Button size="sm" variant="oxblood">بازگشت به فروشگاه</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canPay = order.paymentStatus !== "COMPLETED" && !TERMINAL_STATUSES.includes(order.status);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header card */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground/70">ORDER</p>
            <h2 className="mt-1 font-mono text-lg font-black text-gold">{order.orderNumber}</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">ثبت‌شده در {formatFaDateTime(order.createdAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge label={orderStatusLabels[order.status] ?? order.status} tone={orderStatusTone(order.status)} />
            <Badge
              label={paymentStatusLabels[order.paymentStatus] ?? order.paymentStatus}
              tone={paymentStatusTones[order.paymentStatus] ?? "text-muted-foreground"}
            />
          </div>
        </div>

        {canPay && (
          <div className="mt-5 rounded-xl border border-gold/40 bg-gold/10 p-4">
            <p className="text-[13px] leading-6">این سفارش هنوز پرداخت نشده است. برای ادامه فرایند، پرداخت را انجام دهید.</p>
            <Button className="mt-3" loading={paying} onClick={() => void pay()}>
              <CreditCard className="size-4" />
              پرداخت سفارش
            </Button>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      {/* Items */}
      <div className="glass mt-6 rounded-2xl p-6">
        <h3 className="flex items-center gap-2 text-base font-black">
          <PackageCheck className="size-4 text-gold" />
          اقلام سفارش
        </h3>
        <div className="brand-hairline my-4" />
        <ul className="divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-3 text-[13px]">
              <span className="min-w-0">
                <span className="block font-bold">{item.productName}</span>
                {item.variantName && <span className="block text-[11px] text-muted-foreground">{item.variantName}</span>}
                <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                  {item.quantity.toLocaleString("fa-IR")} × {formatToman(item.price)}
                </span>
              </span>
              <strong className="shrink-0 text-gold">{formatToman(item.lineTotal)}</strong>
            </li>
          ))}
        </ul>

        <div className="brand-hairline my-4" />
        <dl className="space-y-2 text-[13px]">
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
            <dt className="text-muted-foreground">ارسال{order.shipping.methodName ? ` (${order.shipping.methodName})` : ""}</dt>
            <dd className="font-mono">
              {order.shipping.shippingPrice === 0 ? "رایگان" : formatToman(order.shipping.shippingPrice)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2.5 text-base">
            <dt className="font-black">مبلغ کل</dt>
            <dd className="font-black text-gold">{formatToman(order.totals.totalAmount)}</dd>
          </div>
        </dl>
      </div>

      {/* Shipping / address / payments */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <h3 className="flex items-center gap-2 text-sm font-black">
            <MapPin className="size-4 text-gold" />
            آدرس تحویل
          </h3>
          <div className="brand-hairline my-3.5" />
          {order.address ? (
            <address className="text-[13px] not-italic leading-7 text-muted-foreground">
              <strong className="block text-foreground">
                {order.address.firstName} {order.address.lastName}
              </strong>
              {order.address.phoneNumber && <span className="block font-mono text-[12px]">{order.address.phoneNumber}</span>}
              <span className="block">
                {order.address.province ? `${order.address.province}، ` : ""}
                {order.address.city}، {order.address.address}
              </span>
              {order.address.postalCode && <span className="block font-mono text-[12px]">کد پستی: {order.address.postalCode}</span>}
            </address>
          ) : (
            <p className="text-[13px] leading-7 text-muted-foreground">
              {order.customer.username ? `${order.customer.username} — ` : ""}
              تحویل حضوری / بدون آدرس ذخیره‌شده
            </p>
          )}
          {order.shipping.trackingCode && (
            <p className="mt-3 rounded-lg bg-ink/50 px-3 py-2 font-mono text-[12px] text-gold">
              کد رهگیری پستی: {order.shipping.trackingCode}
            </p>
          )}
          {order.customerNote && <p className="mt-3 text-[12px] leading-6 text-muted-foreground">یادداشت: {order.customerNote}</p>}
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-black">تاریخچه پرداخت</h3>
          <div className="brand-hairline my-3.5" />
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
                      {paymentStatusLabels[payment.status] ?? payment.status}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/shop" className="text-xs font-bold text-gold underline-offset-4 hover:underline">
          ادامه خرید از فروشگاه ←
        </Link>
      </div>
    </div>
  );
}
