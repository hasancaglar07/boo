import type { Metadata } from "next";
import { Libre_Bodoni, Public_Sans } from "next/font/google";
import Script from "next/script";

import { AuthStateHydrator } from "@/components/auth/auth-state-hydrator";
import { ChunkLoadRecovery } from "@/components/app/chunk-load-recovery";
import { CookieConsent } from "@/components/app/cookie-consent";
import { RefCodeDetector } from "@/components/app/ref-code-detector";
import { LangProvider } from "@/components/lang-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { PageTransition } from "@/components/app/page-transition";
import { PUBLIC_BILLING_EMAIL, PUBLIC_SUPPORT_EMAIL } from "@/lib/contact-shared";
import { absoluteUrl, metadataBaseUrl, siteConfig } from "@/lib/seo";

import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const libreBodoni = Libre_Bodoni({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl(),
  title: siteConfig.defaultTitle,
  description: siteConfig.description,
  alternates: {
    canonical: absoluteUrl("/"),
    languages: {
      "en-US": absoluteUrl("/"),
    },
  },
  applicationName: siteConfig.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: absoluteUrl("/"),
    siteName: siteConfig.name,
    title: siteConfig.defaultTitle,
    description: siteConfig.description,
    images: [
      {
        url: absoluteUrl(siteConfig.defaultOgImage),
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} cover image`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.defaultTitle,
    description: siteConfig.description,
    images: [absoluteUrl(siteConfig.defaultOgImage)],
  },
};

export default function RootLayout(props: LayoutProps<"/">) {
  const { children } = props;
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    alternateName: siteConfig.alternateName,
    url: siteConfig.siteUrl,
    logo: absoluteUrl("/logo.png"),
    description: siteConfig.description,
    email: PUBLIC_SUPPORT_EMAIL,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: PUBLIC_SUPPORT_EMAIL,
        availableLanguage: ["en", "tr"],
      },
      {
        "@type": "ContactPoint",
        contactType: "billing support",
        email: PUBLIC_BILLING_EMAIL,
        availableLanguage: ["en", "tr"],
      },
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: siteConfig.alternateName,
    url: siteConfig.siteUrl,
    inLanguage: "en-US",
    description: siteConfig.description,
  };

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    alternateName: siteConfig.alternateName,
    description: siteConfig.description,
    url: siteConfig.siteUrl,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "AI publishing studio",
    operatingSystem: "Web",
    inLanguage: "en-US",
    offers: [
      {
        "@type": "Offer",
        name: "Single Book",
        price: "4",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "4",
          priceCurrency: "USD",
          unitText: "one-time",
        },
      },
      {
        "@type": "Offer",
        name: "Starter",
        price: "19",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "19",
          priceCurrency: "USD",
          unitText: "monthly",
          billingDuration: "P1M",
        },
      },
      {
        "@type": "Offer",
        name: "Creator",
        price: "39",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "39",
          priceCurrency: "USD",
          unitText: "monthly",
          billingDuration: "P1M",
        },
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "79",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "79",
          priceCurrency: "USD",
          unitText: "monthly",
          billingDuration: "P1M",
        },
      },
    ],
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.siteUrl,
    },
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${publicSans.variable} ${libreBodoni.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <a
          href="#main-content"
          className="skip-link"
        >
          Skip to main content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <LangProvider>
          <ChunkLoadRecovery />
          <AuthStateHydrator />
          <RefCodeDetector />
          <div id="main-content" className="flex min-h-full flex-col">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
          <CookieConsent />
          <Toaster richColors position="top-right" />
          </LangProvider>
        </ThemeProvider>
        <Script id="asset-load-recovery" strategy="afterInteractive" dangerouslySetInnerHTML={{
          __html: `
(function () {
  var GUARD_KEY = "book-generator:asset-reload-at";
  var GUARD_WINDOW_MS = 30000;

  function now() {
    return Date.now();
  }

  function canReload() {
    try {
      var raw = window.sessionStorage.getItem(GUARD_KEY);
      if (!raw) return true;
      var last = Number(raw);
      if (Number.isNaN(last)) return true;
      return now() - last > GUARD_WINDOW_MS;
    } catch (_error) {
      return true;
    }
  }

  function markReload() {
    try {
      window.sessionStorage.setItem(GUARD_KEY, String(now()));
    } catch (_error) {
      // ignore
    }
  }

  function staticAssetUrl(value) {
    return typeof value === "string" && value.indexOf("/_next/static/") !== -1;
  }

  function shouldRecoverFromMessage(message) {
    if (typeof message !== "string" || !message) return false;
    return (
      message.indexOf("ChunkLoadError") !== -1 ||
      message.indexOf("Failed to load chunk") !== -1 ||
      message.indexOf("Failed to fetch dynamically imported module") !== -1 ||
      message.indexOf("Refused to apply style") !== -1 ||
      message.indexOf("MIME type") !== -1 ||
      message.indexOf("/_next/static/") !== -1
    );
  }

  function reloadForFreshAssets() {
    if (!canReload()) return;
    markReload();

    var url = new URL(window.location.href);
    url.searchParams.set("__asset_retry", String(now()));
    window.location.replace(url.toString());
  }

  window.addEventListener(
    "error",
    function (event) {
      var target = event.target;
      if (target && target.tagName === "SCRIPT" && staticAssetUrl(target.src || "")) {
        reloadForFreshAssets();
        return;
      }
      if (
        target &&
        target.tagName === "LINK" &&
        target.rel === "stylesheet" &&
        staticAssetUrl(target.href || "")
      ) {
        reloadForFreshAssets();
        return;
      }

      if (shouldRecoverFromMessage(event && event.message ? String(event.message) : "")) {
        reloadForFreshAssets();
      }
    },
    true
  );

  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    var message = "";
    if (typeof reason === "string") {
      message = reason;
    } else if (reason && typeof reason.message === "string") {
      message = reason.message;
    }
    if (shouldRecoverFromMessage(message)) {
      reloadForFreshAssets();
    }
  });
})();
          `
        }} />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID ?? "G-GEEGMJ1L7R"}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
            });
            (function() {
              try {
                var c = localStorage.getItem('book-generator:cookie-consent');
                if (c === 'granted' || c === 'denied') {
                  gtag('consent', 'update', { analytics_storage: c, ad_storage: c });
                }
              } catch(e) {}
            })();
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID ?? "G-GEEGMJ1L7R"}');
          `}
        </Script>
      </body>
    </html>
  );
}
