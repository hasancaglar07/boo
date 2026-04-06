import type { Metadata } from "next";
import { Libre_Bodoni, Public_Sans } from "next/font/google";
import Script from "next/script";

import { AuthStateHydrator } from "@/components/auth/auth-state-hydrator";
import { AssetLoadRecoveryScript } from "@/components/app/asset-load-recovery-script";
import { ChunkLoadRecovery } from "@/components/app/chunk-load-recovery";
import { CookieConsent } from "@/components/app/cookie-consent";
import { RefCodeDetector } from "@/components/app/ref-code-detector";
import { LangProvider } from "@/components/lang-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
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
      "tr-TR": absoluteUrl("/"),
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
        alt: `${siteConfig.name} kapak görseli`,
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
        availableLanguage: ["tr", "en"],
      },
      {
        "@type": "ContactPoint",
        contactType: "billing support",
        email: PUBLIC_BILLING_EMAIL,
        availableLanguage: ["tr", "en"],
      },
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: siteConfig.alternateName,
    url: siteConfig.siteUrl,
    inLanguage: "tr-TR",
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
    inLanguage: "tr-TR",
    offers: [
      {
        "@type": "Offer",
        name: "Tek Kitap",
        price: "4",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "4",
          priceCurrency: "USD",
          unitText: "tek seferlik",
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
          unitText: "aylık",
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
          unitText: "aylık",
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
          unitText: "aylık",
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
      lang="tr"
      suppressHydrationWarning
      className={`${publicSans.variable} ${libreBodoni.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <AssetLoadRecoveryScript />
        <a
          href="#main-content"
          className="skip-link"
        >
          Ana içeriğe geç
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
            {children}
          </div>
          <CookieConsent />
          <Toaster richColors position="top-right" />
          </LangProvider>
        </ThemeProvider>
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
