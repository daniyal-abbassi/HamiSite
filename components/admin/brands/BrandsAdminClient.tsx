"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { AdminBrand, CreateBrandInput } from "@/types/admin";

type BrandForm = { name: string; slug: string; imageUrl: string; isActive: boolean; order: string };

const EMPTY: BrandForm = { name: "", slug: "", imageUrl: "", isActive: true, order: "" };

export function BrandsAdminClient() {
  const [brands, setBrands] = useState<AdminBrand[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BrandForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setBrands(await apiGet<AdminBrand[]>("/api/brands"));
    } catch {
      setBrands([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(brand: AdminBrand) {
    setEditingId(brand.id);
    setForm({ name: brand.name, slug: brand.slug, imageUrl: brand.imageUrl ?? "", isActive: true, order: "" });
    setError(null);
    setDialogOpen(true);
  }

  async function submit() {
    if (form.name.trim() === "" || form.slug.trim() === "") {
      setError("نام و اسلاگ الزامی هستند.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload: CreateBrandInput = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      imageUrl: form.imageUrl.trim() || undefined,
      isActive: form.isActive,
      order: form.order ? Number(form.order) : undefined,
    };
    try {
      if (editingId === null) {
        await apiPost("/api/admin/brands", payload);
      } else {
        await apiPatch(`/api/admin/brands/${editingId}`, payload);
      }
      setDialogOpen(false);
      await load();
    } catch (cause) {
      setError(apiErrorToFa(cause));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number, name: string) {
    if (!window.confirm(`برند «${name}» حذف شود؟`)) return;
    setError(null);
    try {
      await apiDelete(`/api/admin/brands/${id}`);
      await load();
    } catch (cause) {
      setError(apiErrorToFa(cause));
    }
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-[13px] text-destructive">
          {error}
        </p>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">{brands ? brands.length.toLocaleString("fa-IR") : "…"} برند</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          برند جدید
        </Button>
      </div>

      {!brands ? (
        <p className="text-[13px] text-muted-foreground">در حال بارگذاری…</p>
      ) : brands.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-12 text-center text-sm text-muted-foreground">
          هنوز برندی ساخته نشده است.
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {brands.map((brand) => (
            <div key={brand.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-ink/40 px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-foreground/5">
                  <Building2 className="size-4 text-gold" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold">{brand.name}</p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground/60">{brand.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(brand)} aria-label={`ویرایش ${brand.name}`}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void remove(brand.id, brand.name)} aria-label={`حذف ${brand.name}`}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editingId === null ? "ایجاد برند" : `ویرایش برند #${editingId}`}>
        <div className="space-y-3 text-[13px]">
          <div>
            <FieldLabel>نام *</FieldLabel>
            <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="h-10" />
          </div>
          <div>
            <FieldLabel>Slug *</FieldLabel>
            <Input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} className="h-10 font-mono" dir="ltr" />
          </div>
          <div>
            <FieldLabel>آدرس تصویر (اختیاری)</FieldLabel>
            <Input value={form.imageUrl} onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))} className="h-10" dir="ltr" />
          </div>
          <div>
            <FieldLabel>ترتیب نمایش</FieldLabel>
            <Input type="number" value={form.order} onChange={(e) => setForm((prev) => ({ ...prev, order: e.target.value }))} className="h-10" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-line bg-ink/40 px-3.5 py-2.5">
            <label className="text-[12px] font-bold">فعال</label>
            <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))} />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDialogOpen(false)}>
            انصراف
          </Button>
          <Button loading={saving} onClick={() => void submit()}>
            {editingId === null ? "ایجاد" : "ذخیره"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[10px] font-bold text-muted-foreground/80">{children}</label>;
}