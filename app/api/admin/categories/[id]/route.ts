import { Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const updateCategorySchema = z
  .object({
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string(),
    parentId: z.number().int().positive(),
    imageUrl: z.string(),
    imageAlt: z.string(),
    iconUrl: z.string(),
    seoTitle: z.string(),
    seoDescription: z.string(),
    available: z.boolean(),
    categoriesMenuShow: z.boolean(),
    topMenuSeparateShow: z.boolean(),
    order: z.number().int(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid category id");
  }
  return id;
}

export const PATCH = withAuth<{ id: string }>(
  async (request, { params }) => {
    return withErrorHandling(async () => {
      const id = parseId(params.id);
      const body = await request.json();
      const parsed = updateCategorySchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, "Invalid request body", parsed.error.flatten());
      }

      const existing = await prisma.category.findUnique({ where: { id } });
      if (!existing) {
        throw new ApiError(404, "Category not found");
      }

      const category = await prisma.category.update({ where: { id }, data: parsed.data });

      return ok(category, { message: "Category updated" });
    });
  },
  { roles: [Role.ADMIN] },
);

export const DELETE = withAuth<{ id: string }>(
  async (_request, { params }) => {
    return withErrorHandling(async () => {
      const id = parseId(params.id);
      const existing = await prisma.category.findUnique({ where: { id } });
      if (!existing) {
        throw new ApiError(404, "Category not found");
      }

      await prisma.category.delete({ where: { id } });

      return ok({ id }, { message: "Category deleted" });
    });
  },
  { roles: [Role.ADMIN] },
);
