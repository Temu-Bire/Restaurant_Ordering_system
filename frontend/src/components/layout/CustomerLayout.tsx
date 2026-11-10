import { useCart } from "../../features/cart/useCart";
import DashboardLayout from "./DashboardLayout";

export default function CustomerLayout() {
  const { count } = useCart();

  const navItems = [
    { label: "Home", to: "/customer/home" },
    { label: "Menu", to: "/customer/menu" },
    { label: "My Orders", to: "/customer/orders" },
    { label: "Profile", to: "/customer/profile" },
    { label: "Cart", to: "/customer/cart", badge: count },
  ];

  return <DashboardLayout navItems={navItems} />;
}