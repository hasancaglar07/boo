import { ArrowRight, Check, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FULL_TRUST_CLAIM, KDP_LIVE_BOOKS_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";

export interface Cta4Props {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  items?: readonly string[];
}

const defaultItems = [
  "5 soruluk hızlı başlangıç sihirbazı",
  "EPUB önce, PDF sonra",
  "Cover and metadata flow",
  "Editable chapter structure",
  "AI destekli araştırma katmanı",
] as const;

export function Cta4({
  title = "The single clear starting point for launching your first book.",
  description = "A book system that takes you from topic idea to your first publishable file without unnecessary panel fatigue.",
  buttonText = "Start your first book",
  buttonUrl = "/start",
  items = defaultItems,
}: Cta4Props) {
  return (
    <section className="py-20 md:py-28">
      <div className="shell">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#1e1410_0%,#2a1a10_40%,#1e1b18_100%)] px-6 py-10 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.55)] md:px-10 lg:px-16 lg:py-14">
            {/* Background glow */}
            <div className="pointer-events-none absolute -top-20 left-1/3 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(201,100,66,0.22),transparent_68%)] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 right-1/4 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(201,100,66,0.14),transparent_68%)] blur-2xl" />

            <div className="relative flex flex-col items-start justify-between gap-10 md:flex-row">
              <div className="md:w-[58%]">
                {/* Guarantee badge */}
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#f0a27f]/30 bg-[#f0a27f]/10 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[#f0a27f]">
                  <ShieldCheck className="size-3.5" />
                  %100 KDP onay garantisi
                </div>

                <h2 className="mb-3 text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  {title}
                </h2>
                <p className="max-w-2xl text-pretty text-base leading-8 text-stone-300">{description}</p>

                <Button className="mt-8 bg-primary hover:bg-primary/90" asChild size="lg">
                  <a href={buttonUrl} className="inline-flex items-center gap-2">
                    {buttonText}
                    <ArrowRight className="size-4" />
                  </a>
                </Button>

                <p className="mt-3 text-xs text-stone-400">
                  Kredi kartı gerekmez · {NO_API_COST_CLAIM}
                </p>

                {/* Social proof row */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    KDP_LIVE_BOOKS_CLAIM,
                    FULL_TRUST_CLAIM,
                    "Önce preview, sonra ödeme",
                    "$4 unlock for a single book",
                  ].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="md:w-[36%]">
                <ul className="flex flex-col space-y-3 text-sm font-medium">
                  {items.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-stone-200">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/25 text-primary">
                        <Check className="size-3" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}