import type { MetadataRoute } from "next";

import { blogPosts } from "@/lib/marketing-data";
import { absoluteUrl } from "@/lib/seo";

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
  "/tools/book-idea-validator",
  "/resources",
  "/contact",
  "/privacy",
  "/terms",
  "/refund-policy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const priorityMap: Record<string, number> = {
    "/": 1.0,
    "/pricing": 0.95,
    "/how-it-works": 0.9,
    "/use-cases": 0.88,
    "/compare": 0.88,
    "/faq": 0.85,
    "/blog": 0.82,
    "/tools/book-idea-validator": 0.84,
    "/about": 0.75,
  };

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: priorityMap[route] ?? 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticEntries, ...blogEntries];
}
