import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo-metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Noindex on customer pages must remain visible to crawlers. Authentication
      // still protects private data; robots.txt is not an access-control layer.
      disallow: ["/api/", "/admin/"],
    },
    sitemap: new URL("/sitemap.xml", SITE_ORIGIN).toString(),
  };
}
