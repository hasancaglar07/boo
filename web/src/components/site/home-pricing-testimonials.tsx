import { KDP_GUARANTEE_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";

const pricingNotes = [
  {
    title: "$4 ile düşük riskli kitap açma",
    text: "Tek Kitap paketi, abonelik açmadan tam kitabın kilidini açmak isteyenler için net ve sade bir giriş noktası. EPUB ve PDF dahil.",
  },
  {
    title: "Önizleme önce, ödeme sonra",
    text: "Fiyat tartışması ödeme sayfasında değil, kullanıcı önizlemeyi gördükten sonra anlam kazanır. Ödeme duvarı direnci düşer.",
  },
  {
    title: "Garanti ve maliyet şeffaf",
    text: `${KDP_GUARANTEE_CLAIM} ve ${NO_API_COST_CLAIM.toLowerCase()} ile fiyatlandırma açık ve anlaşılır. Gizli ücret yok.`,
  },
] as const;

export function HomePricingTestimonials() {
  return (
    <section className="border-b border-border/80 py-10">
      <div className="shell">
        <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
          Fiyatlandırmayı öğrenmeden önce bilmen gereken üç şey:
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {pricingNotes.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-[28px] border border-primary/15 bg-primary/5 px-5 py-5"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
