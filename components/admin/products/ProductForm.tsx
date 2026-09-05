"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { VariantsManager } from "@/components/admin/products/VariantsManager";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { AdminBrand, AdminCategory, AdminVariantListItem, CreateProductInput } from "@/types/admin";
import type { ProductDetail } from "@/types/store";

const STOCK_TYPES = ["UNLIMITED", "LIMITED", "OUT_OF_STOCK", "CALL"] as const;

type FormValues = {
  name: string;
  slug: string;
  englishName: string;
  price: string;
  compareAtPrice: string;
  costPerItem: string;
  batchSize: string;
  stock: string;
  stockType: string;
  description: string;
  analysis: string;
  guarantee: string;
  minOrderQuantity: string;
  maxOrderQuantity: string;
  seoTitle: string;
  seoDescription: string;
  mainCategoryId: string;
  brandId: string;
  isDigital: boolean;
  specialOffer: boolean;
  available: boolean;
  showPrice: boolean;
};

const EMPTY: FormValues = {
  name: "",
  slug: "",
  englishName: "",
  price: "",
  compareAtPrice: "",
  costPerItem: "",
  batchSize: "1",
  stock: "0",
  stockType: "UNLIMITED",
  description: "",
  analysis: "",
  guarantee: "",
  minOrderQuantity: "",
  maxOrderQuantity: "",
  seoTitle: "",
  seoDescription: "",
  mainCategoryId: "",
  brandId: "",
  isDigital: false,
  specialOffer: false,
  available: true,
  showPrice: true,
};

