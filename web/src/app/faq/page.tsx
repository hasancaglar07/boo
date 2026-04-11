import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { FAQPageHero } from "@/components/site/page-heroes";
import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Faq5 } from "@/components/ui/faq-5";
import { Card, CardContent } from "@/components/ui/card";
import { buildFAQSchema } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const t = await getTranslations("FaqPage.metadata");
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/faq",
    keywords: ["book generator faq", "ai book writing questions", "epub pdf output"],
  });
}

export default async function FaqPage() {
  const t = await getTranslations("FaqPage");
  const tFaq = await getTranslations("FaqData");

  const sectionKeys = ["General", "BookProduction", "CoverAndDesign", "DeliveryAndOutputs", "RightsAndPublishing", "SubscriptionAndPayment", "Support"] as const;
  const sectionCtaMap: Record<string, string> = {
    "General": "/how-it-works",
    "Book Production": "/examples",
    "Cover and Design": "/examples",
    "Delivery and Outputs": "/pricing",
    "Rights and Publishing": "/start/topic",
    "Subscription and Payment": "/pricing",
    "Support": "/contact",
  };

  const faqSections = sectionKeys.map((key) => {
    const title = tFaq(`${key}.title`);
    const rawItems = tFaq.raw(`${key}.items`) as Record<string, { q: string; a: string }> | undefined;
    const items: [string, string][] = rawItems
      ? Object.values(rawItems).map((item) => [item.q, item.a])
      : [];
    return { title, items };
  });

  const topFaqs = faqSections
    .slice(0, 2)
    .flatMap((s) => s.items.map(([question, answer]) => ({ question, answer })))
    .slice(0, 4);

  const allFaqs = faqSections.flatMap((s) => s.items.map(([question, answer]) => ({ question, answer })));
  const faqSchema = buildFAQSchema(allFaqs);

  return (
    <MarketingPage>
      <FAQPageHero />
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <h1 className="sr-only">Book Generator frequently asked questions</h1>
          <SectionHeading badge={t("mainSection.badge")} title={t("mainSection.title")} description={t("mainSection.description")} align="center" />
          <p className="mx-auto max-w-2xl text-center text-sm leading-7 text-muted-foreground">
            {t("mainSection.contactLabel") && (
              <>
                For technical questions, visit the{" "}
                <Link href="/contact" className="text-foreground underline-offset-4 hover:underline">{t("mainSection.contactLabel")}</Link>{" "}
                page, for plan details check{" "}
                <Link href="/pricing" className="text-foreground underline-offset-4 hover:underline">{t("mainSection.pricingLabel")}</Link>{" "}
                and for process steps see the{" "}
                <Link href="/how-it-works" className="text-foreground underline-offset-4 hover:underline">{t("mainSection.howItWorksLabel")}</Link>{" "}
                page.
              </>
            )}
          </p>
        </div>
      </section>

      <section className="border-b border-border/80">
        <Faq5
          badge={t("quickAnswers.badge")}
          heading={t("quickAnswers.heading")}
          description={t("quickAnswers.description")}
          faqs={topFaqs}
        />
      </section>

      <section className="py-18">
        <div className="shell space-y-10">
          <SectionHeading badge={t("allQuestions.badge")} title={t("allQuestions.title")} description={t("allQuestions.description")} />

          {faqSections.map((section) => {
            const sectionTitleKey = section.title as keyof typeof sectionCtaMap;
            const ctaHref = sectionCtaMap[sectionTitleKey];
            const ctaLabelKey = `sectionCtas.${section.title}` as const;
            let ctaLabel = "";
            try { ctaLabel = t(ctaLabelKey as never); } catch { ctaLabel = ""; }
            return (
              <section key={section.title} className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">{section.title}</h2>
                  {ctaHref && ctaLabel && (                    <Link href={ctaHref} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                      {ctaLabel} <ArrowRight className="size-3.5" />
                    </Link>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {section.items.map(([question, answer]) => (
                    <Card key={question}>
                      <CardContent className="space-y-3">
                        <h3 className="text-lg font-semibold tracking-tight text-foreground">{question}</h3>
                        <p className="text-sm leading-8 text-muted-foreground">{answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">{t("fitSection.title")}</h2>
              <Link href="/use-cases" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                {t("fitSection.link")} <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="space-y-3">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">{t("fitSection.whereExcel.title")}</h3>
                  <p className="text-sm leading-8 text-muted-foreground">{t("fitSection.whereExcel.description")}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-3">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">{t("fitSection.notRight.title")}</h3>
                  <p className="text-sm leading-8 text-muted-foreground">{t("fitSection.notRight.description")}</p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </section>

      <MarketingCtaSection
        title={t("cta.title")}
        description={t("cta.description")}
        items={[t("cta.items.0"), t("cta.items.1"), t("cta.items.2"), t("cta.items.3")]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </MarketingPage>
  );
}
