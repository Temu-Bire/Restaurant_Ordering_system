import { Outlet } from "react-router-dom";
import Sidebar, { type NavItem } from "./Sidebar";

interface DashboardLayoutProps {
  navItems: NavItem[];
  user: { name: string; role: string };
}

export default function DashboardLayout({ navItems, user }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar items={navItems} user={user} />
      <main className="min-w-0 flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}