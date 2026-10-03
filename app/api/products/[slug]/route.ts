import { findProductBySlug } from "@/lib/catalog";
import { ApiError, ok, withErrorHandling } from "@/lib/http";

/** Single product, from the JSON catalogue export. See lib/catalog.ts. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  return withErrorHandling(async () => {
    const { slug } = await params;
    const product = findProductBySlug(slug);
    if (!product) throw new ApiError(404, "Product not found");
    return ok(product);
  });
}
