"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  BookOpen,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Gift,
  LinkIcon,
  Mail,
  Share2,
  Users,
  Zap,
} from "lucide-react";

import { AppFrame } from "@/components/app/app-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";
import { useAuthenticatedViewer } from "@/lib/use-authenticated-viewer";
import { useSessionGuard } from "@/lib/use-session-guard";

type ConversionItem = {
  newUserEmail: string | null;
  newUserName: string | null;
  convertedAt: string;
  rewardGranted: boolean;
};

type CommissionItem = {
  amount: number;
  description: string;
  date: string;
};

type PayoutItem = {
  id: string;
  amount: number;
  status: string;
  date: string;
  description: string;
};

type AffiliateData = {
  ok: boolean;
  code: string;
  clicks: number;
  referralUrl: string;
  totalEarned: number;
  availableBalance: number;
  paidOut: number;
  pendingPayout: number;
  totalConversions: number;
  rewardedConversions: number;
  pendingConversions: number;
  conversions: ConversionItem[];
  recentCommissions: CommissionItem[];
  payoutRequests: PayoutItem[];
};

function displayName(name?: string | null, email?: string | null) {
  const n = String(name || "").trim();
  if (n && n !== "Book Creator") return n;
  return String(email || "").split("@")[0].replace(/[._-]+/g, " ").trim() || "Book Creator";
}

