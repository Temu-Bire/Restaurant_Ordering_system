import { lazy, Suspense } from "react";
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
import CartPage from "../features/cart/pages/CartPage";
import ProfilePage from "../features/users/pages/ProfilePage";

// Lazy-loaded customer secondary flows
const MyOrdersPage = lazy(() => import("../features/orders/pages/MyOrdersPage"));
const OrderTrackingPage = lazy(() => import("../features/orders/pages/OrderTrackingPage"));
const ReceiptPage = lazy(() => import("../features/payments/pages/ReceiptPage"));
const ChapaCheckoutPage = lazy(() => import("../features/payments/pages/ChapaCheckoutPage"));

// Lazy-loaded staff pages
const StaffDashboardPage = lazy(() => import("../features/reports/pages/StaffDashboardPage"));
const StaffMenuPage = lazy(() => import("../features/menu/pages/StaffMenuPage"));

// Lazy-loaded admin pages
const AdminDashboardPage = lazy(() => import("../features/reports/pages/AdminDashboardPage"));
const MenuManagementPage = lazy(() => import("../features/menu/pages/MenuManagementPage"));
const AdminReviewsPage = lazy(() => import("../features/reviews/pages/AdminReviewsPage"));
const ReportsPage = lazy(() => import("../features/reports/pages/ReportsPage"));
const UsersPage = lazy(() => import("../features/users/pages/UsersPage"));
const SettingsPage = lazy(() => import("../features/settings/pages/SettingsPage"));

// Lazy-loaded shared operational pages
const OrdersPage = lazy(() => import("../features/orders/pages/OrdersPage"));
const TablesPage = lazy(() => import("../features/tables/pages/TablesPage"));
const InventoryPage = lazy(() => import("../features/inventory/pages/InventoryPage"));
const PaymentsPage = lazy(() => import("../features/payments/pages/PaymentsPage"));

import GuestRoute from "./guards/GuestRoute";
import ProtectedRoute from "./guards/ProtectedRoute";
import RoleRoute from "./guards/RoleRoute";
import { PATHS } from "./paths";

function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center p-8">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

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
  { label: "Reviews", to: PATHS.admin.reviews },
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
      { path: "/chapa-checkout/:txRef", element: <LazyRoute><ChapaCheckoutPage /></LazyRoute> },
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
              { path: PATHS.customer.orders, element: <LazyRoute><MyOrdersPage /></LazyRoute> },
              { path: PATHS.customer.track, element: <LazyRoute><OrderTrackingPage /></LazyRoute> },
              { path: PATHS.customer.receipt, element: <LazyRoute><ReceiptPage /></LazyRoute> },
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
              { path: PATHS.staff.dashboard, element: <LazyRoute><StaffDashboardPage /></LazyRoute> },
              { path: PATHS.staff.orders, element: <LazyRoute><OrdersPage role="staff" /></LazyRoute> },
              { path: PATHS.staff.menu, element: <LazyRoute><StaffMenuPage /></LazyRoute> },
              { path: PATHS.staff.tables, element: <LazyRoute><TablesPage role="staff" /></LazyRoute> },
              { path: PATHS.staff.inventory, element: <LazyRoute><InventoryPage role="staff" /></LazyRoute> },
              { path: PATHS.staff.payments, element: <LazyRoute><PaymentsPage role="staff" /></LazyRoute> },
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
              { path: PATHS.admin.dashboard, element: <LazyRoute><AdminDashboardPage /></LazyRoute> },
              { path: PATHS.admin.orders, element: <LazyRoute><OrdersPage role="admin" /></LazyRoute> },
              { path: PATHS.admin.menu, element: <LazyRoute><MenuManagementPage /></LazyRoute> },
              { path: PATHS.admin.reviews, element: <LazyRoute><AdminReviewsPage /></LazyRoute> },
              { path: PATHS.admin.tables, element: <LazyRoute><TablesPage role="admin" /></LazyRoute> },
              { path: PATHS.admin.inventory, element: <LazyRoute><InventoryPage role="admin" /></LazyRoute> },
              { path: PATHS.admin.payments, element: <LazyRoute><PaymentsPage role="admin" /></LazyRoute> },
              { path: PATHS.admin.reports, element: <LazyRoute><ReportsPage /></LazyRoute> },
              { path: PATHS.admin.users, element: <LazyRoute><UsersPage /></LazyRoute> },
              { path: PATHS.admin.settings, element: <LazyRoute><SettingsPage /></LazyRoute> },
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
