import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExampleReader } from "@/components/site/example-reader";
import { MarketingPage } from "@/components/site/marketing-page";
import { absoluteUrl, buildPageMetadata, siteConfig } from "@/lib/seo";
import { loadExampleReaderData } from "@/lib/examples-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await props.params;
  const item = await loadExampleReaderData(slug);

  if (!item) {
    return buildPageMetadata({
      title: "Örnek Kitap Bulunamadı | Book Generator",
      description: "İstenen örnek kitap bulunamadı.",
      path: `/examples/${slug}`,
      noIndex: true,
    });
  }

  const ogImage = absoluteUrl(item.coverImages.primaryUrl || item.coverImages.fallbackUrl || siteConfig.defaultOgImage);
  return buildPageMetadata({
    title: `${item.title} | Örnek Kitap`,
    description: item.subtitle,
    path: `/examples/${slug}`,
    keywords: [item.title, item.category, item.language, "book generator example reader"],
    ogImage,
  });
}

export default async function ExampleReaderPage(
  props: { params: Promise<{ slug: string }> },
) {
  const { slug } = await props.params;
  const item = await loadExampleReaderData(slug);

  if (!item) {
    notFound();
  }

  return (
    <MarketingPage>
      <div className="pb-24 xl:pb-0">
        <ExampleReader item={item} />
      </div>
    </MarketingPage>
  );
}
