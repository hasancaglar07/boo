"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

interface LangCtx {
  lang: "en";
  t: (key: string) => string;
}

const dict: Record<string, string> = {
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
};

const LangContext = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const t = (key: string): string => {
    return dict[key] ?? key;
  };

  return (
    <LangContext.Provider value={{ lang: "en", t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}