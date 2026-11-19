import { Link, Outlet } from "react-router-dom";
import LanguageSwitcher from "../ui/LanguageSwitcher";
import ThemeSwitcher from "../ui/ThemeSwitcher";
import ArifLogo from "../ui/ArifLogo";
import { useTranslation } from "../../hooks/useTranslation";

export default function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-background text-foreground transition-colors selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-stone-200/80 dark:border-border bg-white/95 dark:bg-surface/95 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 transition-transform hover:scale-105">
            <ArifLogo size="sm" />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-orange-500 transition-colors"
            >
              <span>←</span>
              <span>{t("navHome")}</span>
            </Link>
            <div className="hidden sm:block h-4 w-px bg-stone-200 dark:bg-border" />
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md sm:max-w-lg">
          <div className="rounded-3xl border border-stone-200 dark:border-border bg-white dark:bg-surface p-6 sm:p-10 shadow-xl shadow-stone-200/50 dark:shadow-none">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/60 dark:border-border py-4 text-center text-xs text-muted">
        <p>© {new Date().getFullYear()} Arif Food. {t("rightsReserved")}</p>
      </footer>
    </div>
  );
}
