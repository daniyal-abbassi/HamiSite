"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, Minus, Phone, Plus, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { ApiClientError } from "@/lib/api-client";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { stockLabels } from "@/lib/content/shop";
import { storeContact } from "@/lib/content/contact";
import { storeWarranty } from "@/lib/content/verified-facts";
import { PLACEHOLDER_ALT, PLACEHOLDER_LABEL, isPlaceholderImage, resolveProductImage } from "@/lib/product-images";
import { compareAtOf, isPurchasable, unitPriceOf } from "@/lib/product-identity";
import { cn, formatToman, toFaDigits } from "@/lib/utils";
import { DataCurrencyNote } from "@/components/shop/DataCurrencyNote";
/*
 * The record is typed by the seam itself — `ReturnType<typeof serializeProduct>`.
 * This component used to be typed `apiGet<ProductDetail>` against `types/store.ts`,
 * which still describes the pre-seam Prisma payload, and that unchecked cast is
 * what let `selectedVariant.unitPrice` compile while the server sent no such key:
 * every product page then printed «قیمت فروشگاه» instead of a price. Importing the
 * real shape makes the next field rename a build error instead of a wrong number.
 *
 * `types/store.ts` is deliberately left as it is — the admin product form still
 * reads the old shape and the back office is out of scope.
 */
import type { CatalogProduct } from "@/lib/catalog";

type Props = { product: CatalogProduct };

/**
 * The number as text a shopper can take with them. FR-039: the contact action MUST
 * work on a device where placing a call is not possible, and until this existed the
 * digits were only ever renderable, never copyable.
 */
function CopyPhoneButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        // The international form, because that is what a dialer or another shop
        // needs; `phoneDisplay` is the Persian-digit reading of the same number.
        void navigator.clipboard?.writeText(storeContact.phoneHref.replace("tel:", "+"));
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }}
      className="inline-flex items-center gap-1.5 rounded-xl border border-champagne/25 px-4 py-3 text-xs font-bold text-foreground/80 transition-colors hover:border-champagne/50"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "کپی شد" : "کپی شماره"}
    </button>
  );
}

/**
 * The product page.
 *
 * It used to fetch itself. `/shop` and this route prerendered a shell and called
 * `/api/products/*` from an effect after hydration, which is the round-trip
 * Constitution III forbids and the seam where the price defect had hidden. The
 * record now arrives from `app/(main)/shop/[slug]/page.tsx`, which reads it through
 * the seam and returns a real 404 when the slug matches nothing — so there is no
 * loading state, no fetch-failure state, and no «محصول پیدا نشد» that is actually
 * a network error.
 *
 * The B2B payment-term selector went with the fetch. It existed to re-quote a price
 * per quantity and term, the export carries no tiers at all
 * (`lib/catalog.ts:179`), and a control whose only effect was to fire a request that
 * could not change anything is what FR-043 calls inoperable.
 */
