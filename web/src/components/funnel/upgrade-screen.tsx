"use client";

import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Download,
  FileText,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AppFrame } from "@/components/app/app-frame";
import { BackendUnavailableState } from "@/components/app/backend-unavailable-state";
import { BookMockup } from "@/components/books/book-mockup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";
import {
  buildBookAssetUrl,
  isBackendUnavailableError,
  loadBooks,
  type Book,
} from "@/lib/dashboard-api";
import { syncPreviewAuthState } from "@/lib/preview-auth";
import { KDP_GUARANTEE_CLAIM, KDP_LIVE_BOOKS_CLAIM, NO_API_COST_CLAIM, REFUND_GUARANTEE_CLAIM } from "@/lib/site-claims";
import { cn } from "@/lib/utils";

const WHAT_YOU_GET = [
  { icon: FileText, text: "Tüm bölümler — kilitli içerik yok" },
  { icon: Download, text: "PDF indir, Amazon KDP'ye hazır" },
  { icon: BookOpen, text: "EPUB çıktısı — e-kitap mağazaları için" },
  { icon: Zap, text: "Tam çalışma alanı ve düzenleme araçları" },
  { icon: Shield, text: "Kapak, arka kapak ve tüm varlıklar" },
  { icon: CheckCircle2, text: `${KDP_GUARANTEE_CLAIM} + ${REFUND_GUARANTEE_CLAIM}` },
];

const TRUST_ITEMS = [
  { label: KDP_GUARANTEE_CLAIM, icon: Shield },
  { label: "Anında erişim", icon: Zap },
  { label: "Abonelik yok", icon: CheckCircle2 },
  { label: NO_API_COST_CLAIM, icon: BookOpen },
];

const PLAN_COMPARE = [
  {
    id: "premium",
    name: "Tek Kitap",
    price: "$4",
    originalPrice: "$29",
    interval: "tek seferlik",
    badge: "En iyi başlangıç",
    badgeColor: "bg-primary text-primary-foreground",
    highlight: true,
    description: "Bu kitap için tam erişim. Bir kez öde, dosyalar senindir.",
    features: [
      "1 kitap — tam erişim",
      "PDF + EPUB export",
      "Kapak ve arka kapak",
      "30 gün iade",
    ],
    cta: "$4 ile Bu Kitabı Aç",
    ctaVariant: "primary" as const,
  },
  {
    id: "starter",
    name: "Başlangıç",
    price: "$19",
    originalPrice: null,
    interval: "aylık",
    badge: "Ayda 10 kitap",
    badgeColor: "bg-muted text-muted-foreground",
    highlight: false,
    description: "Her ay düzenli kitap üret, kendi üretim ritmine gir.",
    features: [
      "Ayda 10 kitap",
      "EPUB + PDF export",
      "Kapak üretimi",
      "Bölüm editörü",
    ],
    cta: "$19/ay ile Üretime Devam Et",
    ctaVariant: "outline" as const,
  },
];

const AUTOSTART_PLANS = new Set(["premium", "starter"]);

