"use client";

import Link from "next/link";
import { startTransition, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  Mail,
  Sparkles,
  Target,
  TrendingUp,
  FileText,
} from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";
import {
  evaluateBookIdea,
  mapValidatorIntentToBookType,
  mapValidatorLanguageToFunnelLanguage,
  type BookIdeaIntent,
  type BookIdeaLanguage,
  type MaterialStatus,
} from "@/lib/book-idea-validator";
import { useTranslations } from "next-intl";

type FormState = {
  topic: string;
  audience: string;
  goal: string;
  intent: BookIdeaIntent;
  language: BookIdeaLanguage;
  materials: MaterialStatus;
  email: string;
};

const defaultForm: FormState = {
  topic: "",
  audience: "",
  goal: "",
  intent: "authority_book",
  language: "english",
  materials: "notes",
  email: "",
};

const INTENT_VALUES: BookIdeaIntent[] = ["authority_book", "lead_magnet", "paid_guide", "kdp_publish", "not_sure"];
const LANGUAGE_VALUES: BookIdeaLanguage[] = ["english", "turkish", "multilingual", "other"];
const MATERIAL_VALUES: MaterialStatus[] = ["none", "notes", "content", "framework"];

const sampleInputs = [
  "Client acquisition system for freelance designers",
  "Lead magnet book for coaches",
  "Turning your Turkish expertise into an English KDP book",
];

