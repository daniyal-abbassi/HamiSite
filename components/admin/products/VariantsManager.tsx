"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  };
}

export function VariantsManager({
  productId,
  variants,
  onChanged,
}: {
  productId: number;
  variants: AdminVariantListItem[];
  onChanged: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<VariantForm>(EMPTY);
  const [savingForm, setSavingForm] = useState(false);
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

  async function removeVariant(id: number) {
    setBusyId(id);
    setError(null);
    try {
      await apiDelete(`/api/admin/products/${productId}/variants/${id}`);
      onChanged();
    } catch (cause) {
      setError(apiErrorToFa(cause));
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
                    <p className="text-[13px] font-bold">
                      {[variant.storage, variant.color].filter(Boolean).join(" — ") || "واریانت بدون نام"}
                      {variant.isDefault && <span className="ms-2 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] text-gold">پیش‌فرض</span>}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {formatToman(variant.price)} · موجودی: {variant.stock.toLocaleString("fa-IR")} · {variant.stockType}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(variant)}>
                      <Pencil className="size-3.5" />
                      ویرایش
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={busyId === variant.id}
                      onClick={() => void removeVariant(variant.id)}
                      aria-label="حذف واریانت"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Quick stock adjust */}
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-muted-foreground/80">موجودی جدید</label>
                    <Input
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
                    <label className="mb-1 block text-[10px] font-bold text-muted-foreground/80">دلیل تغییر (الزامی)</label>
                    <Input
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
        onClose={() => setDialogOpen(false)}
        title={editingId === null ? "افزودن واریانت" : `ویرایش واریانت #${editingId}`}
      >
        <div className="grid grid-cols-2 gap-3 text-[13px]">
          <div>
            <FieldLabel>رنگ</FieldLabel>
            <Input value={form.color} onChange={(e) => setField("color")(e.target.value)} placeholder="مشکی" className="h-10" />
          </div>
          <div>
            <FieldLabel>حافظه</FieldLabel>
            <Input value={form.storage} onChange={(e) => setField("storage")(e.target.value)} placeholder="256GB" className="h-10" />
          </div>
          <div>
            <FieldLabel>گارانتی</FieldLabel>
            <Input value={form.guarantee} onChange={(e) => setField("guarantee")(e.target.value)} className="h-10" />
          </div>
          <div>
            <FieldLabel>قیمت (تومان) *</FieldLabel>
            <Input type="number" value={form.price} onChange={(e) => setField("price")(e.target.value)} className="h-10" />
          </div>
          <div>
            <FieldLabel>قیمت قبل</FieldLabel>
            <Input type="number" value={form.compareAtPrice} onChange={(e) => setField("compareAtPrice")(e.target.value)} className="h-10" />
          </div>
          <div>
            <FieldLabel>موجودی</FieldLabel>
            <Input type="number" value={form.stock} onChange={(e) => setField("stock")(e.target.value)} className="h-10" />
          </div>
          <div className="col-span-2">
            <FieldLabel>نوع موجودی</FieldLabel>
            <Select value={form.stockType} onChange={(e) => setField("stockType")(e.target.value)}>
              {STOCK_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel>بارکد</FieldLabel>
            <Input value={form.barcode} onChange={(e) => setField("barcode")(e.target.value)} className="h-10" />
          </div>
          <div>
            <FieldLabel>شناسه محصول</FieldLabel>
            <Input value={form.productIdentifier} onChange={(e) => setField("productIdentifier")(e.target.value)} className="h-10" />
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
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDialogOpen(false)}>
            انصراف
          </Button>
          <Button loading={savingForm} onClick={() => void submitVariant()}>
            {editingId === null ? "افزودن" : "ذخیره"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[10px] font-bold text-muted-foreground/80">{children}</label>;
}