export function AffiliateDashboard() {
  const ready = useSessionGuard();
  const { viewer } = useAuthenticatedViewer(ready);
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ready) return;
    fetch("/api/referral/my-code")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setData(json);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [ready]);

  function handleCopy() {
    if (!data) return;
    navigator.clipboard.writeText(data.referralUrl).catch(() => null);
    setCopied(true);
    trackEvent("affiliate_link_copied", { source: "affiliate_dashboard" });
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsApp() {
    if (!data) return;
    trackEvent("affiliate_whatsapp_clicked", { source: "affiliate_dashboard" });
    const text = `BookGenerator.net ile dakikalar içinde profesyonel kitap yaz! ${data.referralUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function handleTwitter() {
    if (!data) return;
    trackEvent("affiliate_twitter_clicked", { source: "affiliate_dashboard" });
    const text = `AI ile dakikalar içinde kitap yazdım 🚀 BookGenerator.net'i dene:`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(data.referralUrl)}`, "_blank");
  }

  function handleEmail() {
    if (!data) return;
    trackEvent("affiliate_email_clicked", { source: "affiliate_dashboard" });
    const subject = encodeURIComponent("Kitap yazmak hiç bu kadar kolay değildi!");
    const body = encodeURIComponent(`Merhaba!\n\nBookGenerator.net ile yapay zeka yardımıyla dakikalar içinde profesyonel kitap yazabilirsin.\n\nÜcretsiz denemek için: ${data.referralUrl}\n\nİyi yazılar!`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  if (!ready || !viewer) return null;

  const readableName = displayName(viewer.name, viewer.email);

  return (
    <AppFrame
      current="affiliate"
      title="Affiliate"
      viewer={viewer}
    >
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        {/* ── Sol: Ana kart — home-screen hero ile aynı dil ── */}
        <Card className="overflow-hidden border-primary/20 bg-[radial-gradient(circle_at_top_right,_rgba(188,104,67,0.08),_transparent_60%)] transition-shadow hover:shadow-[0_4px_20px_rgba(188,104,67,0.12)]">
          <CardContent className="p-5 md:p-8 lg:p-12">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                Affiliate Paneli
              </Badge>
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                <CheckCircle2 className="mr-1 size-3" />
                Aktif
              </Badge>
              <Badge className="border-border/40">%30 Komisyon</Badge>
            </div>

            <h2 className="mt-5 text-balance text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl">
              Hoş geldin, {readableName}
            </h2>

            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Kayıt olduğunuz anda affiliate linkiniz otomatik oluştu. Aşağıdaki linki kopyalayıp paylaşarak her ödeme yapan üyeden <strong className="text-foreground">%30 komisyon</strong> kazanabilirsiniz.
            </p>

            {/* ── Affiliate URL kutusu ── */}
            <div className="mt-6 max-w-2xl">
              {loading ? (
                <div className="rounded-2xl border border-border/60 bg-muted/40 px-4 py-4">
                  <div className="h-5 w-full animate-pulse rounded bg-muted" />
                </div>
              ) : (
                <div
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/40 px-4 py-4 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={handleCopy}
                >
                  <LinkIcon className="size-4 shrink-0 text-primary/60" />
                  <span className="min-w-0 flex-1 truncate font-mono text-sm text-foreground select-all">
                    {data?.referralUrl || "Yükleniyor..."}
                  </span>
                  <Copy className="size-4 shrink-0 text-muted-foreground/60" />
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="lg"
                  className="min-h-[48px]"
                  onClick={handleCopy}
                  disabled={!data}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="mr-1.5 size-4" />
                      Kopyalandı!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 size-4" />
                      Linki Kopyala
                    </>
                  )}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-[48px]"
                  onClick={handleWhatsApp}
                  disabled={!data}
                >
                  WhatsApp
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-[48px]"
                  onClick={handleTwitter}
                  disabled={!data}
                >
                  X (Twitter)
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-[48px]"
                  onClick={handleEmail}
                  disabled={!data}
                >
                  <Mail className="mr-1.5 size-4" />
                  E-posta
                </Button>
              </div>

              {data && data.clicks > 0 && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  <span><strong className="text-foreground">{data.clicks}</strong> kişi linkine tıkladı</span>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <div className="rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs font-medium text-foreground">
                Komisyon: %30
              </div>
              <div className="rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs font-medium text-foreground">
                Min. ödeme: $50
              </div>
              <div className="rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs font-medium text-foreground">
                Aylık ödeme
              </div>
              <div className="rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs font-medium text-foreground">
                Sınır yok
              </div>
            </div>

            {/* ── Ödeme Talebi ── */}
            {data && (
              <div className="mt-8 rounded-[20px] border border-border/60 bg-card/40 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BadgeDollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-semibold text-foreground">Ödeme Talebi</h3>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Kullanılabilir: </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">${data.availableBalance.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ödenen: </span>
                    <span className="font-semibold text-foreground">${data.paidOut.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bekleyen: </span>
                    <span className="font-semibold text-amber-600">${data.pendingPayout.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="mt-4 min-h-[48px]"
                  disabled={data.availableBalance < 50}
                  onClick={async () => {
                    const email = prompt("Ödeme almak istediğiniz PayPal e-posta adresini girin:");
                    if (!email) return;
                    const res = await fetch("/api/referral/payout-request", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ method: "paypal", email }),
                    });
                    const json = await res.json();
                    if (json.ok) {
                      alert(`Talebiniz alındı! $${json.payout.amount.toFixed(2)} — En kısa sürede işlenecek.`);
                      window.location.reload();
                    } else {
                      alert(json.error || "Hata oluştu.");
                    }
                  }}
                >
                  <BadgeDollarSign className="mr-1.5 size-4" />
                  {data.availableBalance >= 50 ? "Ödeme Talep Et" : `Min. $50 gerekli (Eksik: $${(50 - data.availableBalance).toFixed(2)})`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Sağ: İstatistik + bilgi kartları ── */}
        <div className="flex flex-col gap-5">
          {/* İstatistikler */}
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Tıklama", value: data?.clicks ?? 0, icon: Users, numeric: true },
              { label: "Toplam Kazanç", value: `$${(data?.totalEarned ?? 0).toFixed(2)}`, icon: DollarSign, numeric: false },
              { label: "Kullanılabilir Bakiye", value: `$${(data?.availableBalance ?? 0).toFixed(2)}`, icon: BadgeDollarSign, numeric: false, highlight: true },
              { label: "Dönüşüm", value: `${data?.totalConversions ?? 0} (${data?.rewardedConversions ?? 0} ödüllü)`, icon: CheckCircle2, numeric: false },
            ].map(({ label, value, icon: Icon, highlight }) => (
              <div
                key={label}
                className={`rounded-2xl border px-4 py-5 transition-all hover:border-border hover:bg-card ${
                  highlight
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border/60 bg-card/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`size-3.5 ${highlight ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/60"}`} />
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {label}
                  </div>
                </div>
                <div className={`mt-2 text-2xl font-bold tabular-nums ${highlight ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Komisyon tablosu */}
          <Card className="border-border/60 bg-card/50">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <DollarSign className="size-3.5 text-muted-foreground/60" />
                <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Komisyon Tablosu
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { plan: "Starter", price: "$19", commission: "$5.70" },
                  { plan: "Creator", price: "$39", commission: "$11.70" },
                  { plan: "Pro", price: "$79", commission: "$23.70" },
                ].map((row) => (
                  <div key={row.plan} className="flex items-center justify-between rounded-[14px] border border-border/40 bg-background/50 px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{row.plan}</div>
                      <div className="text-xs text-muted-foreground">Aylık {row.price}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">%30</div>
                      <div className="text-xs text-muted-foreground">{row.commission}/ay</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-[14px] border border-primary/15 bg-primary/5 px-4 py-2.5 text-[11px] leading-4 text-muted-foreground">
                Davet ettiğin kişi ödemeyi sürdürdüğü sürece her ay komisyon alırsın.
              </div>
            </CardContent>
          </Card>

          {/* Nasıl çalışır */}
          <Card className="border-border/60 bg-card/50">
            <CardContent className="space-y-2 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Nasıl Çalışır?
                </div>
              </div>

              {[
                {
                  icon: LinkIcon,
                  label: "Linkini kopyala",
                  description: "Yukarıdaki özel affiliate linkini kopyala.",
                },
                {
                  icon: Share2,
                  label: "Paylaş",
                  description: "Sosyal medya, blog, e-posta veya WhatsApp'tan paylaş.",
                },
                {
                  icon: Gift,
                  label: "Kazan",
                  description: "Linkinden üye olan ve ödeme yapan herkesten %30 komisyon kazanırsın.",
                },
              ].map(({ icon: Icon, label, description }) => (
                <button
                  key={label}
                  className="flex min-h-[64px] w-full items-start gap-3 rounded-[20px] border border-border/50 bg-background/50 px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-accent/50"
                >
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">{label}</div>
                    <div className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Son Dönüşümler */}
          {data && data.conversions.length > 0 && (
            <Card className="border-border/60 bg-card/50">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Users className="size-3.5 text-muted-foreground/60" />
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Son Dönüşümler
                  </div>
                </div>
                <div className="space-y-2">
                  {data.conversions.slice(0, 10).map((c, i) => (
                    <div key={i} className="flex items-center justify-between rounded-[14px] border border-border/40 bg-background/50 px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">{c.newUserName || c.newUserEmail || "Kullanıcı"}</div>
                        <div className="text-xs text-muted-foreground">{new Date(c.convertedAt).toLocaleDateString("en-US")}</div>
                      </div>
                      {c.rewardGranted ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" /> Ödüllü
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                          <Clock className="size-3" /> Bekliyor
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ödeme Geçmişi */}
          {data && data.payoutRequests.length > 0 && (
            <Card className="border-border/60 bg-card/50">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <BadgeDollarSign className="size-3.5 text-muted-foreground/60" />
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Ödeme Geçmişi
                  </div>
                </div>
                <div className="space-y-2">
                  {data.payoutRequests.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-[14px] border border-border/40 bg-background/50 px-4 py-3">
                      <div>
                        <div className="text-sm font-bold text-foreground">${p.amount.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString("en-US")}</div>
                      </div>
                      {p.status === "paid" ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" /> Ödendi
                        </span>
                      ) : p.status === "open" || p.status === "draft" ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                          <Clock className="size-3" /> Bekliyor
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">{p.status}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="border-border/60 bg-card/50">
            <CardContent className="space-y-2 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Hızlı İşlemler
                </div>
              </div>

              <Link
                href="/app/library"
                className="flex min-h-[64px] w-full items-start gap-3 rounded-[20px] border border-border/50 bg-background/50 px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-accent/50"
              >
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BookOpen className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">Kitaplarıma Dön</div>
                  <div className="mt-0.5 text-xs leading-5 text-muted-foreground">Kütüphane ve yazım alanına geri dön.</div>
                </div>
                <ArrowRight className="mt-2 size-4 text-muted-foreground/40" />
              </Link>

              <a
                href="mailto:affiliate@bookgenerator.net?subject=Affiliate%20Soru"
                className="flex min-h-[64px] w-full items-start gap-3 rounded-[20px] border border-border/50 bg-background/50 px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-accent/50"
              >
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Mail className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">Soru Sor</div>
                  <div className="mt-0.5 text-xs leading-5 text-muted-foreground">affiliate@bookgenerator.net — 2 iş günü içinde yanıt.</div>
                </div>
                <ArrowRight className="mt-2 size-4 text-muted-foreground/40" />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppFrame>
  );
}
