import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";

import { PATHS } from "../../../app/paths";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import { useLogout } from "../../../features/auth/hooks/useLogout";
import { useCart } from "../../../features/cart/hooks/useCart";
import { useTranslation } from "../../hooks/useTranslation";
import { ROLE_LABEL } from "../../types/user";
import Sidebar, { type NavItem } from "./Sidebar";
import ThemeSwitcher from "../ui/ThemeSwitcher";
import LanguageSwitcher from "../ui/LanguageSwitcher";

export default function DashboardLayout({ navItems }: { navItems: NavItem[] }) {
  const { user } = useAuth();
  const { count } = useCart();
  const logout = useLogout();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  // The only live badge is the cart count
  const items = navItems.map((item) =>
    item.to === PATHS.customer.cart ? { ...item, badge: count } : item
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur md:hidden print:hidden">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground hover:bg-surface-secondary"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-orange-500 text-xs font-bold text-white shadow-xs">
              🍽️
            </span>
            <span className="text-base font-bold tracking-tight">Arif Food</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </header>

      {/* Sidebar: Desktop Sticky + Mobile Drawer */}
      <Sidebar
        items={items}
        user={{ name: user.name, role: ROLE_LABEL[user.role] }}
        onLogout={logout}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 p-4 pb-20 md:p-6 md:pb-6 lg:p-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar for quick access */}
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed bottom-0 inset-x-0 z-30 flex h-16 items-center justify-around border-t border-border bg-surface/95 px-2 backdrop-blur md:hidden print:hidden"
      >
        {items.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-1 py-1 px-3 text-xs font-medium transition-colors ${
                isActive ? "text-primary font-bold" : "text-muted hover:text-foreground"
              }`
            }
          >
            {item.badge ? (
              <span className="absolute top-1 right-2 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {item.badge}
              </span>
            ) : null}
            <span className="truncate max-w-[64px] text-[11px]">{item.label}</span>
          </NavLink>
        ))}

        {items.length > 5 && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-[11px] font-medium text-muted hover:text-foreground"
          >
            <span>•••</span>
            <span>{t("filter")}</span>
          </button>
        )}
      </nav>
    </div>
  );
}
