export interface HeaderEntry {
  key: string;
  value: string;
}

/**
 * Returns the standard static security headers to be configured in next.config.mjs.
 * These headers apply to all routes (HTML, API, assets).
 */
export function getStaticSecurityHeaders(options?: { isProduction?: boolean }): HeaderEntry[] {
  const isProd = options?.isProduction ?? process.env.NODE_ENV === "production";

  const headers: HeaderEntry[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "X-Frame-Options", value: "DENY" },
  ];

  if (isProd) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains",
    });
  }

  return headers;
}

