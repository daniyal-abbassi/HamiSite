"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { CatalogImage } from "@/components/admin/CatalogImageManager";
import { VariantPhotoPicker } from "@/components/admin/products/VariantPhotoPicker";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { apiDelete, apiPatch, apiPost } from "@/lib/api-client";
import { formatToman } from "@/lib/utils";
import type { AdminVariantListItem, CreateVariantInput } from "@/types/admin";

const STOCK_TYPES = ["UNLIMITED", "LIMITED", "OUT_OF_STOCK", "CALL"] as const;

type VariantForm = {
  color: string;
  storage: string;
  guarantee: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  stockType: string;
  barcode: string;
  productIdentifier: string;
  isDefault: boolean;
  imageId: number | null;
};

const EMPTY: VariantForm = {
  color: "",
  storage: "",
  guarantee: "",
  price: "",
  compareAtPrice: "",
  stock: "0",
  stockType: "UNLIMITED",
  barcode: "",
  productIdentifier: "",
  isDefault: false,
  imageId: null,
};

function toForm(variant: AdminVariantListItem): VariantForm {
  return {
    color: variant.color ?? "",
    storage: variant.storage ?? "",
    guarantee: variant.guarantee ?? "",
    price: String(variant.price),
    compareAtPrice: variant.compareAtPrice != null ? String(variant.compareAtPrice) : "",
    stock: String(variant.stock),
    stockType: variant.stockType.toUpperCase(),
    barcode: variant.barcode ?? "",
    productIdentifier: variant.productIdentifier ?? "",
    isDefault: variant.isDefault,
    imageId: variant.imageId ?? null,
  };
}

