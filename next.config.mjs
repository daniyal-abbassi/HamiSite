/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    ],
  },
};

export default nextConfig;
