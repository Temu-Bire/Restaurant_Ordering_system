import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PATHS } from './paths';
import type { Role } from '../types';

interface Props {
  allowedRoles?: Role[]; // leave empty = any logged-in user
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Wait until the session is restored, or refresh would kick you out
  if (loading) return <p className="p-6">Loading...</p>;

  // Not logged in: criterion 16
  if (!user) {
    return <Navigate to={PATHS.LOGIN} replace state={{ from: location }} />;
  }

  // Wrong role: criterion 17
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={PATHS.UNAUTHORIZED} replace />;
  }

  return <Outlet />;
}