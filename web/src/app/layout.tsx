import type { Metadata } from "next";
import { Libre_Bodoni, Public_Sans } from "next/font/google";
import Script from "next/script";

import { AuthStateHydrator } from "@/components/auth/auth-state-hydrator";
import { ChunkLoadRecovery } from "@/components/app/chunk-load-recovery";
import { ThemeProvider } from "@/components/theme-provider";
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
    url: siteConfig.siteUrl,
    logo: absoluteUrl("/logo.png"),
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    inLanguage: "tr-TR",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.siteUrl}/blog?query={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.siteUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "tr-TR",
    offers: [
      { "@type": "Offer", name: "Tek Kitap", price: "4", priceCurrency: "USD", priceSpecification: { "@type": "UnitPriceSpecification", price: "4", priceCurrency: "USD", unitText: "tek seferlik" } },
      { "@type": "Offer", name: "Starter", price: "19", priceCurrency: "USD", priceSpecification: { "@type": "UnitPriceSpecification", price: "19", priceCurrency: "USD", unitText: "aylık", billingDuration: "P1M" } },
      { "@type": "Offer", name: "Creator", price: "39", priceCurrency: "USD", priceSpecification: { "@type": "UnitPriceSpecification", price: "39", priceCurrency: "USD", unitText: "aylık", billingDuration: "P1M" } },
      { "@type": "Offer", name: "Pro", price: "79", priceCurrency: "USD", priceSpecification: { "@type": "UnitPriceSpecification", price: "79", priceCurrency: "USD", unitText: "aylık", billingDuration: "P1M" } },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      bestRating: "5",
      worstRating: "1",
      ratingCount: "1240",
    },
  };

  const speakableSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", ".marketing-hero-description"],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableSchema) }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ChunkLoadRecovery />
          <AuthStateHydrator />
          <div id="main-content" className="flex min-h-full flex-col">
            {children}
          </div>
        </ThemeProvider>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-GEEGMJ1L7R"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GEEGMJ1L7R');
          `}
        </Script>
      </body>
    </html>
  );
}
