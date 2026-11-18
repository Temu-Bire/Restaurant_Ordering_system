import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { translations, type Language, type TranslationKey } from "../i18n/translations";

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, fallback?: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "restrogo-lang";

function getInitialLanguage(): Language {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "am" || saved === "en" ? saved : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.setAttribute("lang", language);
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "am" : "en"));
  };

  const t = (key: TranslationKey, fallback?: string): string => {
    const dict = translations[language];
    if (dict && key in dict) {
      return dict[key];
    }
    // Fallback to English, then provided fallback, then key itself
    return translations.en[key] ?? fallback ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
