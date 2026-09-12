/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
