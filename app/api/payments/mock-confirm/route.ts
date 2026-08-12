import { NextResponse } from "next/server";
import { ApiError, withErrorHandling } from "@/lib/http";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
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
