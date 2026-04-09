import type { Metadata } from "next";

type PageMetadataInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
  type?: "website" | "article";
  ogImage?: string;
  hreflang?: Record<string, string>; // NEW: International language support
};

const productionSiteUrl = "https://bookgenerator.net";
const siteUrlEnvKeys = [
  "NEXT_PUBLIC_SITE_URL",
  "SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
  "URL",
] as const;

function isLocalOrPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase();

  if (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "0.0.0.0" ||
    normalized === "::1" ||
    normalized.endsWith(".local")
  ) {
    return true;
  }

  if (/^10\.\d+\.\d+\.\d+$/.test(normalized)) return true;
  if (/^192\.168\.\d+\.\d+$/.test(normalized)) return true;

  const private172Match = normalized.match(/^172\.(\d{1,2})\.\d+\.\d+$/);
  if (private172Match) {
    const octet = Number(private172Match[1]);
    if (octet >= 16 && octet <= 31) return true;
  }

  return false;
}

function resolveRawSiteUrl() {
  for (const key of siteUrlEnvKeys) {
    const value = process.env[key];
    if (value?.trim()) return value.trim();
  }

  return productionSiteUrl;
}

function normalizeSiteUrl(raw?: string) {
  if (!raw) return productionSiteUrl;

  try {
    const prefixed = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    const parsed = new URL(prefixed);
    const hostname = parsed.hostname.toLowerCase();

    if (isLocalOrPrivateHostname(hostname)) {
      return productionSiteUrl;
    }

    if (hostname === "bookgenerator.net" || hostname === "www.bookgenerator.net") {
      return productionSiteUrl;
    }

    return parsed.origin.replace(/\/+$/, "");
  } catch {
    return productionSiteUrl;
  }
}

export const siteConfig = {
  name: "Book Generator",
  alternateName: "AI Book Writing Tool",
  description:
    "AI-powered book generation platform. Turn your idea into a publication-ready book, cover, and EPUB/PDF output in 5 questions.",
  siteUrl: normalizeSiteUrl(resolveRawSiteUrl()),
  locale: "en_US",
  defaultTitle: "Book Generator - Write Books with AI",
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
        "en": canonical,
        "en-US": canonical,
      },
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
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
          alt: `${siteConfig.name} cover image`,
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
      "ai-locale": "en-US",
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
