import { Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  parentId: z.number().int().positive().optional(),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
  iconUrl: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  available: z.boolean().optional(),
  categoriesMenuShow: z.boolean().optional(),
  topMenuSeparateShow: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const POST = withAuth(
  async (request) => {
    return withErrorHandling(async () => {
      const body = await request.json();
      const parsed = createCategorySchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, "Invalid request body", parsed.error.flatten());
      }

      const input = parsed.data;

      const existing = await prisma.category.findUnique({ where: { slug: input.slug }, select: { id: true } });
      if (existing) {
        throw new ApiError(409, `A category with slug "${input.slug}" already exists`);
      }

      let level = 0;
      if (input.parentId) {
        const parent = await prisma.category.findUnique({ where: { id: input.parentId }, select: { level: true } });
        if (!parent) {
          throw new ApiError(400, "Invalid parentId");
        }
        level = parent.level + 1;
      }

      const category = await prisma.category.create({ data: { ...input, level } });

      return ok(category, { message: "Category created" });
    });
  },
  { roles: [Role.ADMIN] },
);
