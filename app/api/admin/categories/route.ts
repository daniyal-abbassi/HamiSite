import { Role, Prisma } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(1), slug: z.string().trim().min(1), description: z.string().optional(),
  parentId: z.number().int().positive().optional(), imageUrl: z.string().optional(), imageAlt: z.string().optional(),
  iconUrl: z.string().optional(), seoTitle: z.string().optional(), seoDescription: z.string().optional(),
  available: z.boolean().optional(), categoriesMenuShow: z.boolean().optional(), topMenuSeparateShow: z.boolean().optional(), order: z.number().int().optional(),
});
const toRow = (category: { id: number; name: string; slug: string; description: string | null; parentId: number | null; imageUrl: string | null; imageAlt: string | null; iconUrl: string | null; seoTitle: string | null; seoDescription: string | null; available: boolean; categoriesMenuShow: boolean; topMenuSeparateShow: boolean; order: number; level: number }) => ({
  id: category.id, name: category.name, slug: category.slug, description: category.description, parentId: category.parentId,
  imageUrl: category.imageUrl, imageAlt: category.imageAlt, iconUrl: category.iconUrl, seoTitle: category.seoTitle,
  seoDescription: category.seoDescription, available: category.available, categoriesMenuShow: category.categoriesMenuShow,
  topMenuSeparateShow: category.topMenuSeparateShow, order: category.order, level: category.level,
});

export const GET = withAuth(async (request) => withErrorHandling(async () => {
  const rows = (await prisma.category.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] })).map(toRow);
  const tree = new URL(request.url).searchParams.get("tree") === "true";
  if (!tree) return ok(rows, { total: rows.length });
  const children = new Map<number, typeof rows>();
  for (const row of rows) if (row.parentId != null) children.set(row.parentId, [...(children.get(row.parentId) ?? []), row]);
  type TreeRow = (typeof rows)[number] & { children: TreeRow[] };
  const nest = (row: (typeof rows)[number]): TreeRow => ({ ...row, children: (children.get(row.id) ?? []).map(nest) });
  const roots = rows.filter((row) => row.parentId == null || !rows.some((candidate) => candidate.id === row.parentId)).map(nest);
  return ok(roots, { total: rows.length });
}), { roles: [Role.ADMIN] });

export const POST = withAuth(async (request) => withErrorHandling(async () => {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) throw new ApiError(400, "Invalid request body", parsed.error.flatten());
  const input = parsed.data;
  const parent = input.parentId == null ? null : await prisma.category.findUnique({ where: { id: input.parentId }, select: { id: true, level: true } });
  if (input.parentId != null && !parent) throw new ApiError(400, "Invalid parentId");
  try {
    const created = await prisma.category.create({ data: {
      name: input.name, slug: input.slug, description: input.description, parentId: parent?.id ?? null,
      level: parent ? parent.level + 1 : 0, imageUrl: input.imageUrl, imageAlt: input.imageAlt, iconUrl: input.iconUrl,
      seoTitle: input.seoTitle, seoDescription: input.seoDescription, available: input.available,
      categoriesMenuShow: input.categoriesMenuShow, topMenuSeparateShow: input.topMenuSeparateShow, order: input.order,
    } });
    return ok(toRow(created), { message: "Category created" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ApiError(409, "Category slug already exists");
    throw error;
  }
}), { roles: [Role.ADMIN] });
