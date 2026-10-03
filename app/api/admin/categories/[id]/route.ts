import { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(1), slug: z.string().trim().min(1), description: z.string(), parentId: z.number().int().positive().nullable(),
  imageUrl: z.string(), imageAlt: z.string(), iconUrl: z.string(), seoTitle: z.string(), seoDescription: z.string(),
  available: z.boolean(), categoriesMenuShow: z.boolean(), topMenuSeparateShow: z.boolean(), order: z.number().int(),
}).partial().refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

function idOf(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Invalid category id");
  return id;
}

export const PATCH = withAuth<{ id: string }>(async (request, { params }) => withErrorHandling(async () => {
  const id = idOf(params.id);
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) throw new ApiError(400, "Invalid request body", parsed.error.flatten());
  const input = parsed.data;
  const current = await prisma.category.findUnique({ where: { id } });
  if (!current) throw new ApiError(404, "Category not found");
  if (input.parentId === id) throw new ApiError(400, "A category cannot be its own parent");
  if (input.parentId != null) {
    const ancestors = await prisma.category.findMany({ select: { id: true, parentId: true } });
    const byId = new Map(ancestors.map((row) => [row.id, row.parentId]));
    let ancestor: number | null = input.parentId;
    while (ancestor != null) {
      if (ancestor === id) throw new ApiError(400, "A category cannot be moved below its own descendant");
      ancestor = byId.get(ancestor) ?? null;
    }
    if (!byId.has(input.parentId)) throw new ApiError(400, "Invalid parentId");
  }
  try {
    const updated = await prisma.category.update({ where: { id }, data: {
      name: input.name, slug: input.slug, description: input.description,
      ...(input.parentId === undefined ? {} : { parentId: input.parentId }),
      imageUrl: input.imageUrl, imageAlt: input.imageAlt, iconUrl: input.iconUrl,
      seoTitle: input.seoTitle, seoDescription: input.seoDescription, available: input.available,
      categoriesMenuShow: input.categoriesMenuShow, topMenuSeparateShow: input.topMenuSeparateShow,
      order: input.order,
      ...(input.parentId === undefined ? {} : { level: input.parentId == null ? 0 : (await prisma.category.findUniqueOrThrow({ where: { id: input.parentId }, select: { level: true } })).level + 1 }),
    } });
    return ok(updated, { message: "Category updated" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ApiError(409, "Category slug already exists");
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new ApiError(404, "Category not found");
    throw error;
  }
}), { roles: [Role.ADMIN] });

export const DELETE = withAuth<{ id: string }>(async (_request, { params }) => withErrorHandling(async () => {
  const id = idOf(params.id);
  const [category, childCount, mainCount, secondaryCount] = await Promise.all([
    prisma.category.findUnique({ where: { id }, select: { id: true } }),
    prisma.category.count({ where: { parentId: id } }),
    prisma.product.count({ where: { mainCategoryId: id } }),
    prisma.product.count({ where: { otherCategories: { some: { id } } } }),
  ]);
  if (!category) throw new ApiError(404, "Category not found");
  if (childCount) throw new ApiError(409, "Cannot delete a category with child categories");
  if (mainCount || secondaryCount) throw new ApiError(409, "Cannot delete a category used by products");
  await prisma.category.delete({ where: { id } });
  return ok({ id }, { message: "Category deleted" });
}), { roles: [Role.ADMIN] });
