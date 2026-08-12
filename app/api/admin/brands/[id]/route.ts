import { Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const updateBrandSchema = z
  .object({
    name: z.string().min(1),
    slug: z.string().min(1),
    imageUrl: z.string(),
    imageAlt: z.string(),
    iconUrl: z.string(),
    seoTitle: z.string(),
    seoDescription: z.string(),
    isActive: z.boolean(),
    order: z.number().int(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid brand id");
  }
  return id;
}

export const PATCH = withAuth<{ id: string }>(
  async (request, { params }) => {
    return withErrorHandling(async () => {
      const id = parseId(params.id);
      const body = await request.json();
      const parsed = updateBrandSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, "Invalid request body", parsed.error.flatten());
      }

      const existing = await prisma.brand.findUnique({ where: { id } });
      if (!existing) {
        throw new ApiError(404, "Brand not found");
      }

      const input = parsed.data;

      if (
        (input.name && input.name !== existing.name) ||
        (input.slug && input.slug !== existing.slug)
      ) {
        const conflict = await prisma.brand.findFirst({
          where: {
            id: { not: id },
            OR: [
              ...(input.name && input.name !== existing.name ? [{ name: input.name }] : []),
              ...(input.slug && input.slug !== existing.slug ? [{ slug: input.slug }] : []),
            ],
          },
          select: { id: true },
        });
        if (conflict) {
          throw new ApiError(409, `A brand with this name or slug already exists`);
        }
      }

      const brand = await prisma.brand.update({ where: { id }, data: input });

      return ok(brand, { message: "Brand updated" });
    });
  },
  { roles: [Role.ADMIN] },
);

export const DELETE = withAuth<{ id: string }>(
  async (_request, { params }) => {
    return withErrorHandling(async () => {
      const id = parseId(params.id);
      const existing = await prisma.brand.findUnique({ where: { id } });
      if (!existing) {
        throw new ApiError(404, "Brand not found");
      }

      await prisma.brand.delete({ where: { id } });

      return ok({ id }, { message: "Brand deleted" });
    });
  },
  { roles: [Role.ADMIN] },
);