export function UpgradeScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const autoStartHandledRef = useRef(false);

  async function hydrate() {
    try {
      const loaded = await loadBooks();
      setBooks(loaded);
      setBackendUnavailable(false);
    } catch (error) {
      if (isBackendUnavailableError(error)) {
        setBackendUnavailable(true);
        return;
      }
      console.error(error);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void hydrate();
    void syncPreviewAuthState().then((payload) => {
      setAuthenticated(Boolean(payload?.authenticated));
    });
    trackEvent("paywall_viewed", { slug, trigger: "upgrade_screen" });
    if (searchParams.get("checkout") === "cancelled") {
      trackEvent("checkout_cancelled", { slug, source: "stripe_return" });
    }
  }, [slug, searchParams]);

  const currentBook = books.find((b) => b.slug === slug) ?? null;
  const mockupBrand =
    currentBook?.branding_mark || currentBook?.publisher || "Kitap Oluşturucu";
  const mockupLabel = currentBook?.cover_brief || "Ödeme sonrası tam ürün açılır";

  const handleBuy = useCallback(async (planId: string) => {
    trackEvent("paywall_full_unlock_clicked", { slug, plan: planId, source: "upgrade_screen" });
    trackEvent("checkout_started", { slug, plan: planId, source: "preview_upgrade" });
    if (!authenticated) {
      const resumePath = `/app/book/${slug}/upgrade?plan=${encodeURIComponent(planId)}&autostart=1`;
      router.push(
        `/signup/continue?slug=${encodeURIComponent(slug)}&next=${encodeURIComponent(resumePath)}`,
      );
      return;
    }

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, bookSlug: planId === "premium" ? slug : undefined }),
    }).catch(() => null);

    const payload = response
      ? ((await response.json().catch(() => null)) as { ok?: boolean; url?: string } | null)
      : null;

    if (payload?.url) {
      window.location.assign(payload.url);
    } else {
      router.push(`/app/settings/billing?book=${encodeURIComponent(slug)}`);
    }
  }, [authenticated, router, slug]);

  useEffect(() => {
    const autostart = searchParams.get("autostart") === "1";
    const plan = searchParams.get("plan") || "premium";

    if (!authenticated || !autostart || autoStartHandledRef.current) return;
    if (!AUTOSTART_PLANS.has(plan)) return;

    autoStartHandledRef.current = true;
    void handleBuy(plan);
  }, [authenticated, handleBuy, searchParams]);

  if (backendUnavailable) {
    return (
      <AppFrame
        layout="book"
        current="billing"
        currentBookSlug={slug}
        title="Premium"
        books={books}
      >
        <BackendUnavailableState onRetry={() => void hydrate()} />
      </AppFrame>
    );
  }

  return (
    <AppFrame
      layout="book"
      current="billing"
      currentBookSlug={slug}
      title="Kitabını sahiplen"
      books={books}
    >
      {/* ── Hero: value prop + kitap mockup ────────────────────────────────── */}
      <div className="mb-10 grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">

        {/* Kitap mockup — sticky sol kolon */}
        <div className="lg:sticky lg:top-24">
          <Card className="overflow-hidden border-primary/25 bg-gradient-to-b from-primary/8 to-transparent">
            <CardContent className="p-6">
              <BookMockup
                title={currentBook?.title || "Kitabın"}
                subtitle={currentBook?.subtitle || ""}
                author={currentBook?.author || ""}
                brand={mockupBrand}
                logoUrl={
                  currentBook?.branding_logo_url
                    ? buildBookAssetUrl(slug, currentBook.branding_logo_url)
                    : undefined
                }
                imageUrl={
                  currentBook?.cover_image
                    ? buildBookAssetUrl(slug, currentBook.cover_image)
                    : undefined
                }
                accentLabel={mockupLabel}
                size="xl"
              />

              {/* Social proof altında */}
              <div className="mt-5 space-y-2">
                <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                  <p className="text-xs font-semibold text-muted-foreground text-center">
                    <strong className="text-foreground">{KDP_LIVE_BOOKS_CLAIM}</strong>
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                  <p className="text-xs font-semibold text-muted-foreground text-center">
                    {NO_API_COST_CLAIM}. Kapağı ve preview&apos;i gördükten sonra <strong className="text-foreground">ödeme kararı</strong> verirsin
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sağ: başlık + feature list + pricing */}
        <div className="space-y-8">
          {/* Hero copy */}
          <div>
            <div className="editorial-eyebrow mb-3">Kitabın hazır</div>
            <h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl xl:text-6xl">
              $4 ile bu kitabı aç —<br className="hidden sm:block" />
              <span className="text-primary">tamamını şimdi sahiplen</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
              Ön izleme hazır. Kalan bölümleri aç, PDF ve EPUB olarak dışa aktar, Amazon KDP&apos;ye yükle. Önce değeri gördün; şimdi tamamını tek seferde açabilirsin.
            </p>
          </div>

          {/* What you get */}
          <div className="rounded-2xl border border-border/70 bg-card p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Ne alıyorsun?
            </h2>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {WHAT_YOU_GET.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-sm text-foreground">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-3.5 text-primary" aria-hidden="true" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Objection handling */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
            <p className="text-sm font-semibold text-foreground">
              &quot;AI yazımı kalitesiz olmaz mı?&quot;
            </p>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              Çalışma alanında her bölümü düzenleyebilir, yeniden üretebilir ve kendi sesinle revize edebilirsin. Sonuç tamamen senin.
            </p>
          </div>

          {/* Comparison: Biz vs Ajans */}
          <div className="rounded-2xl border border-border/70 bg-card p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Neden $4?
            </h2>
            <div className="space-y-2">
              {[
                { label: "Serbest yazar ajansı", price: "$500+", strikethrough: true },
                { label: "Freelance editör", price: "$200+", strikethrough: true },
                { label: "Kitap Oluşturucu", price: "$4", strikethrough: false, highlight: true },
              ].map(({ label, price, strikethrough, highlight }) => (
                <div
                  key={label}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm",
                    highlight
                      ? "border-primary/30 bg-primary/8 font-semibold text-primary"
                      : "border-border/60 bg-background/60 text-muted-foreground",
                  )}
                >
                  <span>{label}</span>
                  <span className={strikethrough ? "line-through opacity-60" : "font-bold"}>
                    {price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Pricing cards ───────────────────────────────────────────────────── */}
      <div className="mb-10">
        <h2 className="mb-6 text-center text-xl font-bold text-foreground">
          Plan seç, kitabını al
        </h2>
        <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
          {PLAN_COMPARE.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col",
                plan.highlight
                  ? "border-primary/40 shadow-xl shadow-primary/10 ring-1 ring-primary/20"
                  : "border-border/70",
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                  <span className="rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow">
                    {plan.badge}
                  </span>
                </div>
              )}
              <CardContent className="flex flex-1 flex-col p-6 pt-7">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-bold tabular-nums text-foreground">
                    {plan.price}
                  </span>
                  {plan.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {plan.originalPrice}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">{plan.interval}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {plan.description}
                </p>

                <ul className="mt-5 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "mt-6 w-full font-bold",
                    plan.highlight && "shadow-md shadow-primary/20",
                  )}
                  variant={plan.highlight ? "primary" : "outline"}
                  size="lg"
                  onClick={() => handleBuy(plan.id)}
                >
                  {plan.cta}
                  {plan.highlight && (
                    <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust badges row */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="size-3.5 text-primary" aria-hidden="true" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Back link ───────────────────────────────────────────────────────── */}
      <div className="text-center">
        <button
          type="button"
          className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
          onClick={() => router.push(`/app/book/${encodeURIComponent(slug)}/preview`)}
        >
          ← Önizlemeye dön
        </button>
      </div>

      {/* ── Mobile fixed CTA ────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/97 px-4 pb-safe pt-3 pb-3 backdrop-blur-md sm:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">$4 · Tek seferlik</p>
            <p className="text-xs text-muted-foreground">30 gün iade · Tam kitabı aç</p>
          </div>
          <Button
            size="default"
            className="shrink-0 font-bold shadow-md"
            onClick={() => handleBuy("premium")}
          >
            <Sparkles className="mr-1.5 size-3.5" aria-hidden="true" />
            Kitabı Aç
          </Button>
        </div>
      </div>

      {/* Bottom padding for mobile fixed bar */}
      <div className="h-20 sm:hidden" />
    </AppFrame>
  );
}
