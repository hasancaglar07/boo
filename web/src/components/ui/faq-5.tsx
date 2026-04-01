import { Badge } from "@/components/ui/badge";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Faq5Props {
  badge?: string;
  heading?: string;
  description?: string;
  faqs?: readonly FaqItem[];
}

const defaultFaqs: readonly FaqItem[] = [
  {
    question: "Bu urun ne yapiyor?",
    answer: "Fikrini alir, taslagini kurar, bolumleri uretir ve kitabini yayinlanabilir cikti dosyalarina donusturur.",
  },
  {
    question: "Ilk kez kullanan biri bunu anlayabilir mi?",
    answer: "Evet. Ana akista kisa sorular, net karar adimlari ve yonlendirilmis kitap olusturma yolu vardir.",
  },
  {
    question: "Ingilizce kitap uretebilir miyim?",
    answer: "Evet. Arayuz Turkce kalsa da kitap icerigi English veya sectigin dilde uretilebilir.",
  },
  {
    question: "Cikti olarak ne alirim?",
    answer: "Planina gore EPUB, PDF ve uygun akislarda ek formatlar, metadata ve export klasorleri alirsin.",
  },
] as const;

export function Faq5({
  badge = "SSS",
  heading = "En cok sorulan temel sorular",
  description = "Karar vermeden once en kritik noktalarin cevabini tek bakista gorebilirsin.",
  faqs = defaultFaqs,
}: Faq5Props) {
  return (
    <section className="py-20 md:py-28">
      <div className="shell">
        <div className="text-center">
          <Badge className="text-xs font-medium">{badge}</Badge>
          <h2 className="mt-4 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {heading}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-8 text-muted-foreground">{description}</p>
        </div>

        <div className="mx-auto mt-14 max-w-4xl">
          {faqs.map((faq, index) => (
            <div key={faq.question} className="mb-8 flex gap-4 rounded-[26px] border border-border/80 bg-card/90 p-6 shadow-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-background font-mono text-xs text-primary">
                {index + 1}
              </span>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium text-foreground">{faq.question}</h3>
                </div>
                <p className="text-sm leading-7 text-muted-foreground">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
