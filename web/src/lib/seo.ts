import type { Metadata } from "next";

type PageMetadataInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
  type?: "website" | "article";
  ogImage?: string;
};

const fallbackSiteUrl = "http://localhost:3000";

function normalizeSiteUrl(raw?: string) {
  if (!raw) return fallbackSiteUrl;
  const prefixed = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  return prefixed.replace(/\/+$/, "");
}

export const siteConfig = {
  name: "Book Generator",
  description: "İlk kitabını daha sade, daha net ve daha hızlı üretmek için kurulan premium yazım arayüzü.",
  siteUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  locale: "tr_TR",
  defaultTitle: "Book Generator",
  defaultOgImage: "/logo-tight.png",
};

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, siteConfig.siteUrl).toString();
}

export function buildPageMetadata({
  title,
  description,
  path = "/",
  keywords,
  noIndex = false,
  type = "website",
  ogImage: ogImageOverride,
}: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const ogImage = ogImageOverride ?? absoluteUrl(siteConfig.defaultOgImage);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
      languages: {
        "tr-TR": canonical,
      },
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
      },
    },
    openGraph: {
      type,
      locale: siteConfig.locale,
      url: canonical,
      title,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} kapak görseli`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    other: {
      "ai-content-type": "saas-product",
      "ai-locale": "tr-TR",
      "ai-topic": "ai-book-generation",
      "ai-product-name": siteConfig.name,
    },
  };
}

export function buildOgImageUrl(title: string, description: string): string {
  const url = new URL(absoluteUrl("/api/og"));
  url.searchParams.set("title", title);
  url.searchParams.set("description", description.slice(0, 120));
  return url.toString();
}

export function metadataBaseUrl() {
  return new URL(siteConfig.siteUrl);
}
