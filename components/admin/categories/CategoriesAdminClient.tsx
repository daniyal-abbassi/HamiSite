"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { AdminCategory, CreateCategoryInput } from "@/types/admin";

type CatForm = { name: string; slug: string; description: string; parentId: string; available: boolean };

const EMPTY: CatForm = { name: "", slug: "", description: "", parentId: "", available: true };

export function CategoriesAdminClient() {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CatForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setCategories(await apiGet<AdminCategory[]>("/api/categories?tree=true"));
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flatRows = useMemo(() => {
    const rows: { id: number; label: string }[] = [];
    const walk = (nodes: AdminCategory[], depth: number) => {
      for (const node of nodes) {
        rows.push({ id: node.id, label: `${depth > 0 ? "— ".repeat(depth) : ""}${node.name}` });
        if (node.children) walk(node.children, depth + 1);
      }
    };
    walk(categories ?? [], 0);
    return rows;
  }, [categories]);

  function openCreate(parentId = "") {
    setEditingId(null);
    setForm({ ...EMPTY, parentId });
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(category: AdminCategory) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      parentId: category.parentId ? String(category.parentId) : "",
      available: true,
    });
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
    const payload: CreateCategoryInput = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      parentId: form.parentId ? Number(form.parentId) : undefined,
      available: form.available,
    };
    try {
      if (editingId === null) {
        await apiPost("/api/admin/categories", payload);
      } else {
        await apiPatch(`/api/admin/categories/${editingId}`, payload);
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
    if (!window.confirm(`دسته «${name}» حذف شود؟`)) return;
    setError(null);
    try {
      await apiDelete(`/api/admin/categories/${id}`);
      await load();
    } catch (cause) {
      setError(apiErrorToFa(cause));
    }
  }

  function renderNode(category: AdminCategory, depth: number): React.ReactNode {
    return (
      <div key={category.id}>
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-ink/40 px-4 py-3 hover:bg-ink-2/40"
          style={{ marginInlineStart: `${depth * 22}px` }}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <FolderTree className="size-4 shrink-0 text-gold/70" />
            <div className="min-w-0">
              <p className="text-[13px] font-bold">
                {category.name}
                <span className="ms-2 font-mono text-[10px] font-normal text-muted-foreground/60">{category.slug}</span>
              </p>
              {category.description && <p className="truncate text-[11px] text-muted-foreground">{category.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => openCreate(String(category.id))}>
              <Plus className="size-3.5" />
              زیردسته
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openEdit(category)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void remove(category.id, category.name)} aria-label={`حذف ${category.name}`}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
        {category.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-[13px] text-destructive">
          {error}
        </p>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">
          {categories ? (categories.length).toLocaleString("fa-IR") : "…"} دسته ریشه
        </p>
        <Button size="sm" onClick={() => openCreate()}>
          <Plus className="size-4" />
          دسته جدید
        </Button>
      </div>

      {!categories ? (
        <p className="text-[13px] text-muted-foreground">در حال بارگذاری…</p>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-12 text-center text-sm text-muted-foreground">
          هنوز دسته‌ای ساخته نشده است.
        </div>
      ) : (
        <div className="space-y-2">{categories.map((category) => renderNode(category, 0))}</div>
      )}

      {/* Create / edit dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId === null ? "ایجاد دسته" : `ویرایش دسته #${editingId}`}
      >
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
            <FieldLabel>دسته والد</FieldLabel>
            <Select
              value={form.parentId}
              onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
              disabled={editingId !== null && form.parentId !== undefined}
            >
              <option value="">بدون والد (ریشه)</option>
              {flatRows
                .filter((row) => row.id !== editingId)
                .map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.label}
                  </option>
                ))}
            </Select>
          </div>
          <div>
            <FieldLabel>توضیحات</FieldLabel>
            <Input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="h-10" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-line bg-ink/40 px-3.5 py-2.5">
            <label className="text-[12px] font-bold">فعال (نمایش در فروشگاه)</label>
            <Switch checked={form.available} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, available: checked }))} />
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