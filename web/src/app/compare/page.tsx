import { Check, X, Minus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { DirectAnswerBlock } from "@/components/site/direct-answer";
import { LastUpdated } from "@/components/site/last-updated";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { buildBreadcrumbSchema } from "@/lib/schema";
import { buildPageMetadata, absoluteUrl } from "@/lib/seo";
import { KDP_GUARANTEE_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";

export async function generateMetadata() {
  const t = await getTranslations("ComparePage.metadata");
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/compare",
    keywords: ["book generator comparison", "ai book writing alternatives", "chatgpt book"],
  });
}

type Support = "yes" | "no" | "partial";

function SupportIcon({ value }: { value: Support }) {
  if (value === "yes") return <Check className="mx-auto size-5 text-green-600" />;
  if (value === "no") return <X className="mx-auto size-5 text-red-500" />;
  return <Minus className="mx-auto size-5 text-yellow-500" />;
}

const rowSupport: Array<{ bookGenerator: Support; manualAI: Support; generalTools: Support }> = [
  { bookGenerator: "yes", manualAI: "no", generalTools: "no" },
  { bookGenerator: "yes", manualAI: "partial", generalTools: "partial" },
  { bookGenerator: "yes", manualAI: "no", generalTools: "no" },
  { bookGenerator: "yes", manualAI: "no", generalTools: "no" },
  { bookGenerator: "yes", manualAI: "no", generalTools: "no" },
  { bookGenerator: "yes", manualAI: "no", generalTools: "partial" },
  { bookGenerator: "yes", manualAI: "partial", generalTools: "partial" },
  { bookGenerator: "yes", manualAI: "no", generalTools: "partial" },
  { bookGenerator: "yes", manualAI: "no", generalTools: "no" },
  { bookGenerator: "yes", manualAI: "partial", generalTools: "partial" },
  { bookGenerator: "yes", manualAI: "no", generalTools: "no" },
  { bookGenerator: "yes", manualAI: "partial", generalTools: "yes" },
  { bookGenerator: "yes", manualAI: "no", generalTools: "no" },
];

const altProsCounts = [2, 2, 2, 2];
const altConsCounts = [5, 4, 4, 4];

export default async function ComparePage() {
  const t = await getTranslations("ComparePage");

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", item: absoluteUrl("/") },
    { name: "Compare", item: absoluteUrl("/compare") },
  ]);

  return (
    <MarketingPage>
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">{t("hero.badge")}</Badge>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {t("hero.title")}{" "}
              <span className="text-primary">{t("hero.titleHighlight")}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
              {t("hero.description")}
            </p>
            <div className="mt-8 text-left">
              <DirectAnswerBlock question={t("directAnswer.question")} answer={t("directAnswer.answer")} />
              <LastUpdated date="2026-04-09" className="mt-4 text-sm" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-14">
        <div className="shell">
          <div className="mx-auto max-w-4xl rounded-[24px] border border-border/80 bg-card/80 px-6 py-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("hiddenCost.label")}</p>
            <p className="mt-3 text-base leading-8 text-foreground">{t("hiddenCost.text")}</p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <SectionHeading badge={t("featureTable.badge")} title={t("featureTable.title")} description={t("featureTable.description")} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-4 pl-2 text-left font-medium text-muted-foreground">{t("featureTable.headers.feature")}</th>
                  <th className="pb-4 text-center font-semibold text-foreground">{t("featureTable.headers.bookCreator")}</th>
                  <th className="pb-4 text-center font-medium text-muted-foreground">{t("featureTable.headers.manualAI")}</th>
                  <th className="pb-4 pr-2 text-center font-medium text-muted-foreground">{t("featureTable.headers.generalTools")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rowSupport.map((row, i) => (
                  <tr key={i} className="group">
                    <td className="py-3.5 pl-2">
                      <div>
                        <span className="font-medium text-foreground">{t(`featureTable.rows.${i}.feature`)}</span>
                        {(() => { try { const note = t(`featureTable.rows.${i}.note`); return note ? <p className="mt-0.5 text-xs text-muted-foreground">{note}</p> : null; } catch { return null; } })()}
                      </div>
                    </td>
                    <td className="py-3.5 text-center"><SupportIcon value={row.bookGenerator} /></td>
                    <td className="py-3.5 text-center"><SupportIcon value={row.manualAI} /></td>
                    <td className="py-3.5 pr-2 text-center"><SupportIcon value={row.generalTools} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="size-3.5 text-green-600" /> {t("featureTable.legend.yes")}</span>
            <span className="flex items-center gap-1.5"><Minus className="size-3.5 text-yellow-500" /> {t("featureTable.legend.partial")}</span>
            <span className="flex items-center gap-1.5"><X className="size-3.5 text-red-500" /> {t("featureTable.legend.no")}</span>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <SectionHeading badge={t("alternatives.badge")} title={t("alternatives.title")} />
          <div className="grid gap-6 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border/80 bg-background p-6">
                <h3 className="font-serif text-lg font-semibold text-foreground">{t(`alternatives.items.${i}.name`)}</h3>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("alternatives.prosLabel")}</p>
                    <ul className="space-y-1.5">
                      {Array.from({ length: altProsCounts[i] }).map((_, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-green-500" />
                          {t(`alternatives.items.${i}.pros.${j}`)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("alternatives.consLabel")}</p>
                    <ul className="space-y-1.5">
                      {Array.from({ length: altConsCounts[i] }).map((_, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                          <X className="mt-0.5 size-3.5 shrink-0 text-red-400" />
                          {t(`alternatives.items.${i}.cons.${j}`)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingCtaSection
        title={t("cta.title")}
        description={`Preview first, then decide if this book is worth publishing. The real difference isn't the chatbot — it's the publication-ready workflow. ${NO_API_COST_CLAIM} and books are prepared with ${KDP_GUARANTEE_CLAIM}.`}
        items={[t("cta.items.0"), t("cta.items.1"), t("cta.items.2"), t("cta.items.3")]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </MarketingPage>
  );
}
