import { ArrowRight } from "lucide-react";

import { howItWorksSteps } from "@/lib/marketing-data";
import { SectionHeading } from "@/components/site/section-heading";

export function HomeHowItWorksSection() {
  return (
    <section className="border-b border-border/80 py-18">
      <div className="shell">
        <SectionHeading
          badge="Nasıl Çalışır"
          title="5 adımda ilk kitabın tamamlanır."
          description="Konudan EPUB çıktısına kadar her adım birbirine bağlı. Ayrı araç, ayrı sekme yok — tek akışta ilerler, ortada kaybolmazsın."
        />

        <div className="relative mt-12">
          {/* Connector line — desktop only */}
          <div className="absolute left-0 right-0 top-10 hidden border-t border-dashed border-border/60 lg:block" />

          <div className="grid gap-6 md:grid-cols-5">
            {howItWorksSteps.map((item) => (
              <div key={item.step} className="relative">
                <div className="rounded-[28px] border border-border/80 bg-card/80 px-6 pb-6 pt-5 shadow-sm">
                  {/* Step number */}
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-xs font-bold text-foreground">
                    {item.step}
                    {/* dot on connector line */}
                    <span className="absolute -top-[23px] left-1/2 hidden h-2 w-2 -translate-x-1/2 rounded-full bg-primary lg:block" />
                  </div>

                  {/* Step number watermark */}
                  <p className="mt-3 font-serif text-5xl font-semibold leading-none text-primary/12 select-none">
                    {item.step}
                  </p>

                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <a
            href="/start/topic"
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/14"
          >
            Sihirbazı başlat
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
