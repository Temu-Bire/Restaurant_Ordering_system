import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../features/auth/useAuth";
import { PATHS } from "../paths";

export default function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate to={PATHS.login} replace state={{ from: location.pathname }} />
    );
  }

  return <Outlet />;
}