import { Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const createBrandSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
  iconUrl: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const POST = withAuth(
  async (request) => {
    return withErrorHandling(async () => {
      const body = await request.json();
      const parsed = createBrandSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, "Invalid request body", parsed.error.flatten());
      }

      const input = parsed.data;

      const existing = await prisma.brand.findFirst({
        where: { OR: [{ name: input.name }, { slug: input.slug }] },
        select: { id: true },
      });
      if (existing) {
        throw new ApiError(409, `A brand with this name or slug already exists`);
      }

      const brand = await prisma.brand.create({ data: input });

      return ok(brand, { message: "Brand created" });
    });
  },
  { roles: [Role.ADMIN] },
);