export function BookIdeaValidatorTool() {
  const t = useTranslations("BookIdeaValidatorTool");

  const intentOptions: Array<{ value: BookIdeaIntent; label: string; hint: string }> = [
    { value: "authority_book", label: t("intentAuthorityBook"), hint: t("intentAuthorityBookHint") },
    { value: "lead_magnet", label: t("intentLeadMagnet"), hint: t("intentLeadMagnetHint") },
    { value: "paid_guide", label: t("intentPaidGuide"), hint: t("intentPaidGuideHint") },
    { value: "kdp_publish", label: t("intentKdpPublish"), hint: t("intentKdpPublishHint") },
    { value: "not_sure", label: t("intentNotSure"), hint: t("intentNotSureHint") },
  ];

  const languageOptions: Array<{ value: BookIdeaLanguage; label: string }> = [
    { value: "english", label: t("langEnglish") },
    { value: "turkish", label: t("langTurkish") },
    { value: "multilingual", label: t("langMultilingual") },
    { value: "other", label: t("langOther") },
  ];

  const materialOptions: Array<{ value: MaterialStatus; label: string }> = [
    { value: "none", label: t("materialNone") },
    { value: "notes", label: t("materialNotes") },
    { value: "content", label: t("materialContent") },
    { value: "framework", label: t("materialFramework") },
  ];

  const [form, setForm] = useState<FormState>(defaultForm);
  const [showValidation, setShowValidation] = useState(false);
  const [analysisState, setAnalysisState] = useState<"idle" | "analyzing" | "done">("idle");
  const [reportUnlocked, setReportUnlocked] = useState(false);
  const [reportRequestPending, setReportRequestPending] = useState(false);
  const [reportRequestError, setReportRequestError] = useState("");
  const [reportDeliveredTo, setReportDeliveredTo] = useState("");
  const gateViewTrackedRef = useRef(false);
  const startTrackedRef = useRef(false);

  const result = evaluateBookIdea({
    topic: form.topic,
    audience: form.audience,
    goal: form.goal,
    intent: form.intent,
    language: form.language,
    materials: form.materials,
  });

  const isFormValid = form.topic.trim().length > 8 && form.audience.trim().length > 5 && form.goal.trim().length > 8;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  const previewHref = `/start/topic?topic=${encodeURIComponent(form.topic.trim())}&audience=${encodeURIComponent(
    form.audience.trim(),
  )}&language=${encodeURIComponent(mapValidatorLanguageToFunnelLanguage(form.language))}&bookType=${encodeURIComponent(
    mapValidatorIntentToBookType(form.intent),
  )}`;

  useEffect(() => {
    trackEvent("tool_page_viewed", { tool: "book_idea_validator" });
  }, []);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    if (!startTrackedRef.current) {
      startTrackedRef.current = true;
      trackEvent("tool_started", { tool: "book_idea_validator" });
    }
    setForm((current) => ({ ...current, [key]: value }));
  }

  function loadSample(topic: string) {
    setForm({
      topic,
      audience: "Consultants, coaches, and niche operators",
      goal: "Build authority and generate higher-quality leads",
      intent: "authority_book",
      language: "english",
      materials: "framework",
      email: "",
    });
    if (!startTrackedRef.current) {
      startTrackedRef.current = true;
      trackEvent("tool_started", { tool: "book_idea_validator", source: "sample_prompt" });
    }
  }

  function handleAnalyze() {
    setShowValidation(true);
    setReportRequestError("");
    if (!isFormValid) return;

    setAnalysisState("analyzing");
    setReportUnlocked(false);
    trackEvent("tool_result_generated", {
      tool: "book_idea_validator",
      score: result.overallScore,
      intent: form.intent,
    });

    window.setTimeout(() => {
      startTransition(() => {
        setAnalysisState("done");
      });
    }, 950);
  }

  async function handleUnlockReport() {
    if (!gateViewTrackedRef.current) {
      gateViewTrackedRef.current = true;
      trackEvent("tool_email_capture_viewed", {
        tool: "book_idea_validator",
        score: result.overallScore,
      });
    }

    setShowValidation(true);
    if (!emailValid) return;

    setReportRequestPending(true);
    setReportRequestError("");
    try {
      const response = await fetch("/api/tools/book-idea-validator/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          topic: form.topic.trim(),
          audience: form.audience.trim(),
          goal: form.goal.trim(),
          intent: form.intent,
          language: form.language,
          materials: form.materials,
          score: result.overallScore,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Report could not be sent.");
      }

      setReportUnlocked(true);
      setReportDeliveredTo(form.email.trim());
      trackEvent("tool_email_submitted", {
        tool: "book_idea_validator",
        score: result.overallScore,
        intent: form.intent,
      });
      trackEvent("tool_full_report_delivered", {
        tool: "book_idea_validator",
        score: result.overallScore,
        intent: form.intent,
      });
    } catch (error) {
      setReportRequestError(error instanceof Error ? error.message : "Report could not be sent.");
    } finally {
      setReportRequestPending(false);
    }
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/80 py-16 md:py-20">
        <div className="hero-glow" aria-hidden="true" />
        <div className="shell">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="max-w-2xl">
              <Badge className="mb-4">{t("freeTool")}</Badge>
              <h1 className="editorial-display max-w-[11ch] text-foreground">
                {t("heroTitle")}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                {t("heroDesc")}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {sampleInputs.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => loadSample(sample)}
                    className="rounded-full border border-border bg-background/80 px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  >
                    {sample}
                  </button>
                ))}
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <Card className="border border-border/70 bg-background/75">
                  <CardContent className="p-5">
                    <Target className="size-5 text-primary" />
                    <p className="mt-4 text-sm font-semibold text-foreground">{t("audienceClarityTitle")}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("audienceClarityDesc")}</p>
                  </CardContent>
                </Card>
                <Card className="border border-border/70 bg-background/75">
                  <CardContent className="p-5">
                    <Compass className="size-5 text-primary" />
                    <p className="mt-4 text-sm font-semibold text-foreground">{t("positioningAngleTitle")}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("positioningAngleDesc")}</p>
                  </CardContent>
                </Card>
                <Card className="border border-border/70 bg-background/75">
                  <CardContent className="p-5">
                    <TrendingUp className="size-5 text-primary" />
                    <p className="mt-4 text-sm font-semibold text-foreground">{t("commercialFitTitle")}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("commercialFitDesc")}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="border border-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_96%,white_4%),color-mix(in_srgb,var(--primary)_5%,var(--card)))] shadow-[0_24px_60px_rgba(36,22,14,0.08)]">
              <CardContent className="p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-primary">{t("cardTitle")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t("cardSubtitle")}</p>
                  </div>
                  <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    MVP
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <Label htmlFor="topic">{t("topicLabel")}</Label>
                    <Textarea
                      id="topic"
                      value={form.topic}
                      onChange={(event) => updateField("topic", event.target.value)}
                      placeholder={t("topicPlaceholder")}
                      className="min-h-[128px]"
                    />
                    {showValidation && form.topic.trim().length <= 8 ? (
                      <p className="mt-2 text-sm text-primary">{t("topicValidation")}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <Label htmlFor="audience">{t("audienceLabel")}</Label>
                      <Input
                        id="audience"
                        value={form.audience}
                        onChange={(event) => updateField("audience", event.target.value)}
                        placeholder={t("audiencePlaceholder")}
                      />
                      {showValidation && form.audience.trim().length <= 5 ? (
                        <p className="mt-2 text-sm text-primary">{t("audienceValidation")}</p>
                      ) : null}
                    </div>
                    <div>
                      <Label htmlFor="goal">{t("goalLabel")}</Label>
                      <Input
                        id="goal"
                        value={form.goal}
                        onChange={(event) => updateField("goal", event.target.value)}
                        placeholder={t("goalPlaceholder")}
                      />
                      {showValidation && form.goal.trim().length <= 8 ? (
                        <p className="mt-2 text-sm text-primary">{t("goalValidation")}</p>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <Label>{t("intentLabel")}</Label>
                    <div className="grid gap-3 md:grid-cols-2">
                      {intentOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateField("intent", option.value)}
                          className={`rounded-[22px] border px-4 py-4 text-left transition ${
                            form.intent === option.value
                              ? "border-primary/40 bg-primary/10 shadow-sm"
                              : "border-border bg-background hover:border-primary/25"
                          }`}
                        >
                          <p className="text-sm font-semibold text-foreground">{option.label}</p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">{option.hint}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <Label htmlFor="language">{t("languageLabel")}</Label>
                      <select
                        id="language"
                        value={form.language}
                        onChange={(event) => updateField("language", event.target.value as BookIdeaLanguage)}
                        className="flex h-14 w-full rounded-[20px] border border-input bg-card px-5 text-[15px] text-foreground outline-none transition focus:border-ring/50 focus:ring-2 focus:ring-ring/20"
                      >
                        {languageOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="materials">{t("materialsLabel")}</Label>
                      <select
                        id="materials"
                        value={form.materials}
                        onChange={(event) => updateField("materials", event.target.value as MaterialStatus)}
                        className="flex h-14 w-full rounded-[20px] border border-input bg-card px-5 text-[15px] text-foreground outline-none transition focus:border-ring/50 focus:ring-2 focus:ring-ring/20"
                      >
                        {materialOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button size="lg" className="w-full gap-2" onClick={handleAnalyze} isLoading={analysisState === "analyzing"}>
                    <Sparkles className="size-4" />
                    {t("analyzeButton")}
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
                    <h3 className="mt-4 text-xl font-semibold text-foreground">{t("reportPlaceholderTitle")}</h3>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                      {t("reportPlaceholderDesc")}
                    </p>
                  </div>
                ) : analysisState === "analyzing" ? (
                  <div className="rounded-[24px] border border-primary/20 bg-primary/5 p-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{t("analyzingLabel")}</p>
                    <h3 className="mt-4 font-serif text-3xl font-semibold text-foreground">{t("analyzingHeading")}</h3>
                    <div className="mt-6 space-y-3">
                      {[t("analyzingStep1"), t("analyzingStep2"), t("analyzingStep3")].map((item, index) => (
                        <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" style={{ animationDelay: `${index * 120}ms` }} />
                          {item}
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
                          <Badge className="border-primary/20 bg-primary/10 text-primary">
                            {t("primaryRecommendation")}
                          </Badge>
                        </div>
                        <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{t("recommendedAngleTitle")}</h3>
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

                    <div className="grid gap-3 md:grid-cols-3">
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
                              <p className="text-sm font-semibold">{t("unlockFullReportLabel")}</p>
                            </div>
                            <h3 className="mt-3 font-serif text-3xl font-semibold text-foreground">
                              {t("titleSuggestionsReady")}
                            </h3>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                              {t("fullReportDesc")}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">{t("emailOnlyLabel")}</div>
                        </div>
                        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                          <Input
                            type="email"
                            value={form.email}
                            onFocus={() => {
                              if (!gateViewTrackedRef.current) {
                                gateViewTrackedRef.current = true;
                                trackEvent("tool_email_capture_viewed", {
                                  tool: "book_idea_validator",
                                  score: result.overallScore,
                                });
                              }
                            }}
                            onChange={(event) => updateField("email", event.target.value)}
                            placeholder={t("emailPlaceholder")}
                            className="bg-background/90"
                          />
                            <Button onClick={handleUnlockReport} className="gap-2" isLoading={reportRequestPending}>
                              {t("unlockFullReportButton")}
                              <ArrowRight className="size-4" />
                            </Button>
                          </div>
                        {showValidation && !emailValid ? (
                          <p className="mt-2 text-sm text-primary">{t("emailValidation")}</p>
                        ) : null}
                        {reportRequestError ? (
                          <p className="mt-2 text-sm text-primary">{reportRequestError}</p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="grid gap-4 lg:grid-cols-2">
                        <Card className="border border-border/80 bg-background/70">
                          <CardContent className="p-6">
                            <div className="mb-4 rounded-[18px] border border-primary/20 bg-primary/8 px-4 py-3 text-sm text-foreground">
                              {t("fullReportSentTo", { email: reportDeliveredTo })}
                            </div>
                            <p className="text-sm font-semibold text-foreground">{t("suggestedTitlesLabel")}</p>
                            <ul className="mt-4 space-y-3">
                              {result.titleIdeas.map((title) => (
                                <li key={title} className="rounded-[18px] border border-border/70 bg-background px-4 py-3 text-sm text-foreground">
                                  {title}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        <Card className="border border-border/80 bg-background/70">
                          <CardContent className="p-6">
                            <p className="text-sm font-semibold text-foreground">{t("miniOutlineLabel")}</p>
                            <ol className="mt-4 space-y-3">
                              {result.miniOutline.map((item, index) => (
                                <li key={item} className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">
                                    {index + 1}
                                  </span>
                                  {item}
                                </li>
                              ))}
                            </ol>
                          </CardContent>
                        </Card>
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
            {[
              {
                href: "/blog/how-to-validate-a-nonfiction-book-idea",
                title: t("blogCard1Title"),
                text: t("blogCard1Text"),
              },
              {
                href: "/blog/authority-book-mu-lead-magnet-book-mu",
                title: t("blogCard2Title"),
                text: t("blogCard2Text"),
              },
              {
                href: "/blog/how-to-strengthen-a-weak-book-idea",
                title: t("blogCard3Title"),
                text: t("blogCard3Text"),
              },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="h-full border border-border/80 bg-background/70 transition hover:border-primary/30 hover:shadow-sm">
                  <CardContent className="p-6">
                    <FileText className="size-5 text-primary" />
                    <p className="mt-4 text-lg font-semibold tracking-tight text-foreground">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="rounded-[36px] border border-border/80 bg-[linear-gradient(135deg,#1f1510_0%,#2a1d16_50%,#191512_100%)] px-6 py-10 text-white shadow-[0_32px_80px_-20px_rgba(0,0,0,0.45)] md:px-10 md:py-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">{t("nextStepEyebrow")}</p>
                <h2 className="mt-4 max-w-2xl font-serif text-3xl font-semibold tracking-tight md:text-4xl">
                  {t("nextStepTitle")}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
                  {t("nextStepDesc")}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="min-w-[220px] gap-2" onClick={() => trackEvent("tool_cta_clicked", { tool: "book_idea_validator", destination: "start_topic" })}>
                  <Link href={previewHref}>
                    {t("startFreePreviewBtn")}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="min-w-[220px] border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={() => trackEvent("tool_cta_clicked", { tool: "book_idea_validator", destination: "tools_hub" })}>
                  <Link href="/tools">{t("seeOtherToolsBtn")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}