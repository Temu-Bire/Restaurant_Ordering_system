import { useNavigate } from "react-router-dom";

import { useCart } from "../cart/useCart";
import { useAuth } from "./useAuth";

export function useLogout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { clear } = useCart();

  return () => {
    clear();
    logout();
    navigate("/login", { replace: true });
  };
}