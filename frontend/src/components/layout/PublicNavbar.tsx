import { useState } from "react";
import { Link } from "react-router-dom";

import { HOME_BY_ROLE } from "../../app/paths";
import { useAuth } from "../../features/auth/useAuth";
import { useTranslation } from "../../hooks/useTranslation";
import ThemeSwitcher from "../ThemeSwitcher";
import LanguageSwitcher from "../LanguageSwitcher";
import LinkButton from "../ui/LinkButton";

export default function PublicNavbar() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { label: t("navMenu"), href: "#menu" },
    { label: t("howItWorks"), href: "#how-it-works" },
    { label: t("orderType"), href: "#order-types" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary font-bold text-white shadow-sm">
            R
          </span>
          <span className="text-xl font-bold tracking-tight">RestroGo</span>
        </Link>

        {/* Desktop Nav */}
        <nav aria-label="Page sections" className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />

          {user ? (
            <LinkButton to={HOME_BY_ROLE[user.role]} className="hidden sm:inline-flex">
              {t("navDashboard")}
            </LinkButton>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <LinkButton to="/login" variant="outline">
                {t("navLogin")}
              </LinkButton>
              <LinkButton to="/register">
                {t("navRegister")}
              </LinkButton>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground transition-colors hover:bg-surface-secondary md:hidden"
          >
            {mobileMenuOpen ? (
              <span className="text-base font-bold">✕</span>
            ) : (
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-surface px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-secondary"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              {user ? (
                <LinkButton
                  to={HOME_BY_ROLE[user.role]}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full justify-center"
                >
                  {t("navDashboard")}
                </LinkButton>
              ) : (
                <>
                  <LinkButton
                    to="/login"
                    variant="outline"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full justify-center"
                  >
                    {t("navLogin")}
                  </LinkButton>
                  <LinkButton
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full justify-center"
                  >
                    {t("navRegister")}
                  </LinkButton>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
