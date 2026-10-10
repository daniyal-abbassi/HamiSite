"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, ImagePlus, LoaderCircle, Upload } from "lucide-react";
import { apiErrorToFa } from "@/lib/api-error-fa";
import type { CatalogImage } from "@/components/admin/CatalogImageManager";

export function VariantPhotoPicker({
  productId,
  images,
  imageId,
  onSelect,
  onImagesChange,
  onUploadingChange,
}: {
  productId: number;
  images: CatalogImage[];
  imageId: number | null;
  onSelect: (imageId: number | null) => void;
  onImagesChange: (images: CatalogImage[]) => void;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    onUploadingChange(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("entity", "product");
      body.set("id", String(productId));
      // Variant photos share the product library without changing its primary image.
      body.set("role", "gallery");
      const response = await fetch("/api/admin/catalog-images", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? payload.message ?? "بارگذاری تصویر انجام نشد.");
      }

      const uploadedImages = (payload.data?.images ?? []) as Array<{
        id: number;
        url: string;
        alt?: string | null;
        is_default?: boolean;
      }>;
      const nextImages = uploadedImages.map((image) => ({
        id: image.id,
        url: image.url,
        altText: image.alt ?? null,
        isDefault: Boolean(image.is_default),
      }));
      onImagesChange(nextImages);
      const uploaded = nextImages.find((image) => image.url === payload.data?.url) ?? nextImages.at(-1);
      if (uploaded) onSelect(uploaded.id);
    } catch (cause) {
      setError(apiErrorToFa(cause));
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  }

  return (
    <fieldset className="col-span-2 min-w-0">
      <legend className="mb-1 block text-[10px] font-bold text-muted-foreground/80">تصویر اختصاصی واریانت</legend>
      <p className="mb-3 text-[11px] leading-5 text-muted-foreground">
        تصویر را از گالری محصول انتخاب کنید یا تصویر تازه‌ای اضافه کنید؛ تصویر اصلی محصول حفظ می‌شود.
      </p>

      {images.length > 0 ? (
        <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pe-1 sm:grid-cols-4">
          <label className={`relative flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border p-2 text-center text-[10px] transition focus-within:outline focus-within:outline-2 focus-within:outline-champagne ${imageId === null ? "border-aqua bg-aqua/10 text-aqua" : "border-line bg-foreground/[0.03] text-muted-foreground hover:border-aqua/40"}`}>
            <input
              type="radio"
              name={`variant-photo-${productId}`}
              checked={imageId === null}
              onChange={() => onSelect(null)}
              className="sr-only"
            />
            <ImagePlus className="size-5" aria-hidden="true" />
            بدون تصویر اختصاصی
            {imageId === null && <Check className="absolute end-1.5 top-1.5 size-3.5" aria-hidden="true" />}
          </label>
          {images.map((image) => (
            <label
              key={image.id}
              className={`relative cursor-pointer overflow-hidden rounded-xl border p-1 transition focus-within:outline focus-within:outline-2 focus-within:outline-champagne ${imageId === image.id ? "border-aqua bg-aqua/10 ring-1 ring-aqua/50" : "border-line bg-foreground/[0.03] hover:border-aqua/40"}`}
            >
              <input
                type="radio"
                name={`variant-photo-${productId}`}
                checked={imageId === image.id}
                onChange={() => onSelect(image.id)}
                className="sr-only"
              />
              {/* Local catalog uploads are resized for these small admin previews. */}
              {image.url.startsWith("/") ? (
                <Image src={image.url} alt="" width={88} height={88} sizes="88px" className="aspect-square w-full rounded-lg object-contain" />
              ) : (
                <img src={image.url} alt="" className="aspect-square w-full rounded-lg object-contain" />
              )}
              <span className="block truncate px-1 py-1 text-center text-[9px] text-muted-foreground">
                {image.isDefault ? "تصویر اصلی" : image.altText || `تصویر ${image.id.toLocaleString("fa-IR")}`}
              </span>
              {imageId === image.id && <Check className="absolute end-2 top-2 size-4 rounded-full bg-ink p-0.5 text-aqua" aria-hidden="true" />}
            </label>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-xs text-muted-foreground">
          هنوز تصویری در گالری محصول نیست.
        </p>
      )}

      <label className={`relative mt-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-line bg-foreground/[0.03] px-3 text-xs font-bold transition hover:border-aqua/40 hover:bg-foreground/[0.06] focus-within:outline focus-within:outline-2 focus-within:outline-champagne ${uploading ? "pointer-events-none opacity-60" : ""}`}>
        {uploading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
        {uploading ? "در حال بارگذاری…" : "افزودن تصویر به گالری"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          aria-label="افزودن تصویر به گالری محصول برای این واریانت"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void upload(file);
          }}
        />
      </label>
      {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
    </fieldset>
  );
}
