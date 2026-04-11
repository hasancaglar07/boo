import { getTranslations } from "next-intl/server";

import { ContactPageHero } from "@/components/site/page-heroes";
import { ContactForm } from "@/components/site/contact-form";
import { DirectAnswerBlock } from "@/components/site/direct-answer";
import { LastUpdated } from "@/components/site/last-updated";
import { MarketingPage } from "@/components/site/marketing-page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buildBreadcrumbSchema } from "@/lib/schema";
import { supportChannels } from "@/lib/marketing-data";
import { buildPageMetadata, absoluteUrl } from "@/lib/seo";

export async function generateMetadata() {
  const t = await getTranslations("ContactPage.metadata");
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/contact",
    keywords: ["book generator contact", "book writing support", "billing support"],
  });
}

export default async function ContactPage() {
  const t = await getTranslations("ContactPage");

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", item: absoluteUrl("/") },
    { name: "Contact", item: absoluteUrl("/contact") },
  ]);

  const infoBannerItems = [0, 1, 2].map((i) => ({
    title: t(`infoBanner.${i}.title`),
    text: t(`infoBanner.${i}.text`),
  }));

  return (
    <MarketingPage>
      <ContactPageHero />

      <section className="border-b border-border/80 py-12">
        <div className="shell">
          <DirectAnswerBlock question={t("directAnswer.question")} answer={t("directAnswer.answer")} />
          <LastUpdated date="2026-04-09" className="mt-4 text-sm" />
        </div>
      </section>

      <section className="border-b border-border/80 bg-accent/20 py-8">
        <div className="shell grid gap-4 md:grid-cols-3">
          {supportChannels.map((channel, i) => (
            <Card key={channel.title}>
              <CardContent className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{t(`supportChannels.${i}.title`)}</h3>
                <p className="text-xs leading-6 text-muted-foreground">{t(`supportChannels.${i}.text`)}</p>
                <p className="text-sm font-medium text-primary">{channel.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="shell py-12">
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {infoBannerItems.map(({ title, text }) => (
            <Card key={title}>
              <CardContent className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="text-xs leading-6 text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mb-8">
          <Badge>{t("formSection.badge")}</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {t("formSection.title")}
          </h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {t("formSection.description")}
          </p>
        </div>
        <ContactForm />
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </MarketingPage>
  );
}
