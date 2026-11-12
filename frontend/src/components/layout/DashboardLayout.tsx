import { Outlet } from "react-router-dom";

import { PATHS } from "../../app/paths";
import { useAuth } from "../../features/auth/useAuth";
import { useLogout } from "../../features/auth/useLogout";
import { useCart } from "../../features/cart/useCart";
import { ROLE_LABEL } from "../../types/user";
import Sidebar, { type NavItem } from "./Sidebar";

export default function DashboardLayout({ navItems }: { navItems: NavItem[] }) {
  const { user } = useAuth();
  const { count } = useCart();
  const logout = useLogout();

  if (!user) return null; // the route guards make this unreachable

  // The only live badge is the cart count
  const items = navItems.map((item) =>
    item.to === PATHS.customer.cart ? { ...item, badge: count } : item
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        items={items}
        user={{ name: user.name, role: ROLE_LABEL[user.role] }}
        onLogout={logout}
      />
      <main className="min-w-0 flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}