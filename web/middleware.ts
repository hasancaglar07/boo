import createMiddleware from 'next-intl/middleware';
import {match as localeMatch} from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import {NextRequest, NextResponse} from 'next/server';

import {
  defaultLocale,
  hasLocale,
  localeFromCountry,
  locales,
  localePath,
  routing,
  type AppLocale
} from '@/i18n/routing';

const handleI18nRouting = createMiddleware(routing);

function getAcceptLanguageLocale(request: NextRequest): AppLocale | null {
  const header = request.headers.get('accept-language');
  if (!header) return null;

  const negotiator = new Negotiator({
    headers: {
      'accept-language': header
    }
  });

  const languages = negotiator.languages();
  const matched = localeMatch(languages, [...locales], defaultLocale);
  return hasLocale(matched) ? matched : null;
}

function getGeoLocale(request: NextRequest): AppLocale | null {
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country');

  return localeFromCountry(country);
}

function getCookieLocale(request: NextRequest): AppLocale | null {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  return hasLocale(cookieLocale) ? cookieLocale : null;
}

function hasLocalePrefix(pathname: string): boolean {
  return locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
}

function detectLocale(request: NextRequest): AppLocale {
  const cookieLocale = getCookieLocale(request);
  if (cookieLocale) return cookieLocale;

  return (
    getAcceptLanguageLocale(request) ||
    getGeoLocale(request) ||
    defaultLocale
  );
}

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!hasLocalePrefix(pathname)) {
    const locale = detectLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = localePath(pathname, locale);

    const response = NextResponse.redirect(url);
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax'
    });

    return response;
  }

  const response = handleI18nRouting(request);
  const prefixLocale = pathname.split('/')[1];
  if (hasLocale(prefixLocale)) {
    response.cookies.set('NEXT_LOCALE', prefixLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax'
    });
  }
  return response;
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
