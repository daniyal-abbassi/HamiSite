import type { Metadata } from "next";

export const SITE_NAME = "حامی همراه";
export const SITE_ORIGIN = new URL(process.env.APP_BASE_URL ?? "http://localhost:3000").origin;
export const SOCIAL_IMAGE = "/store/shop-upright.jpg";

export function pageMetadata(input: { title: string; description: string; path: string }): Metadata {
  const fullTitle = `${input.title} | ${SITE_NAME}`;
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName: SITE_NAME,
      title: fullTitle,
      description: input.description,
      url: input.path,
      images: [{ url: SOCIAL_IMAGE, width: 3000, height: 4000, alt: "فروشگاه حضوری حامی همراه در مشهد" }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: input.description,
      images: [SOCIAL_IMAGE],
    },
  };
}

export const noIndexMetadata: Metadata = {
  robots: { index: false, follow: false },
};
