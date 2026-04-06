import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExampleReader } from "@/components/site/example-reader";
import { MarketingPage } from "@/components/site/marketing-page";
import { absoluteUrl, buildPageMetadata, siteConfig } from "@/lib/seo";
import { loadExampleReaderData, loadExamplesShowcaseData } from "@/lib/examples-data";

export const revalidate = 86400;
export const dynamicParams = false;

export async function generateStaticParams() {
  const { items } = await loadExamplesShowcaseData();
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await props.params;
  const item = await loadExampleReaderData(slug);

  if (!item) {
    return buildPageMetadata({
      title: "Example Book Not Found | Book Generator",
      description: "The requested example book was not found.",
      path: `/examples/${slug}`,
      noIndex: true,
    });
  }

  const ogImage = absoluteUrl(item.coverImages.primaryUrl || item.coverImages.fallbackUrl || siteConfig.defaultOgImage);
  return buildPageMetadata({
    title: `${item.title} | Example Book`,
    description: item.summary || item.subtitle,
    path: `/examples/${slug}`,
    keywords: [item.title, item.category, item.language, ...item.tags.slice(0, 5), "book generator example reader"],
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

  const pageUrl = absoluteUrl(`/examples/${slug}`);
  const imageUrl = absoluteUrl(item.coverImages.primaryUrl || item.coverImages.fallbackUrl || siteConfig.defaultOgImage);
  const bookSchema = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: item.title,
    description: item.summary || item.subtitle,
    url: pageUrl,
    image: imageUrl,
    inLanguage: item.languageCode,
    genre: item.category,
    keywords: item.tags.join(", "),
    bookFormat: "https://schema.org/EBook",
    isAccessibleForFree: true,
    author: {
      "@type": "Person",
      name: item.author,
    },
    publisher: {
      "@type": "Organization",
      name: item.publisher || siteConfig.name,
      url: siteConfig.siteUrl,
    },
    workExample: item.exports.html?.url || item.exports.pdf?.url || item.exports.epub?.url || pageUrl,
    copyrightYear: item.year,
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Examples",
        item: absoluteUrl("/examples"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: item.title,
        item: pageUrl,
      },
    ],
  };

  return (
    <MarketingPage>
      <div className="pb-24 xl:pb-0">
        <ExampleReader item={item} />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </MarketingPage>
  );
}
