import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma, Role } from "@prisma/client";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
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
    let result: { url: string; images?: Array<{ id: number; url: string; alt: string | null; is_default: boolean; order: number }> };
    if (entity === "product") {
      const product = await prisma.product.findUnique({ where: { id }, select: { id: true, name: true } });
      if (!product) throw new ApiError(404, "محصول پیدا نشد.");
      const images = await prisma.$transaction(async (tx) => {
        const imageCount = await tx.productImage.count({ where: { productId: id } });
        if (role === "primary") await tx.productImage.updateMany({ where: { productId: id }, data: { isDefault: false } });
        await tx.productImage.create({ data: { productId: id, url, altText: product.name, isDefault: role === "primary" || imageCount === 0, order: imageCount } });
        return tx.productImage.findMany({ where: { productId: id }, orderBy: [{ order: "asc" }, { id: "asc" }] });
      });
      result = { url, images: images.map((image) => ({ id: image.id, url: image.url, alt: image.altText, is_default: image.isDefault, order: image.order })) };
    } else if (entity === "category") {
      try { await prisma.category.update({ where: { id }, data: { imageUrl: url } }); }
      catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new ApiError(404, "دسته پیدا نشد."); throw error; }
      result = { url };
    } else {
      try { await prisma.brand.update({ where: { id }, data: { imageUrl: url } }); }
      catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new ApiError(404, "برند پیدا نشد."); throw error; }
      result = { url };
    }
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
  let inUse: boolean;
  if (entity === "product") {
    const image = await prisma.productImage.findFirst({ where: { productId: id, url }, orderBy: { id: "asc" } });
    if (!image) throw new ApiError(404, "تصویر محصول پیدا نشد.");
    if (action === "primary") {
      await prisma.$transaction(async (tx) => {
        await tx.productImage.updateMany({ where: { productId: id }, data: { isDefault: false } });
        await tx.productImage.update({ where: { id: image.id }, data: { isDefault: true } });
      });
    } else {
      await prisma.$transaction(async (tx) => {
        const fallback = await tx.productImage.findFirst({ where: { productId: id, id: { not: image.id } }, orderBy: [{ order: "asc" }, { id: "asc" }] });
        if (image.isDefault) {
          await tx.productImage.updateMany({ where: { productId: id }, data: { isDefault: false } });
          if (fallback) await tx.productImage.update({ where: { id: fallback.id }, data: { isDefault: true } });
        }
        await tx.productImage.delete({ where: { id: image.id } });
      });
    }
  } else if (entity === "category") {
    const updated = await prisma.category.updateMany({ where: { id, imageUrl: url }, data: { imageUrl: null, imageAlt: null } });
    if (!updated.count) throw new ApiError(404, "تصویر پیدا نشد.");
  } else {
    const updated = await prisma.brand.updateMany({ where: { id, imageUrl: url }, data: { imageUrl: null, imageAlt: null } });
    if (!updated.count) throw new ApiError(404, "تصویر پیدا نشد.");
  }
  inUse = Boolean(await prisma.productImage.count({ where: { url } })) ||
    Boolean(await prisma.category.count({ where: { imageUrl: url } })) || Boolean(await prisma.brand.count({ where: { imageUrl: url } }));
  if (!inUse && filename) await rm(path.join(MEDIA_DIR, filename), { force: true });
  return ok({ removed: !inUse }, { message: "تصویر به‌روزرسانی شد." });
}), { roles: [Role.ADMIN] });
