"use client";

import Link from "next/link";
import { startTransition, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  Layers3,
  Mail,
  Magnet,
  PenSquare,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/lib/analytics";
import {
  getGenericMarketingToolBySlug,
  getMarketingToolRelatedCards,
  type GenericMarketingToolSlug,
  type MarketingToolField,
  type MarketingToolValues,
  type ToolIconKey,
} from "@/lib/marketing-tools";

const iconMap: Record<ToolIconKey, LucideIcon> = {
  sparkles: Sparkles,
  target: Target,
  compass: Compass,
  trending: TrendingUp,
  layers: Layers3,
  search: Search,
  magnet: Magnet,
  book: BookOpen,
  pen: PenSquare,
};

function defaultValues(fields: MarketingToolField[]) {
  return fields.reduce<MarketingToolValues>((acc, field) => {
    if (field.type === "select") {
      acc[field.name] = field.options[0]?.value || "";
      return acc;
    }

    acc[field.name] = "";
    return acc;
  }, {});
}

function fieldError(field: MarketingToolField, value: string) {
  if (field.type === "select") {
    if (field.required === false) return "";
    return value ? "" : `${field.label} must be selected.`;
  }

  if (field.required === false) return "";
  return value.trim().length >= field.minLength ? "" : `${field.label} field a bit more clearly.`;
}

function isValid(fields: MarketingToolField[], values: MarketingToolValues) {
  return fields.every((field) => !fieldError(field, values[field.name] || ""));
}

function renderField(
  field: MarketingToolField,
  values: MarketingToolValues,
  showValidation: boolean,
  onChange: (name: string, value: string) => void,
) {
  const currentValue = values[field.name] || "";
  const error = showValidation ? fieldError(field, currentValue) : "";

  if (field.type === "textarea") {
    return (
      <div key={field.name}>
        <Label htmlFor={field.name}>{field.label}</Label>
        <Textarea
          id={field.name}
          value={currentValue}
          onChange={(event) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder}
          className="min-h-[120px]"
        />
        {error ? <p className="mt-2 text-sm text-primary">{error}</p> : null}
      </div>
    );
  }

  if (field.type === "input") {
    return (
      <div key={field.name}>
        <Label htmlFor={field.name}>{field.label}</Label>
        <Input
          id={field.name}
          value={currentValue}
          onChange={(event) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder}
        />
        {error ? <p className="mt-2 text-sm text-primary">{error}</p> : null}
      </div>
    );
  }

  return (
    <div key={field.name}>
      <Label htmlFor={field.name}>{field.label}</Label>
      <select
        id={field.name}
        value={currentValue}
        onChange={(event) => onChange(field.name, event.target.value)}
        className="flex h-14 w-full rounded-[20px] border border-input bg-card px-5 text-[15px] text-foreground outline-none transition focus:border-ring/50 focus:ring-2 focus:ring-ring/20"
      >
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-2 text-sm text-primary">{error}</p> : null}
    </div>
  );
}

export function InteractiveMarketingTool({ slug }: { slug: GenericMarketingToolSlug }) {
  const t = useTranslations("InteractiveMarketingTool");
  const tool = getGenericMarketingToolBySlug(slug);
  const [values, setValues] = useState<MarketingToolValues>(() => (tool ? defaultValues(tool.fields) : {}));
  const [analysisState, setAnalysisState] = useState<"idle" | "analyzing" | "done">("idle");
  const [showValidation, setShowValidation] = useState(false);
  const [email, setEmail] = useState("");
  const [reportUnlocked, setReportUnlocked] = useState(false);
  const [reportDeliveredTo, setReportDeliveredTo] = useState("");
  const [reportPending, setReportPending] = useState(false);
  const [reportError, setReportError] = useState("");
  const startTrackedRef = useRef(false);
  const gateViewTrackedRef = useRef(false);

  useEffect(() => {
    if (!tool) return;
    trackEvent("tool_page_viewed", { tool: tool.id });
  }, [tool]);

  if (!tool) {
    return null;
  }

  const activeTool = tool;
  const result = activeTool.evaluate(values);
  const previewHref = activeTool.buildPreviewHref(values);
  const formValid = isValid(activeTool.fields, values);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const relatedCards = getMarketingToolRelatedCards(activeTool.slug);

  function updateField(name: string, value: string) {
    if (!startTrackedRef.current) {
      startTrackedRef.current = true;
      trackEvent("tool_started", { tool: activeTool.id });
    }
    setValues((current) => ({ ...current, [name]: value }));
  }

  function loadSample(sampleValues: MarketingToolValues) {
    setValues({ ...defaultValues(activeTool.fields), ...sampleValues });
    if (!startTrackedRef.current) {
      startTrackedRef.current = true;
      trackEvent("tool_started", { tool: activeTool.id, source: "sample_prompt" });
    }
  }

  function handleAnalyze() {
    setShowValidation(true);
    setReportUnlocked(false);
    setReportError("");
    if (!formValid) return;

    setAnalysisState("analyzing");
    trackEvent("tool_result_generated", { tool: activeTool.id, score: result.overallScore });

    window.setTimeout(() => {
      startTransition(() => {
        setAnalysisState("done");
      });
    }, 850);
  }

  async function handleUnlockReport() {
    if (!gateViewTrackedRef.current) {
      gateViewTrackedRef.current = true;
      trackEvent("tool_email_capture_viewed", { tool: activeTool.id, score: result.overallScore });
    }

    setShowValidation(true);
    if (!emailValid) return;

    setReportPending(true);
    setReportError("");
    try {
      const response = await fetch(`/api/tools/${activeTool.slug}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          values,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Report could not be sent.");
      }

      setReportUnlocked(true);
      setReportDeliveredTo(email.trim());
      trackEvent("tool_email_submitted", { tool: activeTool.id, score: result.overallScore });
      trackEvent("tool_full_report_delivered", { tool: activeTool.id, score: result.overallScore });
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "Report could not be sent.");
    } finally {
      setReportPending(false);
    }
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/80 py-16 md:py-20">
        <div className="hero-glow" aria-hidden="true" />
        <div className="shell">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="max-w-2xl">
              <Badge className="mb-4">{activeTool.badge}</Badge>
              <h1 className="editorial-display max-w-[11ch] text-foreground">{activeTool.heroTitle}</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">{activeTool.heroDescription}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                {activeTool.samples.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => loadSample(sample.values)}
                    className="rounded-full border border-border bg-background/80 px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {activeTool.benefits.map((benefit) => {
                  const Icon = iconMap[benefit.icon];
                  return (
                    <Card key={benefit.title} className="border border-border/70 bg-background/75">
                      <CardContent className="p-5">
                        <Icon className="size-5 text-primary" />
                        <p className="mt-4 text-sm font-semibold text-foreground">{benefit.title}</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{benefit.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <Card className="border border-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_96%,white_4%),color-mix(in_srgb,var(--primary)_5%,var(--card)))] shadow-[0_24px_60px_rgba(36,22,14,0.08)]">
              <CardContent className="p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-primary">{activeTool.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{activeTool.formIntro}</p>
                  </div>
                  <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {t("mvpBadge")}
                  </div>
                </div>

                <div className="space-y-5">
                  {activeTool.fields.map((field) => renderField(field, values, showValidation, updateField))}

                  <Button size="lg" className="w-full gap-2" onClick={handleAnalyze} isLoading={analysisState === "analyzing"}>
                    <Sparkles className="size-4" />
                    {t("runAnalysis")}
                  </Button>

                  <p className="text-center text-xs leading-6 text-muted-foreground">
                    {t("analyzeDisclaimer")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="editorial-eyebrow">{t("instantReportEyebrow")}</p>
              <h2 className="editorial-title mt-4 text-foreground">{t("instantReportTitle")}</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
                {t("instantReportDesc")}
              </p>
            </div>

            <Card className="border border-border/80 bg-background/85">
              <CardContent className="p-6 md:p-8">
                {analysisState === "idle" ? (
                  <div className="rounded-[24px] border border-dashed border-border/80 bg-muted/30 p-8 text-center">
                    <BookOpen className="mx-auto size-9 text-primary" />
                    <h3 className="mt-4 text-xl font-semibold text-foreground">{activeTool.placeholderTitle}</h3>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">{activeTool.placeholderText}</p>
                  </div>
                ) : analysisState === "analyzing" ? (
                  <div className="rounded-[24px] border border-primary/20 bg-primary/5 p-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{t("analyzingLabel")}</p>
                    <h3 className="mt-4 font-serif text-3xl font-semibold text-foreground">{t("analyzingHeading")}</h3>
                    <div className="mt-6 space-y-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" style={{ animationDelay: `${i * 120}ms` }} />
                          {t(`analyzingSteps.${i}`)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                      <div className="rounded-[28px] border border-primary/20 bg-[linear-gradient(180deg,rgba(188,104,67,0.18),rgba(188,104,67,0.06))] p-6 text-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{t("ideaScoreLabel")}</p>
                        <p className="mt-4 font-serif text-6xl leading-none text-foreground">{result.overallScore}</p>
                        <p className="mt-3 text-sm text-muted-foreground">{result.verdict}</p>
                      </div>

                      <div className="rounded-[28px] border border-border/80 bg-card p-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{result.recommendedFormat}</Badge>
                          <Badge className="border-primary/20 bg-primary/10 text-primary">{t("primaryRecommendation")}</Badge>
                        </div>
                        <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{t("suggestedAngle")}</h3>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground">{result.recommendedAngle}</p>
                        <div className="mt-5 rounded-[20px] border border-border/70 bg-background/70 p-4">
                          <p className="text-sm font-semibold text-foreground">{t("clearNextStep")}</p>
                          <p className="mt-2 text-sm leading-7 text-muted-foreground">{result.nextStep}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="border border-border/80 bg-background/70">
                        <CardContent className="p-6">
                          <p className="text-sm font-semibold text-foreground">{t("whyStrongTitle")}</p>
                          <ul className="mt-4 space-y-3">
                            {result.strongestPoints.map((point) => (
                              <li key={point} className="flex items-start gap-2.5 text-sm leading-7 text-muted-foreground">
                                <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="border border-border/80 bg-background/70">
                        <CardContent className="p-6">
                          <p className="text-sm font-semibold text-foreground">{t("needsTighteningTitle")}</p>
                          <ul className="mt-4 space-y-3">
                            {result.risks.map((risk) => (
                              <li key={risk} className="flex items-start gap-2.5 text-sm leading-7 text-muted-foreground">
                                <ChevronRight className="mt-1 size-4 shrink-0 text-primary" />
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
                      {result.dimensions.map((dimension) => (
                        <div key={dimension.key} className="rounded-[24px] border border-border/75 bg-background px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-foreground">{dimension.label}</p>
                            <span className="text-sm font-semibold text-primary">{dimension.score}</span>
                          </div>
                          <div className="mt-3 h-2 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-[linear-gradient(90deg,#c96f47,#8f4324)]"
                              style={{ width: `${dimension.score}%` }}
                            />
                          </div>
                          <p className="mt-3 text-xs leading-6 text-muted-foreground">{dimension.summary}</p>
                        </div>
                      ))}
                    </div>

                    {!reportUnlocked ? (
                      <div className="rounded-[28px] border border-primary/20 bg-[linear-gradient(135deg,rgba(188,104,67,0.10),rgba(255,255,255,0.45))] p-6 md:p-7">
                        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
                          <div>
                            <div className="flex items-center gap-2 text-primary">
                              <Mail className="size-4" />
                              <p className="text-sm font-semibold">{t("openFullReport")}</p>
                            </div>
                            <h3 className="mt-3 font-serif text-3xl font-semibold text-foreground">{activeTool.gateTitle}</h3>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{activeTool.gateDescription}</p>
                          </div>
                          <div className="text-sm text-muted-foreground">{t("emailOnlyLabel")}</div>
                        </div>
                        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                          <Input
                            type="email"
                            value={email}
                            onFocus={() => {
                              if (!gateViewTrackedRef.current) {
                                gateViewTrackedRef.current = true;
                                trackEvent("tool_email_capture_viewed", { tool: activeTool.id, score: result.overallScore });
                              }
                            }}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder={t("emailPlaceholder")}
                            className="bg-background/90"
                          />
                          <Button onClick={handleUnlockReport} className="gap-2" isLoading={reportPending}>
                            {t("openFullReportButton")}
                            <ArrowRight className="size-4" />
                          </Button>
                        </div>
                        {showValidation && !emailValid ? <p className="mt-2 text-sm text-primary">{t("emailValidation")}</p> : null}
                        {reportError ? <p className="mt-2 text-sm text-primary">{reportError}</p> : null}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-[20px] border border-primary/20 bg-primary/8 px-4 py-3 text-sm text-foreground">
                          {t("fullReportSentTo", { email: reportDeliveredTo })}
                        </div>
                        <div className={`grid gap-4 ${result.reportSections.length > 2 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                          {result.reportSections.map((section) => (
                            <Card key={section.title} className="border border-border/80 bg-background/70">
                              <CardContent className="p-6">
                                <p className="text-sm font-semibold text-foreground">{section.title}</p>
                                {section.ordered ? (
                                  <ol className="mt-4 space-y-3">
                                    {section.items.map((item, index) => (
                                      <li key={item} className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">
                                          {index + 1}
                                        </span>
                                        {item}
                                      </li>
                                    ))}
                                  </ol>
                                ) : (
                                  <ul className="mt-4 space-y-3">
                                    {section.items.map((item) => (
                                      <li key={item} className="flex items-start gap-2.5 text-sm leading-7 text-muted-foreground">
                                        <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="shell">
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            {relatedCards.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <Link key={item.slug} href={item.path}>
                  <Card className="h-full border border-border/80 bg-background/70 transition hover:border-primary/30 hover:shadow-sm">
                    <CardContent className="p-6">
                      <Icon className="size-5 text-primary" />
                      <p className="mt-4 text-lg font-semibold tracking-tight text-foreground">{item.name}</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="rounded-[36px] border border-border/80 bg-[linear-gradient(135deg,#1f1510_0%,#2a1d16_50%,#191512_100%)] px-6 py-10 text-white shadow-[0_32px_80px_-20px_rgba(0,0,0,0.45)] md:px-10 md:py-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">{t("nextStepEyebrow")}</p>
                <h2 className="mt-4 max-w-2xl font-serif text-3xl font-semibold tracking-tight md:text-4xl">{activeTool.nextStepTitle}</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">{activeTool.nextStepDescription}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="min-w-[220px] gap-2"
                  onClick={() => trackEvent("tool_cta_clicked", { tool: activeTool.id, destination: "start_topic" })}
                >
                  <Link href={previewHref}>
                    {activeTool.previewCtaLabel}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="min-w-[220px] border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => trackEvent("tool_cta_clicked", { tool: activeTool.id, destination: "tools_hub" })}
                >
                  <Link href="/tools">{t("seeOtherTools")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}