import { Globe } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, toggleLanguage } = useTranslation();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={`Switch language to ${language === "en" ? "Amharic" : "English"}`}
      title={language === "en" ? "ቀይር ወደ አማርኛ (Switch to Amharic)" : "Switch to English"}
      className={`inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 text-xs font-semibold text-foreground shadow-xs transition-all hover:bg-surface-secondary hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 ${className}`}
    >
      <Globe className="size-3.5 text-muted" />
      <span className="font-bold tracking-wide">
        {language === "en" ? "EN" : "አማ"}
      </span>
      <span className="text-[10px] text-muted">
        {language === "en" ? "→ አማ" : "→ EN"}
      </span>
    </button>
  );
}
