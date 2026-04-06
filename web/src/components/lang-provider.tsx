"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type Lang = "tr" | "en";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const dict: Record<Lang, Record<string, string>> = {
  en: {
    // ── Header Nav ──
    "nav.howItWorks": "How It Works",
    "nav.examples": "Examples",
    "nav.pricing": "Pricing",
    "nav.tools": "Tools",
    "nav.faq": "FAQ",
    "nav.login": "Log In",
    "nav.myBooks": "My Books",
    "nav.newBook": "New Book",
    "nav.freePreview": "Free Preview",
    "nav.goHome": "Go to homepage",
    "nav.mainMenu": "Main menu",

    // ── Footer ──
    "footer.freePreview": "Free Preview",
    "footer.compare": "Compare",
    "footer.freeTools": "Free Tools",
    "footer.blog": "Blog",
    "footer.resources": "Resources",
    "footer.useCases": "Use Cases",
    "footer.about": "About",
    "footer.contact": "Contact",
    "footer.affiliate": "Affiliate Program",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    "footer.refund": "Refund Policy",
    "footer.product": "Product",
    "footer.company": "Company",
    "footer.legal": "Legal",
    "footer.writingTips": "Writing tips & campaigns",
    "footer.newsletterDesc": "Join our weekly newsletter, write your first book faster.",
    "footer.emailPlaceholder": "Your email address",
    "footer.emailLabel": "Email address",
    "footer.subscribe": "Subscribe",
    "footer.subscribed": "Subscribed!",
    "footer.ctaTitle": "Start writing your book <em>today</em>",
    "footer.ctaSub": "Create your first book in minutes with a free preview.",
    "footer.ctaBtn": "Start Free Preview",
    "footer.brandDesc": "AI-powered, simple and premium book writing interface. Create your first book to professional standards.",
    "footer.copyright": "Book Generator. All rights reserved.",
    "footer.tagline": "AI-powered book writing.",
    "footer.theme": "Theme",
    "footer.goHome": "Go to homepage",

    // ── Language ──
    "lang.label": "EN",
    "lang.switchTo": "Türkçe",
  },
  tr: {
    // ── Header Nav ──
    "nav.howItWorks": "Nasıl Çalışır",
    "nav.examples": "Örnekler",
    "nav.pricing": "Fiyatlar",
    "nav.tools": "Araçlar",
    "nav.faq": "SSS",
    "nav.login": "Giriş Yap",
    "nav.myBooks": "Kitaplarım",
    "nav.newBook": "Yeni Kitap",
    "nav.freePreview": "Ücretsiz Preview",
    "nav.goHome": "Ana sayfaya git",
    "nav.mainMenu": "Ana menü",

    // ── Footer ──
    "footer.freePreview": "Ücretsiz Önizleme",
    "footer.compare": "Karşılaştır",
    "footer.freeTools": "Ücretsiz Araçlar",
    "footer.blog": "Blog",
    "footer.resources": "Kaynaklar",
    "footer.useCases": "Kullanım Senaryoları",
    "footer.about": "Hakkında",
    "footer.contact": "İletişim",
    "footer.affiliate": "Affiliate Programı",
    "footer.privacy": "Gizlilik Politikası",
    "footer.terms": "Kullanım Şartları",
    "footer.refund": "İade Politikası",
    "footer.product": "Ürün",
    "footer.company": "Şirket",
    "footer.legal": "Yasal",
    "footer.writingTips": "Yazım ipuçları ve kampanyalar",
    "footer.newsletterDesc": "Haftalık bültenimize katıl, ilk kitabını daha hızlı yaz.",
    "footer.emailPlaceholder": "E-posta adresin",
    "footer.emailLabel": "E-posta adresi",
    "footer.subscribe": "Abone Ol",
    "footer.subscribed": "Katıldın!",
    "footer.ctaTitle": "Kitabını <em>bugün</em> yazmaya başla",
    "footer.ctaSub": "Ücretsiz preview ile ilk kitabını dakikalar içinde oluştur.",
    "footer.ctaBtn": "Ücretsiz Önizleme Başlat",
    "footer.brandDesc": "Yapay zeka destekli, sade ve premium kitap yazım arayüzü. İlk kitabını profesyonel standartlarda oluştur.",
    "footer.copyright": "Kitap Oluşturucu. Tüm hakları saklıdır.",
    "footer.tagline": "Yapay zeka destekli kitap yazımı.",
    "footer.theme": "Tema",
    "footer.goHome": "Ana sayfaya git",

    // ── Language ──
    "lang.label": "TR",
    "lang.switchTo": "English",
  },
};

const LangContext = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved && (saved === "en" || saved === "tr")) {
      setLangState(saved);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  const t = (key: string): string => {
    return dict[lang]?.[key] ?? key;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
