"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Plus, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CustomSelect } from "@/components/ui/custom-select";
import { Switch } from "@/components/ui/switch";
import { GooSwitch } from "@/components/ui/goo-switch";
import { Textarea } from "@/components/ui/textarea";
import { VariantsManager } from "@/components/admin/products/VariantsManager";
import { CatalogImageManager, type CatalogImage } from "@/components/admin/CatalogImageManager";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { AdminBrand, AdminCategory, AdminProductDetail, AdminVariantListItem, CreateProductInput, UpdateProductInput } from "@/types/admin";

export type SpecItem = { name: string; value: string };

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
  showPrice: boolean | undefined;
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

export function ProductForm({ mode, productId }: { mode: "new" | "edit"; productId?: number }) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [variants, setVariants] = useState<AdminVariantListItem[]>([]);
  const [images, setImages] = useState<CatalogImage[]>([]);
  const [specs, setSpecs] = useState<SpecItem[]>([]);
  const [prevProduct, setPrevProduct] = useState<{ id: number; slug: string; name: string } | null>(null);
  const [nextProduct, setNextProduct] = useState<{ id: number; slug: string; name: string } | null>(null);
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
    Promise.all([apiGet<AdminCategory[]>("/api/admin/categories?tree=true"), apiGet<AdminBrand[]>("/api/admin/brands")])
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
    if (mode !== "edit") {
      setLoading(false);
      // Check if product data was imported from Digikala
      try {
        const stored = sessionStorage.getItem("imported_digikala_product");
        if (stored) {
          sessionStorage.removeItem("imported_digikala_product");
          const imported = JSON.parse(stored);
          setValues((prev) => ({
            ...prev,
            name: imported.name || prev.name,
            englishName: imported.englishName || prev.englishName,
            slug: imported.slug || prev.slug,
            description: imported.description || prev.description,
            price: imported.price ? String(imported.price) : prev.price,
            compareAtPrice: imported.compareAtPrice ? String(imported.compareAtPrice) : prev.compareAtPrice,
            seoTitle: imported.seoTitle || prev.seoTitle,
            seoDescription: imported.seoDescription || prev.seoDescription,
          }));
          if (Array.isArray(imported.specs) && imported.specs.length > 0) {
            setSpecs(imported.specs);
          }
          if (Array.isArray(imported.images) && imported.images.length > 0) {
            setImages(
              imported.images.map((img: any, idx: number) => ({
                id: -1 * (idx + 1), // temporary negative id for preview
                url: img.url,
                altText: img.altText || null,
                isDefault: img.isDefault || idx === 0,
              }))
            );
          }
          setMessage("اطلاعات محصول دیجی‌کالا با موفقیت بارگذاری شد. لطفاً دسته‌بندی و قیمت را بررسی فرمایید.");
        }
      } catch {
        // Ignore session parse errors
      }
      return;
    }
    if (!productId) {
      setError("شناسه محصول معتبر نیست.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiGet<AdminProductDetail>(`/api/admin/products/${productId}`)
      .then((product) => {
        if (cancelled) return;
        const defaultVariant = product.variants.find((variant) => variant.isDefault) ?? product.variants[0];
        setValues({
          name: product.name,
          slug: product.slug,
          englishName: product.englishName ?? "",
          price: defaultVariant ? String(defaultVariant.price) : "0",
          compareAtPrice: String(defaultVariant?.compareAtPrice ?? ""),
          costPerItem: product.costPerItem == null ? "" : String(product.costPerItem),
          batchSize: String(product.batchSize ?? 1),
          stock: String(product.stock ?? 0),
          stockType: product.stockType.toUpperCase(),
          description: product.description ?? "",
          analysis: product.analysis ?? "",
          guarantee: defaultVariant?.guarantee ?? product.guarantee ?? "",
          minOrderQuantity: String(product.minOrderQuantity ?? ""),
          maxOrderQuantity: String(product.maxOrderQuantity ?? ""),
          seoTitle: product.seoTitle ?? "",
          seoDescription: product.seoDescription ?? "",
          mainCategoryId: product.mainCategory ? String(product.mainCategory.id) : "",
          brandId: product.brand ? String(product.brand.id) : "",
          isDigital: product.isDigital,
          specialOffer: product.specialOffer,
          available: product.available,
          showPrice: product.showPrice,
        });
        setSpecs(Array.isArray(product.specs) ? product.specs.map((s) => ({ name: s.name, value: s.value })) : []);
        setImages((product.images ?? []).map((image) => ({ id: image.id, url: image.url, altText: image.altText ?? null, isDefault: image.isDefault })));
        setVariants(product.variants);
        setPrevProduct(product.prevProduct ?? null);
        setNextProduct(product.nextProduct ?? null);
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
  }, [mode, productId]);

  // Variants + product detail reload after variant CRUD — refetches the
  // public detail endpoint (keyed by slug) and syncs the variants table.
  const reloadProduct = useCallback(async () => {
    if (mode !== "edit" || !productId) return;
    try {
      const product = await apiGet<AdminProductDetail>(`/api/admin/products/${productId}`);
      setVariants(product.variants);
      setImages((product.images ?? []).map((image) => ({ id: image.id, url: image.url, altText: image.altText ?? null, isDefault: image.isDefault })));
    } catch {
      // Keep the stale list; the error is surfaced on the next manual action.
    }
  }, [mode, productId]);

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

  function buildPatchPayload(): UpdateProductInput {
    const payload: UpdateProductInput = {};
    if (values.name.trim()) payload.name = values.name.trim();
    if (values.slug.trim()) payload.slug = values.slug.trim();
    payload.englishName = values.englishName.trim() || null;
    payload.description = values.description.trim() || null;
    payload.analysis = values.analysis.trim() || null;
    payload.guarantee = values.guarantee.trim() || null;
    payload.seoTitle = values.seoTitle.trim() || null;
    payload.seoDescription = values.seoDescription.trim() || null;
    payload.mainCategoryId = values.mainCategoryId ? Number(values.mainCategoryId) : null;
    payload.brandId = values.brandId ? Number(values.brandId) : null;
    if (values.price !== "") payload.price = Number(values.price) || 0;
    payload.compareAtPrice = num(values.compareAtPrice) ?? null;
    payload.costPerItem = num(values.costPerItem) ?? null;
    if (values.batchSize !== "") payload.batchSize = num(values.batchSize);
    if (values.stock !== "") payload.stock = Number(values.stock) || 0;
    payload.stockType = values.stockType as CreateProductInput["stockType"];
    payload.minOrderQuantity = num(values.minOrderQuantity) ?? null;
    payload.maxOrderQuantity = num(values.maxOrderQuantity) ?? null;
    payload.isDigital = values.isDigital;
    payload.specialOffer = values.specialOffer;
    payload.available = values.available;
    if (values.showPrice !== undefined) payload.showPrice = values.showPrice;
    const cleanSpecs = specs.map((s) => ({ name: s.name.trim(), value: s.value.trim() })).filter((s) => s.name && s.value);
    payload.specs = cleanSpecs;
    return payload;
  }

  function buildCreatePayload(): CreateProductInput {
    const cleanSpecs = specs.map((s) => ({ name: s.name.trim(), value: s.value.trim() })).filter((s) => s.name && s.value);
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
      specs: cleanSpecs.length ? cleanSpecs : undefined,
      images: images.length
        ? images.map((img, idx) => ({
            url: img.url,
            altText: img.altText || values.name.trim(),
            isDefault: img.isDefault ?? idx === 0,
            order: idx,
          }))
        : undefined,
    };
  }

  async function submit() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "edit" && productId) {
        await apiPatch(`/api/admin/products/${productId}`, buildPatchPayload());
        setMessage("محصول به‌روزرسانی شد.");
      } else {
        const created = await apiPost<{ id: number; slug: string }>("/api/admin/products", buildCreatePayload());
        router.push(`/admin/products/${created.id}`);
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
    <div className="space-y-6 rounded-3xl bg-white p-4 sm:p-6 shadow-xl border border-zinc-200/80">
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
        <h2 className="text-sm font-black">هویت و رسانه محصول</h2>
        <p className="mt-1 text-xs text-muted-foreground">نام، شناسه و تصویرهایی که مشتری در فروشگاه می‌بیند.</p>
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
        </div>
        <div className="mt-5">
          <CatalogImageManager
            entity="product"
            ownerId={productId ?? null}
            images={images}
            referencedImageCounts={variants.reduce<Record<number, number>>((counts, variant) => {
              if (variant.imageId != null) counts[variant.imageId] = (counts[variant.imageId] ?? 0) + 1;
              return counts;
            }, {})}
            onImagesChange={(nextImages) => {
              setImages(nextImages);
              void reloadProduct();
            }}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-ink-2/60 p-6">
        <h2 className="text-sm font-black">قیمت و موجودی</h2>
        <p className="mt-1 text-xs text-muted-foreground">قیمت پایه و محدودیت‌های سفارش این محصول.</p>
        <div className="brand-hairline my-4" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <Field label="دسته اصلی" htmlFor="p-category" />
            <CustomSelect
              id="p-category"
              value={values.mainCategoryId}
              onChange={(val) => setValues((prev) => ({ ...prev, mainCategoryId: val }))}
              placeholder="بدون دسته"
              options={[
                { value: "", label: "بدون دسته" },
                ...flatCategoryRows.map((row) => ({ value: String(row.id), label: row.label })),
              ]}
            />
          </div>
          <div>
            <Field label="برند" htmlFor="p-brand" />
            <CustomSelect
              id="p-brand"
              value={values.brandId}
              onChange={(val) => setValues((prev) => ({ ...prev, brandId: val }))}
              placeholder="بدون برند"
              options={[
                { value: "", label: "بدون برند" },
                ...brands.map((brand) => ({ value: String(brand.id), label: brand.name })),
              ]}
            />
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
            <CustomSelect
              id="p-stocktype"
              value={values.stockType}
              onChange={(val) => setValues((prev) => ({ ...prev, stockType: val }))}
              options={STOCK_TYPES.map((type) => {
                const labels: Record<string, string> = {
                  UNLIMITED: "نامحدود (UNLIMITED)",
                  LIMITED: "محدود (LIMITED)",
                  OUT_OF_STOCK: "ناموجود (OUT_OF_STOCK)",
                  CALL: "تماس بگیرید (CALL)",
                };
                return { value: type, label: labels[type] || type };
              })}
            />
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
          <FlagRow label="وضعیت قابل فروش" hint="در فروشگاه نمایش داده شود" htmlFor="p-available">
            <GooSwitch
              id="p-available"
              size="sm"
              checked={values.available}
              onCheckedChange={setBool("available")}
              aria-label="وضعیت قابل فروش"
            />
          </FlagRow>
          <FlagRow label="نمایش قیمت" hint="قیمت به خریدار نمایش داده شود" htmlFor="p-showprice">
            <GooSwitch
              id="p-showprice"
              size="sm"
              checked={values.showPrice ?? true}
              onCheckedChange={setBool("showPrice")}
              aria-label="نمایش قیمت"
            />
          </FlagRow>
          <FlagRow label="پیشنهاد ویژه" hint="برچسب ویژه و اولویت در فروشگاه" htmlFor="p-special">
            <GooSwitch
              id="p-special"
              size="sm"
              checked={values.specialOffer}
              onCheckedChange={setBool("specialOffer")}
              aria-label="پیشنهاد ویژه"
            />
          </FlagRow>
          <FlagRow label="کالای دیجیتال" hint="بدون ارسال فیزیکی" htmlFor="p-digital">
            <GooSwitch
              id="p-digital"
              size="sm"
              checked={values.isDigital}
              onCheckedChange={setBool("isDigital")}
              aria-label="کالای دیجیتال"
            />
          </FlagRow>
        </div>
      </section>

      {/* Specifications (ویژگی‌ها) */}
      <section className="rounded-2xl border border-line bg-ink-2/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black">ویژگی‌ها و مشخصات فنی (Specs)</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              ویژگی‌های ساختاریافته مانند ریجن، ابعاد، وزن، حافظه، پردازنده و...
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSpecs((prev) => [{ name: "", value: "" }, ...prev])}
            className="gap-1.5 text-xs border-champagne/30 text-champagne hover:bg-champagne/10"
          >
            <Plus className="size-3.5" />
            افزودن ویژگی جدید
          </Button>
        </div>
        <div className="brand-hairline my-4" />

        {specs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-6 text-center">
            <p className="text-xs text-muted-foreground">
              هیچ ویژگی‌ای برای این محصول تعریف نشده است.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSpecs([{ name: "", value: "" }])}
              className="mt-2 text-xs text-aqua hover:underline gap-1"
            >
              <Plus className="size-3" />
              افزودن اولین ویژگی
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-2 text-[11px] font-bold text-muted-foreground">
              <span className="sm:col-span-4">نام ویژگی (مثال: ریجن، ابعاد، رم)</span>
              <span className="sm:col-span-7">مقدار (مثال: گلوبال، 128 گیگابایت)</span>
              <span className="sm:col-span-1 text-center">عملیات</span>
            </div>

            {specs.map((spec, index) => (
              <div
                key={index}
                className="flex flex-col sm:grid sm:grid-cols-12 gap-2.5 items-center rounded-xl border border-line bg-ink/40 p-2.5 sm:p-2 transition-colors hover:border-line/80"
              >
                <div className="w-full sm:col-span-4">
                  <Input
                    placeholder="نام ویژگی..."
                    value={spec.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setSpecs((prev) =>
                        prev.map((item, i) => (i === index ? { ...item, name: newName } : item))
                      );
                    }}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="w-full sm:col-span-7">
                  <Input
                    placeholder="مقدار ویژگی..."
                    value={spec.value}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setSpecs((prev) =>
                        prev.map((item, i) => (i === index ? { ...item, value: newValue } : item))
                      );
                    }}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="flex justify-end sm:justify-center w-full sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => setSpecs((prev) => prev.filter((_, i) => i !== index))}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                    title="حذف این ویژگی"
                    aria-label={`حذف ویژگی ردیف ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
          <VariantsManager productId={productId} variants={variants} images={images} onImagesChange={setImages} onChanged={reloadProduct} />
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-ink-2/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button loading={saving} onClick={() => void submit()}>
            <Save className="size-4" />
            {mode === "edit" ? "ذخیره تغییرات" : "ایجاد محصول"}
          </Button>
          <Link href="/admin/products">
            <Button variant="ghost">انصراف</Button>
          </Link>
          {mode === "edit" && prevProduct && (
            <Link
              href={`/admin/products/${prevProduct.id}?slug=${encodeURIComponent(prevProduct.slug)}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line/80 bg-foreground/5 px-3 py-2 text-xs font-bold text-foreground transition-all hover:border-primary/40 hover:bg-foreground/10"
              title={prevProduct.name}
            >
              <ArrowRight className="size-3.5 text-primary" />
              <span>قبلی</span>
            </Link>
          )}
          {mode === "edit" && nextProduct && (
            <Link
              href={`/admin/products/${nextProduct.id}?slug=${encodeURIComponent(nextProduct.slug)}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line/80 bg-foreground/5 px-3 py-2 text-xs font-bold text-foreground transition-all hover:border-primary/40 hover:bg-foreground/10"
              title={nextProduct.name}
            >
              <span>بعدی</span>
              <ArrowLeft className="size-3.5 text-primary" />
            </Link>
          )}
        </div>
        {mode === "edit" && productId !== undefined && (
          <Button variant="destructive" size="sm" onClick={() => void remove()} disabled={saving}>
            <Trash2 className="size-4" />
            حذف محصول
          </Button>
        )}
      </div>

      {mode === "edit" && (
        <p className="text-[11px] leading-5 text-zinc-600">
          هزینه تمام‌شده و وضعیت نمایش قیمت در کاتالوگ عمومی ثبت نشده‌اند؛ اگر آن‌ها را تغییر ندهید، مقدار ذخیره‌شده دست‌نخورده می‌ماند.
        </p>
      )}
    </div>
  );
}

function FlagRow({ label, hint, htmlFor, children }: { label: string; hint: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-ink/40 px-3.5 py-3">
      <label htmlFor={htmlFor} className={cn("text-[12px] font-bold", htmlFor && "cursor-pointer select-none")}>
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
