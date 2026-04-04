"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, ArrowRight, Users, LinkIcon, BadgeDollarSign } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const COMMISSIONS = [
  { plan: "Starter", price: "$19", perMonth: "$5.70", total3: "$17.10" },
  { plan: "Creator", price: "$39", perMonth: "$11.70", total3: "$35.10" },
  { plan: "Pro", price: "$79", perMonth: "$23.70", total3: "$71.10" },
];

const STEPS = [
  {
    icon: ArrowRight,
    title: "Başvurunu gönder",
    desc: "Affiliate programına başvurunu e-posta ile gönder. 2 iş günü içinde yanıt alırsın.",
  },
  {
    icon: LinkIcon,
    title: "Özel affiliate linkini al",
    desc: "Onay sonrası sana özel izleme linkini alırsın. Paylaşmaya hemen başlayabilirsin.",
  },
  {
    icon: BadgeDollarSign,
    title: "Komisyonunu kazan",
    desc: "Referansın ödeme yaptığında her ay %30 komisyon kazanırsın. İlk 3 ay geçerli.",
  },
];

const FAQS = [
  {
    q: "Ödeme nasıl yapılır?",
    a: "Rewardful platformu üzerinden PayPal veya banka transferi ile ödeme yapılır. Minimum ödeme eşiği $50'dır.",
  },
  {
    q: "Premium plan ($4) komisyon kapsamında mı?",
    a: "Hayır. Affiliate komisyonları yalnızca aylık abonelik planları için geçerlidir (Starter, Creator, Pro).",
  },
  {
    q: "Komisyon ne zaman onaylanır?",
    a: "30 günlük iade süresi dolduktan sonra komisyon onaylanır ve hesabına eklenir.",
  },
  {
    q: "Kaç kişiyi davet edebilirim?",
    a: "Sınır yok. Ne kadar çok paylaşırsan, o kadar çok kazanırsın.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        {q}
        {open ? <ChevronUp className="size-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>}
    </div>
  );
}

export function AffiliatePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-border/60 bg-gradient-to-b from-primary/5 to-transparent py-20 text-center">
        <div className="shell max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            Affiliate Programı
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground sm:text-5xl">
            Her Abonelikten<br />%30 Komisyon Kazan
          </h1>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            Kitap Oluşturucu&apos;yu tanıtıyorsun, biz ödüyoruz. İlk 3 ay boyunca her aktif abonelikten komisyon kazan.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="mailto:affiliate@kitapol.com?subject=Affiliate%20Ba%C5%9Fvurusu&body=Merhaba%2C%0A%0AAffiliate%20program%C4%B1na%20ba%C5%9Fvurmak%20istiyorum.%0A%0AAd%C4%B1m%3A%0AWeb%20sitem%20%2F%20kanalım%3A%0AHedef%20kitlem%3A"
              className="inline-flex items-center gap-2 rounded-[14px] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <Users className="size-4" />
              Hemen Başvur
            </a>
            <Link
              href="#nasil-calisir"
              className="inline-flex items-center gap-2 rounded-[14px] border border-border/60 px-6 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Nasıl çalışır?
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="nasil-calisir" className="py-16">
        <div className="shell">
          <h2 className="mb-10 text-center font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            3 Adımda Komisyon Kazan
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <Card key={i} className="rounded-[22px]">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <step.icon className="size-5" />
                  </div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
                    Adım {i + 1}
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Commission table */}
      <section className="bg-muted/30 py-16">
        <div className="shell max-w-2xl">
          <h2 className="mb-8 text-center font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            Komisyon Tablosu
          </h2>
          <Card className="rounded-[22px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/50">
                    <th className="px-5 py-3 text-left font-semibold text-foreground">Plan</th>
                    <th className="px-5 py-3 text-right font-semibold text-foreground">Aylık Fiyat</th>
                    <th className="px-5 py-3 text-right font-semibold text-foreground">Komisyon/Ay</th>
                    <th className="px-5 py-3 text-right font-semibold text-primary">3 Ay Toplamı</th>
                  </tr>
                </thead>
                <tbody>
                  {COMMISSIONS.map((row, i) => (
                    <tr key={i} className={cn("border-b border-border/40 last:border-0", i % 2 === 1 && "bg-muted/20")}>
                      <td className="px-5 py-4 font-medium text-foreground">{row.plan}</td>
                      <td className="px-5 py-4 text-right text-muted-foreground">{row.price}</td>
                      <td className="px-5 py-4 text-right text-muted-foreground">{row.perMonth}</td>
                      <td className="px-5 py-4 text-right font-semibold text-primary">{row.total3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border/40 bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
              * Premium ($4 tek seferlik) komisyon kapsamı dışındadır. Komisyonlar 30 günlük iade süresi sonrası onaylanır.
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="shell max-w-2xl">
          <h2 className="mb-8 text-center font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            Sık Sorulan Sorular
          </h2>
          <Card className="rounded-[22px]">
            <CardContent className="divide-y divide-border/60 p-6">
              {FAQS.map((faq, i) => (
                <FaqItem key={i} q={faq.q} a={faq.a} />
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 bg-gradient-to-b from-transparent to-primary/5 py-20 text-center">
        <div className="shell max-w-xl">
          <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            Hazır mısın?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            E-posta adresini ve platformunu belirterek bize yaz. 2 iş günü içinde affiliate linkini gönderiyoruz.
          </p>
          <a
            href="mailto:affiliate@kitapol.com?subject=Affiliate%20Ba%C5%9Fvurusu&body=Merhaba%2C%0A%0AAffiliate%20program%C4%B1na%20ba%C5%9Fvurmak%20istiyorum.%0A%0AAd%C4%B1m%3A%0AWeb%20sitem%20%2F%20kanalım%3A%0AHedef%20kitlem%3A"
            className="mt-6 inline-flex items-center gap-2 rounded-[14px] bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <Users className="size-4" />
            Başvuru E-postası Gönder
          </a>
          <p className="mt-3 text-xs text-muted-foreground">
            affiliate@kitapol.com · Başvurular 2 iş günü içinde yanıtlanır
          </p>
        </div>
      </section>
    </div>
  );
}
