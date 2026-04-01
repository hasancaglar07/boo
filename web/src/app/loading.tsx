"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getSession, syncPreviewAuthState } from "@/lib/preview-auth";

const MOTIVATION_FACTS = [
  "📖 Her ay 50+ kitap Book Generator ile üretiliyor",
  "⚡ Ortalama 10 dakikada outline hazır",
  "🌍 15+ dilde kitap üretilebiliyor",
  "📚 2 kitap Amazon KDP'de canlı",
  "🎨 AI kapak tasarımı 30 saniyede hazır",
  "✨ İlk bölüm 60 saniyede önizleme",
];

export default function RootLoading() {
  const [factIndex, setFactIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(() => (
    typeof window === "undefined" ? null : getSession() !== null
  ));

  useEffect(() => {
    // Rotate facts every 4 seconds
    const timer = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % MOTIVATION_FACTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    void syncPreviewAuthState().then((payload) => {
      if (!active) return;
      if (payload) {
        setIsLoggedIn(payload.authenticated);
        return;
      }
      setIsLoggedIn(getSession() !== null);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="shell flex min-h-[60vh] items-center justify-center py-24">
      <div className="w-full max-w-xl rounded-[28px] border border-border/80 bg-card/80 p-8 text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">Sayfa hazırlanıyor</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          İçerik yüklenirken kısa bir bekleme olabilir.
        </p>

        {/* Motivational Fact */}
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/8 px-4 py-3 transition-all duration-500">
          <p className="text-xs font-medium text-primary">
            {MOTIVATION_FACTS[factIndex]}
          </p>
        </div>

        {/* Signup CTA for guest users */}
        {isLoggedIn === false && (
          <div className="mt-6 space-y-2">
            <p className="text-xs text-muted-foreground">
              🎁 Kitaplarını kaybetmek istemiyorsan:
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link href="/signup">Ücretsiz Hesap Oluştur</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
