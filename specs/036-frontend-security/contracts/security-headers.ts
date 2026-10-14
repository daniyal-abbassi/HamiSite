import type { NextRequest, NextResponse } from "next/server";

export interface SecurityHeadersContract {
  /**
   * Generates a cryptographically random base64 nonce and builds the CSP header value.
   */
  generateCsp(options: { nonce: string; isDev: boolean; isTma?: boolean }): string;

  /**
   * Applies nonce and CSP headers to both the forwarded request headers and the response.
   */
  applyCsp(request: NextRequest, response?: NextResponse): { nonce: string; response: NextResponse };

  /**
   * Static security headers applied to all responses via next.config.mjs headers().
   */
  getStaticSecurityHeaders(options?: { isProduction?: boolean }): Array<{ key: string; value: string }>;
}

