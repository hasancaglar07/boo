import type {Metadata} from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';

import {LocaleHtmlAttributes} from '@/components/i18n/locale-html-attributes';
import {LangProvider} from '@/components/lang-provider';
import {
  defaultLocale,
  hasLocale,
  isRtlLocale,
  localeAlternates,
  locales,
  type AppLocale
} from '@/i18n/routing';
import {absoluteUrl, siteConfig} from '@/lib/seo';

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

const OG_LOCALE_MAP: Record<AppLocale, string> = {
  en: 'en_US',
  tr: 'tr_TR',
  de: 'de_DE',
  fr: 'fr_FR',
  es: 'es_ES',
  ar: 'ar_AR',
  ru: 'ru_RU',
  zh: 'zh_CN',
  ja: 'ja_JP',
  ko: 'ko_KR',
  it: 'it_IT',
  pt: 'pt_PT'
};

async function readLocaleMessages(locale: AppLocale) {
  return (await import(`../../../messages/${locale}.json`)).default as Record<string, unknown>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export async function generateMetadata(
  props: Omit<LocaleLayoutProps, 'children'>
): Promise<Metadata> {
  const {locale: rawLocale} = await props.params;
  const locale = hasLocale(rawLocale) ? rawLocale : defaultLocale;
  const messages = await readLocaleMessages(locale);
  const metadata = (messages.Metadata as Record<string, string> | undefined) ?? {};

  const title = metadata.defaultTitle ?? siteConfig.defaultTitle;
  const description = metadata.defaultDescription ?? siteConfig.description;
  const localeRootPath = `/${locale}`;
  const alternates = localeAlternates('/');
  const languageAlternates = Object.fromEntries(
    Object.entries(alternates).map(([key, path]) => [key, absoluteUrl(path)])
  );

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(localeRootPath),
      languages: languageAlternates
    },
    openGraph: {
      type: 'website',
      locale: OG_LOCALE_MAP[locale],
      url: absoluteUrl(localeRootPath),
      siteName: siteConfig.name,
      title,
      description,
      images: [
        {
          url: absoluteUrl(siteConfig.defaultOgImage),
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} cover image`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteUrl(siteConfig.defaultOgImage)]
    }
  };
}

export default async function LocaleLayout({children, params}: LocaleLayoutProps) {
  const {locale: rawLocale} = await params;

  if (!hasLocale(rawLocale)) {
    notFound();
  }

  setRequestLocale(rawLocale);
  const messages = await readLocaleMessages(rawLocale);
  const dir = isRtlLocale(rawLocale) ? 'rtl' : 'ltr';

  return (
    <>
      <LocaleHtmlAttributes locale={rawLocale} dir={dir} />
      <div lang={rawLocale} dir={dir} className="contents">
        <NextIntlClientProvider locale={rawLocale} messages={messages}>
          <LangProvider>{children}</LangProvider>
        </NextIntlClientProvider>
      </div>
    </>
  );
}
