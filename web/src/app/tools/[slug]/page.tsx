import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InteractiveMarketingTool } from "@/components/site/interactive-marketing-tool";
import { MarketingPage } from "@/components/site/marketing-page";
import { buildBreadcrumbSchema, buildHowToSchema } from "@/lib/schema";
import { getGenericMarketingToolBySlug, getGenericMarketingToolSlugs } from "@/lib/marketing-tools";
import { buildPageMetadata, absoluteUrl } from "@/lib/seo";

type ToolPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getGenericMarketingToolBySlug(slug);

  if (!tool) {
    return buildPageMetadata({
      title: "Tool Not Found | Book Generator",
      description: "The requested tool was not found.",
      path: `/tools/${slug}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: tool.metaTitle,
    description: tool.metaDescription,
    path: tool.path,
    keywords: tool.keywords,
  });
}

export function generateStaticParams() {
  return getGenericMarketingToolSlugs().map((slug) => ({ slug }));
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getGenericMarketingToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const toolUrl = absoluteUrl(tool.path);

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", item: absoluteUrl("/") },
    { name: "Tools", item: absoluteUrl("/tools") },
    { name: tool.name, item: toolUrl },
  ]);

  const howToSchema = buildHowToSchema({
    name: tool.name,
    description: tool.description,
    steps: (tool.steps || [
      "Enter your information",
      "AI analyzes and processes",
      "Get detailed results via email"
    ]).map((step) => ({
      name: step,
      text: step,
    })),
    estimatedTime: "PT5M",
  });

  return (
    <MarketingPage>
      <InteractiveMarketingTool slug={tool.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
    </MarketingPage>
  );
}
