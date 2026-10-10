import { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { revalidateHomepage } from "@/lib/revalidate-homepage";

const schema = z.object({
  name: z.string().trim().min(1), slug: z.string().trim().min(1), imageUrl: z.string(), imageAlt: z.string(),
  iconUrl: z.string(), seoTitle: z.string(), seoDescription: z.string(), isActive: z.boolean(), order: z.number().int(),
}).partial().refine((data) => Object.keys(data).length > 0);
const withCount = { _count: { select: { products: true } } } satisfies Prisma.BrandInclude;
const idOf = (raw: string) => { const id = Number(raw); if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Invalid brand id"); return id; };
const toRow = (brand: Prisma.BrandGetPayload<{ include: typeof withCount }>) => ({
  id: brand.id, name: brand.name, slug: brand.slug, imageUrl: brand.imageUrl, imageAlt: brand.imageAlt,
  iconUrl: brand.iconUrl, seoTitle: brand.seoTitle, seoDescription: brand.seoDescription,
  isActive: brand.isActive, order: brand.order, productCount: brand._count.products,
});

export const PATCH = withAuth<{ id: string }>(async (request, { params }) => withErrorHandling(async () => {
  const id = idOf(params.id);
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) throw new ApiError(400, "Invalid request body", parsed.error.flatten());
  try {
    const brand = await prisma.brand.update({ where: { id }, data: parsed.data, include: withCount });
    revalidateHomepage();
    return ok(toRow(brand), { message: "Brand updated" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ApiError(409, "A brand with this name or slug already exists");
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new ApiError(404, "Brand not found");
    throw error;
  }
}), { roles: [Role.ADMIN] });

export const DELETE = withAuth<{ id: string }>(async (_request, { params }) => withErrorHandling(async () => {
  const id = idOf(params.id);
  const brand = await prisma.brand.findUnique({ where: { id }, select: { id: true } });
  if (!brand) throw new ApiError(404, "Brand not found");
  if (await prisma.product.count({ where: { brandId: id } })) throw new ApiError(409, "Cannot delete a brand used by products");
  await prisma.brand.delete({ where: { id } });
  revalidateHomepage();
  return ok({ id }, { message: "Brand deleted" });
}), { roles: [Role.ADMIN] });
