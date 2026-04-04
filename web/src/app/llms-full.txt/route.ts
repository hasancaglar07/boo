import { blogPosts } from "@/lib/marketing-data";
import { marketingToolCatalog } from "@/lib/marketing-tools";
import { siteConfig } from "@/lib/seo";

export const revalidate = 86400;

function section(title: string, items: string[]) {
  return [`## ${title}`, ...items, ""];
}

function buildLlmsFullText() {
  const lines = [
    `# ${siteConfig.name} / ${siteConfig.alternateName}`,
    "",
    `Canonical site: [${siteConfig.siteUrl}](${siteConfig.siteUrl})`,
    `Summary: ${siteConfig.description}`,
    "",
    "Audience:",
    "- experts",
    "- consultants",
    "- coaches",
    "- educators",
    "- creators",
    "- small business operators",
    "",
    "Core promise:",
    "- turn one idea into a structured, branded, publish-ready nonfiction book",
    "- generate outline, chapters, cover direction, and export-ready outputs in one workflow",
    "- support multilingual production from a Turkish-first interface",
    "",
    ...section("Core URLs", [
      `- [Homepage](${siteConfig.siteUrl}/): homepage and positioning`,
      `- [How It Works](${siteConfig.siteUrl}/how-it-works): workflow explanation`,
      `- [Pricing](${siteConfig.siteUrl}/pricing): plans and one-time unlock`,
      `- [Examples](${siteConfig.siteUrl}/examples): showcase books and proof`,
      `- [Compare](${siteConfig.siteUrl}/compare): alternatives and comparisons`,
      `- [FAQ](${siteConfig.siteUrl}/faq): objections and product answers`,
      `- [Resources](${siteConfig.siteUrl}/resources): free resources`,
      `- [Contact](${siteConfig.siteUrl}/contact): support and billing contact`,
    ]),
    ...section(
      "Free Tools",
      marketingToolCatalog.map(
        (tool) => `- [${tool.name}](${siteConfig.siteUrl}${tool.path}): ${tool.description}`,
      ),
    ),
    ...section(
      "Blog Articles",
      blogPosts.map(
        (post) =>
          `- [${post.title}](${siteConfig.siteUrl}/blog/${post.slug}): ${post.summary}`,
      ),
    ),
    ...section("Editorial / Product Notes", [
      "- The product is optimized for nonfiction, authority, lead magnet, and KDP-oriented publishing workflows.",
      "- It is not intended for novels, thesis-style academic work, or dense technical documentation.",
      "- The product uses a guided wizard and preview-first funnel before full unlock.",
      "- Example pages and free tools are public discovery surfaces; app/account flows are private utility surfaces.",
    ]),
  ];

  return `${lines.join("\n")}\n`;
}

export function GET() {
  return new Response(buildLlmsFullText(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
