import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InteractiveMarketingTool } from "@/components/site/interactive-marketing-tool";
import { MarketingPage } from "@/components/site/marketing-page";
import { getGenericMarketingToolBySlug, getGenericMarketingToolSlugs } from "@/lib/marketing-tools";
import { buildPageMetadata } from "@/lib/seo";

type ToolPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getGenericMarketingToolBySlug(slug);

  if (!tool) {
    return buildPageMetadata({
      title: "Araç Bulunamadı | Kitap Oluşturucu",
      description: "İstenen araç bulunamadı.",
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

  return (
    <MarketingPage>
      <InteractiveMarketingTool slug={tool.slug} />
    </MarketingPage>
  );
}
