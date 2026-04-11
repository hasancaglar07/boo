'use client';

import {createContext, useContext, type ReactNode} from 'react';
import {useLocale, useTranslations} from 'next-intl';

type LangCtx = {
  lang: string;
  t: (key: string) => string;
};

const LangContext = createContext<LangCtx | null>(null);

export function LangProvider({children}: {children: ReactNode}) {
  const locale = useLocale();
  const translate = useTranslations();

  const t = (key: string): string => {
    try {
      return translate(key as never);
    } catch {
      return key;
    }
  };

  return <LangContext.Provider value={{lang: locale, t}}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
