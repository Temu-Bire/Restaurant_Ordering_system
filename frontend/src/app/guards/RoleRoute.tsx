import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../features/auth/useAuth";
import type { Role } from "../../types/user";
import { HOME_BY_ROLE } from "../paths";

// Always used inside <ProtectedRoute />, so a user exists here
export default function RoleRoute({ role }: { role: Role }) {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role !== role) {
    return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
  }

  return <Outlet />;
}