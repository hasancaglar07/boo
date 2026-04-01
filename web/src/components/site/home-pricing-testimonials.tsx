const pricingTestimonials = [
  {
    text: "İlk rehber kitabımı iki akşamda çıkardım. Şimdi düşük fiyatlı giriş ürünü olarak satıyorum.",
    name: "Selin A.",
    role: "Eğitmen",
    platform: "KDP",
  },
  {
    text: "Ajans teklifine göre çok daha ucuza mal oldu. İlk satış sayfamı günler içinde açtım.",
    name: "Baran K.",
    role: "Danışman",
    platform: "Gumroad",
  },
];

export function HomePricingTestimonials() {
  return (
    <section className="border-b border-border/80 py-10">
      <div className="shell">
        <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
          Plan seçmeden önce — bunlar gerçek kullanıcıların yorumu:
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {pricingTestimonials.map((t) => (
            <div
              key={t.name}
              className="flex gap-4 rounded-[28px] border border-primary/15 bg-primary/5 px-5 py-5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                {t.name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="text-sm leading-7 text-foreground">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{t.role}</span>
                  <span className="rounded-full border border-border/80 bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
                    {t.platform}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
