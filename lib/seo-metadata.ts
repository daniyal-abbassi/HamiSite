import type { Metadata } from "next";

export const SITE_NAME = "حامی همراه";
export const SITE_ORIGIN = new URL(process.env.APP_BASE_URL ?? "http://localhost:3000").origin;
export const SOCIAL_IMAGE = "/store/shop-upright.jpg";

export interface CanonicalUrlConfig {
  path: string;
  origin?: string;
  includeQuery?: boolean;
}

export interface MetaRobotsPolicy {
  index: boolean;
  follow: boolean;
  googleBot?: {
    index: boolean;
    follow: boolean;
    "max-image-preview"?: "none" | "standard" | "large";
    "max-snippet"?: number;
    "max-video-preview"?: number;
  };
}

export const defaultRobotsPolicy: MetaRobotsPolicy = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

/**
 * Resolves an absolute preferred URL. Callers must opt in to a query string only
 * when that query identifies a distinct page of content.
 */
export function formatCanonicalUrl(path: string, origin: string = SITE_ORIGIN, includeQuery = false): string {
  try {
    const targetOrigin = origin.replace(/\/+$/, "");
    const parsed = path.startsWith("http://") || path.startsWith("https://")
      ? new URL(path)
      : new URL(path.startsWith("/") ? path : `/${path}`, targetOrigin);

    let pathname = parsed.pathname.replace(/\/+/g, "/");
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    return `${targetOrigin}${pathname}${includeQuery ? parsed.search : ""}`;
  } catch {
    const base = origin.replace(/\/+$/, "");
    const cleanPath = path.split("#")[0].replace(/^\/*/, "/");
    return `${base}${includeQuery ? cleanPath : cleanPath.split("?")[0]}`;
  }
}

export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  includeQuery?: boolean;
  robots?: Metadata["robots"];
}): Metadata {
  const fullTitle = `${input.title} | ${SITE_NAME}`;
  const canonicalUrl = formatCanonicalUrl(input.path, SITE_ORIGIN, input.includeQuery);

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName: SITE_NAME,
      title: fullTitle,
      description: input.description,
      url: canonicalUrl,
      images: [{ url: SOCIAL_IMAGE, width: 3000, height: 4000, alt: "فروشگاه حضوری حامی همراه در مشهد" }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: input.description,
      images: [SOCIAL_IMAGE],
    },
    ...(input.robots ? { robots: input.robots } : {}),
  };
}

export const noIndexMetadata: Metadata = {
  robots: { index: false, follow: false },
};
