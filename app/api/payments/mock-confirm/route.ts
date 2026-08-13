import { NextResponse } from "next/server";
import { ApiError, withErrorHandling } from "@/lib/http";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    // Dev/test-only shortcut that fabricates a gateway confirmation. It must not
    // exist in production; 404 rather than 403 so the route is indistinguishable
    // from one that was never deployed.
    if (process.env.NODE_ENV === "production") {
      throw new ApiError(404, "Not found");
    }

    const { searchParams, origin } = new URL(request.url);
    const authority = searchParams.get("authority");
    const orderId = searchParams.get("orderId");
    const fail = searchParams.get("fail") === "true";

    if (!authority || !orderId) {
      throw new ApiError(400, "Missing authority or orderId");
    }

    const callbackUrl = new URL("/api/payments/callback", origin);
    callbackUrl.searchParams.set("Authority", authority);
    callbackUrl.searchParams.set("Status", fail ? "NOK" : "OK");
    callbackUrl.searchParams.set("orderId", orderId);

    return NextResponse.redirect(callbackUrl, 302);
  });
}
