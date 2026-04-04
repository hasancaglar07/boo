import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["/app/", "/login", "/signup", "/register", "/account", "/billing", "/api/"];
  const aiAccessPaths = ["/", "/api/og", "/llms.txt", "/llms-full.txt"];
  const allowlistedCrawlers = [
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "anthropic-ai",
    "PerplexityBot",
    "Google-Extended",
    "Applebot-Extended",
    "FacebookBot",
    "Amazonbot",
  ];
  const blockedTrainingCrawlers = ["GPTBot", "CCBot", "Bytespider"];

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/og"],
        disallow: privatePaths,
      },
      ...allowlistedCrawlers.map((userAgent) => ({
        userAgent,
        allow: aiAccessPaths,
        disallow: privatePaths,
      })),
      ...blockedTrainingCrawlers.map((userAgent) => ({
        userAgent,
        disallow: "/",
      })),
    ],
    sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
    host: siteConfig.siteUrl,
  };
}
