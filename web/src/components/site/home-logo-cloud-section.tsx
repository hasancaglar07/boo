import { LogoCloud } from "@/components/ui/logo-cloud-3";
import {
  KDP_LIVE_BOOK_COUNT,
  KDP_LIVE_BOOKS_CLAIM,
  NO_API_COST_CLAIM,
} from "@/lib/site-claims";

const logos = [
  { src: "/logos/openai_wordmark_light.svg", alt: "OpenAI" },
  { src: "/logos/claude-ai-wordmark-icon_light.svg", alt: "Claude" },
  { src: "/logos/notion.svg", alt: "Notion" },
  { src: "/logos/microsoft-word.svg", alt: "Microsoft Word" },
  { src: "/logos/canva.svg", alt: "Canva" },
  { src: "/logos/adobe.svg", alt: "Adobe" },
  { src: "/logos/apple.svg", alt: "Apple Books" },
  { src: "/logos/googleplay.svg", alt: "Google Play Books" },
  { src: "/logos/dropbox_wordmark.svg", alt: "Dropbox" },
];

export function HomeLogoCloudSection() {
  return (
    <section className="border-b border-border/80 py-8 md:py-10">
      <div className="shell">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary/80">
            {KDP_LIVE_BOOKS_CLAIM}
          </p>
          <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Ürettiğin kitap bu platformlara direkt yüklenmeye hazır çıkar.
          </h2>
        </div>

        <div className="mt-6 rounded-[28px] border border-border/70 bg-card/60 px-4 py-5 shadow-sm backdrop-blur-sm">
          <LogoCloud logos={logos} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {[
            { value: KDP_LIVE_BOOK_COUNT, label: "KDP onaylı kitap canlıda" },
            { value: "%100", label: "KDP onay garantisi" },
            { value: "Ek API cost yok", label: NO_API_COST_CLAIM },
            { value: "EPUB + PDF", label: "Yayına hazır çıktı" },
          ].map(({ value, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-foreground">{value}</span>
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
