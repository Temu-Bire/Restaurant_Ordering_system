import { Link, Outlet } from "react-router-dom";
import LanguageSwitcher from "../LanguageSwitcher";
import ThemeSwitcher from "../ThemeSwitcher";
import { useTranslation } from "../../hooks/useTranslation";

export default function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen">
      {/* Left: image panel (hidden on mobile and tablet) */}
      <div
        className="hidden w-1/2 flex-col justify-between bg-primary bg-cover bg-center p-12 text-white lg:flex"
        style={{
          backgroundImage:
            "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.25)), url('/image.png')",
        }}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-white font-bold text-orange-500 shadow-sm">
            🍽️
          </div>
          <span className="text-2xl font-bold tracking-tight">Arif Food</span>
        </Link>

        <div>
          <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 text-sm text-white/90">
            {t("brandTagline")}
          </p>
        </div>

        <div />
      </div>

      {/* Right: form area */}
      <div className="relative flex flex-1 flex-col justify-between p-4 sm:p-6 md:p-8">
        {/* Top header with Language & Theme Switcher */}
        <div className="flex items-center justify-between pb-4">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-bold text-white text-xs">
              R
            </span>
            <span className="text-lg font-bold">Arif Food</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 items-center justify-center py-4">
          <div className="w-full rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            <Outlet />
          </div>
        </div>

        <div className="text-center text-xs text-muted pt-2">
          © {new Date().getFullYear()} Arif Food. {t("rightsReserved")}
        </div>
      </div>
    </div>
  );
}
