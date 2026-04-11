import {defineRouting} from 'next-intl/routing';

export const locales = [
  'en',
  'tr',
  'de',
  'fr',
  'es',
  'ar',
  'ru',
  'zh',
  'ja',
  'ko',
  'it',
  'pt'
] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'en';

export const rtlLocales = ['ar'] as const;

const COUNTRY_LOCALE_MAP: Partial<Record<string, AppLocale>> = {
  TR: 'tr',
  DE: 'de',
  FR: 'fr',
  ES: 'es',
  AR: 'ar',
  SA: 'ar',
  AE: 'ar',
  EG: 'ar',
  RU: 'ru',
  CN: 'zh',
  TW: 'zh',
  HK: 'zh',
  JP: 'ja',
  KR: 'ko',
  IT: 'it',
  PT: 'pt',
  BR: 'pt',
  US: 'en',
  GB: 'en',
  CA: 'en',
  AU: 'en'
};

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
  localeCookie: {
    name: 'NEXT_LOCALE',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365
  }
});

export function hasLocale(value: string | undefined | null): value is AppLocale {
  if (!value) return false;
  return (locales as readonly string[]).includes(value);
}

export function localeFromCountry(country: string | null | undefined): AppLocale | null {
  if (!country) return null;
  const normalized = country.trim().toUpperCase();
  return COUNTRY_LOCALE_MAP[normalized] ?? null;
}

export function isRtlLocale(locale: string): boolean {
  return (rtlLocales as readonly string[]).includes(locale);
}

export function localePath(pathname: string, locale: AppLocale): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (path === '/') return `/${locale}`;
  return `/${locale}${path}`;
}

export function localeAlternates(pathname: string): Record<string, string> {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const normalized = path === '/' ? '' : path;

  const map: Record<string, string> = {
    'x-default': localePath(path, defaultLocale)
  };

  for (const locale of locales) {
    map[locale] = `/${locale}${normalized}`;
  }

  return map;
}
