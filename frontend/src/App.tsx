import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AuthLayout from "./components/layout/AuthLayout";
import CustomerLayout from "./components/layout/CustomerLayout";
import DashboardLayout from "./components/layout/DashboardLayout";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

import HomePage from "./pages/customer/HomePage";
import MenuPage from "./pages/customer/MenuPage";
import CartPage from "./pages/customer/CartPage";
import MyOrdersPage from "./pages/customer/MyOrdersPage";
import OrderTrackingPage from "./pages/customer/OrderTrackingPage";
import ReceiptPage from "./pages/customer/ReceiptPage";
import ProfilePage from "./pages/customer/ProfilePage";

import StaffDashboardPage from "./pages/staff/StaffDashboardPage";
import OrdersPage from "./pages/shared/OrdersPage";
import TablesPage from "./pages/shared/TablesPage";

import InventoryPage from "./pages/shared/InventoryPage";
import PaymentsPage from "./pages/shared/PaymentsPage";

import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import MenuManagementPage from "./pages/admin/MenuManagementPage";
import ReportsPage from "./pages/admin/ReportsPage";
import UsersPage from "./pages/admin/UsersPage";
import SettingsPage from "./pages/admin/SettingsPage";

const staffNav = [
  { label: "Dashboard", to: "/staff/dashboard" },
  { label: "Orders", to: "/staff/orders" },
  { label: "Tables", to: "/staff/tables" },
  { label: "Inventory", to: "/staff/inventory" },
  { label: "Payments", to: "/staff/payments" },
];

const adminNav = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Orders", to: "/admin/orders" },
  { label: "Menu", to: "/admin/menu" },
  { label: "Tables", to: "/admin/tables" },
  { label: "Inventory", to: "/admin/inventory" },
  { label: "Payments", to: "/admin/payments" },
  { label: "Reports", to: "/admin/reports" },
  { label: "Users", to: "/admin/users" },
  { label: "Settings", to: "/admin/settings" },
];
const adminUser = { name: "Admin", role: "Administrator" };

const staffUser = { name: "Sara T.", role: "Waiter / Staff" };

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route path="/customer" element={<CustomerLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="orders" element={<MyOrdersPage />} />
          <Route path="orders/:id/track" element={<OrderTrackingPage />} />
          <Route path="orders/:id/receipt" element={<ReceiptPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="/staff" element={<DashboardLayout navItems={staffNav} user={staffUser} />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StaffDashboardPage />} />
          <Route path="orders" element={<OrdersPage role="staff" />} />
          <Route path="tables" element={<TablesPage role="staff" />} />
          <Route path="inventory" element={<InventoryPage role="staff" />} />
          <Route path="payments" element={<PaymentsPage role="staff" />} />
        </Route>

        <Route path="/admin" element={<DashboardLayout navItems={adminNav} user={adminUser} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="orders" element={<OrdersPage role="admin" />} />
            <Route path="menu" element={<MenuManagementPage />} />
            <Route path="tables" element={<TablesPage role="admin" />} />
            <Route path="inventory" element={<InventoryPage role="admin" />} />
            <Route path="payments" element={<PaymentsPage role="admin" />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}