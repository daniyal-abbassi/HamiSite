"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Copy, Minus, Phone, Plus, ShieldCheck, ShoppingBag, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { ApiClientError } from "@/lib/api-client";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { stockLabels } from "@/lib/content/shop";
import { storeContact } from "@/lib/content/contact";
import { storeWarranty, trustFacts } from "@/lib/content/verified-facts";
import { compareAtOf, discountPercent, isPurchasable, splitProductName, unitPriceOf } from "@/lib/product-identity";
import { swatchColor } from "@/lib/swatch-color";
import { cn, toFaDigits } from "@/lib/utils";
import { TomanPrice } from "@/components/ui/TomanPrice";
import { DataCurrencyNote } from "@/components/shop/DataCurrencyNote";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { LiquidSelection } from "@/components/liquid/LiquidSelection";
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
import type { CatalogProduct } from "@/lib/catalog-db";

type Props = { product: CatalogProduct; generatedAt: string | null };

const STORE_FACT = trustFacts.find((fact) => fact.key === "store")?.label;
/** Rows shown before «نمایش همه»; the rest stay in the markup for crawlers. */
const SPEC_PREVIEW = 8;
/** Below this length the description fits its preview and needs no toggle. */
const STORY_PREVIEW_CHARS = 420;

/** Colours as swatches: the name is read from the heading and each button's accessible name. */
function ColorPicker({
  label,
  colors,
  selected,
  isSoldOut,
  onPick,
}: {
  label: string;
  colors: string[];
  selected: string | null;
  isSoldOut: (color: string) => boolean;
  onPick: (color: string) => void;
}) {
  return (
    <div className="pdp-option">
      <p className="pdp-option__label">
        {label}
        {selected && <b>{selected}</b>}
      </p>
      <div className="pdp-swatches" role="group" aria-label={label}>
        {colors.map((color) => {
          const soldOut = isSoldOut(color);
          return (
            <button
              key={color}
              type="button"
              title={color}
              aria-label={`${label}: ${color}${soldOut ? "، ناموجود" : ""}`}
              aria-pressed={selected === color}
              data-unavailable={soldOut ? "" : undefined}
              onClick={() => onPick(color)}
            >
              <span style={{ backgroundColor: swatchColor(color) }} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
      className="pdp-copy"
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
export function ProductDetail({ product, generatedAt }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    () => product.variants.find((variant) => variant.isDefault)?.id ?? product.variants[0]?.id ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [addState, setAddState] = useState<"idle" | "loading" | "done">("idle");
  const [actionError, setActionError] = useState<string | null>(null);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);

  const selectedVariant = useMemo(() => {
    if (product.variants.length === 0) return null;
    return product.variants.find((variant) => variant.id === selectedVariantId) ?? null;
  }, [product, selectedVariantId]);

  /*
   * Variant options, grouped by the key the export actually uses. The selector used
   * to be hard-wired to «رنگ» and «حافظه»; «حافظه» exists on none of the 311
   * variants, and product 347's 18 variants use دامنه/سرور/نوع — so FR-033's capacity
   * choice never appeared and that product offered no selector at all despite
   * having real options.
   */
  const optionGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const variant of product.variants) {
      for (const option of variant.options ?? []) {
        const list = groups.get(option.label) ?? [];
        if (!list.includes(option.value)) list.push(option.value);
        groups.set(option.label, list);
      }
    }
    return [...groups.entries()].filter(([, values]) => values.length > 1);
  }, [product]);

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
   * The seam emits `variant.price` and a product-level `displayPrice`; 0 means
   * "no price listed", never free, so both go through helpers that turn it back
   * into null. A comparison price only exists when it is strictly higher —
   * 40 of the 311 variants carry one that is not.
   */
  const unitPrice = unitPriceOf(selectedVariant?.price, product.displayPrice);
  const compareAtPrice = compareAtOf(unitPrice, selectedVariant?.compareAtPrice ?? product.compareAtPrice);

  /*
   * The merchant's own `purchasable` field, not the shelf label, and only when the
   * state is one this site can interpret: sixteen records read «موجود محدود» while
   * `purchasable` says they cannot be sold, and FR-056 requires an unknown state to
   * fall back to contact rather than to a positive claim. A live cart control also
   * needs a number to put in the cart: no record is both obtainable and unpriced
   * today, but the export refreshes, and an add-to-cart that files a price-less
   * line is the failure FR-040 says a page must not ship. Such a record gets the
   * call action instead.
   */
  /*
   * A chosen variant under `limited` has its own quantity, and on two records it is
   * zero while the product's default colour has one (ids 5 and 309). Before this,
   * picking مشکی on the Poco kept a live «افزودن به سبد» over a price for something
   * the warehouse says it does not have — the exact control FR-040 forbids. Only
   * `limited` reads the variant number: under other states a zero is an absence of
   * tracking, not a claim of emptiness.
   */
  const sellableRecord = isPurchasable({ available: product.available, stockType }) && unitPrice !== null;
  const variantSoldOut =
    sellableRecord && stockType === "limited" && selectedVariant != null && (selectedVariant.stock ?? 0) <= 0;
  const purchasable = sellableRecord && !variantSoldOut;

  async function handleAddToCart(e?: React.MouseEvent<HTMLButtonElement>) {
    if (e) e.currentTarget.setAttribute("aria-busy", "true");
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

  /** Select the variant matching every chosen option, falling back to the first that matches this one. */
  function pickOption(label: string, value: string) {
    const chosen = new Map(optionGroups.map(([groupLabel]) => [groupLabel, selectedVariant?.options?.find((o) => o.label === groupLabel)?.value]));
    chosen.set(label, value);
    const match =
      product.variants.find((variant) =>
        [...chosen.entries()].every(([groupLabel, groupValue]) =>
          groupValue == null || variant.options?.some((o) => o.label === groupLabel && o.value === groupValue),
        ),
      ) ?? product.variants.find((variant) => variant.options?.some((o) => o.label === label && o.value === value));
    if (match) setSelectedVariantId(match.id);
  }

  function Chip({ active, children, onClick, label }: { active: boolean; children: React.ReactNode; onClick: () => void; label: string }) {
    return (
      <button type="button" onClick={onClick} aria-pressed={active} aria-label={label} className="pdp-chip">
        {children}
      </button>
    );
  }

  const colorSoldOut = (color: string) =>
    !product.variants.some(
      (variant) =>
        (variant.color === color || variant.options?.some((option) => option.value === color))
        && isPurchasable({ available: product.available, stockType: variant.stockType })
        && !(variant.stockType === "limited" && (variant.stock ?? 0) <= 0),
    );

  const { label: nameLabel, model: nameModel, specs: nameSpecs } = splitProductName(product.name);
  const off = unitPrice !== null ? discountPercent(unitPrice, compareAtPrice) : null;
  const soldOutNow = stockType === "out_of_stock" || variantSoldOut;
  const hasStory = Boolean(product.descriptionText?.trim());
  const longStory = (product.descriptionText?.length ?? 0) > STORY_PREVIEW_CHARS;

  return (
    <>
      <section className="pdp-stage">
        <div className="pdp-wrap">
          <nav aria-label="مسیر صفحه" className="pdp-crumbs">
            <Link href="/">خانه</Link>
            <span aria-hidden="true">/</span>
            <Link href="/shop">فروشگاه</Link>
            {product.mainCategory && (
              <>
                <span aria-hidden="true">/</span>
                <Link href={`/categories/${encodeURIComponent(product.mainCategory.slug)}`}>{product.mainCategory.name}</Link>
              </>
            )}
            <span aria-hidden="true" className="pdp-crumbs__tail">/</span>
            <span aria-current="page" className="pdp-crumbs__tail">{product.name}</span>
          </nav>

          <div className="pdp-hero">
            <ProductGallery product={product} variantImageUrl={selectedVariant?.imageUrl ?? null} />

            <div className="pdp-buy">
              <div className="pdp-status">
                <span className="pdp-pill" data-state={soldOutNow ? "out" : "in"}>
                  <i aria-hidden="true" />
                  {soldOutNow ? stockLabels.out_of_stock : stockLabels[stockType] ?? "—"}
                </span>
                {product.brand?.name && <span className="pdp-brand">{product.brand.name}</span>}
              </div>

              {/* The whole catalogue name stays in the heading; only its emphasis is split. */}
              <h1 className="pdp-title">
                {nameModel ? (
                  <>
                    <span className="pdp-title__label">{nameLabel} مدل</span>{" "}
                    <span className="pdp-title__model"><bdi>{nameModel}</bdi></span>{" "}
                    {nameSpecs && <span className="pdp-title__specs">{nameSpecs}</span>}
                  </>
                ) : (
                  product.name
                )}
              </h1>

              <div className="pdp-price">
                {unitPrice !== null ? (
                  <>
                    {compareAtPrice != null && compareAtPrice > unitPrice && (
                      <p className="pdp-price__was">
                        <del><TomanPrice amount={compareAtPrice} /></del>
                        {off != null && <b>٪{toFaDigits(off)} تخفیف</b>}
                      </p>
                    )}
                    <TomanPrice as="strong" className="type-price tracking-normal" amount={unitPrice * quantity} aria-live="polite" />
                    {quantity > 1 && (
                      <p className="pdp-price__each">
                        {toFaDigits(quantity)} × <TomanPrice amount={unitPrice} />
                      </p>
                    )}
                  </>
                ) : (
                  /* The audit found this line to be text plus an icon with no number
                     and no link, which is a claim about a phone call rather than a way
                     to make one. FR-039 asks for the latter. */
                  <a href={storeContact.phoneHref} className="pdp-price__call">
                    <Phone className="size-4" aria-hidden="true" />
                    برای استعلام قیمت تماس بگیرید
                    <b dir="ltr">{storeContact.phoneDisplay}</b>
                  </a>
                )}
                <DataCurrencyNote generatedAt={generatedAt} className="pdp-price__note" />
              </div>

              {/* Variant selection */}
              {optionGroups.length > 0 && (
                <div className="pdp-options">
                  {optionGroups.map(([label, values]) =>
                    label === "رنگ" ? (
                      <ColorPicker
                        key={label}
                        label={label}
                        colors={values}
                        selected={selectedVariant?.options?.find((option) => option.label === label)?.value ?? null}
                        isSoldOut={colorSoldOut}
                        onPick={(value) => pickOption(label, value)}
                      />
                    ) : (
                      <div key={label} className="pdp-option">
                        <p className="pdp-option__label">{label}</p>
                        {/*
                          One marker per option group, not one per product: a product like
                          347 carries three independent groups (دامنه/سرور/نوع), and each
                          group asks its own one-of-N question. The shared component allows
                          `value` to be null, so a group the current variant does not answer
                          simply has no marker until it does.
                        */}
                        <LiquidSelection
                          className="!gap-2"
                          itemClassName="pdp-chip"
                          value={selectedVariant?.options?.find((option) => option.label === label)?.value ?? null}
                          announce="pressed"
                          markerInset={4}
                          onChange={(value) => pickOption(label, value)}
                          items={values.map((value) => ({
                            id: value,
                            label: <span>{value}</span>,
                            // `name`, not the visible text: the accessible name must stay
                            // «دامنه: جیمیل» — group label plus value — byte-identical to
                            // what the chip announced before the marker (SC-010). A bare
                            // value would silently drop the group half of the name.
                            name: `${label}: ${value}`,
                          }))}
                        />
                      </div>
                    ),
                  )}
                </div>
              )}

              {(colors.length > 0 || storages.length > 0) && optionGroups.length === 0 && (
                <div className="pdp-options">
                  {storages.length > 0 && (
                    <div className="pdp-option">
                      <p className="pdp-option__label">حافظه</p>
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
                    <ColorPicker
                      label="رنگ"
                      colors={colors}
                      selected={selectedVariant?.color ?? null}
                      isSoldOut={colorSoldOut}
                      onPick={pickByColor}
                    />
                  )}
                </div>
              )}

              {/* Quantity + the one action this record supports. An out-of-stock or
                  call-for-price product gets the phone, not a dead button: FR-037
                  asks for one unambiguous action per state and FR-039 for reaching a
                  human in a single interaction, including where dialing is not
                  possible — hence the copy control beside the tel: link. */}
              {!purchasable && (
                <div className="pdp-actions">
                  <a href={storeContact.phoneHref} className="pdp-call">
                    <Phone className="size-4" aria-hidden="true" />
                    تماس برای اطلاع از موجودی
                  </a>
                  <CopyPhoneButton />
                </div>
              )}

              {purchasable && (
                <div className="pdp-actions">
                  <div className="pdp-qty">
                    <button
                      type="button"
                      aria-label="کاهش تعداد"
                      disabled={quantity <= 1 || addState === "loading"}
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    >
                      <Minus className="size-4" aria-hidden="true" />
                    </button>
                    <span aria-live="polite">{toFaDigits(quantity)}</span>
                    <button
                      type="button"
                      aria-label="افزایش تعداد"
                      disabled={addState === "loading" || (maxQuantity !== null && quantity >= maxQuantity)}
                      onClick={() => setQuantity((value) => value + 1)}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  </div>

                  <Button
                    size="lg"
                    variant="oxblood"
                    className="pdp-add"
                    loading={addState === "loading"}
                    disabled={addState === "done"}
                    onClick={(e) => void handleAddToCart(e)}
                  >
                    {addState === "done" ? <Check className="size-5" /> : <ShoppingBag className="size-5" />}
                    {addState === "done" ? "به سبد اضافه شد" : "افزودن به سبد خرید"}
                  </Button>
                </div>
              )}

              {maxQuantity !== null && maxQuantity > 0 && purchasable && (
                <p className="pdp-hint">حداکثر {toFaDigits(maxQuantity)} عدد در انبار موجود است.</p>
              )}

              {/* The other half of T066: a choice has to say what it cost. Without this
                  the sold-out colour simply loses its «حداکثر …» line, which a shopper
                  can read as nothing having changed. */}
              {variantSoldOut && (
                <p className="pdp-hint" role="status">
                  این انتخاب در انبار موجود نیست. انتخاب دیگری ببینید یا برای هماهنگی تماس بگیرید.
                </p>
              )}

              {actionError && <p role="alert" className="pdp-error">{actionError}</p>}

              {/* Owner-confirmed 2026-09-23, and a storefront-wide fact: the export
                  holds no guarantee field, so this must not look per-product. */}
              <ul className="pdp-assure" role="list">
                <li><ShieldCheck aria-hidden="true" />{storeWarranty.label}</li>
                {STORE_FACT && <li><Store aria-hidden="true" />{STORE_FACT}</li>}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {(product.specs.length > 0 || hasStory || product.tags.length > 0) && (
        <div className="pdp-wrap pdp-body">
          <div className="pdp-details">
            {/*
             * Specifications. `product.specs` has carried name/value pairs for 166 of
             * the 189 records and nothing on this page read them: the block that existed
             * printed `product.analysis`, a field the seam never emits, so the section
             * was permanently absent and FR-032 was unmet for the 166 while passing
             * vacuously for the 23 that have none (FR-005).
             */}
            {product.specs.length > 0 && (
              <section className="pdp-card pdp-specs" data-open={specsOpen}>
                <h2>مشخصات</h2>
                <dl>
                  {product.specs.map((spec) => (
                    <div key={`${spec.name}-${spec.value}`}>
                      <dt>{spec.name}</dt>
                      <dd><bdi>{spec.value}</bdi></dd>
                    </div>
                  ))}
                </dl>
                {product.specs.length > SPEC_PREVIEW && (
                  <button type="button" className="pdp-more" aria-expanded={specsOpen} onClick={() => setSpecsOpen((open) => !open)}>
                    {specsOpen ? "بستن" : `نمایش همه‌ی ${toFaDigits(product.specs.length)} مشخصه`}
                    <ChevronDown aria-hidden="true" />
                  </button>
                )}
              </section>
            )}

            {hasStory && (
              <section className="pdp-card pdp-story">
                <h2>توضیحات محصول</h2>
                {/* `descriptionText`, not `description`: the latter is the export's
                   raw HTML, so 147 records were printing literal <p> tags and
                   &zwnj; entities to shoppers. */}
                <p data-open={storyOpen || !longStory}>{product.descriptionText}</p>
                {longStory && (
                  <button type="button" className="pdp-more" aria-expanded={storyOpen} onClick={() => setStoryOpen((open) => !open)}>
                    {storyOpen ? "بستن" : "ادامه‌ی توضیحات"}
                    <ChevronDown aria-hidden="true" />
                  </button>
                )}
              </section>
            )}
          </div>

          {product.tags.length > 0 && (
            <ul className="pdp-tags" role="list" aria-label="برچسب‌ها">
              {product.tags.map((tag) => <li key={tag}>{tag}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Sticky buy bar — mobile only. Opaque, not glass: T074 took the
          backdrop-filter off it, and a bar that must be readable over any
          product photograph has no business being translucent. */}
      <div className="pdp-buybar">
        <div className="pdp-buybar__price">
          {unitPrice !== null ? (
            <>
              <span>قیمت نهایی</span>
              <TomanPrice as="strong" amount={unitPrice * quantity} />
            </>
          ) : (
            <b>تماس بگیرید</b>
          )}
        </div>
        {purchasable ? (
          <Button
            size="lg"
            variant="oxblood"
            className="pdp-buybar__action"
            loading={addState === "loading"}
            disabled={addState === "done"}
            onClick={(e) => void handleAddToCart(e)}
          >
            {addState === "done" ? <Check className="size-5" /> : <ShoppingBag className="size-5" />}
            {addState === "done" ? "اضافه شد" : "افزودن به سبد"}
          </Button>
        ) : (
          <a href={storeContact.phoneHref} className="pdp-call pdp-buybar__action">
            <Phone className="size-4" aria-hidden="true" />
            تماس
          </a>
        )}
      </div>
    </>
  );
}
