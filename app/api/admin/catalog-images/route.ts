import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Role } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { updateCatalog } from "@/lib/catalog-store";
import { z } from "zod";

const MAX_BYTES = 8 * 1024 * 1024;
const MEDIA_DIR = path.resolve(process.env.CATALOG_MEDIA_DIR || path.join(process.cwd(), "data/uploads/catalog-images"));
type Entity = "product" | "category" | "brand";

function extensionFor(type: string, bytes: Buffer): string | null {
  if (type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return ".jpg";
  if (type === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return ".png";
  if (type === "image/webp" && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return ".webp";
  if (type === "image/avif" && bytes.toString("ascii", 4, 12).includes("ftyp") && bytes.toString("ascii", 8, 16).includes("avif")) return ".avif";
  return null;
}

export const POST = withAuth(async (request) => withErrorHandling(async () => {
  const form = await request.formData();
  const file = form.get("file");
  const entity = form.get("entity");
  const id = Number(form.get("id"));
  const role = form.get("role");
  if (!(file instanceof File) || file.size === 0) throw new ApiError(400, "یک تصویر انتخاب کنید.");
  if (file.size > MAX_BYTES) throw new ApiError(400, "حداکثر حجم تصویر ۸ مگابایت است.");
  if (!(entity === "product" || entity === "category" || entity === "brand") || !Number.isInteger(id) || id <= 0) throw new ApiError(400, "شناسه مقصد تصویر معتبر نیست.");
  if (entity === "product" && role !== "primary" && role !== "gallery") throw new ApiError(400, "نوع تصویر محصول معتبر نیست.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = extensionFor(file.type, bytes);
  if (!extension) throw new ApiError(400, "فرمت تصویر باید JPG، PNG، WebP یا AVIF باشد.");

  const filename = `${randomUUID()}${extension}`;
  const filePath = path.join(MEDIA_DIR, filename);
  const url = `/api/catalog-images/${filename}`;
  await mkdir(MEDIA_DIR, { recursive: true });
  await writeFile(filePath, bytes, { flag: "wx" });
  try {
    const result = await updateCatalog((catalog) => {
      if (entity === "product") {
        const product = catalog.products.find((item) => item.id === id);
        if (!product) throw new ApiError(404, "محصول پیدا نشد.");
        product.images ??= [];
        const image = { id: Math.max(0, ...product.images.map((item: { id: number }) => item.id)) + 1, url, alt: product.name, is_default: role === "primary", order: product.images.length };
        if (role === "primary") for (const item of product.images) item.is_default = false;
        product.images.push(image);
        if (role === "primary" || !product.primary_image) product.primary_image = url;
        product.updated_at = new Date().toISOString();
        return { url, images: product.images };
      }
      const rows = entity === "category" ? catalog.categories : catalog.brands;
      const item = rows.find((row) => row.id === id);
      if (!item) throw new ApiError(404, entity === "category" ? "دسته پیدا نشد." : "برند پیدا نشد.");
      item.image_url = url;
      return { url };
    });
    return ok(result, { message: "تصویر بارگذاری شد." });
  } catch (error) {
    await rm(filePath, { force: true });
    throw error;
  }
}), { roles: [Role.ADMIN] });

const imageAction = z.object({ entity: z.enum(["product", "category", "brand"]), id: z.number().int().positive(), action: z.enum(["primary", "remove"]), url: z.string().min(1) });

export const PATCH = withAuth(async (request) => withErrorHandling(async () => {
  const parsed = imageAction.safeParse(await request.json());
  if (!parsed.success) throw new ApiError(400, "عملیات تصویر معتبر نیست.", parsed.error.flatten());
  const { entity, id, action, url } = parsed.data;
  const filename = url.startsWith("/api/catalog-images/") ? url.slice("/api/catalog-images/".length) : null;
  if (filename && !/^[0-9a-f-]+\.(jpg|png|webp|avif)$/i.test(filename)) throw new ApiError(400, "آدرس تصویر معتبر نیست.");
  const result = await updateCatalog((catalog) => {
    if (entity === "product") {
      const product = catalog.products.find((item) => item.id === id);
      if (!product) throw new ApiError(404, "محصول پیدا نشد.");
      const image = (product.images ?? []).find((item: { url: string }) => item.url === url);
      if (!image) throw new ApiError(404, "تصویر محصول پیدا نشد.");
      if (action === "primary") {
        for (const item of product.images ?? []) item.is_default = item.url === url;
        product.primary_image = url;
      } else {
        product.images = (product.images ?? []).filter((item: { url: string }) => item.url !== url);
        const fallback = product.images.find((item: { is_default?: boolean }) => item.is_default) ?? product.images[0];
        if (fallback) fallback.is_default = true;
        product.primary_image = fallback?.url ?? null;
      }
      product.updated_at = new Date().toISOString();
    } else {
      const rows = entity === "category" ? catalog.categories : catalog.brands;
      const item = rows.find((row) => row.id === id);
      if (!item) throw new ApiError(404, entity === "category" ? "دسته پیدا نشد." : "برند پیدا نشد.");
      if (item.image_url !== url) throw new ApiError(404, "تصویر پیدا نشد.");
      item.image_url = null;
      item.image_alt = null;
    }
    const inUse = catalog.products.some((product) => (product.images ?? []).some((image: { url: string }) => image.url === url)) ||
      catalog.categories.some((item) => item.image_url === url) || catalog.brands.some((item) => item.image_url === url);
    return { inUse };
  });
  if (!result.inUse && filename) await rm(path.join(MEDIA_DIR, filename), { force: true });
  return ok({ removed: !result.inUse }, { message: "تصویر به‌روزرسانی شد." });
}), { roles: [Role.ADMIN] });
