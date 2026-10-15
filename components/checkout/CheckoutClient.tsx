"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgePercent, Check, MapPin, RotateCcw, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TomanPrice } from "@/components/ui/TomanPrice";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { ApiClientError, apiGet, apiPost } from "@/lib/api-client";
import { checkoutAddressError } from "@/lib/checkout-validation";
import { paymentTermLabels, shippingOptions, type ShippingOptionKey } from "@/lib/content/order";
import { cn, formatToman } from "@/lib/utils";
import { normalizePersianDigits } from "@/lib/persian-typography";
import type { Address, CouponValidation, OrderCreationResult, PaymentInitiation } from "@/types/store";

type NewAddress = {
  firstName: string;
  lastName: string;
  phone: string;
  province: string;
  city: string;
  addressText: string;
  postalCode: string;
};

const EMPTY_ADDRESS: NewAddress = {
  firstName: "",
  lastName: "",
  phone: "",
  province: "",
  city: "",
  addressText: "",
  postalCode: "",
};

export function CheckoutClient() {
  const router = useRouter();
  const { user, status } = useAuth();
  const { cart, loading: cartLoading, hasCart, clear } = useCart();

  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [addressMode, setAddressMode] = useState<"saved" | "new">("new");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [newAddress, setNewAddress] = useState<NewAddress>(EMPTY_ADDRESS);

  const [shippingKey, setShippingKey] = useState<ShippingOptionKey>("post");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [paymentTerm, setPaymentTerm] = useState<"CASH" | "CREDIT_60_DAYS">("CASH");
  const [note, setNote] = useState("");

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isWholesale = user?.role === "WHOLESALE";
  const shippingOption = shippingOptions.find((option) => option.key === shippingKey) ?? shippingOptions[0];

  // Auth guard: the cart/order APIs are all withAuth.
  useEffect(() => {
    if (status === "guest") {
      router.replace(`/login?next=${encodeURIComponent("/checkout")}`);
    }
  }, [status, router]);

  // Saved addresses + prefill the manual form from the profile.
  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    let cancelled = false;
    apiGet<Address[]>("/api/addresses")
      .then((list) => {
        if (cancelled) return;
        setAddresses(list);
        const fallback = list.find((address) => address.isDefault) ?? list[0];
        if (fallback) {
          setAddressMode("saved");
          setSelectedAddressId(fallback.id);
        }
        setNewAddress((prev) => ({
          ...prev,
          firstName: prev.firstName || (user.firstName ?? ""),
          lastName: prev.lastName || (user.lastName ?? ""),
          phone: prev.phone || user.phoneNumber,
          city: prev.city || (user.city ?? ""),
        }));
      })
      .catch(() => {
        if (!cancelled) setAddresses([]);
      });
    return () => {
      cancelled = true;
    };
  }, [status, user]);

  const subtotal = cart?.subtotal ?? 0;
  const discount = coupon?.valid ? coupon.discountAmount : 0;
  const total = Math.max(0, subtotal - discount) + shippingOption.price;

  const addressError = useMemo(() => {
    return checkoutAddressError(addressMode, selectedAddressId, newAddress);
  }, [addressMode, selectedAddressId, newAddress]);

  async function applyCoupon() {
    if (!cart || couponInput.trim() === "") return;
    setCouponChecking(true);
    setCouponMessage(null);
    try {
      const result = await apiPost<CouponValidation>("/api/coupons/validate", {
        code: couponInput.trim(),
        subtotal,
        productIds: cart.items.map((item) => item.productId).filter((id): id is number => typeof id === "number"),
      });
      setCoupon(result);
      setCouponMessage(
        result.valid
          ? `کد تخفیف اعمال شد — ${formatToman(result.discountAmount)} تخفیف.`
          : "این کد تخفیف قابل اعمال نیست.",
      );
    } catch (cause) {
      setCoupon(null);
      setCouponMessage(apiErrorToFa(cause));
    } finally {
      setCouponChecking(false);
    }
  }

  async function placeOrder() {
    if (!cart) return;
    if (addressError) {
      setError(addressError);
      return;
    }
    setPlacing(true);
    setError(null);

    const saved = addressMode === "saved" ? (addresses ?? []).find((a) => a.id === selectedAddressId) ?? null : null;

    // The order schema requires inline contact/address fields even when an
    // addressId is linked, so both are always sent (prefilled from the record).
    const payload: Record<string, unknown> = {
      firstName: saved?.firstName || newAddress.firstName || user?.firstName || "",
      lastName: saved?.lastName || newAddress.lastName || user?.lastName || "",
      phone: normalizePersianDigits(saved?.phoneNumber || newAddress.phone || user?.phoneNumber || ""),
      province: saved?.province || newAddress.province || undefined,
      city: saved?.city || newAddress.city,
      addressText: saved?.address || newAddress.addressText,
      postalCode: normalizePersianDigits(saved?.postalCode || newAddress.postalCode || "") || undefined,
      shippingMethodName: shippingOption.label,
      shippingPrice: shippingOption.price,
      paymentTerm,
      paymentMethod: paymentTerm === "CASH" ? "card" : "credit",
      ...(coupon?.valid && coupon.coupon?.code ? { couponCode: coupon.coupon.code } : {}),
      ...(note.trim() !== "" ? { customerNote: note.trim() } : {}),
      items: cart.items.map((item) => ({
        bundleId: item.bundleId ?? undefined,
        productId: item.productId ?? undefined,
        variantId: item.variantId ?? undefined,
        quantity: item.quantity,
      })),
    };
    if (saved) payload.addressId = saved.id;

    try {
      const order = await apiPost<OrderCreationResult>("/api/orders", payload);
      // Order placed — the server cart's job is done.
      await clear();

      // B2B credit orders settle off-gateway; everything else goes to the
      // gateway redirect (dev: mock auto-confirm → callback; prod: Zarinpal).
      if (paymentTerm === "CREDIT_60_DAYS") {
        router.push(`/order/${order.id}`);
        return;
      }
      try {
        const payment = await apiPost<PaymentInitiation>(`/api/orders/${order.id}/pay`);
        if (payment.free) {
          router.push(`/payment/result?payment=success&orderId=${payment.orderId}`);
        } else {
          window.location.href = payment.redirectUrl;
        }
      } catch {
        // Order exists — never strand the user; the order page has a pay button.
        router.push(`/order/${order.id}`);
      }
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.code === "AUTH_REQUIRED") {
      router.replace(`/login?next=${encodeURIComponent("/checkout")}`);
        return;
      }
      setError(apiErrorToFa(cause));
      setPlacing(false);
    }
  }

  if (status === "loading" || (cartLoading && status === "authenticated" && !cart)) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (status === "guest") return null; // redirecting to login

  if (!cart || cart.items.length === 0) {
    return (
      <div className="glass mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl p-10 text-center">
        <ShoppingBag className="size-10 text-aqua/60" />
        <h2 className="text-lg font-black">سبد خرید خالی است</h2>
        <p className="text-sm text-muted-foreground">برای تسویه حساب ابتدا محصولی به سبد اضافه کنید.</p>
        <Link href="/shop">
          <Button variant="oxblood">مشاهده محصولات</Button>
        </Link>
      </div>
    );
  }

  const inputClass = "h-10";
  const newAddressField = (field: keyof NewAddress) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setNewAddress((prev) => ({ ...prev, [field]: event.target.value }));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {/* ۱ — آدرس */}
        <section className="glass rounded-2xl p-6">
          <header className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-full bg-aqua/15 font-mono text-xs font-bold text-aqua">۱</span>
            <h2 className="text-base font-black">اطلاعات تماس و آدرس</h2>
          </header>
          <div className="brand-hairline my-4" />

          {(addresses ?? []).length > 0 && (
            <div className="mb-4 space-y-2.5">
              {(addresses ?? []).map((address) => (
                <label
                  key={address.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all duration-fast",
                    addressMode === "saved" && selectedAddressId === address.id
                      ? "border-aqua bg-aqua/10"
                      : "border-line bg-foreground/5 hover:border-aqua/40",
                  )}
                >
                  <input
                    type="radio"
                    name="address"
                    className="mt-1 accent-brass"
                    checked={addressMode === "saved" && selectedAddressId === address.id}
                    onChange={() => {
                      setAddressMode("saved");
                      setSelectedAddressId(address.id);
                    }}
                  />
                  <span className="min-w-0 type-label">
                    <strong className="block">
                      {address.firstName || user?.firstName} {address.lastName || user?.lastName} — {address.city}
                      {address.isDefault && <span className="ms-2 rounded-full bg-aqua/15 px-2 py-0.5 text-xs text-aqua">پیش‌فرض</span>}
                    </strong>
                    <span className="block text-muted-foreground">{address.address}</span>
                  </span>
                </label>
              ))}
              <button
                type="button"
                onClick={() => setAddressMode("new")}
                className="text-xs font-bold text-aqua underline-offset-4 hover:underline"
              >
                + افزودن آدرس جدید
              </button>
            </div>
          )}

          {(addressMode === "new" || (addresses ?? []).length === 0) && (
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="co-firstName" className="type-label mb-1 block font-bold text-foreground/80">نام</label>
                <Input id="co-firstName" className={inputClass} value={newAddress.firstName} onChange={newAddressField("firstName")} autoComplete="given-name" />
              </div>
              <div>
                <label htmlFor="co-lastName" className="type-label mb-1 block font-bold text-foreground/80">نام خانوادگی</label>
                <Input id="co-lastName" className={inputClass} value={newAddress.lastName} onChange={newAddressField("lastName")} autoComplete="family-name" />
              </div>
              <div>
                <label htmlFor="co-phone" className="type-label mb-1 block font-bold text-foreground/80">شماره تماس *</label>
                <Input id="co-phone" className={inputClass} value={newAddress.phone} onChange={newAddressField("phone")} type="tel" inputMode="tel" dir="ltr" autoComplete="tel" />
              </div>
              <div>
                <label htmlFor="co-city" className="type-label mb-1 block font-bold text-foreground/80">شهر *</label>
                <Input id="co-city" className={inputClass} value={newAddress.city} onChange={newAddressField("city")} autoComplete="address-level2" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="co-province" className="type-label mb-1 block font-bold text-foreground/80">استان</label>
                <Input id="co-province" className={inputClass} value={newAddress.province} onChange={newAddressField("province")} autoComplete="address-level1" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="co-addressText" className="type-label mb-1 block font-bold text-foreground/80">نشانی کامل *</label>
                <Input id="co-addressText" className={inputClass} value={newAddress.addressText} onChange={newAddressField("addressText")} autoComplete="street-address" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="co-postalCode" className="type-label mb-1 block font-bold text-foreground/80">کد پستی</label>
                {/* An Iranian postal code is ten digits. Without inputMode the
                    phone opens a full alphabetic keyboard for a field that can
                    only ever take numbers; without `dir="ltr"` the digits render
                    right-to-left and a pasted code reads backwards; and without
                    the hint the shopper has to guess the length. FR-064. */}
                <Input
                  id="co-postalCode"
                  className={inputClass}
                  inputMode="numeric"
                  dir="ltr"
                  maxLength={10}
                  placeholder="۱۰ رقم"
                  aria-describedby="co-postalCode-hint"
                  value={newAddress.postalCode}
                  onChange={newAddressField("postalCode")}
                  autoComplete="postal-code"
                />
                <span id="co-postalCode-hint" className="type-label mt-1 block text-muted-foreground">
                  کد پستی ۱۰ رقمی (اختیاری)
                </span>
              </div>
              {(addresses ?? []).length > 0 && (
                <button
                  type="button"
                  onClick={() => setAddressMode("saved")}
                  className="text-xs font-bold text-aqua underline-offset-4 hover:underline sm:col-span-2"
                >
                  استفاده از آدرس‌های ذخیره‌شده
                </button>
              )}
            </div>
          )}
        </section>

        {/* ۲ — ارسال */}
        <section className="glass rounded-2xl p-6">
          <header className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-full bg-aqua/15 font-mono text-xs font-bold text-aqua">۲</span>
            <h2 className="flex items-center gap-2 text-base font-black">
              <Truck className="size-4 text-aqua" />
              روش ارسال
            </h2>
          </header>
          <div className="brand-hairline my-4" />
          <div className="grid gap-2.5 sm:grid-cols-3">
            {shippingOptions.map((option) => (
              <label
                key={option.key}
                className={cn(
                  "cursor-pointer rounded-xl border p-3.5 transition-all duration-fast",
                  shippingKey === option.key ? "border-aqua bg-aqua/10" : "border-line bg-foreground/5 hover:border-aqua/40",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <input
                    type="radio"
                    name="shipping"
                    className="accent-brass"
                    checked={shippingKey === option.key}
                    onChange={() => setShippingKey(option.key)}
                  />
                  <strong className="text-[13px]">{option.label}</strong>
                </span>
                <span className="mt-2 block type-label text-aqua">
                  {option.price === 0 ? "رایگان" : <TomanPrice amount={option.price} />}
                </span>
                <span className="type-label mt-1 block text-muted-foreground">{option.note}</span>
              </label>
            ))}
          </div>
        </section>

        {/* ۳ — کوپن */}
        <section className="glass rounded-2xl p-6">
          <header className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-full bg-aqua/15 font-mono text-xs font-bold text-aqua">۳</span>
            <h2 className="flex items-center gap-2 text-base font-black">
              <BadgePercent className="size-4 text-aqua" />
              کد تخفیف
            </h2>
          </header>
          <div className="brand-hairline my-4" />
          <div className="flex gap-2.5">
            <Input
              className={cn(inputClass, "flex-1 font-mono")}
              placeholder="کد تخفیف…"
              value={couponInput}
              onChange={(event) => setCouponInput(event.target.value)}
              aria-label="کد تخفیف"
            />
            <Button variant="ghost" loading={couponChecking} onClick={() => void applyCoupon()}>
              اعمال
            </Button>
          </div>
          {couponMessage && (
            <p className={cn("type-label mt-3", coupon?.valid ? "text-emerald-400" : "text-muted-foreground")} aria-live="polite">
              {couponMessage}
            </p>
          )}
        </section>

        {/* ۴ — پرداخت */}
        <section className="glass rounded-2xl p-6">
          <header className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-full bg-aqua/15 font-mono text-xs font-bold text-aqua">۴</span>
            <h2 className="text-base font-black">پرداخت</h2>
          </header>
          <div className="brand-hairline my-4" />
          {isWholesale ? (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {(["CASH", "CREDIT_60_DAYS"] as const).map((term) => (
                <label
                  key={term}
                  className={cn(
                    "cursor-pointer rounded-xl border p-3.5 type-label transition-all duration-fast",
                    paymentTerm === term ? "border-aqua bg-aqua/10" : "border-line bg-foreground/5 hover:border-aqua/40",
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="paymentTerm"
                      className="accent-brass"
                      checked={paymentTerm === term}
                      onChange={() => setPaymentTerm(term)}
                    />
                    <strong>{paymentTermLabels[term]}</strong>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="type-label text-muted-foreground">
              پس از ثبت سفارش، برای پرداخت آنلاین به درگاه زرین‌پال منتقل می‌شوید.
            </p>
          )}
          <div className="mt-4">
            <label htmlFor="co-note" className="type-label mb-1 block font-bold text-foreground/80">یادداشت سفارش (اختیاری)</label>
            <Input id="co-note" className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} placeholder="مثلاً زمان مناسب تحویل…" />
          </div>
        </section>
      </div>

      {/* Summary */}
      {/* T097 / FR-044: the summary used to carry `order-first` below `lg`, so on a
          phone it painted above the address and shipping controls that come earlier
          in the DOM — keyboard and screen-reader order ran one way and the screen the
          other. The order override is gone; on a phone the summary now follows the
          controls, which is also the reading order of a checkout. */}
      <aside className="glass h-fit rounded-2xl p-6 lg:sticky lg:top-24">
        <h2 className="type-section">سفارش شما</h2>
        <div className="brand-hairline my-4" />
        <ul className="max-h-52 space-y-2.5 overflow-y-auto pe-1">
          {cart.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-2 type-label">
              <span className="min-w-0">
                <span className="block truncate font-bold">
                  {item.isBundle ? `سبد: ${item.bundleTitle}` : item.product?.name ?? "کالا"}
                </span>
                <span className="text-muted-foreground">
                  {item.isBundle
                    ? `${item.bundleItems?.length ?? 0} قلم کالا`
                    : [item.variant?.storage, item.variant?.color].filter(Boolean).join(" — ") || "—"}{" "}
                  × {item.quantity.toLocaleString("fa-IR")}
                </span>
              </span>
              <span className="shrink-0 text-muted-foreground"><TomanPrice amount={item.lineTotal} /></span>
            </li>
          ))}
        </ul>
        <div className="brand-hairline my-4" />
        <dl className="space-y-2.5 type-label">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">جمع کالاها</dt>
            <dd><TomanPrice amount={subtotal} /></dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <dt>تخفیف</dt>
              <dd><TomanPrice amount={-discount} /></dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">ارسال ({shippingOption.label})</dt>
            <dd>{shippingOption.price === 0 ? "رایگان" : <TomanPrice amount={shippingOption.price} />}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base">
            <dt className="font-black">مبلغ نهایی</dt>
            <dd aria-live="polite"><TomanPrice className="type-price text-aqua" amount={total} /></dd>
          </div>
        </dl>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button size="lg" className="mt-5 w-full" loading={placing} onClick={() => void placeOrder()}>
          <Check className="size-5" />
          ثبت نهایی سفارش
        </Button>
        <p className="mt-3 text-center text-xs leading-5 text-muted-foreground/70">
          با ثبت سفارش، موجودی رزرو و در صورت لغو به انبار بازگردانده می‌شود.
        </p>
      </aside>
    </div>
  );
}
