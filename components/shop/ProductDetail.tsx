"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Minus, Phone, Plus, RotateCcw, ShoppingBag, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { ApiClientError, apiGet } from "@/lib/api-client";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { paymentTermLabels } from "@/lib/content/order";
import { stockLabels } from "@/lib/content/shop";
import { resolveProductImage } from "@/lib/product-images";
import { cn, formatToman, toFaDigits } from "@/lib/utils";
import type { ProductDetail as ProductData } from "@/types/store";

type Props = { slug: string };

/** B2B payment-term selector values (the API only accepts these two). */
const PAYMENT_TERMS = ["CASH", "CREDIT_60_DAYS"] as const;

export function ProductDetail({ slug }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentTerm, setPaymentTerm] = useState<(typeof PAYMENT_TERMS)[number]>("CASH");

  const [addState, setAddState] = useState<"idle" | "loading" | "done">("idle");
  const [actionError, setActionError] = useState<string | null>(null);

  const isWholesale = user?.role === "WHOLESALE";
  const effectiveTerm = isWholesale ? paymentTerm : "CASH";

  // The product endpoint resolves B2B price tiers per requested quantity +
  // paymentTerm, so quantity changes refetch and the price stays "alive".
  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setActionError(null);
    setLoading((prev) => prev || product === null);

    const params = new URLSearchParams({ quantity: String(quantity) });
    if (effectiveTerm !== "CASH") params.set("paymentTerm", effectiveTerm);

    apiGet<ProductData>(`/api/products/${slug}?${params.toString()}`)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        setSelectedVariantId((prev) =>
          data.variants.some((variant) => variant.id === prev)
            ? prev
            : (data.variants.find((variant) => variant.isDefault)?.id ?? data.variants[0]?.id ?? null),
        );
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `product` must not retrigger the fetch
  }, [slug, quantity, effectiveTerm, reloadKey]);

  const selectedVariant = useMemo(() => {
    if (!product || product.variants.length === 0) return null;
    return product.variants.find((variant) => variant.id === selectedVariantId) ?? null;
  }, [product, selectedVariantId]);

  const colors = useMemo(() => {
    if (!product) return [];
    return [...new Set(product.variants.map((variant) => variant.color).filter((color): color is string => Boolean(color)))];
  }, [product]);

  const storages = useMemo(() => {
    if (!product) return [];
    return [...new Set(product.variants.map((variant) => variant.storage).filter((storage): storage is string => Boolean(storage)))];
  }, [product]);

  const stockType = selectedVariant?.stockType ?? product?.stockType ?? "limited";
  const maxQuantity = stockType === "limited" ? (selectedVariant?.stock ?? product?.stock ?? null) : null;
  const purchasable = stockType !== "out_of_stock" && stockType !== "call";

  async function handleAddToCart() {
    if (!product) return;
    setAddState("loading");
    setActionError(null);
    try {
      await addItem(product.id, selectedVariant?.id, quantity);
      setAddState("done");
      window.setTimeout(() => setAddState("idle"), 1800);
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.code === "AUTH_REQUIRED") {
        router.push(`/login?next=${encodeURIComponent(`/shop/${slug}`)}`);
        return;
      }
      setActionError(apiErrorToFa(cause));
      setAddState("idle");
    }
  }

  function pickByColor(color: string) {
    if (!product) return;
    const sameStorage = product.variants.find(
      (variant) => variant.color === color && variant.storage === selectedVariant?.storage,
    );
    const next = sameStorage ?? product.variants.find((variant) => variant.color === color);
    if (next) setSelectedVariantId(next.id);
  }

  function pickByStorage(storage: string) {
    if (!product) return;
    const sameColor = product.variants.find(
      (variant) => variant.storage === storage && variant.color === selectedVariant?.color,
    );
    const next = sameColor ?? product.variants.find((variant) => variant.storage === storage);
    if (next) setSelectedVariantId(next.id);
  }

  function Chip({ active, children, onClick, label }: { active: boolean; children: React.ReactNode; onClick: () => void; label: string }) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={label}
        className={cn(
          "rounded-full border px-4 py-2 text-xs font-bold transition-all duration-fast",
          active
            ? "border-gold bg-gold/15 text-gold shadow-glow-gold"
            : "border-line bg-foreground/5 text-foreground/75 hover:border-gold/40 hover:text-foreground",
        )}
      >
        {children}
      </button>
    );
  }

  if (loading && !product) {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square max-w-lg rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-12 w-64 rounded-full" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (failed && !product) {
    return (
      <div className="glass mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl p-10 text-center">
        <TriangleAlert className="size-9 text-destructive" />
        <h2 className="text-lg font-black">محصول پیدا نشد</h2>
        <p className="text-sm text-muted-foreground">در بارگذاری این محصول مشکلی پیش آمد.</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
            <RotateCcw className="size-4" />
            تلاش دوباره
          </Button>
          <Link href="/shop">
            <Button size="sm" variant="oxblood">
              بازگشت به فروشگاه
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const unitPrice = selectedVariant ? selectedVariant.unitPrice : null;
  const compareAtPrice = selectedVariant?.compareAtPrice ?? null;
  const tier = selectedVariant?.matchedTier ?? null;
  const tierActive = Boolean(tier && tier.minQuantity > 1 && quantity >= tier.minQuantity && tier.calculatedPrice !== null && unitPrice !== tier.calculatedPrice);
  const variantTitle = [selectedVariant?.storage, selectedVariant?.color].filter(Boolean).join(" — ");

  return (
    <div>
      {/* Breadcrumb */}
      <nav aria-label="مسیر صفحه" className="mb-6 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground/70">
        <Link href="/" className="transition-colors hover:text-gold">خانه</Link>
        <span aria-hidden="true">/</span>
        <Link href="/shop" className="transition-colors hover:text-gold">فروشگاه</Link>
        {product.mainCategory && (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/shop?category=${product.mainCategory.slug}`} className="transition-colors hover:text-gold">
              {product.mainCategory.name}
            </Link>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span className="text-foreground/85">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-2xl glass shadow-card">
          {product.specialOffer && (
            <span className="absolute start-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-xl bg-oxblood/90 px-3 py-1.5 font-mono text-[9px] tracking-[0.12em] text-gold-lite">
              <Sparkles className="size-3" />
              SPECIAL OFFER
            </span>
          )}
          <Image
            src={resolveProductImage(product)}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 40vw, 90vw"
            className="object-contain p-8"
            priority
          />
        </div>

        {/* Buy box */}
        <div>
          <span className="font-mono text-[10px] tracking-[0.12em] text-gold/80">
            {product.brand?.name ?? "—"}
            {product.englishName ? ` · ${product.englishName}` : ""}
          </span>
          <h1 className="mt-2 text-2xl font-black leading-snug md:text-3xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-line bg-foreground/5 px-3 py-1", stockType === "out_of_stock" && "text-destructive")}>
              <i className={cn("size-1.5 rounded-full", stockType === "out_of_stock" ? "bg-destructive" : "bg-emerald-400")} aria-hidden="true" />
              {stockLabels[stockType] ?? "—"}
            </span>
            {selectedVariant?.guarantee && (
              <span className="rounded-full border border-line bg-foreground/5 px-3 py-1 text-muted-foreground">
                گارانتی: {selectedVariant.guarantee}
              </span>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-ink/40 p-5">
            {unitPrice !== null ? (
              <div className="flex flex-wrap items-baseline gap-3">
                {compareAtPrice != null && compareAtPrice > unitPrice && (
                  <del className="text-sm text-foreground/50">{formatToman(compareAtPrice)}</del>
                )}
                <strong className="text-2xl font-black text-gold" aria-live="polite">
                  {formatToman(unitPrice * quantity)}
                </strong>
                {quantity > 1 && (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    ({toFaDigits(quantity)} × {formatToman(unitPrice)})
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-4 text-gold" />
                برای استعلام قیمت تماس بگیرید
              </div>
            )}

            {tierActive && tier && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1.5 text-[11px] font-bold text-gold">
                <Check className="size-3.5" />
                قیمت عمده فعال شد
                {tier.discountPercent ? ` — ${toFaDigits(tier.discountPercent)}٪ تخفیف` : ""}
              </p>
            )}
          </div>

          {/* Variant selection */}
          {(colors.length > 0 || storages.length > 0) && (
            <div className="mt-6 space-y-4">
              {storages.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-[10px] tracking-[0.1em] text-muted-foreground/70">حافظه</p>
                  <div className="flex flex-wrap gap-2">
                    {storages.map((storage) => (
                      <Chip key={storage} label={`حافظه ${storage}`} active={selectedVariant?.storage === storage} onClick={() => pickByStorage(storage)}>
                        {storage}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
              {colors.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-[10px] tracking-[0.1em] text-muted-foreground/70">رنگ</p>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <Chip key={color} label={`رنگ ${color}`} active={selectedVariant?.color === color} onClick={() => pickByColor(color)}>
                        {color}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
              {isWholesale && (
                <div>
                  <p className="mb-2 font-mono text-[10px] tracking-[0.1em] text-muted-foreground/70">نوع تسویه</p>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_TERMS.map((term) => (
                      <Chip key={term} label={paymentTermLabels[term]} active={paymentTerm === term} onClick={() => setPaymentTerm(term)}>
                        {paymentTermLabels[term]}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity + add to cart */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1 rounded-full border border-line bg-ink/40 p-1.5">
              <button
                type="button"
                aria-label="کاهش تعداد"
                disabled={quantity <= 1 || addState === "loading"}
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="grid size-9 place-items-center rounded-full text-foreground/75 transition-colors duration-fast hover:bg-foreground/10 disabled:opacity-40"
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-9 text-center font-mono text-base" aria-live="polite">
                {toFaDigits(quantity)}
              </span>
              <button
                type="button"
                aria-label="افزایش تعداد"
                disabled={addState === "loading" || (maxQuantity !== null && quantity >= maxQuantity)}
                onClick={() => setQuantity((value) => value + 1)}
                className="grid size-9 place-items-center rounded-full text-foreground/75 transition-colors duration-fast hover:bg-foreground/10 disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <Button
              size="lg"
              className="min-w-52 flex-1"
              loading={addState === "loading"}
              disabled={!purchasable || addState === "done"}
              onClick={() => void handleAddToCart()}
            >
              {addState === "done" ? (
                <>
                  <Check className="size-5" />
                  به سبد اضافه شد
                </>
              ) : (
                <>
                  <ShoppingBag className="size-5" />
                  {purchasable ? "افزودن به سبد خرید" : "ناموجود"}
                </>
              )}
            </Button>
          </div>

          {maxQuantity !== null && purchasable && (
            <p className="mt-2.5 text-[11px] text-muted-foreground/70">
              حداکثر {toFaDigits(maxQuantity)} عدد در انبار موجود است.
            </p>
          )}

          {actionError && (
            <p role="alert" className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {actionError}
            </p>
          )}

        </div>
      </div>

      {/* Description / analysis / tags */}
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {product.description && (
          <section className="glass rounded-2xl p-6">
            <h2 className="text-base font-black">توضیحات محصول</h2>
            <div className="brand-hairline my-3.5" />
            <p className="whitespace-pre-line text-sm leading-8 text-muted-foreground">{product.description}</p>
          </section>
        )}
        {product.analysis && (
          <section className="glass rounded-2xl p-6">
            <h2 className="text-base font-black">مشخصات و آنالیز</h2>
            <div className="brand-hairline my-3.5" />
            <p className="whitespace-pre-line text-sm leading-8 text-muted-foreground">{product.analysis}</p>
          </section>
        )}
      </div>

      {product.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground/70">برچسب‌ها:</span>
          {product.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-line bg-foreground/5 px-3 py-1 font-mono text-[10px] text-foreground/70">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
