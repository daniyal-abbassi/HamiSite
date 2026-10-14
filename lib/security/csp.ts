import { NextRequest, NextResponse } from "next/server";

export interface GenerateCspOptions {
  nonce: string;
  isDev?: boolean;
  isTma?: boolean;
}

/**
 * Builds the Content-Security-Policy string for a given request nonce.
 */
export function generateCsp({ nonce, isDev, isTma }: GenerateCspOptions): string {
  const dev = isDev ?? process.env.NODE_ENV === "development";
  const frameAncestors = isTma
    ? "'self' https://web.telegram.org https://*.telegram.org"
    : "'none'";

  const directives: string[] = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://telegram.org${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://hamihamrah-shop.com https://dkstatics-public.digikala.com https://*.digikala.com",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors}`,
    "upgrade-insecure-requests",
  ];

  return directives.join("; ");
}

/**
 * Generates a per-request cryptographic nonce in base64.
 */
export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

/**
 * Applies the generated nonce and CSP to the request headers (so Next.js reads it)
 * and to the response headers.
 */
export function applyCsp(
  request: NextRequest,
  response?: NextResponse,
): { nonce: string; csp: string; response: NextResponse } {
  const nonce = generateNonce();
  const isDev = process.env.NODE_ENV === "development";
  const isTma = request.nextUrl.pathname.startsWith("/tma");

  const csp = generateCsp({ nonce, isDev, isTma });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const res = response ?? NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);

  return { nonce, csp, response: res };
}

