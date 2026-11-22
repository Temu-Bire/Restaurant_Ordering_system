import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sun, Moon, ShoppingCart, Menu, X } from "lucide-react";
import { HOME_BY_ROLE } from "../../../app/paths";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import { useCart } from "../../../features/cart/hooks/useCart";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../hooks/useTranslation";
import ArifLogo from "../ui/ArifLogo";
import LanguageSwitcher from "../ui/LanguageSwitcher";

interface PublicNavbarProps {
  onOpenAuth?: (mode: "login" | "register", redirectTo?: string) => void;
}

export default function PublicNavbar({ onOpenAuth }: PublicNavbarProps) {
  const { user } = useAuth();
  const { count } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const isLanding = location.pathname === "/";

  const links = [
    { id: "home", label: t("navHome"), href: isLanding ? "#" : "/" },
    { id: "menu", label: t("navMenu"), href: "#menu" },
    { id: "about", label: t("aboutUs"), href: "#about" },
    { id: "how-it-works", label: t("howItWorks"), href: "#how-it-works" },
  ];

  // Track active section on scroll
  useEffect(() => {
    if (!isLanding) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      const sections = ["home", "menu", "about", "how-it-works"];

      for (const section of sections) {
        if (section === "home" && scrollPosition < 400) {
          setActiveSection("home");
          break;
        }
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLanding]);

  const handleAuthClick = (mode: "login" | "register") => {
    if (onOpenAuth) {
      onOpenAuth(mode);
    } else {
      navigate(mode === "login" ? "/login" : "/register");
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-orange-950/40 bg-[#111318]/95 text-white backdrop-blur-md transition-colors shadow-sm">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand Logo */}
        <ArifLogo size="md" variant="light" />

        {/* Desktop Nav Links */}
        <nav aria-label="Page navigation" className="hidden items-center gap-7 md:flex">
          {links.map((l) => {
            const isActive = activeSection === l.id;
            return (
              <a
                key={l.id}
                href={l.href}
                className={`text-sm font-medium transition-all duration-200 relative py-1 ${
                  isActive
                    ? "text-orange-400 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-orange-500 after:rounded-full"
                    : "text-stone-300 hover:text-orange-400"
                }`}
              >
                {l.label}
              </a>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <LanguageSwitcher />

          {/* Theme switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark/light mode"
            className="flex size-9 items-center justify-center rounded-full bg-white/10 text-stone-200 transition-colors hover:bg-white/20 hover:text-white"
          >
            {theme === "dark" ? (
              <Sun className="size-4.5 text-amber-400" />
            ) : (
              <Moon className="size-4.5 text-stone-300" />
            )}
          </button>

          {/* Cart Pill Button */}
          <button
            type="button"
            onClick={() => {
              if (user) {
                navigate("/customer/cart");
              } else if (onOpenAuth) {
                onOpenAuth("login", "/customer/cart");
              } else {
                navigate("/login", { state: { from: "/customer/cart" } });
              }
            }}
            className="flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-orange-600 active:scale-95"
          >
            <ShoppingCart className="size-4" />
            <span>{t("navCart")} ({count})</span>
          </button>

          {/* User Logged in / Guest Auth Buttons */}
          {user ? (
            <Link
              to={HOME_BY_ROLE[user.role]}
              className="hidden sm:inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/20"
            >
              {t("navDashboard")}
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAuthClick("login")}
                className="rounded-full border border-white/25 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-stone-200 transition-colors hover:border-white hover:bg-white/15 hover:text-white"
              >
                {t("navLogin")}
              </button>
              <button
                type="button"
                onClick={() => handleAuthClick("register")}
                className="rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-95"
              >
                {t("startOrdering")}
              </button>
            </div>
          )}

          {/* Mobile hamburger menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="flex size-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-stone-200 transition-colors hover:bg-white/20 md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-orange-950/40 bg-[#111318] px-4 py-4 md:hidden animate-in fade-in duration-200">
          <nav className="flex flex-col gap-2.5">
            {links.map((l) => (
              <a
                key={l.id}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  activeSection === l.id
                    ? "bg-orange-500/15 text-orange-400 font-bold"
                    : "text-stone-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                {l.label}
              </a>
            ))}

            <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
              {user ? (
                <Link
                  to={HOME_BY_ROLE[user.role]}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-full bg-orange-500 py-2.5 text-xs font-bold text-white shadow-sm"
                >
                  {t("navDashboard")}
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleAuthClick("login")}
                    className="w-full rounded-full border border-white/20 bg-white/5 py-2.5 text-xs font-bold text-white hover:bg-white/10"
                  >
                    {t("navLogin")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAuthClick("register")}
                    className="w-full rounded-full bg-orange-500 py-2.5 text-xs font-bold text-white hover:bg-orange-600 shadow-sm"
                  >
                    {t("startOrdering")}
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
