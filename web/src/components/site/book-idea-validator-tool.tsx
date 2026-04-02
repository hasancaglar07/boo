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
} from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";
import { evaluateBookIdea, type BookIdeaIntent, type BookIdeaLanguage, type MaterialStatus } from "@/lib/book-idea-validator";

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

const intentOptions: Array<{ value: BookIdeaIntent; label: string; hint: string }> = [
  { value: "authority_book", label: "Authority book", hint: "Trust, positioning ve premium algı için." },
  { value: "lead_magnet", label: "Lead magnet", hint: "E-posta ve danışmanlık talebi üretmek için." },
  { value: "paid_guide", label: "Paid guide", hint: "Düşük fiyatlı bilgi ürünü olarak satmak için." },
  { value: "kdp_publish", label: "KDP publish", hint: "Amazon KDP veya marketplace odaklı yayın için." },
  { value: "not_sure", label: "Henüz emin değilim", hint: "Validator uygun formatı önersin." },
];

const languageOptions: Array<{ value: BookIdeaLanguage; label: string }> = [
  { value: "english", label: "English" },
  { value: "turkish", label: "Türkçe" },
  { value: "multilingual", label: "Çok dilli" },
  { value: "other", label: "Diğer" },
];

const materialOptions: Array<{ value: MaterialStatus; label: string }> = [
  { value: "none", label: "Henüz materyalim yok" },
  { value: "notes", label: "Dağınık notlarım var" },
  { value: "content", label: "Blog, ders veya içerik birikimim var" },
  { value: "framework", label: "Kendi metodum / framework'üm var" },
];

const sampleInputs = [
  "Freelance tasarımcılar için müşteri kazanma sistemi",
  "Koçlar için lead magnet kitabı",
  "Türkçe uzmanlığını İngilizce KDP kitabına dönüştürme",
];

