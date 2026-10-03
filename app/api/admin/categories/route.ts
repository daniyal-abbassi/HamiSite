import { Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { updateCatalog } from "@/lib/catalog-store";

const schema = z.object({ name: z.string().trim().min(1), slug: z.string().trim().min(1), description: z.string().optional(), parentId: z.number().int().positive().optional(), imageUrl: z.string().optional(), imageAlt: z.string().optional(), iconUrl: z.string().optional(), seoTitle: z.string().optional(), seoDescription: z.string().optional(), available: z.boolean().optional(), categoriesMenuShow: z.boolean().optional(), topMenuSeparateShow: z.boolean().optional(), order: z.number().int().optional() });
const toRow = (c: Record<string, any>) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description ?? null, parentId: c.parent_id ?? null, imageUrl: c.image_url ?? null, imageAlt: c.image_alt ?? null, iconUrl: c.icon_url ?? null, seoTitle: c.seo_title ?? null, seoDescription: c.seo_description ?? null, available: c.available ?? true, categoriesMenuShow: c.categories_menu_show ?? true, topMenuSeparateShow: c.top_menu_separate_show ?? false, order: c.order ?? 0, level: c.level ?? 0 });
const parseId = (value: string) => { const id = Number(value); if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Invalid category id"); return id; };

export const GET = withAuth(async (request) => withErrorHandling(async () => {
  const { readCatalogSync } = await import("@/lib/catalog-store");
  const rows = readCatalogSync().categories.map(toRow).sort((a,b) => a.order-b.order || a.id-b.id);
  const children = new Map<number, typeof rows>();
  for (const row of rows) if (row.parentId != null) children.set(row.parentId, [...(children.get(row.parentId) ?? []), row]);
  type CategoryRow = (typeof rows)[number];
  type TreeRow = CategoryRow & { children: TreeRow[] };
  const nested = (row: CategoryRow): TreeRow => ({ ...row, children: (children.get(row.id) ?? []).map(nested) });
  const tree = new URL(request.url).searchParams.get("tree") === "true";
  return ok(tree ? rows.filter((r) => r.parentId == null || !rows.some((x) => x.id === r.parentId)).map(nested) : rows, { total: rows.length });
}), { roles: [Role.ADMIN] });

export const POST = withAuth(async (request) => withErrorHandling(async () => {
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) throw new ApiError(400, "Invalid request body", parsed.error.flatten());
  const input = parsed.data;
  const category = await updateCatalog((catalog) => {
    if (catalog.categories.some((c) => c.slug === input.slug)) throw new ApiError(409, `A category with slug "${input.slug}" already exists`);
    const parent = input.parentId ? catalog.categories.find((c) => c.id === input.parentId) : null;
    if (input.parentId && !parent) throw new ApiError(400, "Invalid parentId");
    const created = { id: Math.max(0, ...catalog.categories.map((c) => c.id)) + 1, name: input.name, slug: input.slug, parent_id: parent?.id ?? null, level: parent ? (parent.level ?? 0) + 1 : 0,
      description: input.description ?? null, image_url: input.imageUrl ?? null, image_alt: input.imageAlt ?? null, icon_url: input.iconUrl ?? null, seo_title: input.seoTitle ?? null, seo_description: input.seoDescription ?? null,
      available: input.available ?? true, categories_menu_show: input.categoriesMenuShow ?? true, top_menu_separate_show: input.topMenuSeparateShow ?? false, order: input.order ?? catalog.categories.length };
    catalog.categories.push(created); return toRow(created);
  });
  return ok(category, { message: "Category created" });
}), { roles: [Role.ADMIN] });
