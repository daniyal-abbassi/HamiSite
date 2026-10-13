/**
 * Strongly typed definitions for Persian SEO metadata and JSON-LD structured data.
 * Complies with schema.org specifications and Persian e-commerce search patterns.
 */

export interface PersianSeoMetadataInput {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}

export interface PersianProductJsonLdInput {
  name: string;
  description: string;
  slug: string;
  images?: string[];
  price?: number;
  currency?: "IRR" | "IRT";
  inStock?: boolean;
  brandName?: string;
  sku?: string;
  categoryName?: string;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface OrganizationJsonLdInput {
  name?: string;
  url?: string;
  logo?: string;
  telephone?: string;
  city?: string;
}

export interface WebSiteJsonLdInput {
  name?: string;
  url?: string;
  searchPath?: string;
}

