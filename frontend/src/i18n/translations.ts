import en from "./locales/en.json";
import am from "./locales/am.json";

export type Language = "en" | "am";

export const translations = {
  en,
  am,
} as const;

export type TranslationKey = keyof typeof translations.en;
