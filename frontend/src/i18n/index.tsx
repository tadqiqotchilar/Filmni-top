import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { uz } from "./uz";
import { ru } from "./ru";
import type { Language } from "../api/types";

const DICTIONARIES = { uz, ru };

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof uz;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function detectDefaultLanguage(): Language {
  const tgLangCode = (window as unknown as { Telegram?: { WebApp?: { initDataUnsafe?: { user?: { language_code?: string } } } } })
    .Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  if (tgLangCode?.startsWith("ru")) return "ru";
  if (navigator.language?.startsWith("ru")) return "ru";
  return "uz";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => detectDefaultLanguage());

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, t: DICTIONARIES[lang] }),
    [lang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
