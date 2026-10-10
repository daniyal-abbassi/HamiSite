"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderTree,
  Layers,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DeleteButton } from "@/components/ui/delete-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CatalogImageManager } from "@/components/admin/CatalogImageManager";
import { apiErrorToFa } from "@/lib/api-error-fa";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { AdminCategory, CreateCategoryInput } from "@/types/admin";

type CatForm = {
  name: string;
  slug: string;
  description: string;
  parentId: string;
  available: boolean;
  imageUrl: string | null;
};

const EMPTY: CatForm = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
  available: true,
  imageUrl: null,
};

export function CategoriesAdminClient() {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"explorer" | "tree">("explorer");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CatForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<AdminCategory[]>("/api/admin/categories?tree=true");
      setCategories(data);
      // Auto-expand and select first category if none selected
      if (data.length > 0) {
        setSelectedCategory((prev) => {
          if (!prev) return data[0];
          // Refresh selected if still exists
          const found = findNode(data, prev.id);
          return found ?? data[0];
        });
        setExpandedIds((prev) => {
          if (prev.size === 0) {
            return new Set([data[0].id]);
          }
          return prev;
        });
      }
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
        rows.push({
          id: node.id,
          label: `${depth > 0 ? "— ".repeat(depth) : ""}${node.name}`,
        });
        if (node.children) walk(node.children, depth + 1);
      }
    };
    walk(categories ?? [], 0);
    return rows;
  }, [categories]);

  // Total stats
  const totalCounts = useMemo(() => {
    let total = 0;
    let leaves = 0;
    const walk = (nodes: AdminCategory[]) => {
      for (const node of nodes) {
        total++;
        if (!node.children || node.children.length === 0) {
          leaves++;
        } else {
          walk(node.children);
        }
      }
    };
    walk(categories ?? []);
    return { total, roots: categories?.length ?? 0, leaves };
  }, [categories]);

  const toggleExpand = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelect = (category: AdminCategory) => {
    setSelectedCategory(category);
    // Also auto-expand it
    setExpandedIds((prev) => new Set(prev).add(category.id));
  };

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
      imageUrl: category.imageUrl,
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

  async function remove(id: number) {
    setError(null);
    try {
      await apiDelete(`/api/admin/categories/${id}`);
      if (selectedCategory?.id === id) {
        setSelectedCategory(null);
      }
      await load();
    } catch (cause) {
      setError(apiErrorToFa(cause));
      throw cause;
    }
  }

  // Filtered categories when search query is active
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim() || !categories) return categories;
    const q = searchQuery.toLowerCase().trim();
    const filterNodes = (nodes: AdminCategory[]): AdminCategory[] => {
      const result: AdminCategory[] = [];
      for (const node of nodes) {
        const matchesSelf =
          node.name.toLowerCase().includes(q) ||
          node.slug.toLowerCase().includes(q);
        const filteredChildren = node.children ? filterNodes(node.children) : [];
        if (matchesSelf || filteredChildren.length > 0) {
          result.push({
            ...node,
            children: filteredChildren,
          });
        }
      }
      return result;
    };
    return filterNodes(categories);
  }, [categories, searchQuery]);

  // Breadcrumbs calculation for selectedCategory
  const breadcrumbs = useMemo(() => {
    if (!selectedCategory || !categories) return [];
    return getBreadcrumbTrail(categories, selectedCategory.id);
  }, [categories, selectedCategory]);

  return (
    <div className="space-y-4">
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-[13px] text-destructive"
        >
          {error}
        </p>
      )}

      {/* Top Header & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-ink-2/80 p-3 sm:px-4 sm:py-3.5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="relative w-48 sm:w-64">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جست‌وجوی دسته‌بندی..."
              className="h-8 ps-8 pe-7 text-xs bg-ink/50 border-line"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-muted-foreground ps-2 border-s border-line">
            <span>
              کل: <strong className="font-mono text-foreground">{totalCounts.total.toLocaleString("fa-IR")}</strong>
            </span>
            <span>·</span>
            <span>
              ریشه: <strong className="font-mono text-foreground">{totalCounts.roots.toLocaleString("fa-IR")}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex items-center rounded-lg border border-line bg-ink/60 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("explorer")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors",
                viewMode === "explorer"
                  ? "bg-foreground/15 text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Layers className="size-3.5" />
              <span>کاوشگر درختی</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tree")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors",
                viewMode === "tree"
                  ? "bg-foreground/15 text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FolderTree className="size-3.5" />
              <span>فهرست کامل</span>
            </button>
          </div>

          <Button size="sm" onClick={() => openCreate()} className="gap-1.5 h-8">
            <Plus className="size-3.5" />
            دسته جدید
          </Button>
        </div>
      </div>

      {!categories ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-line bg-ink-2/40 text-sm text-muted-foreground">
          در حال بارگذاری دسته‌بندی‌ها…
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-12 text-center text-sm text-muted-foreground">
          هنوز دسته‌ای ساخته نشده است.
        </div>
      ) : viewMode === "explorer" ? (
        /* ================= 2-COLUMN EXPLORER VIEW (Recommended) ================= */
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Left / Navigation Pane: Tree of Parents & Subcategories */}
          <div className="lg:col-span-5 rounded-2xl border border-line bg-ink-2/60 p-3 sm:p-4 shadow-sm flex flex-col h-[680px]">
            <div className="mb-2.5 flex items-center justify-between px-1 text-xs font-bold text-muted-foreground">
              <span>ساختار درختی شاخه‌ها</span>
              <button
                type="button"
                onClick={() => {
                  if (expandedIds.size > 0) {
                    setExpandedIds(new Set());
                  } else {
                    const allIds = new Set<number>();
                    const walk = (nodes: AdminCategory[]) => {
                      for (const n of nodes) {
                        allIds.add(n.id);
                        if (n.children) walk(n.children);
                      }
                    };
                    walk(categories);
                    setExpandedIds(allIds);
                  }
                }}
                className="text-[11px] text-aqua hover:underline"
              >
                {expandedIds.size > 0 ? "بستن همه" : "باز کردن همه"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pe-1 space-y-1 select-none">
              {filteredCategories?.map((cat) => (
                <ExplorerTreeNode
                  key={cat.id}
                  category={cat}
                  depth={0}
                  selectedId={selectedCategory?.id ?? null}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpand}
                  onSelect={handleSelect}
                  onAddChild={(parentId) => openCreate(String(parentId))}
                />
              ))}
            </div>
          </div>

          {/* Right / Detail Pane: Active Category card & children overview */}
          <div className="lg:col-span-7 rounded-2xl border border-line bg-ink-2/60 p-4 sm:p-5 shadow-sm flex flex-col h-[680px] overflow-y-auto">
            {selectedCategory ? (
              <div className="space-y-5">
                {/* Breadcrumbs Path */}
                {breadcrumbs.length > 1 && (
                  <nav
                    aria-label="مسیر دسته"
                    className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    {breadcrumbs.map((crumb, idx) => {
                      const isLast = idx === breadcrumbs.length - 1;
                      return (
                        <div key={crumb.id} className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSelect(crumb)}
                            className={cn(
                              "transition-colors hover:text-foreground",
                              isLast && "font-bold text-champagne cursor-default"
                            )}
                          >
                            {crumb.name}
                          </button>
                          {!isLast && <ChevronLeft className="size-3 text-muted-foreground/50" />}
                        </div>
                      );
                    })}
                  </nav>
                )}

                {/* Selected Category Header Banner */}
                <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-line bg-ink/70 p-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    {selectedCategory.imageUrl ? (
                      <img
                        src={selectedCategory.imageUrl}
                        alt={selectedCategory.imageAlt ?? ""}
                        className="size-14 shrink-0 rounded-xl bg-ink-2 object-contain p-1 border border-line"
                      />
                    ) : (
                      <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-champagne/10 border border-champagne/20 text-champagne">
                        <Folder className="size-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-black text-foreground truncate">
                          {selectedCategory.name}
                        </h2>
                        <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                          ID: {selectedCategory.id}
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-aqua" dir="ltr">
                        /{selectedCategory.slug}
                      </p>
                      {selectedCategory.description && (
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground max-w-xl">
                          {selectedCategory.description.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions for selected parent category */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCreate(String(selectedCategory.id))}
                      className="gap-1 text-xs h-8"
                    >
                      <Plus className="size-3.5 text-aqua" />
                      افزودن زیردسته
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(selectedCategory)}
                      className="size-8 p-0"
                      aria-label="ویرایش"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <DeleteButton
                      onConfirm={() => remove(selectedCategory.id)}
                      label="حذف دسته"
                      confirmLabel="تأیید حذف"
                      cancelLabel="انصراف"
                      pendingLabel="در حال حذف…"
                      doneLabel="حذف شد"
                      className="scale-90"
                    />
                  </div>
                </div>

                {/* Subcategories Grid / List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black text-foreground">
                        زیردسته‌های مستقیم
                      </h3>
                      <span className="rounded-full bg-champagne/10 px-2 py-0.5 text-[11px] font-bold text-champagne">
                        {(selectedCategory.children?.length ?? 0).toLocaleString("fa-IR")}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openCreate(String(selectedCategory.id))}
                      className="text-xs text-aqua hover:underline gap-1 h-7"
                    >
                      <Plus className="size-3" />
                      زیردسته جدید
                    </Button>
                  </div>

                  {(!selectedCategory.children || selectedCategory.children.length === 0) ? (
                    <div className="rounded-xl border border-dashed border-line p-8 text-center">
                      <p className="text-xs text-muted-foreground">
                        این دسته هیچ زیرمجموعه‌ای ندارد. می‌توانید از دکمه «افزودن زیردسته» استفاده کنید.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCreate(String(selectedCategory.id))}
                        className="mt-3 gap-1.5 text-xs"
                      >
                        <Plus className="size-3.5" />
                        ساخت اولین زیردسته
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {selectedCategory.children.map((child) => (
                        <div
                          key={child.id}
                          onClick={() => handleSelect(child)}
                          className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-ink/40 p-3 transition-colors hover:border-champagne/40 hover:bg-ink-2/80 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {child.imageUrl ? (
                              <img
                                src={child.imageUrl}
                                alt={child.imageAlt ?? ""}
                                className="size-9 shrink-0 rounded-lg bg-ink-2 object-contain p-1 border border-line/60"
                              />
                            ) : (
                              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-foreground/5 text-muted-foreground group-hover:text-aqua">
                                <Folder className="size-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate group-hover:text-champagne transition-colors">
                                {child.name}
                              </p>
                              <p className="text-[10px] font-mono text-muted-foreground/70 truncate">
                                /{child.slug}
                              </p>
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-1 opacity-80 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => openEdit(child)}
                              className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-foreground/5"
                              title="ویرایش"
                            >
                              <Pencil className="size-3" />
                            </button>
                            <DeleteButton
                              onConfirm={() => remove(child.id)}
                              label="حذف زیردسته"
                              confirmLabel="تأیید حذف"
                              cancelLabel="انصراف"
                              pendingLabel="در حال حذف…"
                              doneLabel="حذف شد"
                              className="scale-85"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">
                یک دسته‌بندی را از منوی سمت راست برای مشاهده و مدیریت انتخاب کنید.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= FULL INDENTED TREE VIEW ================= */
        <div className="space-y-2 rounded-2xl border border-line bg-ink-2/60 p-4">
          {filteredCategories?.map((category) => (
            <TreeItemRow
              key={category.id}
              category={category}
              depth={0}
              onAddChild={(parentId) => openCreate(String(parentId))}
              onEdit={openEdit}
              onRemove={remove}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId === null ? "ایجاد دسته جدید" : `ویرایش دسته #${editingId}`}
      >
        <div className="space-y-3 text-[13px]">
          <div>
            <FieldLabel>نام دسته‌بندی *</FieldLabel>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="h-10"
              placeholder="مثال: گوشی سامسونگ"
            />
          </div>
          <div>
            <FieldLabel>نامک انگلیسی (Slug) *</FieldLabel>
            <Input
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              className="h-10 font-mono"
              dir="ltr"
              placeholder="samsung-phones"
            />
          </div>
          <div>
            <FieldLabel>دسته والد (سرگروه)</FieldLabel>
            <Select
              value={form.parentId}
              onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
            >
              <option value="">بدون والد (دسته‌بندی اصلی / ریشه)</option>
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
            <FieldLabel>توضیحات اختیاری</FieldLabel>
            <Input
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="h-10"
              placeholder="توضیح کوتاه درباره این دسته..."
            />
          </div>
          <CatalogImageManager
            entity="category"
            ownerId={editingId}
            imageUrl={form.imageUrl}
            onImageUrlChange={(imageUrl) => {
              setForm((prev) => ({ ...prev, imageUrl }));
              if (editingId != null) {
                setCategories(
                  (current) =>
                    current?.map((node) => patchCategoryImage(node, editingId, imageUrl)) ??
                    current
                );
              }
            }}
          />
          <div className="flex items-center justify-between rounded-xl border border-line bg-ink/40 px-3.5 py-2.5">
            <label className="text-[12px] font-bold">فعال (نمایش در فروشگاه)</label>
            <Switch
              checked={form.available}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, available: checked }))}
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDialogOpen(false)}>
            انصراف
          </Button>
          <Button loading={saving} onClick={() => void submit()}>
            {editingId === null ? "ایجاد دسته" : "ذخیره تغییرات"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

/** Explorer side navigation tree node item */
function ExplorerTreeNode({
  category,
  depth,
  selectedId,
  expandedIds,
  onToggleExpand,
  onSelect,
  onAddChild,
}: {
  category: AdminCategory;
  depth: number;
  selectedId: number | null;
  expandedIds: Set<number>;
  onToggleExpand: (id: number, e?: React.MouseEvent) => void;
  onSelect: (cat: AdminCategory) => void;
  onAddChild: (id: number) => void;
}) {
  const hasChildren = Boolean(category.children && category.children.length > 0);
  const isExpanded = expandedIds.has(category.id);
  const isSelected = selectedId === category.id;

  return (
    <div>
      <div
        onClick={() => onSelect(category)}
        className={cn(
          "group flex items-center justify-between gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-colors cursor-pointer",
          isSelected
            ? "bg-champagne/15 text-foreground font-bold border border-champagne/30"
            : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
        )}
        style={{ paddingInlineStart: `${Math.max(8, depth * 18 + 8)}px` }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => onToggleExpand(category.id, e)}
              className="grid size-5 shrink-0 place-items-center rounded text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <ChevronDown className="size-3.5 text-champagne" />
              ) : (
                <ChevronLeft className="size-3.5" />
              )}
            </button>
          ) : (
            <span className="size-5 shrink-0 flex items-center justify-center">
              <span className="size-1 rounded-full bg-muted-foreground/40" />
            </span>
          )}

          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="size-4 shrink-0 text-champagne" />
            ) : (
              <Folder className="size-4 shrink-0 text-muted-foreground group-hover:text-champagne" />
            )
          ) : (
            <Folder className="size-3.5 shrink-0 text-muted-foreground/60" />
          )}

          <span className="truncate">{category.name}</span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {hasChildren && (
            <span className="font-mono text-[10px] text-muted-foreground px-1 bg-foreground/5 rounded">
              {category.children?.length}
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(category.id);
            }}
            title="افزودن زیردسته"
            className="p-1 text-muted-foreground hover:text-aqua"
          >
            <Plus className="size-3" />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Subtle vertical hierarchy line */}
          <span
            aria-hidden="true"
            className="absolute top-0 bottom-0 w-px bg-line"
            style={{ insetInlineStart: `${depth * 18 + 17}px` }}
          />
          {category.children?.map((child) => (
            <ExplorerTreeNode
              key={child.id}
              category={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Full tree list row with visual indentation lines */
function TreeItemRow({
  category,
  depth,
  onAddChild,
  onEdit,
  onRemove,
}: {
  category: AdminCategory;
  depth: number;
  onAddChild: (id: number) => void;
  onEdit: (cat: AdminCategory) => void;
  onRemove: (id: number) => Promise<void> | void;
}) {
  const hasChildren = Boolean(category.children && category.children.length > 0);

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-ink/40 px-3.5 py-2.5 transition-colors hover:bg-ink-2/60",
          depth === 0 && "font-bold bg-ink-2/40 border-line/80"
        )}
        style={{ marginInlineStart: `${depth * 24}px` }}
      >
        <div className="flex min-w-0 items-center gap-3">
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.imageAlt ?? ""}
              className="size-9 shrink-0 rounded-lg bg-ink-2 object-contain p-1 border border-line"
            />
          ) : (
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-lg border",
                depth === 0
                  ? "bg-champagne/10 border-champagne/20 text-champagne"
                  : "bg-foreground/5 border-line text-muted-foreground"
              )}
            >
              <FolderTree className="size-4" />
            </span>
          )}

          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground">
              {category.name}
              <span className="ms-2 font-mono text-[10px] font-normal text-muted-foreground/70" dir="ltr">
                /{category.slug}
              </span>
            </p>
            {category.description && (
              <p className="truncate text-[11px] text-muted-foreground max-w-md">
                {category.description.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddChild(category.id)}
            className="h-7 text-xs gap-1"
          >
            <Plus className="size-3" />
            زیردسته
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
            className="size-7 p-0"
            aria-label={`ویرایش ${category.name}`}
          >
            <Pencil className="size-3.5" />
          </Button>
          <DeleteButton
            onConfirm={() => onRemove(category.id)}
            label="حذف دسته"
            confirmLabel="تأیید حذف"
            cancelLabel="انصراف"
            pendingLabel="در حال حذف…"
            doneLabel="حذف شد"
            className="scale-85"
          />
        </div>
      </div>

      {hasChildren && (
        <div className="space-y-1.5">
          {category.children?.map((child) => (
            <TreeItemRow
              key={child.id}
              category={child}
              depth={depth + 1}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function patchCategoryImage(
  category: AdminCategory,
  id: number | null,
  imageUrl: string | null
): AdminCategory {
  if (category.id === id) return { ...category, imageUrl };
  return {
    ...category,
    children: category.children?.map((child) =>
      patchCategoryImage(child, id, imageUrl)
    ),
  };
}

function findNode(nodes: AdminCategory[], id: number): AdminCategory | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function getBreadcrumbTrail(
  nodes: AdminCategory[],
  targetId: number,
  trail: AdminCategory[] = []
): AdminCategory[] {
  for (const node of nodes) {
    const current = [...trail, node];
    if (node.id === targetId) return current;
    if (node.children) {
      const found = getBreadcrumbTrail(node.children, targetId, current);
      if (found.length > 0) return found;
    }
  }
  return [];
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[10px] font-bold text-muted-foreground/80">
      {children}
    </label>
  );
}
