import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../features/auth/useAuth";
import { landingPath } from "../paths";

export default function GuestRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={landingPath(user, from)} replace />;
  }

  return <Outlet />;
}