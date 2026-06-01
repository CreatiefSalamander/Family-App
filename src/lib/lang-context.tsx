'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { type Lang, getTranslations, type Translations, LANG_LABELS } from './translations';

interface LangContextValue {
  lang: Lang;
  t: Translations;
  dir: 'ltr' | 'rtl';
}

const LangContext = createContext<LangContextValue>({
  lang: 'nl',
  t: getTranslations('nl'),
  dir: 'ltr',
});

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const t   = getTranslations(lang);
  const dir = LANG_LABELS[lang]?.dir ?? 'ltr';

  return (
    <LangContext.Provider value={{ lang, t, dir }}>
      <div dir={dir} style={{ minHeight: '100%' }}>
        {children}
      </div>
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  return useContext(LangContext);
}
