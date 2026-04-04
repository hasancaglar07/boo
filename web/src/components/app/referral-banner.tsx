"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Gift } from "lucide-react";

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
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="rounded-[18px] border-dashed border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Gift className="size-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Arkadaşlarını davet et, ücretsiz kitap kazan</span>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Her ödeme yapan referans için 1 ücretsiz kitap kredisi kazanırsın.
          {data.clicks > 0 && ` — ${data.clicks} tıklanma`}
        </p>
        <div className="flex items-center gap-2 rounded-[10px] border border-border/60 bg-background/60 px-3 py-1.5">
          <span className="flex-1 truncate font-mono text-xs text-muted-foreground">{data.referralUrl}</span>
          <Button size="sm" variant="outline" onClick={handleCopy} className="h-7 text-xs">
            {copied ? (
              <>
                <Check className="mr-1 size-3" />
                Kopyalandı
              </>
            ) : (
              <>
                <Copy className="mr-1 size-3" />
                Kopyala
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
