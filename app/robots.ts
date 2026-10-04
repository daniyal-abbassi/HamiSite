import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo-metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/account", "/cart", "/checkout", "/login", "/register", "/orders", "/order/", "/payment/"],
    },
    sitemap: new URL("/sitemap.xml", SITE_ORIGIN).toString(),
  };
}
