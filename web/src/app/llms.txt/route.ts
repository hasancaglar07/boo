import { blogPosts } from "@/lib/marketing-data";
import { marketingToolCatalog } from "@/lib/marketing-tools";
import { siteConfig } from "@/lib/seo";

export const revalidate = 86400;

function buildLlmsText() {
  const keyPages = [
    `[Homepage](${siteConfig.siteUrl}/): Product positioning and primary CTA`,
    `[How It Works](${siteConfig.siteUrl}/how-it-works): Workflow and output explanation`,
    `[Pricing](${siteConfig.siteUrl}/pricing): Plans, credits, and one-time unlock`,
    `[Examples](${siteConfig.siteUrl}/examples): Public proof with sample books`,
    `[Tools](${siteConfig.siteUrl}/tools): Free AI SEO and book-planning tools`,
    `[Blog](${siteConfig.siteUrl}/blog): Educational content and topical authority`,
    `[FAQ](${siteConfig.siteUrl}/faq): Objections, constraints, and policy answers`,
    `[Compare](${siteConfig.siteUrl}/compare): Alternatives and comparison pages`,
    `[Contact](${siteConfig.siteUrl}/contact): Support and billing contact`,
  ];

  const lines = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    "Primary language: Turkish",
    "Output languages: multilingual, including English",
    "Category: AI publishing studio / AI book creation SaaS",
    "",
    "## Key pages",
    ...keyPages.map((line) => `- ${line}`),
    "",
    "## Free tools",
    ...marketingToolCatalog.map(
      (tool) => `- [${tool.name}](${siteConfig.siteUrl}${tool.path}): ${tool.description}`,
    ),
    "",
    "## Recent articles",
    ...blogPosts
      .slice(0, 8)
      .map((post) => `- [${post.title}](${siteConfig.siteUrl}/blog/${post.slug}): ${post.summary}`),
    "",
    "## Best-fit use cases",
    "- authority books",
    "- lead magnet books",
    "- KDP-ready nonfiction publishing",
    "- branded expert guides",
    "- multilingual publishing workflows",
    "",
    "## Not designed for",
    "- fiction novels",
    "- citation-heavy academic publishing",
    "- technical API documentation",
    "",
    `More detail: [llms-full.txt](${siteConfig.siteUrl}/llms-full.txt)`,
  ];

  return `${lines.join("\n")}\n`;
}

export function GET() {
  return new Response(buildLlmsText(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
