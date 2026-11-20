import { createBrowserRouter, Navigate } from "react-router-dom";

import DashboardLayout from "../shared/components/layout/DashboardLayout";
import AuthLayout from "../shared/components/layout/AuthLayout";
import type { NavItem } from "../shared/components/layout/Sidebar";

import LandingPage from "../pages/LandingPage";
import NotFoundPage from "../pages/NotFoundPage";

import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";

import HomePage from "../features/menu/pages/HomePage";
import MenuPage from "../features/menu/pages/MenuPage";
import StaffMenuPage from "../features/menu/pages/StaffMenuPage";
import CartPage from "../features/cart/pages/CartPage";
import MyOrdersPage from "../features/orders/pages/MyOrdersPage";
import OrderTrackingPage from "../features/orders/pages/OrderTrackingPage";
import ReceiptPage from "../features/payments/pages/ReceiptPage";
import ProfilePage from "../features/users/pages/ProfilePage";

import StaffDashboardPage from "../features/reports/pages/StaffDashboardPage";

import AdminDashboardPage from "../features/reports/pages/AdminDashboardPage";
import MenuManagementPage from "../features/menu/pages/MenuManagementPage";
import ReportsPage from "../features/reports/pages/ReportsPage";
import UsersPage from "../features/users/pages/UsersPage";
import SettingsPage from "../features/settings/pages/SettingsPage";

import OrdersPage from "../features/orders/pages/OrdersPage";
import TablesPage from "../features/tables/pages/TablesPage";
import InventoryPage from "../features/inventory/pages/InventoryPage";
import PaymentsPage from "../features/payments/pages/PaymentsPage";

import GuestRoute from "./guards/GuestRoute";
import ProtectedRoute from "./guards/ProtectedRoute";
import RoleRoute from "./guards/RoleRoute";
import { PATHS } from "./paths";

/* ---------- Sidebar menus (the customer menu lives in CustomerLayout) ---------- */

const customerNav: NavItem[] = [
  { label: "Home", to: PATHS.customer.home },
  { label: "Menu", to: PATHS.customer.menu },
  { label: "My Orders", to: PATHS.customer.orders },
  { label: "Profile", to: PATHS.customer.profile },
  { label: "Cart", to: PATHS.customer.cart },
];

const staffNav: NavItem[] = [
  { label: "Dashboard", to: PATHS.staff.dashboard },
  { label: "Orders", to: PATHS.staff.orders },
  { label: "Menu & Availability", to: PATHS.staff.menu },
  { label: "Tables", to: PATHS.staff.tables },
  { label: "Inventory", to: PATHS.staff.inventory },
  { label: "Payments", to: PATHS.staff.payments },
  { label: "Profile", to: PATHS.staff.profile },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", to: PATHS.admin.dashboard },
  { label: "Orders", to: PATHS.admin.orders },
  { label: "Menu", to: PATHS.admin.menu },
  { label: "Tables", to: PATHS.admin.tables },
  { label: "Inventory", to: PATHS.admin.inventory },
  { label: "Payments", to: PATHS.admin.payments },
  { label: "Reports", to: PATHS.admin.reports },
  { label: "Users", to: PATHS.admin.users },
  { label: "Settings", to: PATHS.admin.settings },
  { label: "Profile", to: PATHS.admin.profile },
];

/* ---------- Route table ---------- */
export const router = createBrowserRouter([
  // Public
  { path: PATHS.home, element: <LandingPage /> },

  // Full-page authentication flow (for guests)
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: PATHS.login, element: <LoginPage /> },
          { path: PATHS.register, element: <RegisterPage /> },
        ],
      },
    ],
  },

  // Everything below requires login, then the right role
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute role="customer" />,
        children: [
          {
            path: PATHS.customer.root,
            element: <DashboardLayout navItems={customerNav} />,
            children: [
              { index: true, element: <Navigate to={PATHS.customer.home} replace /> },
              { path: PATHS.customer.home, element: <HomePage /> },
              { path: PATHS.customer.menu, element: <MenuPage /> },
              { path: PATHS.customer.cart, element: <CartPage /> },
              { path: PATHS.customer.orders, element: <MyOrdersPage /> },
              { path: PATHS.customer.track, element: <OrderTrackingPage /> },
              { path: PATHS.customer.receipt, element: <ReceiptPage /> },
              { path: PATHS.customer.profile, element: <ProfilePage /> },
            ],
          },
        ],
      },

      {
        element: <RoleRoute role="staff" />,
        children: [
          {
            path: PATHS.staff.root,
            element: <DashboardLayout navItems={staffNav} />,
            children: [
              { index: true, element: <Navigate to={PATHS.staff.dashboard} replace /> },
              { path: PATHS.staff.dashboard, element: <StaffDashboardPage /> },
              { path: PATHS.staff.orders, element: <OrdersPage role="staff" /> },
              { path: PATHS.staff.menu, element: <StaffMenuPage /> },
              { path: PATHS.staff.tables, element: <TablesPage role="staff" /> },
              { path: PATHS.staff.inventory, element: <InventoryPage role="staff" /> },
              { path: PATHS.staff.payments, element: <PaymentsPage role="staff" /> },
              { path: PATHS.staff.profile, element: <ProfilePage /> },
            ],
          },
        ],
      },

      {
        element: <RoleRoute role="admin" />,
        children: [
          {
            path: PATHS.admin.root,
            element: <DashboardLayout navItems={adminNav} />,
            children: [
              { index: true, element: <Navigate to={PATHS.admin.dashboard} replace /> },
              { path: PATHS.admin.dashboard, element: <AdminDashboardPage /> },
              { path: PATHS.admin.orders, element: <OrdersPage role="admin" /> },
              { path: PATHS.admin.menu, element: <MenuManagementPage /> },
              { path: PATHS.admin.tables, element: <TablesPage role="admin" /> },
              { path: PATHS.admin.inventory, element: <InventoryPage role="admin" /> },
              { path: PATHS.admin.payments, element: <PaymentsPage role="admin" /> },
              { path: PATHS.admin.reports, element: <ReportsPage /> },
              { path: PATHS.admin.users, element: <UsersPage /> },
              { path: PATHS.admin.settings, element: <SettingsPage /> },
              { path: PATHS.admin.profile, element: <ProfilePage /> },
            ],
          },
        ],
      },
    ],
  },

  // Fallback 404
  { path: "*", element: <NotFoundPage /> },
]);
