import type { Metadata } from "next";

import { MarketingPage } from "@/components/site/marketing-page";
import { BookIdeaValidatorTool } from "@/components/site/book-idea-validator-tool";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Kitap Fikri Değerlendirici | Kitap Oluşturucu",
  description:
    "Kitap fikrinin ne kadar güçlü olduğunu saniyeler içinde puanla. Hedef okur, vaat ve format açısından analiz al; başlık fikirleri ve mini outline ile devam et.",
  path: "/tools/book-idea-validator",
  keywords: [
    "book idea validator",
    "book topic validator",
    "kitap fikri doğrulama",
    "authority book idea",
    "lead magnet book idea",
    "book outline starter",
  ],
});

export default function BookIdeaValidatorPage() {
  return (
    <MarketingPage>
      <BookIdeaValidatorTool />
    </MarketingPage>
  );
}
