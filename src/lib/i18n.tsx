import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { L10n, Lang } from '../data/projects';

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (s: L10n) => string };
const I18n = createContext<Ctx>({ lang: 'es', setLang: () => {}, t: (s) => s.es });

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('gl-lang');
    if (saved === 'es' || saved === 'en') return saved;
  } catch {
    /* sin almacenamiento: se usa el idioma del navegador */
  }
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('gl-lang', l);
    } catch {
      /* no pasa nada si no se puede guardar */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo<Ctx>(() => ({ lang, setLang, t: (s) => s[lang] }), [lang, setLang]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

export const useI18n = () => useContext(I18n);
