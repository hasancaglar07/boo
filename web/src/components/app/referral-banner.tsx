"use client";

import { useEffect, useState } from "react";
import { Copy, CheckCircle2, DollarSign, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";

interface ReferralData {
  code: string;
  clicks: number;
  referralUrl: string;
}

export function ReferralBanner() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral/my-code")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setData({ code: json.code, clicks: json.clicks, referralUrl: json.referralUrl });
      })
      .catch(() => null);
  }, []);

  if (!data) return null;

  function handleCopy() {
    if (!data) return;
    navigator.clipboard.writeText(data.referralUrl).catch(() => null);
    setCopied(true);
    trackEvent("referral_link_copied", { source: "banner" });
    setTimeout(() => setCopied(false), 2500);
  }

  function handleWhatsApp() {
    if (!data) return;
    trackEvent("affiliate_whatsapp_clicked", { source: "banner" });
    const text = `BookGenerator.net ile dakikalar içinde profesyonel kitap yaz! ${data.referralUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function handleTwitter() {
    if (!data) return;
    trackEvent("affiliate_twitter_clicked", { source: "banner" });
    const text = `AI ile dakikalar içinde kitap yazdım 🚀 BookGenerator.net'i dene:`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(data.referralUrl)}`,
      "_blank",
    );
  }

  return (
    <Card className="overflow-hidden rounded-[22px] border-primary/25 bg-[radial-gradient(circle_at_bottom_right,_rgba(188,104,67,0.10),_transparent_60%)]">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <DollarSign className="size-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-foreground">
              Affiliate Linkin — %30 Komisyon
            </div>
            <div className="text-xs text-muted-foreground">
              Linkinden üye olan ve ödeme yapan herkesten kalıcı %30 kazan.
            </div>
          </div>
          {data.clicks > 0 && (
            <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
              {data.clicks} tıklanma
            </span>
          )}
        </div>

        {/* Link box */}
        <div className="mt-3 flex items-center gap-2 rounded-[14px] border border-border/60 bg-background/70 px-3 py-2">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground select-all">
            {data.referralUrl}
          </span>
        </div>

        {/* Copy button - large and prominent */}
        <Button
          className="mt-3 w-full min-h-[44px] text-sm font-semibold"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <CheckCircle2 className="mr-2 size-4.5" />
              Kopyalandı!
            </>
          ) : (
            <>
              <Copy className="mr-2 size-4" />
              Affiliate Linkini Kopyala
            </>
          )}
        </Button>

        {/* Share buttons */}
        <div className="mt-2 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-h-[38px] text-xs"
            onClick={handleWhatsApp}
          >
            <Share2 className="mr-1.5 size-3.5" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-h-[38px] text-xs"
            onClick={handleTwitter}
          >
            <Share2 className="mr-1.5 size-3.5" />
            X (Twitter)
          </Button>
        </div>

        {/* Info line */}
        <p className="mt-2.5 text-center text-[10px] leading-4 text-muted-foreground/70">
          Sınır yok • Min. ödeme $50 • Aylık ödeme
        </p>
      </CardContent>
    </Card>
  );
}
