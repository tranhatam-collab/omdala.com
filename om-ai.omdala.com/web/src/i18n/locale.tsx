import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';

import { pickLocale, type Locale } from './pick';

export type { Locale };
export { pickLocale };
const STORAGE_KEY = 'om-ai-locale';

function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'vi';
}

/** First render: ?lang=, then the saved choice, then the browser language. */
export function detectLocale(): Locale {
  try {
    const fromQuery = new URLSearchParams(window.location.search).get('lang');
    if (isLocale(fromQuery)) return fromQuery;
  } catch {
    /* no window */
  }
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    /* storage can be blocked */
  }
  const browser = typeof navigator === 'undefined' ? '' : (navigator.language ?? '');
  return browser.toLowerCase().startsWith('vi') ? 'vi' : 'en';
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (text: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Sets <html lang> synchronously so the first paint already has the right language. */
export function applyDocumentLanguage(locale: Locale) {
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
}

export function LocaleProvider({ children, initial }: { children: ReactNode; initial?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const first = initial ?? detectLocale();
    applyDocumentLanguage(first);
    return first;
  });

  useLayoutEffect(() => {
    applyDocumentLanguage(locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    applyDocumentLanguage(next);
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* the choice just is not remembered */
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: (text: string) => pickLocale(text, locale) }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useLocale must be used inside LocaleProvider');
  return value;
}
