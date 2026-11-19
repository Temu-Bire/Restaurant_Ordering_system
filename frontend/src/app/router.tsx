import { createBrowserRouter, Navigate } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";
import type { NavItem } from "../components/layout/Sidebar";

import LandingPage from "../pages/LandingPage";
import NotFoundPage from "../pages/NotFoundPage";

import HomePage from "../pages/customer/HomePage";
import MenuPage from "../pages/customer/MenuPage";
import CartPage from "../pages/customer/CartPage";
import MyOrdersPage from "../pages/customer/MyOrdersPage";
import OrderTrackingPage from "../pages/customer/OrderTrackingPage";
import ReceiptPage from "../pages/customer/ReceiptPage";
import ProfilePage from "../pages/customer/ProfilePage";

import StaffDashboardPage from "../pages/staff/StaffDashboardPage";

import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import MenuManagementPage from "../pages/admin/MenuManagementPage";
import ReportsPage from "../pages/admin/ReportsPage";
import UsersPage from "../pages/admin/UsersPage";
import SettingsPage from "../pages/admin/SettingsPage";

import OrdersPage from "../pages/shared/OrdersPage";
import TablesPage from "../pages/shared/TablesPage";
import InventoryPage from "../pages/shared/InventoryPage";
import PaymentsPage from "../pages/shared/PaymentsPage";

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
  { label: "Tables", to: PATHS.staff.tables },
  { label: "Inventory", to: PATHS.staff.inventory },
  { label: "Payments", to: PATHS.staff.payments },
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
];

/* ---------- Route table ---------- */
export const router = createBrowserRouter([
  // Public
  { path: PATHS.home, element: <LandingPage /> },
  { path: PATHS.login, element: <LandingPage initialAuthMode="login" /> },
  { path: PATHS.register, element: <LandingPage initialAuthMode="register" /> },

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
              { path: PATHS.staff.tables, element: <TablesPage role="staff" /> },
              { path: PATHS.staff.inventory, element: <InventoryPage role="staff" /> },
              { path: PATHS.staff.payments, element: <PaymentsPage role="staff" /> },
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
            ],
          },
        ],
      },
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);