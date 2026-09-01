import { ok, withErrorHandling } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandling(async () => {
    return ok({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "mixin-ecommerce-api",
    });
  });
}
