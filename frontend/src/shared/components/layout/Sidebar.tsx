import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  ShoppingCart,
  UserCircle,
  Table,
  Boxes,
  CreditCard,
  BarChart3,
  Users,
  Settings,
  Home,
  LogOut,
  X,
  Star,
} from "lucide-react";
import { cn } from "../../../lib/cn";
import { useTranslation } from "../../hooks/useTranslation";
import { resolveAvatarUrl } from "../../utils/resolveAvatarUrl";
import type { TranslationKey } from "../../../i18n/translations";

export interface NavItem {
  label: string;
  to: string;
  badge?: number;
}

interface SidebarProps {
  items: NavItem[];
  user: { name: string; role: string; avatarUrl?: string | null };
  onLogout: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const navTranslationMap: Record<string, TranslationKey> = {
  Home: "navHome",
  Menu: "navMenu",
  Orders: "navOrders",
  "My Orders": "navMyOrders",
  Cart: "navCart",
  Profile: "navProfile",
  Dashboard: "navDashboard",
  Tables: "navTables",
  Inventory: "navInventory",
  Payments: "navPayments",
  Reports: "navReports",
  Users: "navUsers",
  Settings: "navSettings",
  Reviews: "navReviews",
  "Menu & Availability": "navMenuAvailability",
};

const navIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Menu: UtensilsCrossed,
  "Menu & Availability": UtensilsCrossed,
  Orders: ShoppingBag,
  "My Orders": ShoppingBag,
  Cart: ShoppingCart,
  Profile: UserCircle,
  Dashboard: LayoutDashboard,
  Tables: Table,
  Inventory: Boxes,
  Payments: CreditCard,
  Reports: BarChart3,
  Reviews: Star,
  Users,
  Settings,
};

export default function Sidebar({
  items,
  user,
  onLogout,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const { t } = useTranslation();
  const avatarSrc = resolveAvatarUrl(user.avatarUrl);

  const getTranslatedLabel = (label: string) => {
    const key = navTranslationMap[label];
    return key ? t(key) : label;
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Header / Brand */}
        <div className="mb-6 flex items-center justify-between px-2 pt-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500 font-bold text-white shadow-sm">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                <line x1="6" y1="17" x2="18" y2="17" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Arif Food</span>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-secondary hover:text-foreground md:hidden"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        {/* Navigation links */}
        <nav aria-label="Main navigation" className="space-y-1">
          {items.map((item) => {
            const Icon = navIconMap[item.label] ?? LayoutDashboard;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-white shadow-xs font-semibold"
                      : "text-foreground hover:bg-surface-secondary"
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-4 shrink-0" />
                  <span>{getTranslatedLabel(item.label)}</span>
                </div>
                {typeof item.badge === "number" && item.badge > 0 ? (
                  <span className="flex size-5 items-center justify-center rounded-full bg-danger text-[11px] font-bold text-white shadow-xs">
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User profile card & Logout */}
      <div className="border-t border-border px-2 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-xs font-bold text-primary overflow-hidden border border-border/50">
            {avatarSrc ? (
              <img src={avatarSrc} alt={user.name} className="size-full object-cover" />
            ) : (
              user.name.charAt(0)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold leading-tight text-foreground">{user.name}</p>
            <p className="text-xs text-muted">{user.role}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
          >
            <LogOut className="size-3.5" />
            <span>{t("navLogout")}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface p-4 md:sticky md:top-0 md:flex md:h-screen md:flex-col lg:w-64 print:hidden">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="h-full w-72 max-w-[85vw] border-r border-border bg-surface p-5 shadow-2xl transition-transform animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
