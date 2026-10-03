import { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(1), slug: z.string().trim().min(1), imageUrl: z.string().optional(),
  imageAlt: z.string().optional(), iconUrl: z.string().optional(), seoTitle: z.string().optional(),
  seoDescription: z.string().optional(), isActive: z.boolean().optional(), order: z.number().int().optional(),
});
const withCount = { _count: { select: { products: true } } } satisfies Prisma.BrandInclude;
const toRow = (brand: Prisma.BrandGetPayload<{ include: typeof withCount }>) => ({
  id: brand.id, name: brand.name, slug: brand.slug, imageUrl: brand.imageUrl, imageAlt: brand.imageAlt,
  iconUrl: brand.iconUrl, seoTitle: brand.seoTitle, seoDescription: brand.seoDescription,
  isActive: brand.isActive, order: brand.order, productCount: brand._count.products,
});

export const GET = withAuth(async () => withErrorHandling(async () => {
  const brands = await prisma.brand.findMany({ include: withCount, orderBy: [{ order: "asc" }, { name: "asc" }] });
  return ok(brands.map(toRow), { total: brands.length });
}), { roles: [Role.ADMIN] });

export const POST = withAuth(async (request) => withErrorHandling(async () => {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) throw new ApiError(400, "Invalid request body", parsed.error.flatten());
  try {
    const brand = await prisma.brand.create({ data: parsed.data, include: withCount });
    return ok(toRow(brand), { message: "Brand created" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ApiError(409, "A brand with this name or slug already exists");
    throw error;
  }
}), { roles: [Role.ADMIN] });
