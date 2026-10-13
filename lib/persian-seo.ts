import type { Metadata } from "next";
import { SITE_NAME, SITE_ORIGIN, SOCIAL_IMAGE } from "@/lib/seo-metadata";
import type {
  PersianSeoMetadataInput,
  PersianProductJsonLdInput,
  BreadcrumbItem,
  OrganizationJsonLdInput,
  WebSiteJsonLdInput,
} from "@/types/persian-seo";

/**
 * Normalizes Persian and Arabic text:
 * - Replaces Arabic Yeh (ي \u064A) with Persian Yeh (ی \u06CC)
 * - Replaces Arabic Kaf (ك \u0643) with Persian Keheh (ک \u06A9)
 * - Normalizes Arabic Heh with Yeh above (ۀ) to ه
 * - Trims whitespace
 */
export function normalizePersianText(input: string): string {
  if (!input) return "";
  return input
    .replace(/\u064A/g, "\u06CC") // ي -> ی
    .replace(/\u0643/g, "\u06A9") // ك -> ک
    .replace(/\u06C0/g, "\u0647") // ۀ -> ه
    .trim();
}

/**
 * Converts Persian text into a URL-safe, crawl-friendly slug:
 * - Normalizes Arabic characters to Persian
 * - Converts ZWNJ (\u200c), spaces, underscores, pipes, and slashes to hyphens (-)
 * - Drops punctuation and characters outside Unicode letters and numbers
 * - Collapses consecutive hyphens into a single hyphen
 * - Trims hyphens from ends
 */
export function sanitizePersianSlug(input: string): string {
  if (!input) return "";
  const normalized = normalizePersianText(input);

  return normalized
    .replace(/[\u200c\u00a0\s_|\\/]+/g, "-") // ZWNJ, spaces, underscores, separators -> -
    .replace(/[^\p{L}\p{N}-]/gu, "")         // Drop special characters
    .replace(/-+/g, "-")                     // Deduplicate hyphens
    .replace(/^-+|-+$/g, "")                 // Trim leading/trailing hyphens
    .toLowerCase();
}

/**
 * Generates schema.org/Product JSON-LD object for product detail pages.
 */
export function buildProductJsonLd(input: PersianProductJsonLdInput): Record<string, unknown> {
  const productUrl = `${SITE_ORIGIN}/shop/${encodeURIComponent(input.slug)}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.images && input.images.length > 0 ? input.images : [`${SITE_ORIGIN}${SOCIAL_IMAGE}`],
    ...(input.sku ? { sku: input.sku } : {}),
    ...(input.brandName ? { brand: { "@type": "Brand", name: input.brandName } } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: input.currency ?? "IRT",
      price: input.price ?? 0,
      availability: input.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: productUrl,
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_ORIGIN,
      },
    },
  };
}

/**
 * Generates schema.org/BreadcrumbList JSON-LD object.
 */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, SITE_ORIGIN).toString(),
    })),
  };
}

/**
 * Generates schema.org/Organization JSON-LD object.
 */
export function buildOrganizationJsonLd(input?: OrganizationJsonLdInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_ORIGIN}/#organization`,
    name: input?.name ?? SITE_NAME,
    url: input?.url ?? SITE_ORIGIN,
    logo: input?.logo ?? `${SITE_ORIGIN}/brand/hami-wordmark-fa.png`,
    ...(input?.telephone ? { telephone: input.telephone } : {}),
    areaServed: {
      "@type": "City",
      name: input?.city ?? "مشهد",
    },
  };
}

/**
 * Generates schema.org/WebSite JSON-LD object with SearchAction.
 */
export function buildWebSiteJsonLd(input?: WebSiteJsonLdInput): Record<string, unknown> {
  const origin = input?.url ?? SITE_ORIGIN;
  const searchPath = input?.searchPath ?? "/shop?q={search_term_string}";

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    url: origin,
    name: input?.name ?? SITE_NAME,
    inLanguage: "fa-IR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${origin}${searchPath}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Standard page metadata generator with Persian SEO conventions.
 */
export function generatePersianMetadata(input: PersianSeoMetadataInput): Metadata {
  const fullTitle = `${input.title} | ${SITE_NAME}`;
  const canonicalPath = input.path.startsWith("/") ? input.path : `/${input.path}`;
  const canonicalUrl = new URL(canonicalPath, SITE_ORIGIN).toString();
  const socialImage = input.image ?? SOCIAL_IMAGE;

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName: SITE_NAME,
      title: fullTitle,
      description: input.description,
      url: canonicalUrl,
      images: [
        {
          url: socialImage,
          alt: input.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: input.description,
      images: [socialImage],
    },
    ...(input.noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

