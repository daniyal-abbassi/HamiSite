import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
