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

const staffNav = [
  { label: "Dashboard", to: "/staff/dashboard" },
  { label: "Orders", to: "/staff/orders" },
  { label: "Tables", to: "/staff/tables" },
];
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}