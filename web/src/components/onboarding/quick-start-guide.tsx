"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

const QUICK_START_STEPS = [
  {
    icon: "✍️",
    title: "Konunu Yaz",
    description: "10 saniyede kitabın konusunu belirle",
    time: "10 sn",
  },
  {
    icon: "🤖",
    title: "AI ile Outline",
    description: "Otomatik bölüm planı oluştur",
    time: "30 sn",
  },
  {
    icon: "🎨",
    title: "Kapağı Seç",
    description: "AI kapak taslağından birini seç",
    time: "15 sn",
  },
  {
    icon: "📖",
    title: "Preview Gör",
    description: "İlk bölümü hemen oku",
    time: "Hemen",
  },
];

export function QuickStartGuide() {
  const router = useRouter();

  function handleStart() {
    trackEvent("quick_start_clicked", { location: "homepage_guide" });
    router.push("/start/topic");
  }

  return (
    <div className="quick-start-card rounded-[28px] border border-border/80 bg-card/80 p-6 md:p-8">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-foreground">⚡ 60 Saniyede İlk Kitabın</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Sadece 4 adımda fikrini yayına hazır kitaba dönüştür
        </p>
      </div>

      <div className="space-y-3">
        {QUICK_START_STEPS.map((step, index) => (
          <div
            key={index}
            className="group flex items-start gap-4 rounded-[20px] border border-border/60 bg-background/60 px-4 py-4 transition-all hover:border-primary/30 hover:bg-accent/70 hover:shadow-sm"
          >
            {/* Step Number */}
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {index + 1}
            </div>

            {/* Icon */}
            <div className="text-2xl">{step.icon}</div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-[15px] font-semibold text-foreground">{step.title}</h4>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {step.time}
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Button size="lg" className="w-full" onClick={handleStart}>
          Hemen Başla
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Kayıt gerekmez • Ücretsiz deneme • İstediğin zaman çık
        </p>
      </div>
    </div>
  );
}