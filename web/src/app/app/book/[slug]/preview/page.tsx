import type { Metadata } from "next";

import { BookPreviewScreen } from "@/components/funnel/book-preview-screen";
import { PreviewErrorBoundary } from "@/components/error/preview-error-boundary";
import { requireBookPreviewAccess } from "@/lib/auth/server-access";
import { buildPageMetadata } from "@/lib/seo";
import { loadBookPreview } from "@/lib/dashboard-api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const preview = await loadBookPreview(slug);
    const bookTitle = preview.book.title;
    const bookSubtitle = preview.book.subtitle;
    const authorName = preview.book.author || "Anonymous Author";

    return buildPageMetadata({
      title: `${bookTitle} by ${authorName} - Preview | Book Generator`,
      description: `Preview "${bookTitle}${bookSubtitle ? ': ' + bookSubtitle : ''}" by ${authorName}. View the cover, outline, and first chapter before downloading.`,
      path: `/app/book/${slug}/preview`,
      noIndex: true,
      type: "website",
      keywords: [
        "book preview",
        "read book online",
        "book generator",
        "AI book writing",
        slug,
        bookTitle,
        authorName,
      ].filter(Boolean) as string[],
    });
  } catch (error) {
    // Fallback if book data not available
    return buildPageMetadata({
      title: `${slug} Preview | Book Generator`,
      description: "View your book's cover, outline, and the first 20% preview.",
      path: `/app/book/${slug}/preview`,
      noIndex: true,
    });
  }
}

export default async function BookPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireBookPreviewAccess(slug, `/app/book/${slug}/preview`);

  return (
    <PreviewErrorBoundary slug={slug}>
      <BookPreviewScreen slug={slug} />
    </PreviewErrorBoundary>
  );
}