export function BookIdeaValidatorTool() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [showValidation, setShowValidation] = useState(false);
  const [analysisState, setAnalysisState] = useState<"idle" | "analyzing" | "done">("idle");
  const [reportUnlocked, setReportUnlocked] = useState(false);
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
      audience: "Consultants, coaches ve niche operators",
      goal: "Authority oluşturmak ve daha kaliteli lead kazanmak",
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

  function handleUnlockReport() {
    if (!gateViewTrackedRef.current) {
      gateViewTrackedRef.current = true;
      trackEvent("tool_email_capture_viewed", {
        tool: "book_idea_validator",
        score: result.overallScore,
      });
    }

    setShowValidation(true);
    if (!emailValid) return;

    setReportUnlocked(true);
    trackEvent("tool_email_submitted", {
      tool: "book_idea_validator",
      score: result.overallScore,
      intent: form.intent,
    });
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/80 py-16 md:py-20">
        <div className="hero-glow" aria-hidden="true" />
        <div className="shell">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="max-w-2xl">
              <Badge className="mb-4">Free Tool</Badge>
              <h1 className="editorial-display max-w-[11ch] text-foreground">
                Kitap fikriniz güçlü mü, yoksa yalnızca iyi duyulan bir başlık mı?
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                Konunuzu, hedef okurunuzu ve amacınızı girin. Book Idea Validator; fikrinizin gücünü puanlasın, en
                doğru kitap açısını önerisin ve sizi tam outline akışına taşısın.
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
                    <p className="mt-4 text-sm font-semibold text-foreground">Audience clarity</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Kime yazdığın ne kadar net, hızlıca gör.</p>
                  </CardContent>
                </Card>
                <Card className="border border-border/70 bg-background/75">
                  <CardContent className="p-5">
                    <Compass className="size-5 text-primary" />
                    <p className="mt-4 text-sm font-semibold text-foreground">Positioning angle</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Genel konu yerine daha güçlü kitabı bul.</p>
                  </CardContent>
                </Card>
                <Card className="border border-border/70 bg-background/75">
                  <CardContent className="p-5">
                    <TrendingUp className="size-5 text-primary" />
                    <p className="mt-4 text-sm font-semibold text-foreground">Commercial fit</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Lead, authority veya satış katkısını ölç.</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="border border-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_96%,white_4%),color-mix(in_srgb,var(--primary)_5%,var(--card)))] shadow-[0_24px_60px_rgba(36,22,14,0.08)]">
              <CardContent className="p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-primary">Book Idea Validator</p>
                    <p className="mt-1 text-sm text-muted-foreground">60 saniyelik kısa analiz ile başla.</p>
                  </div>
                  <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    MVP
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <Label htmlFor="topic">Kitabın konusu nedir?</Label>
                    <Textarea
                      id="topic"
                      value={form.topic}
                      onChange={(event) => updateField("topic", event.target.value)}
                      placeholder="Örn. freelance tasarımcıların referans beklemeden müşteri kazanması"
                      className="min-h-[128px]"
                    />
                    {showValidation && form.topic.trim().length <= 8 ? (
                      <p className="mt-2 text-sm text-primary">Konuyu biraz daha somut yaz. Tek kelime yerine problem + segment kullan.</p>
                    ) : null}
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <Label htmlFor="audience">Bu kitabı kim okuyacak?</Label>
                      <Input
                        id="audience"
                        value={form.audience}
                        onChange={(event) => updateField("audience", event.target.value)}
                        placeholder="Örn. consultants, coaches, course creators"
                      />
                      {showValidation && form.audience.trim().length <= 5 ? (
                        <p className="mt-2 text-sm text-primary">Hedef okuru daha net tarif et.</p>
                      ) : null}
                    </div>
                    <div>
                      <Label htmlFor="goal">Ana amaç ne?</Label>
                      <Input
                        id="goal"
                        value={form.goal}
                        onChange={(event) => updateField("goal", event.target.value)}
                        placeholder="Örn. authority oluşturmak ve danışmanlık lead'i üretmek"
                      />
                      {showValidation && form.goal.trim().length <= 8 ? (
                        <p className="mt-2 text-sm text-primary">Amaç alanında net bir sonuç yaz.</p>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <Label>Bu kitabı ne için kullanacaksın?</Label>
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
                      <Label htmlFor="language">Hangi dilde üretmek istiyorsun?</Label>
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
                      <Label htmlFor="materials">Elinde hangi materyal var?</Label>
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
                    Fikri Analiz Et
                  </Button>

                  <p className="text-center text-xs leading-6 text-muted-foreground">
                    İlk skor anında açık. Tam rapor için yalnız e-posta ister.
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
              <p className="editorial-eyebrow">Instant Report</p>
              <h2 className="editorial-title mt-4 text-foreground">Skorla kalma. Neden güçlü ya da zayıf olduğunu da gör.</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
                Bu araç yalnız iyi hissettiren bir sayı vermez. Fikrinin kimin için yeterince net olduğunu, vaadinin
                ne kadar savunulabilir olduğunu ve hangi formatta daha iyi çalışacağını açık şekilde gösterir.
              </p>
            </div>

            <Card className="border border-border/80 bg-background/85">
              <CardContent className="p-6 md:p-8">
                {analysisState === "idle" ? (
                  <div className="rounded-[24px] border border-dashed border-border/80 bg-muted/30 p-8 text-center">
                    <BookOpen className="mx-auto size-9 text-primary" />
                    <h3 className="mt-4 text-xl font-semibold text-foreground">İlk rapor burada görünecek</h3>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                      Konunu doldur, analiz başlat ve partial score&apos;u anında gör. Tam rapor; title set, mini outline
                      ve format önerisiyle birlikte açılır.
                    </p>
                  </div>
                ) : analysisState === "analyzing" ? (
                  <div className="rounded-[24px] border border-primary/20 bg-primary/5 p-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Analyzing</p>
                    <h3 className="mt-4 font-serif text-3xl font-semibold text-foreground">Editorial signal aranıyor...</h3>
                    <div className="mt-6 space-y-3">
                      {[
                        "Audience clarity ölçülüyor",
                        "Promise strength puanlanıyor",
                        "Format ve angle önerisi hazırlanıyor",
                      ].map((item, index) => (
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
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Idea Score</p>
                        <p className="mt-4 font-serif text-6xl leading-none text-foreground">{result.overallScore}</p>
                        <p className="mt-3 text-sm text-muted-foreground">{result.verdict}</p>
                      </div>

                      <div className="rounded-[28px] border border-border/80 bg-card p-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{result.recommendedFormat}</Badge>
                          <Badge className="border-primary/20 bg-primary/10 text-primary">
                            Primary recommendation
                          </Badge>
                        </div>
                        <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Önerilen kitap açısı</h3>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground">{result.recommendedAngle}</p>
                        <div className="mt-5 rounded-[20px] border border-border/70 bg-background/70 p-4">
                          <p className="text-sm font-semibold text-foreground">Net sonraki adım</p>
                          <p className="mt-2 text-sm leading-7 text-muted-foreground">{result.nextStep}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="border border-border/80 bg-background/70">
                        <CardContent className="p-6">
                          <p className="text-sm font-semibold text-foreground">Neden güçlü?</p>
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
                          <p className="text-sm font-semibold text-foreground">Ne sıkılaştırılmalı?</p>
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
                              <p className="text-sm font-semibold">Tam raporu aç</p>
                            </div>
                            <h3 className="mt-3 font-serif text-3xl font-semibold text-foreground">
                              Başlık önerileri ve mini outline hazır.
                            </h3>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                              Tam rapor; 5 title idea, 8 bölümlük outline ve daha net format önerisini açar.
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">Email only</div>
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
                            placeholder="you@example.com"
                            className="bg-background/90"
                          />
                          <Button onClick={handleUnlockReport} className="gap-2">
                            Tam Raporu Aç
                            <ArrowRight className="size-4" />
                          </Button>
                        </div>
                        {showValidation && !emailValid ? (
                          <p className="mt-2 text-sm text-primary">Tam rapor için geçerli bir e-posta gir.</p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="grid gap-4 lg:grid-cols-2">
                        <Card className="border border-border/80 bg-background/70">
                          <CardContent className="p-6">
                            <p className="text-sm font-semibold text-foreground">Önerilen başlıklar</p>
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
                            <p className="text-sm font-semibold text-foreground">Mini outline</p>
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
          <div className="rounded-[36px] border border-border/80 bg-[linear-gradient(135deg,#1f1510_0%,#2a1d16_50%,#191512_100%)] px-6 py-10 text-white shadow-[0_32px_80px_-20px_rgba(0,0,0,0.45)] md:px-10 md:py-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Next Step</p>
                <h2 className="mt-4 max-w-2xl font-serif text-3xl font-semibold tracking-tight md:text-4xl">
                  Güçlü fikri şimdi preview, outline ve kapağa taşı.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
                  Validator karar netliği verir. Asıl üretim için Book Generator wizard&apos;ına geçip aynı fikri tam
                  outline, branded cover ve preview akışına sok.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="min-w-[220px] gap-2" onClick={() => trackEvent("tool_cta_clicked", { tool: "book_idea_validator", destination: "start_topic" })}>
                  <Link href="/start/topic">
                    Ücretsiz Preview Başlat
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="min-w-[220px] border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={() => trackEvent("tool_cta_clicked", { tool: "book_idea_validator", destination: "resources" })}>
                  <Link href="/resources">Diğer Kaynakları Gör</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
