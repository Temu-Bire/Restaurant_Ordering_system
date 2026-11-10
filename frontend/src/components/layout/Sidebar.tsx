import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";

export interface NavItem {
  label: string;
  to: string;
  badge?: number;
}

interface SidebarProps {
  items: NavItem[];
  user: { name: string; role: string };
  onLogout: () => void;
}

export default function Sidebar({ items, user, onLogout }: SidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface p-4 md:sticky md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-r">
      <div className="mb-4 flex items-center gap-2.5 px-2 md:mb-8">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary font-bold text-white">
          R
        </div>
        <span className="text-xl font-bold">RestroGo</span>
      </div>

      <nav
        aria-label="Main navigation"
        className="flex gap-1.5 overflow-x-auto md:flex-1 md:flex-col"
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-foreground hover:bg-surface-secondary"
              )
            }
          >
            {item.label}
            {item.badge ? (
              <span className="rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">
                {item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}

        <button
          onClick={onLogout}
          className="whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10 md:hidden"
        >
          Log out
        </button>
      </nav>

      <div className="mt-4 hidden items-center gap-3 border-t border-border px-2 pt-4 md:flex">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
          {user.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold leading-tight">{user.name}</p>
          <p className="text-xs text-muted">{user.role}</p>
        </div>
        <button
          onClick={onLogout}
          className="text-xs text-muted transition-colors hover:text-danger"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}