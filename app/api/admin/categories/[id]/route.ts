import { Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { updateCatalog } from "@/lib/catalog-store";

const schema = z.object({
  name: z.string().trim().min(1), slug: z.string().trim().min(1), description: z.string(), parentId: z.number().int().positive(),
  imageUrl: z.string(), imageAlt: z.string(), iconUrl: z.string(), seoTitle: z.string(), seoDescription: z.string(), available: z.boolean(),
  categoriesMenuShow: z.boolean(), topMenuSeparateShow: z.boolean(), order: z.number().int(),
}).partial().refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Invalid category id");
  return id;
}

export const PATCH = withAuth<{ id: string }>(async (request, { params }) => withErrorHandling(async () => {
  const id = parseId(params.id);
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) throw new ApiError(400, "Invalid request body", parsed.error.flatten());
  const input = parsed.data;
  const row = await updateCatalog((catalog) => {
    const current = catalog.categories.find((category) => category.id === id);
    if (!current) throw new ApiError(404, "Category not found");
    if (input.slug && catalog.categories.some((category) => category.id !== id && category.slug === input.slug)) throw new ApiError(409, "Category slug already exists");

    let parent: (typeof catalog.categories)[number] | undefined;
    if (input.parentId !== undefined) {
      parent = catalog.categories.find((category) => category.id === input.parentId);
      if (!parent) throw new ApiError(400, "Invalid parentId");
      let ancestor: typeof parent | undefined = parent;
      while (ancestor) {
        if (ancestor.id === id) throw new ApiError(400, "A category cannot be moved below its own descendant");
        ancestor = ancestor.parent_id == null ? undefined : catalog.categories.find((category) => category.id === ancestor!.parent_id);
      }
    }

    Object.assign(current, {
      ...(input.name !== undefined ? { name: input.name } : {}), ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.parentId !== undefined ? { parent_id: input.parentId, level: parent ? (parent.level ?? 0) + 1 : 0 } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}), ...(input.imageUrl !== undefined ? { image_url: input.imageUrl } : {}),
      ...(input.imageAlt !== undefined ? { image_alt: input.imageAlt } : {}), ...(input.iconUrl !== undefined ? { icon_url: input.iconUrl } : {}),
      ...(input.seoTitle !== undefined ? { seo_title: input.seoTitle } : {}), ...(input.seoDescription !== undefined ? { seo_description: input.seoDescription } : {}),
      ...(input.available !== undefined ? { available: input.available } : {}), ...(input.categoriesMenuShow !== undefined ? { categories_menu_show: input.categoriesMenuShow } : {}),
      ...(input.topMenuSeparateShow !== undefined ? { top_menu_separate_show: input.topMenuSeparateShow } : {}), ...(input.order !== undefined ? { order: input.order } : {}),
    });
    for (const product of catalog.products) {
      if (product.category?.id === id) product.category.name = current.name;
      for (const secondary of product.other_categories ?? []) if (secondary.id === id) secondary.name = current.name;
    }
    return current;
  });
  return ok(row, { message: "Category updated" });
}), { roles: [Role.ADMIN] });

export const DELETE = withAuth<{ id: string }>(async (_request, { params }) => withErrorHandling(async () => {
  const id = parseId(params.id);
  await updateCatalog((catalog) => {
    if (!catalog.categories.some((category) => category.id === id)) throw new ApiError(404, "Category not found");
    if (catalog.categories.some((category) => category.parent_id === id)) throw new ApiError(409, "Cannot delete a category with child categories");
    if (catalog.products.some((product) => product.category?.id === id || (product.other_categories ?? []).some((category: { id: number }) => category.id === id))) throw new ApiError(409, "Cannot delete a category used by products");
    catalog.categories = catalog.categories.filter((category) => category.id !== id);
  });
  return ok({ id }, { message: "Category deleted" });
}), { roles: [Role.ADMIN] });
