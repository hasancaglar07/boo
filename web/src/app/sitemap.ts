import type { MetadataRoute } from "next";

import { loadExamplesShowcaseData } from "@/lib/examples-data";
import { defaultLocale, locales } from "@/i18n/routing";
import { blogPosts } from "@/lib/marketing-data";
import { marketingToolCatalog } from "@/lib/marketing-tools";
import { siteConfig } from "@/lib/seo";

const DEFAULT_LAST_MODIFIED = new Date("2026-04-03T00:00:00.000Z");

// Production-safe sitemap: ensure we never leak localhost URLs
const PRODUCTION_SITE_URL = "https://bookgenerator.net";

function getSitemapBaseUrl(): string {
  // If siteConfig is already production URL, use it
  if (siteConfig.siteUrl === PRODUCTION_SITE_URL || 
      siteConfig.siteUrl === "https://www.bookgenerator.net") {
    return siteConfig.siteUrl;
  }
  // Fallback to production URL to prevent localhost leakage
  return PRODUCTION_SITE_URL;
}

function sitemapAbsoluteUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, getSitemapBaseUrl()).toString();
}

function localizedPath(path: string, locale: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath === "/") return `/${locale}`;
  return `/${locale}${normalizedPath}`;
}

function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {
    "x-default": sitemapAbsoluteUrl(localizedPath(path, defaultLocale)),
  };

  for (const locale of locales) {
    languages[locale] = sitemapAbsoluteUrl(localizedPath(path, locale));
  }

  return languages;
}

const staticRoutes = [
  "/",
  "/about",
  "/how-it-works",
  "/use-cases",
  "/examples",
  "/compare",
  "/pricing",
  "/faq",
  "/blog",
  "/tools",
  "/resources",
  "/contact",
  "/privacy",
  "/terms",
  "/refund-policy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { items: exampleItems } = await loadExamplesShowcaseData();
  const toolRoutes = marketingToolCatalog.map((tool) => tool.path);

  const priorityMap: Record<string, number> = {
    "/": 1.0,
    "/pricing": 0.95,
    "/how-it-works": 0.9,
    "/use-cases": 0.88,
    "/compare": 0.88,
    "/examples": 0.87,
    "/faq": 0.85,
    "/blog": 0.82,
    "/tools": 0.86,
    "/resources": 0.78,
    "/contact": 0.74,
    "/tools/book-idea-validator": 0.84,
    "/tools/book-outline-starter": 0.84,
    "/tools/content-to-book-mapper": 0.84,
    "/tools/kdp-niche-score": 0.84,
    "/tools/lead-magnet-book-angle-finder": 0.84,
    "/tools/title-subtitle-critic": 0.84,
    "/about": 0.75,
  };

  const publicRoutes = Array.from(new Set([...staticRoutes, ...toolRoutes]));

  const staticEntries: MetadataRoute.Sitemap = publicRoutes.flatMap((route) =>
    locales.map((locale) => ({
      url: sitemapAbsoluteUrl(localizedPath(route, locale)),
      lastModified: DEFAULT_LAST_MODIFIED,
      changeFrequency: route === "/" ? "daily" : "weekly",
      priority: priorityMap[route] ?? 0.7,
      alternates: {
        languages: languageAlternates(route),
      },
    })),
  );

  const blogEntries: MetadataRoute.Sitemap = blogPosts.flatMap((post) => {
    const route = `/blog/${post.slug}`;
    return locales.map((locale) => ({
      url: sitemapAbsoluteUrl(localizedPath(route, locale)),
      lastModified: new Date(post.dateModified),
      changeFrequency: "monthly",
      priority: 0.72,
      alternates: {
        languages: languageAlternates(route),
      },
    }));
  });

  const exampleEntries: MetadataRoute.Sitemap = exampleItems.flatMap((item) => {
    const route = `/examples/${item.slug}`;
    return locales.map((locale) => ({
      url: sitemapAbsoluteUrl(localizedPath(route, locale)),
      lastModified: DEFAULT_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: {
        languages: languageAlternates(route),
      },
    }));
  });

  return [...staticEntries, ...blogEntries, ...exampleEntries];
}