export function ProductForm({ mode, productId, slug: initialSlug }: { mode: "new" | "edit"; productId?: number; slug?: string }) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [variants, setVariants] = useState<AdminVariantListItem[]>([]);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const setField = (field: keyof FormValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };
  const setBool = (field: "isDigital" | "specialOffer" | "available" | "showPrice") => (checked: boolean) => {
    setValues((prev) => ({ ...prev, [field]: checked }));
  };

  // Reference data (categories + brands) for the selects.
  useEffect(() => {
    let cancelled = false;
    Promise.all([apiGet<AdminCategory[]>("/api/categories?tree=true"), apiGet<AdminBrand[]>("/api/brands")])
      .then(([cats, brs]) => {
        if (cancelled) return;
        setCategories(cats);
        setBrands(brs);
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([]);
          setBrands([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load product detail on edit — the public endpoint is keyed by slug, so the
  // list page passes it via query params (id alone has no admin GET endpoint).
  useEffect(() => {
    if (mode !== "edit" || !initialSlug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiGet<ProductDetail>(`/api/products/${encodeURIComponent(initialSlug)}?quantity=1`)
      .then((product) => {
        if (cancelled) return;
        const defaultVariant = product.variants.find((variant) => variant.isDefault) ?? product.variants[0];
        setValues({
          name: product.name,
          slug: product.slug,
          englishName: product.englishName ?? "",
          price: defaultVariant ? String(defaultVariant.price) : "0",
          compareAtPrice: "",
          costPerItem: "",
          batchSize: "1",
          stock: String(product.stock ?? 0),
          stockType: product.stockType.toUpperCase(),
          description: product.description ?? "",
          analysis: product.analysis ?? "",
          guarantee: defaultVariant?.guarantee ?? "",
          minOrderQuantity: "",
          maxOrderQuantity: "",
          seoTitle: "",
          seoDescription: "",
          mainCategoryId: product.mainCategory ? String(product.mainCategory.id) : "",
          brandId: product.brand ? String(product.brand.id) : "",
          isDigital: product.isDigital,
          specialOffer: product.specialOffer,
          available: true,
          showPrice: true,
        });
        setVariants(
          product.variants.map((variant) => ({
            id: variant.id,
            color: variant.color,
            storage: variant.storage,
            guarantee: variant.guarantee,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            stock: variant.stock,
            stockType: variant.stockType,
            barcode: variant.barcode,
            productIdentifier: variant.productIdentifier,
            isDefault: variant.isDefault,
            quoted: {
              quantity: 1,
              paymentTerm: "CASH",
              role: "ADMIN",
              unitPrice: variant.unitPrice,
              matchedTier: variant.matchedTier,
            },
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setError("محصول پیدا نشد یا در بارگذاری آن خطایی رخ داد.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, initialSlug]);

  // Variants + product detail reload after variant CRUD — refetches the
  // public detail endpoint (keyed by slug) and syncs the variants table.
  const reloadProduct = useCallback(async () => {
    if (mode !== "edit" || !initialSlug) return;
    try {
      const product = await apiGet<ProductDetail>(`/api/products/${encodeURIComponent(initialSlug)}?quantity=1`);
      setVariants(
        product.variants.map((variant) => ({
          id: variant.id,
          color: variant.color,
          storage: variant.storage,
          guarantee: variant.guarantee,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          stock: variant.stock,
          stockType: variant.stockType,
          barcode: variant.barcode,
          productIdentifier: variant.productIdentifier,
          isDefault: variant.isDefault,
          quoted: {
            quantity: 1,
            paymentTerm: "CASH",
            role: "ADMIN",
            unitPrice: variant.unitPrice,
            matchedTier: variant.matchedTier,
          },
        })),
      );
    } catch {
      // Keep the stale list; the error is surfaced on the next manual action.
    }
  }, [mode, initialSlug]);

  const flatCategoryRows = useMemo(() => {
    const rows: { id: number; label: string }[] = [];
    const walk = (nodes: AdminCategory[], depth: number) => {
      for (const node of nodes) {
        rows.push({ id: node.id, label: `${depth > 0 ? "— ".repeat(depth) : ""}${node.name}` });
        if (node.children) walk(node.children, depth + 1);
      }
    };
    walk(categories, 0);
    return rows;
  }, [categories]);

  function num(value: string): number | undefined {
    if (value.trim() === "") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function buildPatchPayload(): Partial<CreateProductInput> {
    const payload: Partial<CreateProductInput> = {};
    if (values.name.trim()) payload.name = values.name.trim();
    if (values.slug.trim()) payload.slug = values.slug.trim();
    if (values.englishName.trim()) payload.englishName = values.englishName.trim();
    if (values.description.trim()) payload.description = values.description.trim();
    if (values.analysis.trim()) payload.analysis = values.analysis.trim();
    if (values.guarantee.trim()) payload.guarantee = values.guarantee.trim();
    if (values.seoTitle.trim()) payload.seoTitle = values.seoTitle.trim();
    if (values.seoDescription.trim()) payload.seoDescription = values.seoDescription.trim();
    if (values.mainCategoryId) payload.mainCategoryId = Number(values.mainCategoryId);
    if (values.brandId) payload.brandId = Number(values.brandId);
    if (values.price !== "") payload.price = Number(values.price) || 0;
    if (values.compareAtPrice !== "") payload.compareAtPrice = num(values.compareAtPrice);
    if (values.costPerItem !== "") payload.costPerItem = num(values.costPerItem);
    if (values.batchSize !== "") payload.batchSize = num(values.batchSize);
    if (values.stock !== "") payload.stock = Number(values.stock) || 0;
    payload.stockType = values.stockType as CreateProductInput["stockType"];
    if (values.minOrderQuantity !== "") payload.minOrderQuantity = num(values.minOrderQuantity);
    if (values.maxOrderQuantity !== "") payload.maxOrderQuantity = num(values.maxOrderQuantity);
    payload.isDigital = values.isDigital;
    payload.specialOffer = values.specialOffer;
    payload.available = values.available;
    payload.showPrice = values.showPrice;
    return payload;
  }

  function buildCreatePayload(): CreateProductInput {
    return {
      name: values.name.trim(),
      slug: values.slug.trim(),
      englishName: values.englishName.trim() || undefined,
      description: values.description.trim() || undefined,
      analysis: values.analysis.trim() || undefined,
      guarantee: values.guarantee.trim() || undefined,
      seoTitle: values.seoTitle.trim() || undefined,
      seoDescription: values.seoDescription.trim() || undefined,
      mainCategoryId: values.mainCategoryId ? Number(values.mainCategoryId) : undefined,
      brandId: values.brandId ? Number(values.brandId) : undefined,
      price: Number(values.price) || 0,
      compareAtPrice: num(values.compareAtPrice),
      costPerItem: num(values.costPerItem),
      batchSize: num(values.batchSize),
      stock: Number(values.stock) || 0,
      stockType: values.stockType as CreateProductInput["stockType"],
      minOrderQuantity: num(values.minOrderQuantity),
      maxOrderQuantity: num(values.maxOrderQuantity),
      isDigital: values.isDigital,
      specialOffer: values.specialOffer,
      available: values.available,
      showPrice: values.showPrice,
    };
  }

  async function submit() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "edit" && productId) {
        const updated = await apiPatch<{ id: number; slug: string }>(`/api/admin/products/${productId}`, buildPatchPayload());
        setMessage("محصول به‌روزرسانی شد.");
        if (updated.slug && updated.slug !== initialSlug) {
          // Slug changed — refresh the page against the new slug so edits stay keyed correctly.
          setTimeout(() => router.replace(`/admin/products/${updated.id}?slug=${encodeURIComponent(updated.slug)}`), 600);
        }
      } else {
        const created = await apiPost<{ id: number; slug: string }>("/api/admin/products", buildCreatePayload());
        router.push(`/admin/products/${created.id}?slug=${encodeURIComponent(created.slug)}`);
      }
    } catch (cause) {
      setError(apiErrorToFa(cause));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!productId) return;
    if (!window.confirm("محصول برای همیشه حذف شود؟ این عمل قابل بازگشت نیست.")) return;
    setSaving(true);
    setError(null);
    try {
      await apiDelete(`/api/admin/products/${productId}`);
      router.push("/admin/products");
    } catch (cause) {
      setError(apiErrorToFa(cause));
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-1/3 animate-pulse rounded-xl bg-foreground/10" />
        <div className="h-40 animate-pulse rounded-2xl bg-foreground/10" />
        <div className="h-40 animate-pulse rounded-2xl bg-foreground/10" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-400">{message}</p>
      )}

      {/* Basic info */}
      <section className="rounded-2xl border border-line bg-ink-2/60 p-6">
        <h2 className="text-sm font-black">اطلاعات پایه</h2>
        <div className="brand-hairline my-4" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <Field label="نام محصول *" htmlFor="p-name" />
            <Input id="p-name" value={values.name} onChange={setField("name")} placeholder="گوشی موبایل سامسونگ…" className="h-10" />
          </div>
          <div>
            <Field label="Slug *" htmlFor="p-slug" />
            <Input id="p-slug" value={values.slug} onChange={setField("slug")} placeholder="samsung-galaxy-s24" className="h-10 font-mono" dir="ltr" />
          </div>
          <div>
            <Field label="نام انگلیسی" htmlFor="p-english" />
            <Input id="p-english" value={values.englishName} onChange={setField("englishName")} className="h-10" dir="ltr" />
          </div>
          <div>
            <Field label="دسته اصلی" htmlFor="p-category" />
            <Select id="p-category" value={values.mainCategoryId} onChange={setField("mainCategoryId")} className="h-10">
              <option value="">بدون دسته</option>
              {flatCategoryRows.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Field label="برند" htmlFor="p-brand" />
            <Select id="p-brand" value={values.brandId} onChange={setField("brandId")} className="h-10">
              <option value="">بدون برند</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Field label="گارانتی" htmlFor="p-guarantee" />
            <Input id="p-guarantee" value={values.guarantee} onChange={setField("guarantee")} className="h-10" />
          </div>
          <div>
            <Field label="قیمت (تومان) *" htmlFor="p-price" />
            <Input id="p-price" type="number" min={0} value={values.price} onChange={setField("price")} className="h-10" />
          </div>
          <div>
            <Field label="قیمت قبل از تخفیف" htmlFor="p-compare" />
            <Input id="p-compare" type="number" min={0} value={values.compareAtPrice} onChange={setField("compareAtPrice")} className="h-10" />
          </div>
          <div>
            <Field label="هزینه تمام‌شده (اختیاری)" htmlFor="p-cost" />
            <Input id="p-cost" type="number" min={0} value={values.costPerItem} onChange={setField("costPerItem")} className="h-10" />
          </div>
          <div>
            <Field label="تعداد بسته / دسته" htmlFor="p-batch" />
            <Input id="p-batch" type="number" min={1} value={values.batchSize} onChange={setField("batchSize")} className="h-10" />
          </div>
          <div>
            <Field label="موجودی (محصول)" htmlFor="p-stock" />
            <Input id="p-stock" type="number" min={0} value={values.stock} onChange={setField("stock")} className="h-10" />
          </div>
          <div>
            <Field label="نوع موجودی" htmlFor="p-stocktype" />
            <Select id="p-stocktype" value={values.stockType} onChange={setField("stockType")} className="h-10">
              {STOCK_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Field label="حداقل سفارش" htmlFor="p-minqty" />
            <Input id="p-minqty" type="number" min={1} value={values.minOrderQuantity} onChange={setField("minOrderQuantity")} className="h-10" />
          </div>
          <div>
            <Field label="حداکثر سفارش" htmlFor="p-maxqty" />
            <Input id="p-maxqty" type="number" min={1} value={values.maxOrderQuantity} onChange={setField("maxOrderQuantity")} className="h-10" />
          </div>
        </div>
      </section>

      {/* Description / flags */}
      <section className="rounded-2xl border border-line bg-ink-2/60 p-6">
        <h2 className="text-sm font-black">توضیحات و تنظیمات</h2>
        <div className="brand-hairline my-4" />
        <div className="grid gap-4">
          <div>
            <Field label="توضیحات محصول" htmlFor="p-desc" />
            <Textarea id="p-desc" value={values.description} onChange={setField("description")} placeholder="توضیحات کامل محصول…" />
          </div>
          <div>
            <Field label="مشخصات / آنالیز" htmlFor="p-analysis" />
            <Textarea id="p-analysis" value={values.analysis} onChange={setField("analysis")} placeholder="مشخصات فنی، امکانات…" />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FlagRow label="وضعیت قابل فروش" hint="در فروشگاه نمایش داده شود">
            <Switch id="p-available" checked={values.available} onCheckedChange={setBool("available")} />
          </FlagRow>
          <FlagRow label="نمایش قیمت" hint="قیمت به خریدار نمایش داده شود">
            <Switch id="p-showprice" checked={values.showPrice} onCheckedChange={setBool("showPrice")} />
          </FlagRow>
          <FlagRow label="پیشنهاد ویژه" hint="برچسب ویژه و اولویت در فروشگاه">
            <Switch id="p-special" checked={values.specialOffer} onCheckedChange={setBool("specialOffer")} />
          </FlagRow>
          <FlagRow label="کالای دیجیتال" hint="بدون ارسال فیزیکی">
            <Switch id="p-digital" checked={values.isDigital} onCheckedChange={setBool("isDigital")} />
          </FlagRow>
        </div>
      </section>

      {/* SEO */}
      <section className="rounded-2xl border border-line bg-ink-2/60 p-6">
        <h2 className="text-sm font-black">SEO</h2>
        <div className="brand-hairline my-4" />
        <div className="grid gap-4">
          <div>
            <Field label="عنوان SEO" htmlFor="p-seotitle" />
            <Input id="p-seotitle" value={values.seoTitle} onChange={setField("seoTitle")} className="h-10" />
          </div>
          <div>
            <Field label="توضیح متا" htmlFor="p-seodesc" />
            <Textarea id="p-seodesc" value={values.seoDescription} onChange={setField("seoDescription")} className="min-h-16" />
          </div>
        </div>
      </section>

      {/* Variants — edit only */}
      {mode === "edit" && productId !== undefined && (
        <section className="rounded-2xl border border-line bg-ink-2/60 p-6">
          <h2 className="text-sm font-black">واریانت‌ها</h2>
          <div className="brand-hairline my-4" />
          <VariantsManager productId={productId} variants={variants} onChanged={reloadProduct} />
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-ink-2/60 p-5">
        <div className="flex items-center gap-2">
          <Button loading={saving} onClick={() => void submit()}>
            <Save className="size-4" />
            {mode === "edit" ? "ذخیره تغییرات" : "ایجاد محصول"}
          </Button>
          <Link href="/admin/products">
            <Button variant="ghost">انصراف</Button>
          </Link>
        </div>
        {mode === "edit" && productId !== undefined && (
          <Button variant="destructive" size="sm" onClick={() => void remove()} disabled={saving}>
            <Trash2 className="size-4" />
            حذف محصول
          </Button>
        )}
      </div>

      {mode === "edit" && (
        <p className="text-[11px] leading-5 text-muted-foreground/60">
          نکته: برخی فیلدها (هزینه تمام‌شده، SEO، حداقل/حداکثر سفارش) در اندپوینت عمومی محصول موجود نیستند و فقط هنگام ایجاد یا با
          ورود دستی اعمال می‌شوند؛ اگر مقداری وارد نکنید، مقدار قبلی دست‌نخورده می‌ماند.
        </p>
      )}
    </div>
  );
}

function FlagRow({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-ink/40 px-3.5 py-3">
      <label className="text-[12px] font-bold">
        {label}
        <span className="block text-[10px] font-normal text-muted-foreground/70">{hint}</span>
      </label>
      {children}
    </div>
  );
}

function Field({ label, htmlFor }: { label: string; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[11px] font-bold text-foreground/80">
      {label}
    </label>
  );
}