export function VariantsManager({
  productId,
  variants,
  images,
  onImagesChange,
  onChanged,
}: {
  productId: number;
  variants: AdminVariantListItem[];
  images: CatalogImage[];
  onImagesChange: (images: CatalogImage[]) => void;
  onChanged: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<VariantForm>(EMPTY);
  const [savingForm, setSavingForm] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Stock quick-adjust per row: { [variantId]: { stock, reason } }
  const [stockDraft, setStockDraft] = useState<Record<number, { stock: string; reason: string }>>({});

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(variant: AdminVariantListItem) {
    setEditingId(variant.id);
    setForm(toForm(variant));
    setError(null);
    setDialogOpen(true);
  }

  async function submitVariant() {
    setSavingForm(true);
    setError(null);
    const payload: CreateVariantInput = {
      price: Number(form.price) || 0,
      color: form.color || undefined,
      storage: form.storage || undefined,
      guarantee: form.guarantee || undefined,
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      stock: Number(form.stock) || 0,
      stockType: form.stockType as CreateVariantInput["stockType"],
      barcode: form.barcode || undefined,
      productIdentifier: form.productIdentifier || undefined,
      isDefault: form.isDefault || undefined,
      imageId: form.imageId,
    };
    try {
      if (editingId === null) {
        await apiPost(`/api/admin/products/${productId}/variants`, payload);
      } else {
        await apiPatch(`/api/admin/products/${productId}/variants/${editingId}`, payload);
      }
      setDialogOpen(false);
      onChanged();
    } catch (cause) {
      setError(apiErrorToFa(cause));
    } finally {
      setSavingForm(false);
    }
  }

  async function removeVariant(id: number): Promise<void> {
    setBusyId(id);
    setError(null);
    try {
      await apiDelete(`/api/admin/products/${productId}/variants/${id}`);
      onChanged();
    } catch (cause) {
      const msg = apiErrorToFa(cause);
      setError(msg);
      throw cause;
    } finally {
      setBusyId(null);
    }
  }

  async function adjustStock(variantId: number) {
    const draft = stockDraft[variantId];
    if (!draft || draft.reason.trim() === "") return;
    setBusyId(variantId);
    setError(null);
    try {
      await apiPatch(`/api/admin/variants/${variantId}/stock`, {
        stock: Number(draft.stock) || 0,
        reason: draft.reason.trim(),
      });
      setStockDraft((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
      onChanged();
    } catch (cause) {
      setError(apiErrorToFa(cause));
    } finally {
      setBusyId(null);
    }
  }

  const setField = (field: keyof VariantForm) => (value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-[13px] text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">
          {variants.length.toLocaleString("fa-IR")} واریانت
        </p>
        <Button size="sm" variant="ghost" onClick={openCreate}>
          <Plus className="size-4" />
          افزودن واریانت
        </Button>
      </div>

      {variants.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-line p-6 text-center text-[13px] text-muted-foreground">
          هنوز واریانتی ثبت نشده است — در صورت نیاز از «افزودن واریانت» استفاده کنید.
        </p>
      ) : (
        <div className="mt-4 divide-y divide-line/70 rounded-xl border border-line">
          {variants.map((variant) => {
            const draft = stockDraft[variant.id];
            return (
              <div key={variant.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-foreground/[0.03]">
                        {variant.imageUrl ? (
                          variant.imageUrl.startsWith("/") ? (
                            <Image src={variant.imageUrl} alt="" width={48} height={48} sizes="48px" className="size-full object-contain p-1" />
                          ) : (
                            <img src={variant.imageUrl} alt="" className="size-full object-contain p-1" />
                          )
                        ) : (
                          <ImagePlus className="size-4 text-muted-foreground/50" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold">
                          {[variant.storage, variant.color].filter(Boolean).join(" — ") || "واریانت بدون نام"}
                          {variant.isDefault && <span className="ms-2 rounded-full bg-aqua/15 px-2 py-0.5 text-[10px] text-aqua">پیش‌فرض</span>}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {formatToman(variant.price)} · موجودی: {variant.stock.toLocaleString("fa-IR")} · {variant.stockType}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(variant)}>
                      <Pencil className="size-3.5" />
                      ویرایش
                    </Button>
                    <DeleteButton
                      onConfirm={() => removeVariant(variant.id)}
                      label={`حذف واریانت ${[variant.storage, variant.color].filter(Boolean).join(" ") || variant.id}`}
                      confirmLabel="تأیید حذف"
                      cancelLabel="انصراف"
                      pendingLabel="در حال حذف…"
                      doneLabel="حذف شد"
                      className="scale-85 origin-left"
                    />
                  </div>
                </div>

                {/* Quick stock adjust */}
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <div>
                    <label htmlFor={`variant-stock-${variant.id}`} className="mb-1 block text-[10px] font-bold text-muted-foreground/80">موجودی جدید</label>
                    <Input
                      id={`variant-stock-${variant.id}`}
                      type="number"
                      min={0}
                      value={draft?.stock ?? ""}
                      onChange={(e) =>
                        setStockDraft((prev) => ({ ...prev, [variant.id]: { stock: e.target.value, reason: prev[variant.id]?.reason ?? "" } }))
                      }
                      className="h-9 w-24"
                      aria-label={`موجودی واریانت ${variant.id}`}
                    />
                  </div>
                  <div>
                    <label htmlFor={`variant-stock-reason-${variant.id}`} className="mb-1 block text-[10px] font-bold text-muted-foreground/80">دلیل تغییر (الزامی)</label>
                    <Input
                      id={`variant-stock-reason-${variant.id}`}
                      value={draft?.reason ?? ""}
                      onChange={(e) =>
                        setStockDraft((prev) => ({ ...prev, [variant.id]: { stock: prev[variant.id]?.stock ?? "", reason: e.target.value } }))
                      }
                      className="h-9 w-52"
                      placeholder="مثلاً ورود محموله جدید"
                      aria-label="دلیل تغییر موجودی"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="oxblood"
                    disabled={!draft || draft.reason.trim() === ""}
                    loading={busyId === variant.id}
                    onClick={() => void adjustStock(variant.id)}
                  >
                    ثبت موجودی
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (!savingForm && !uploadingPhoto) setDialogOpen(false);
        }}
        title={editingId === null ? "افزودن واریانت" : `ویرایش واریانت #${editingId}`}
        description="ویژگی، قیمت و تصویر نمایشی این گزینه را تنظیم کنید."
      >
        <div className="grid grid-cols-2 gap-3 text-[13px]">
          <div>
            <FieldLabel htmlFor="variant-color">رنگ</FieldLabel>
            <Input id="variant-color" value={form.color} onChange={(e) => setField("color")(e.target.value)} placeholder="مشکی" className="h-10" />
          </div>
          <div>
            <FieldLabel htmlFor="variant-storage">حافظه</FieldLabel>
            <Input id="variant-storage" value={form.storage} onChange={(e) => setField("storage")(e.target.value)} placeholder="256GB" className="h-10" />
          </div>
          <div>
            <FieldLabel htmlFor="variant-guarantee">گارانتی</FieldLabel>
            <Input id="variant-guarantee" value={form.guarantee} onChange={(e) => setField("guarantee")(e.target.value)} className="h-10" />
          </div>
          <div>
            <FieldLabel htmlFor="variant-price">قیمت (تومان) *</FieldLabel>
            <Input id="variant-price" type="number" min={0} value={form.price} onChange={(e) => setField("price")(e.target.value)} className="h-10" />
          </div>
          <div>
            <FieldLabel htmlFor="variant-compare-price">قیمت قبل</FieldLabel>
            <Input id="variant-compare-price" type="number" min={0} value={form.compareAtPrice} onChange={(e) => setField("compareAtPrice")(e.target.value)} className="h-10" />
          </div>
          <div>
            <FieldLabel htmlFor="variant-quantity">موجودی</FieldLabel>
            <Input id="variant-quantity" type="number" min={0} value={form.stock} onChange={(e) => setField("stock")(e.target.value)} className="h-10" />
          </div>
          <div className="col-span-2">
            <FieldLabel htmlFor="variant-stock-type">نوع موجودی</FieldLabel>
            <Select id="variant-stock-type" value={form.stockType} onChange={(e) => setField("stockType")(e.target.value)}>
              {STOCK_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="variant-barcode">بارکد</FieldLabel>
            <Input id="variant-barcode" value={form.barcode} onChange={(e) => setField("barcode")(e.target.value)} className="h-10" />
          </div>
          <div>
            <FieldLabel htmlFor="variant-product-identifier">شناسه محصول</FieldLabel>
            <Input id="variant-product-identifier" value={form.productIdentifier} onChange={(e) => setField("productIdentifier")(e.target.value)} className="h-10" />
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-xl border border-line bg-ink/40 px-3.5 py-2.5">
            <label htmlFor="variant-default" className="text-[12px] font-bold">
              واریانت پیش‌فرض
            </label>
            <Switch
              id="variant-default"
              checked={form.isDefault}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isDefault: checked }))}
            />
          </div>
          <VariantPhotoPicker
            productId={productId}
            images={images}
            imageId={form.imageId}
            onSelect={(imageId) => setForm((prev) => ({ ...prev, imageId }))}
            onImagesChange={onImagesChange}
            onUploadingChange={setUploadingPhoto}
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" disabled={savingForm || uploadingPhoto} onClick={() => setDialogOpen(false)}>
            انصراف
          </Button>
          <Button loading={savingForm || uploadingPhoto} disabled={uploadingPhoto} onClick={() => void submitVariant()}>
            {editingId === null ? "افزودن" : "ذخیره"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return <label htmlFor={htmlFor} className="mb-1 block text-[10px] font-bold text-muted-foreground/80">{children}</label>;
}
