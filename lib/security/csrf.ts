import { ApiError } from "@/lib/http";
import { SITE_ORIGIN } from "@/lib/seo-metadata";

/**
 * Validates that an incoming state-modifying request (POST, PUT, PATCH, DELETE)
 * originates from the same site origin or an explicit allowlist.
 * Throws 403 ApiError if origin mismatch is detected.
 */
export function assertSameOrigin(request: Request, additionalAllowedOrigins: string[] = []): void {
  const origin = request.headers.get("origin");

  // If no Origin header, check Referer header as fallback
  const sourceOrigin = origin ?? getOriginFromReferer(request.headers.get("referer"));
  if (!sourceOrigin) {
    // No Origin or Referer (e.g. server-to-server or CLI tool).
    // Allow if non-browser or custom client header is present.
    return;
  }

  const host = request.headers.get("host") || request.headers.get("x-forwarded-host");
  const protocol = request.headers.get("x-forwarded-proto") || "http";

  const allowed = new Set<string>([
    SITE_ORIGIN.toLowerCase(),
    ...(host ? [`${protocol}://${host}`.toLowerCase(), `https://${host}`.toLowerCase(), `http://${host}`.toLowerCase()] : []),
    ...additionalAllowedOrigins.map((o) => o.toLowerCase()),
  ]);

  if (!allowed.has(sourceOrigin.toLowerCase())) {
    throw ApiError.coded(403, "FORBIDDEN", "Cross-origin mutation request rejected.");
  }
}

function getOriginFromReferer(referer: string | null): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

