"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus, LoaderCircle, Star, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiPatch } from "@/lib/api-client";
import { apiErrorToFa } from "@/lib/api-error-fa";

export type CatalogImage = { id: number; url: string; altText: string | null; isDefault: boolean };
type Entity = "product" | "category" | "brand";

export function CatalogImageManager({
  entity,
  ownerId,
  images = [],
  imageUrl,
  referencedImageCounts = {},
  onImagesChange,
  onImageUrlChange,
}: {
  entity: Entity;
  ownerId: number | null;
  images?: CatalogImage[];
  imageUrl?: string | null;
  referencedImageCounts?: Record<number, number>;
  onImagesChange?: (images: CatalogImage[]) => void;
  onImageUrlChange?: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [busyUrl, setBusyUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const singular = entity === "product" ? "محصول" : entity === "category" ? "دسته" : "برند";
  const currentImages = entity === "product" ? images : imageUrl ? [{ id: 0, url: imageUrl, altText: singular, isDefault: true }] : [];

  async function upload(file?: File) {
    if (!file || ownerId == null) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("entity", entity);
      body.set("id", String(ownerId));
      body.set("role", entity === "product" && images.length > 0 ? "gallery" : "primary");
      const response = await fetch("/api/admin/catalog-images", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? payload.message ?? "بارگذاری تصویر انجام نشد.");
      if (entity === "product") {
        const raw = (payload.data?.images ?? []) as Array<{ id: number; url: string; alt?: string | null; is_default?: boolean }>;
        onImagesChange?.(raw.map((image) => ({ id: image.id, url: image.url, altText: image.alt ?? null, isDefault: Boolean(image.is_default) })));
      } else {
        onImageUrlChange?.(payload.data?.url ?? null);
      }
    } catch (cause) {
      setError(apiErrorToFa(cause));
    } finally {
      setUploading(false);
    }
  }

  async function mutate(action: "primary" | "remove", image: CatalogImage) {
    if (ownerId == null) return;
    const variantCount = entity === "product" ? referencedImageCounts[image.id] ?? 0 : 0;
    if (action === "remove" && variantCount > 0 && !window.confirm(`این تصویر برای ${variantCount.toLocaleString("fa-IR")} واریانت انتخاب شده است. با حذف آن، تصویر اختصاصی این واریانت‌ها نیز پاک می‌شود. ادامه می‌دهید؟`)) return;
    setBusyUrl(image.url);
    setError(null);
    try {
      const result = await apiPatch<{ removed?: boolean }>("/api/admin/catalog-images", { entity, id: ownerId, action, url: image.url });
      if (entity === "product") {
        onImagesChange?.(action === "remove" ? images.filter((item) => item.url !== image.url).map((item, index) => ({ ...item, isDefault: item.isDefault || index === 0 })) : images.map((item) => ({ ...item, isDefault: item.url === image.url })));
      } else if (action === "remove") {
        onImageUrlChange?.(null);
      }
      void result;
    } catch (cause) {
      setError(apiErrorToFa(cause));
    } finally {
      setBusyUrl(null);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-ink/35 p-4 sm:p-5" aria-label={`تصاویر ${singular}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black">تصاویر {singular}</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">JPG، PNG، WebP یا AVIF تا ۸ مگابایت</p>
        </div>
        <label className={`relative inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-line bg-foreground/5 px-3 text-xs font-bold transition hover:bg-foreground/10 ${ownerId == null || uploading ? "pointer-events-none opacity-50" : ""}`}>
          {uploading ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? "در حال بارگذاری…" : "بارگذاری تصویر"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            aria-label={`بارگذاری تصویر ${singular}`}
            disabled={ownerId == null || uploading}
            onChange={(event) => void upload(event.target.files?.[0])}
          />
        </label>
      </div>
      {ownerId == null && <p className="mb-3 rounded-lg bg-foreground/5 px-3 py-2 text-xs text-muted-foreground">ابتدا {singular} را ذخیره کنید تا بتوانید تصویر اضافه کنید.</p>}
      {error && <p role="alert" className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
      {currentImages.length ? (
        <div className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto pe-1 sm:grid-cols-3 lg:grid-cols-4">
          {currentImages.map((image) => (
            <div key={image.url} className="overflow-hidden rounded-xl border border-line bg-ink-2/70">
              <div className="grid aspect-square place-items-center bg-black/15 p-3">
                {image.url.startsWith("/") ? (
                  <Image src={image.url} alt={image.altText ?? `تصویر ${singular}`} width={320} height={320} sizes="(min-width: 1024px) 20vw, 45vw" className="max-h-full max-w-full object-contain" />
                ) : (
                  <img src={image.url} alt={image.altText ?? `تصویر ${singular}`} className="max-h-full max-w-full object-contain" />
                )}
              </div>
              <div className="flex items-center justify-between gap-1 px-2 py-2">
                {image.isDefault ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-aqua"><Star className="size-3 fill-current" /> اصلی</span> : <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[10px]" disabled={busyUrl !== null} onClick={() => void mutate("primary", image)}><Star className="size-3" /> اصلی‌کردن</Button>}
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-destructive" aria-label={`حذف تصویر ${singular}`} disabled={busyUrl !== null} onClick={() => void mutate("remove", image)}>
                  {busyUrl === image.url ? <LoaderCircle className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <label className={`relative flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line py-8 text-muted-foreground transition hover:border-aqua/50 hover:text-aqua ${ownerId == null || uploading ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>
          <ImagePlus className="size-6" />
          <span className="text-xs">هنوز تصویری ثبت نشده است</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="absolute inset-0 size-full cursor-pointer opacity-0" aria-label={`بارگذاری تصویر ${singular}`} disabled={ownerId == null || uploading} onChange={(event) => void upload(event.target.files?.[0])} />
        </label>
      )}
    </section>
  );
}