export function ProductDetail({ product }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    () => product.variants.find((variant) => variant.isDefault)?.id ?? product.variants[0]?.id ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [addState, setAddState] = useState<"idle" | "loading" | "done">("idle");
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedVariant = useMemo(() => {
    if (product.variants.length === 0) return null;
    return product.variants.find((variant) => variant.id === selectedVariantId) ?? null;
  }, [product, selectedVariantId]);

  const colors = useMemo(
    () => [...new Set(product.variants.map((variant) => variant.color).filter((color): color is string => Boolean(color)))],
    [product],
  );

  const storages = useMemo(
    () => [...new Set(product.variants.map((variant) => variant.storage).filter((storage): storage is string => Boolean(storage)))],
    [product],
  );

  const stockType = selectedVariant?.stockType ?? product.stockType ?? "call";
  const maxQuantity = stockType === "limited" ? (selectedVariant?.stock ?? null) : null;
  /*
   * The merchant's own `purchasable` field, not the shelf label, and only when the
   * state is one this site can interpret: sixteen records read «موجود محدود» while
   * `purchasable` says they cannot be sold, and FR-056 requires an unknown state to
   * fall back to contact rather than to a positive claim.
   */
  const purchasable = isPurchasable({ available: product.available, stockType });

  async function handleAddToCart() {
    setAddState("loading");
    setActionError(null);
    try {
      await addItem(product.id, selectedVariant?.id, quantity);
      setAddState("done");
      window.setTimeout(() => setAddState("idle"), 1800);
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.code === "AUTH_REQUIRED") {
        router.push(`/login?next=${encodeURIComponent(`/shop/${product.slug}`)}`);
        return;
      }
      setActionError(apiErrorToFa(cause));
      setAddState("idle");
    }
  }

  function pickByColor(color: string) {
    const sameStorage = product.variants.find(
      (variant) => variant.color === color && variant.storage === selectedVariant?.storage,
    );
    const next = sameStorage ?? product.variants.find((variant) => variant.color === color);
    if (next) setSelectedVariantId(next.id);
  }

  function pickByStorage(storage: string) {
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
            ? "border-aqua bg-aqua/15 text-aqua shadow-glow-cta"
            : "border-line bg-foreground/5 text-foreground/75 hover:border-aqua/40 hover:text-foreground",
        )}
      >
        {children}
      </button>
    );
  }

  const variantTitle = [selectedVariant?.storage, selectedVariant?.color].filter(Boolean).join(" — ");
  const productImage = resolveProductImage(product);
  const noImage = isPlaceholderImage(productImage);

  /*
   * The seam emits `variant.price` and a product-level `displayPrice`; 0 means
   * "no price listed", never free, so both go through helpers that turn it back
   * into null. A comparison price only exists when it is strictly higher —
   * 40 of the 311 variants carry one that is not.
   */
  const unitPrice = unitPriceOf(selectedVariant?.price, product.displayPrice);
  const compareAtPrice = compareAtOf(unitPrice, selectedVariant?.compareAtPrice ?? product.compareAtPrice);
  return (
    /* pb clears the sticky mobile buy bar *and* the dock under it. Without it
       the tags row at the bottom of this page sits behind both. */
    <div className="pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* Breadcrumb */}
      <nav aria-label="مسیر صفحه" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground/70">
        <Link href="/" className="transition-colors hover:text-aqua">خانه</Link>
        <span aria-hidden="true">/</span>
        <Link href="/shop" className="transition-colors hover:text-aqua">فروشگاه</Link>
        {product.mainCategory && (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/shop?category=${product.mainCategory.slug}`} className="transition-colors hover:text-aqua">
              {product.mainCategory.name}
            </Link>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span className="text-foreground/85">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Image */}
        {/* Image Vitrine */}
        <div className="relative aspect-square overflow-hidden rounded-3xl glass-smoked border border-champagne/25 shadow-monolith">
          {noImage && (
            <span className="absolute end-4 top-4 z-20 rounded-full border border-champagne/25 bg-ink/80 px-3 py-1.5 font-mono text-[11px] text-foreground/75">
              {PLACEHOLDER_LABEL}
            </span>
          )}
          {product.specialOffer && (
            <span className="absolute start-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-champagne/30 bg-oxblood/90 px-3.5 py-1.5 font-mono text-xs tracking-[0.14em] text-champagne backdrop-blur-md shadow-glow-oxblood">
              <Sparkles className="size-3 text-champagne" />
              SPECIAL OFFER
            </span>
          )}
          <Image
            src={productImage}
            alt={isPlaceholderImage(productImage) ? PLACEHOLDER_ALT : product.name}
            fill
            sizes="(min-width: 1024px) 40vw, 90vw"
            className="object-contain p-8 transition-transform duration-700 hover:scale-105"
            priority
          />
        </div>

        {/* Buy box */}
        <div>
          <span className="font-mono text-xs tracking-[0.14em] text-champagne">
            {product.brand?.name ?? "—"}
            {product.englishName ? ` · ${product.englishName}` : ""}
          </span>
          <h1 className="mt-2 text-2xl font-black leading-snug md:text-3xl text-foreground">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-champagne/20 bg-champagne/5 px-3 py-1", stockType === "out_of_stock" && "text-destructive")}>
              <i className={cn("size-1.5 rounded-full", stockType === "out_of_stock" ? "bg-destructive" : "bg-emerald-400")} aria-hidden="true" />
              {stockLabels[stockType] ?? "—"}
            </span>
            /* Owner-confirmed 2026-09-23, and a storefront-wide fact: the export
               holds no guarantee field, so this must not look per-product. The
               «ضمانت اصالت ۱۰۰٪» badge that sat here asserted a percentage nobody
               measured and came out with it. */
            <span className="rounded-full border border-champagne/20 bg-champagne/5 px-3 py-1 text-muted-foreground">
              {storeWarranty.label}
            </span>
          </div>

          <div className="mt-6 rounded-2xl glass-smoked border border-champagne/25 p-6 shadow-card">
            <DataCurrencyNote className="mb-3 text-[11px]" />
            {unitPrice !== null ? (
              <div className="flex flex-wrap items-baseline gap-3">
                {compareAtPrice != null && compareAtPrice > unitPrice && (
                  <del className="text-sm text-foreground/50">{formatToman(compareAtPrice)}</del>
                )}
                <strong className="text-3xl font-black text-champagne tracking-tight" aria-live="polite">
                  {formatToman(unitPrice * quantity)}
                </strong>
                {quantity > 1 && (
                  <span className="font-mono text-xs text-muted-foreground">
                    ({toFaDigits(quantity)} × {formatToman(unitPrice)})
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-4 text-aqua" />
                برای استعلام قیمت تماس بگیرید
              </div>
            )}

          </div>

          {/* Variant selection */}
          {(colors.length > 0 || storages.length > 0) && (
            <div className="mt-6 space-y-4">
              {storages.length > 0 && (
                <div>
                  <p className="mb-2 font-mono text-xs tracking-[0.1em] text-muted-foreground/70">حافظه</p>
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
                  <p className="mb-2 font-mono text-xs tracking-[0.1em] text-muted-foreground/70">رنگ</p>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <Chip key={color} label={`رنگ ${color}`} active={selectedVariant?.color === color} onClick={() => pickByColor(color)}>
                        {color}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity + the one action this record supports. An out-of-stock or
              call-for-price product gets the phone, not a dead button: FR-037
              asks for one unambiguous action per state and FR-039 for reaching a
              human in a single interaction, including where dialing is not
              possible — hence the copy control beside the tel: link. */}
          {!purchasable && (
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={storeContact.phoneHref}
                className="inline-flex min-w-52 flex-1 items-center justify-center gap-2 rounded-xl bg-oxblood px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                <Phone className="size-4" />
                تماس برای اطلاع از موجودی
              </a>
              <CopyPhoneButton />
            </div>
          )}

          {purchasable && (
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1 rounded-full border border-line bg-ink/40 p-1.5">
              <button
                type="button"
                aria-label="کاهش تعداد"
                disabled={quantity <= 1 || addState === "loading"}
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="grid size-11 place-items-center rounded-full text-foreground/75 transition-colors duration-fast hover:bg-foreground/10 disabled:opacity-40"
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
                className="grid size-11 place-items-center rounded-full text-foreground/75 transition-colors duration-fast hover:bg-foreground/10 disabled:opacity-40"
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
          )}

          {maxQuantity !== null && maxQuantity > 0 && purchasable && (
            <p className="mt-2.5 text-xs text-muted-foreground/70">
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
          <section className="glass-smoked rounded-2xl p-7 border border-champagne/20 shadow-card">
            <h2 className="text-base font-black text-foreground">توضیحات محصول</h2>
            <div className="brand-hairline my-3.5" />
            {/* `descriptionText`, not `description`: the latter is the export's
               raw HTML, so 147 records were printing literal <p> tags and
               &zwnj; entities to shoppers. */}
            <p className="whitespace-pre-line text-sm leading-8 text-foreground/75">{product.descriptionText}</p>
          </section>
        )}
      </div>

      {product.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs tracking-[0.12em] text-champagne">برچسب‌ها:</span>
          {product.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-champagne/15 bg-champagne/5 px-3 py-1 font-mono text-xs text-foreground/70">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ---------------------------------------------------------------
          Sticky buy bar — mobile only.
          Elevated to smoked obsidian glass with champagne gold accents. */}
      <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-40 border-t border-champagne/25 bg-ink/90 px-4 py-3 backdrop-blur-xl shadow-monolith md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            {unitPrice !== null ? (
              <>
                <span className="block font-mono text-xs text-champagne/75">قیمت نهایی</span>
                <b className="block truncate text-base font-black leading-tight tabular-nums text-champagne">
                  {formatToman(unitPrice * quantity)}
                </b>
              </>
            ) : (
              <b className="block text-sm font-black text-muted-foreground">تماس بگیرید</b>
            )}
          </div>
          <Button
            size="lg"
            className="h-12 min-w-[9.5rem] shrink-0"
            loading={addState === "loading"}
            disabled={!purchasable || addState === "done"}
            onClick={() => void handleAddToCart()}
          >
            {addState === "done" ? (
              <>
                <Check className="size-5" />
                اضافه شد
              </>
            ) : (
              <>
                <ShoppingBag className="size-5" />
                {purchasable ? "افزودن به سبد" : "ناموجود"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
