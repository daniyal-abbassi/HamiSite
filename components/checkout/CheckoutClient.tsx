"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgePercent, Check, MapPin, RotateCcw, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { ApiClientError, apiGet, apiPost } from "@/lib/api-client";
import { paymentTermLabels, shippingOptions, type ShippingOptionKey } from "@/lib/content/order";
import { cn, formatToman } from "@/lib/utils";
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
    if (addressMode === "saved") return selectedAddressId === null ? "یک آدرس انتخاب کنید." : null;
    if (newAddress.city.trim().length < 2) return "شهر را وارد کنید.";
    if (newAddress.addressText.trim().length < 5) return "نشانی کامل را وارد کنید.";
    if (newAddress.phone.trim().length < 5) return "شماره تماس را وارد کنید.";
    return null;
  }, [addressMode, selectedAddressId, newAddress]);

  async function applyCoupon() {
    if (!cart || couponInput.trim() === "") return;
    setCouponChecking(true);
    setCouponMessage(null);
    try {
      const result = await apiPost<CouponValidation>("/api/coupons/validate", {
        code: couponInput.trim(),
        subtotal,
        productIds: cart.items.map((item) => item.productId),
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
      phone: saved?.phoneNumber || newAddress.phone || user?.phoneNumber || "",
      province: saved?.province || newAddress.province || undefined,
      city: saved?.city || newAddress.city,
      addressText: saved?.address || newAddress.addressText,
      postalCode: saved?.postalCode || newAddress.postalCode || undefined,
      shippingMethodName: shippingOption.label,
      shippingPrice: shippingOption.price,
      paymentTerm,
      paymentMethod: paymentTerm === "CASH" ? "card" : "credit",
      ...(coupon?.valid && coupon.coupon?.code ? { couponCode: coupon.coupon.code } : {}),
      ...(note.trim() !== "" ? { customerNote: note.trim() } : {}),
      items: cart.items.map((item) => ({
        productId: item.productId,
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
        window.location.href = payment.redirectUrl;
      } catch {
        // Order exists — never strand the user; the order page has a pay button.
        router.push(`/order/${order.id}`);
      }
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.code === "AUTH_REQUIRED") {
        router.replace("/login?next=/checkout");
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
        <ShoppingBag className="size-10 text-gold/60" />
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
            <span className="grid size-7 place-items-center rounded-full bg-gold/15 font-mono text-[11px] font-bold text-gold">۱</span>
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
                      ? "border-gold bg-gold/10"
                      : "border-line bg-foreground/5 hover:border-gold/40",
                  )}
                >
                  <input
                    type="radio"
                    name="address"
                    className="mt-1 accent-[#C9A227]"
                    checked={addressMode === "saved" && selectedAddressId === address.id}
                    onChange={() => {
                      setAddressMode("saved");
                      setSelectedAddressId(address.id);
                    }}
                  />
                  <span className="min-w-0 text-[13px] leading-6">
                    <strong className="block">
                      {address.firstName || user?.firstName} {address.lastName || user?.lastName} — {address.city}
                      {address.isDefault && <span className="ms-2 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] text-gold">پیش‌فرض</span>}
                    </strong>
                    <span className="block text-muted-foreground">{address.address}</span>
                  </span>
                </label>
              ))}
              <button
                type="button"
                onClick={() => setAddressMode("new")}
                className="text-xs font-bold text-gold underline-offset-4 hover:underline"
              >
                + افزودن آدرس جدید
              </button>
            </div>
          )}

          {(addressMode === "new" || (addresses ?? []).length === 0) && (
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="co-firstName" className="mb-1 block text-[11px] font-bold text-foreground/80">نام</label>
                <Input id="co-firstName" className={inputClass} value={newAddress.firstName} onChange={newAddressField("firstName")} autoComplete="given-name" />
              </div>
              <div>
                <label htmlFor="co-lastName" className="mb-1 block text-[11px] font-bold text-foreground/80">نام خانوادگی</label>
                <Input id="co-lastName" className={inputClass} value={newAddress.lastName} onChange={newAddressField("lastName")} autoComplete="family-name" />
              </div>
              <div>
                <label htmlFor="co-phone" className="mb-1 block text-[11px] font-bold text-foreground/80">شماره تماس *</label>
                <Input id="co-phone" className={inputClass} value={newAddress.phone} onChange={newAddressField("phone")} type="tel" autoComplete="tel" />
              </div>
              <div>
                <label htmlFor="co-city" className="mb-1 block text-[11px] font-bold text-foreground/80">شهر *</label>
                <Input id="co-city" className={inputClass} value={newAddress.city} onChange={newAddressField("city")} autoComplete="address-level2" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="co-province" className="mb-1 block text-[11px] font-bold text-foreground/80">استان</label>
                <Input id="co-province" className={inputClass} value={newAddress.province} onChange={newAddressField("province")} autoComplete="address-level1" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="co-addressText" className="mb-1 block text-[11px] font-bold text-foreground/80">نشانی کامل *</label>
                <Input id="co-addressText" className={inputClass} value={newAddress.addressText} onChange={newAddressField("addressText")} autoComplete="street-address" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="co-postalCode" className="mb-1 block text-[11px] font-bold text-foreground/80">کد پستی</label>
                <Input id="co-postalCode" className={inputClass} value={newAddress.postalCode} onChange={newAddressField("postalCode")} autoComplete="postal-code" />
              </div>
              {(addresses ?? []).length > 0 && (
                <button
                  type="button"
                  onClick={() => setAddressMode("saved")}
                  className="text-xs font-bold text-gold underline-offset-4 hover:underline sm:col-span-2"
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
            <span className="grid size-7 place-items-center rounded-full bg-gold/15 font-mono text-[11px] font-bold text-gold">۲</span>
            <h2 className="flex items-center gap-2 text-base font-black">
              <Truck className="size-4 text-gold" />
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
                  shippingKey === option.key ? "border-gold bg-gold/10" : "border-line bg-foreground/5 hover:border-gold/40",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <input
                    type="radio"
                    name="shipping"
                    className="accent-[#C9A227]"
                    checked={shippingKey === option.key}
                    onChange={() => setShippingKey(option.key)}
                  />
                  <strong className="text-[13px]">{option.label}</strong>
                </span>
                <span className="mt-2 block font-mono text-[11px] text-gold">
                  {option.price === 0 ? "رایگان" : formatToman(option.price)}
                </span>
                <span className="mt-1 block text-[11px] text-muted-foreground">{option.note}</span>
              </label>
            ))}
          </div>
        </section>

        {/* ۳ — کوپن */}
        <section className="glass rounded-2xl p-6">
          <header className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-full bg-gold/15 font-mono text-[11px] font-bold text-gold">۳</span>
            <h2 className="flex items-center gap-2 text-base font-black">
              <BadgePercent className="size-4 text-gold" />
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
            <p className={cn("mt-3 text-xs", coupon?.valid ? "text-emerald-400" : "text-muted-foreground")} aria-live="polite">
              {couponMessage}
            </p>
          )}
        </section>

        {/* ۴ — پرداخت */}
        <section className="glass rounded-2xl p-6">
          <header className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-full bg-gold/15 font-mono text-[11px] font-bold text-gold">۴</span>
            <h2 className="text-base font-black">پرداخت</h2>
          </header>
          <div className="brand-hairline my-4" />
          {isWholesale ? (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {(["CASH", "CREDIT_60_DAYS"] as const).map((term) => (
                <label
                  key={term}
                  className={cn(
                    "cursor-pointer rounded-xl border p-3.5 text-[13px] transition-all duration-fast",
                    paymentTerm === term ? "border-gold bg-gold/10" : "border-line bg-foreground/5 hover:border-gold/40",
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="paymentTerm"
                      className="accent-[#C9A227]"
                      checked={paymentTerm === term}
                      onChange={() => setPaymentTerm(term)}
                    />
                    <strong>{paymentTermLabels[term]}</strong>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">پرداخت آنلاین از طریق درگاه امن انجام می‌شود.</p>
          )}
          <div className="mt-4">
            <label htmlFor="co-note" className="mb-1 block text-[11px] font-bold text-foreground/80">یادداشت سفارش (اختیاری)</label>
            <Input id="co-note" className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} placeholder="مثلاً زمان مناسب تحویل…" />
          </div>
        </section>
      </div>

      {/* Summary */}
      <aside className="glass h-fit rounded-2xl p-6 lg:sticky lg:top-24">
        <h2 className="text-base font-black">سفارش شما</h2>
        <div className="brand-hairline my-4" />
        <ul className="max-h-52 space-y-2.5 overflow-y-auto pe-1">
          {cart.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-2 text-[12px]">
              <span className="min-w-0">
                <span className="block truncate font-bold">{item.product.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {[item.variant?.storage, item.variant?.color].filter(Boolean).join(" — ") || "—"} ×{" "}
                  {item.quantity.toLocaleString("fa-IR")}
                </span>
              </span>
              <span className="shrink-0 font-mono text-muted-foreground">{formatToman(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="brand-hairline my-4" />
        <dl className="space-y-2.5 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">جمع کالاها</dt>
            <dd className="font-mono">{formatToman(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <dt>تخفیف</dt>
              <dd className="font-mono">−{formatToman(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">ارسال ({shippingOption.label})</dt>
            <dd className="font-mono">{shippingOption.price === 0 ? "رایگان" : formatToman(shippingOption.price)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base">
            <dt className="font-black">مبلغ نهایی</dt>
            <dd className="font-black text-gold" aria-live="polite">
              {formatToman(total)}
            </dd>
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
        <p className="mt-3 text-center text-[10px] leading-5 text-muted-foreground/70">
          با ثبت سفارش، موجودی رزرو و در صورت لغو به انبار بازگردانده می‌شود.
        </p>
      </aside>
    </div>
  );
}
