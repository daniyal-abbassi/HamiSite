import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output bundles a minimal server and only traced dependencies for host deployment.
  output: "standalone",
  // Keep tracing rooted at this app when a parent workspace also has a lockfile.
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  // Keep metadata in <head> for SEO and social crawlers that do not execute
  // streamed body content. Browser requests still use Next.js metadata streaming.
  htmlLimitedBots: /bot|crawler|spider/i,
  /* The Next dev badge renders as a black circle pinned to the bottom-left of
     the viewport — which is exactly where the mobile dock sits, so on a phone it
     covered the «حساب» tab. Dev-only, absent from a production build, but it made
     the bar look broken on every device while testing. */
  devIndicators: false,
  images: {
    // The catalogue export carries the shop's own photography, hosted on the
    // live site. Without this allowlist every product image 400s through the
    // next/image optimizer.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hamihamrah-shop.com",
        pathname: "/shop-resources/**",
      },
      {
        protocol: "https",
        hostname: "dkstatics-public.digikala.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.digikala.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "X-Frame-Options", value: "DENY" },
      ...(isProd
        ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
        : []),
    ];

    return [
      {
        source: "/_next/static/:path*",
        headers: [
          // Dev chunk URLs are unhashed and their content changes under the
          // same URL, so `immutable` pins stale code in every browser for a
          // year. Only production (content-hashed URLs) may cache forever.
          process.env.NODE_ENV === "production"
            ? { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
            : { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
