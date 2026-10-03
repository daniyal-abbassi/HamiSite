import { Role } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { ApiError, ok, withErrorHandling } from "@/lib/http";
import { updateCatalog } from "@/lib/catalog-store";
import { findProductSlugById, findProductBySlug } from "@/lib/catalog";

const updateSchema = z.object({
  name: z.string().trim().min(1), englishName: z.string(), slug: z.string().trim().min(1), description: z.string(), analysis: z.string(),
  mainCategoryId: z.number().int().positive(), brandId: z.number().int().positive(), isDigital: z.boolean(), price: z.number().min(0),
  compareAtPrice: z.number().min(0), specialOffer: z.boolean(), specialOfferEnd: z.string(), batchSize: z.number().int().positive(),
  available: z.boolean(), showPrice: z.boolean(), hasVariants: z.boolean(), stock: z.number().int().min(0), stockType: z.string(),
  minOrderQuantity: z.number().int().positive(), maxOrderQuantity: z.number().int().positive(), guarantee: z.string(),
  seoTitle: z.string(), seoDescription: z.string(),
}).partial().refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

function parseId(raw: string) { const id = Number(raw); if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Invalid product id"); return id; }

export const GET = withAuth<{ id: string }>(async (_request, { params }) => withErrorHandling(async () => {
  const slug = findProductSlugById(parseId(params.id));
  const product = slug ? findProductBySlug(slug) : null;
  if (!product) throw new ApiError(404, "Product not found");
  return ok(product);
}), { roles: [Role.ADMIN] });

export const PATCH = withAuth<{ id: string }>(async (request, { params }) => withErrorHandling(async () => {
  const id = parseId(params.id);
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) throw new ApiError(400, "Invalid request body", parsed.error.flatten());
  const input = parsed.data;
  const product = await updateCatalog((catalog) => {
    const current = catalog.products.find((item) => item.id === id);
    if (!current) throw new ApiError(404, "Product not found");
    if (input.slug && catalog.products.some((item) => item.id !== id && item.slug === input.slug)) throw new ApiError(409, `A product with slug "${input.slug}" already exists`);
    const category = input.mainCategoryId ? catalog.categories.find((item) => item.id === input.mainCategoryId) : undefined;
    const brand = input.brandId ? catalog.brands.find((item) => item.id === input.brandId) : undefined;
    if (input.mainCategoryId && !category) throw new ApiError(400, "Invalid category id");
    if (input.brandId && !brand) throw new ApiError(400, "Invalid brand id");
    if (input.name !== undefined) current.name = input.name;
    if (input.englishName !== undefined) current.english_name = input.englishName || null;
    if (input.slug !== undefined) current.slug = input.slug;
    if (input.description !== undefined) { current.description_html = input.description; current.description_text = input.description; }
    if (input.analysis !== undefined) current.analysis = input.analysis;
    if (input.isDigital !== undefined) current.is_digital = input.isDigital;
    if (input.showPrice !== undefined) current.show_price = input.showPrice;
    if (input.guarantee !== undefined) current.guarantee = input.guarantee || null;
    if (input.seoTitle !== undefined || input.seoDescription !== undefined) current.seo = { ...current.seo, title: input.seoTitle ?? current.seo?.title ?? null, description: input.seoDescription ?? current.seo?.description ?? null };
    if (input.batchSize !== undefined) current.shipping = { ...current.shipping, batch_size: input.batchSize };
    if (input.mainCategoryId !== undefined) current.category = category ? { id: category.id, name: category.name } : null;
    if (input.brandId !== undefined) current.brand = brand ? { id: brand.id, name: brand.name } : null;
    if (input.price !== undefined) current.price = input.price;
    if (input.compareAtPrice !== undefined) current.compare_at_price = input.compareAtPrice || null;
    if (input.specialOffer !== undefined) current.special_offer = input.specialOffer;
    if (input.specialOfferEnd !== undefined) current.special_offer_end = input.specialOfferEnd || null;
    current.stock = { ...current.stock, state: input.stockType?.toLowerCase() ?? current.stock?.state, available: input.available ?? current.stock?.available ?? true,
      purchasable: input.available ?? current.stock?.purchasable ?? true, quantity: input.stock ?? current.stock?.quantity ?? 0,
      min_order_quantity: input.minOrderQuantity ?? current.stock?.min_order_quantity ?? null,
      max_order_quantity: input.maxOrderQuantity ?? current.stock?.max_order_quantity ?? null };
    if (input.price !== undefined && current.variants?.length) {
      const selected = current.variants.find((variant: { is_default?: boolean }) => variant.is_default) ?? current.variants[0];
      if (selected) { selected.price = input.price; if (input.compareAtPrice !== undefined) selected.compare_at_price = input.compareAtPrice || null; }
    }
    current.updated_at = new Date().toISOString();
    return current;
  });
  return ok({ id: product.id, slug: product.slug }, { message: "Product updated" });
}), { roles: [Role.ADMIN] });

export const DELETE = withAuth<{ id: string }>(async (_request, { params }) => withErrorHandling(async () => {
  const id = parseId(params.id);
  await updateCatalog((catalog) => {
    const index = catalog.products.findIndex((item) => item.id === id);
    if (index < 0) throw new ApiError(404, "Product not found");
    catalog.products.splice(index, 1);
  });
  return ok({ id }, { message: "Product deleted" });
}), { roles: [Role.ADMIN] });
