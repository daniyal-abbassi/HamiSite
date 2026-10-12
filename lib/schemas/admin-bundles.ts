import { z } from "zod";

export const bundleItemInputSchema = z.object({
  productId: z.number().int().positive({ message: "شناسه محصول نامعتبر است" }),
  variantId: z.number().int().positive().nullable().optional(),
  quantity: z.number().int().min(1, { message: "تعداد هر قلم در سبد باید حداقل ۱ باشد" }),
});

export const createBundleInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, { message: "نام سبد باید حداقل ۲ کاراکتر باشد" })
    .max(200, { message: "نام سبد نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد" }),
  slug: z.string().trim().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  price: z.number().min(0, { message: "قیمت سبد نمی‌تواند منفی باشد" }),
  compareAtPrice: z.number().min(0).nullable().optional(),
  stock: z.number().int().min(0, { message: "تعداد سهمیه سبد نمی‌تواند منفی باشد" }),
  isActive: z.boolean().default(true),
  imageUrl: z.string().nullable().optional(),
  items: z
    .array(bundleItemInputSchema)
    .min(1, { message: "سبد باید حداقل دارای یک کالا باشد" }),
});

export const updateBundleInputSchema = createBundleInputSchema.partial();

export type BundleItemInput = z.infer<typeof bundleItemInputSchema>;
export type CreateBundleInput = z.infer<typeof createBundleInputSchema>;
export type UpdateBundleInput = z.infer<typeof updateBundleInputSchema>;

