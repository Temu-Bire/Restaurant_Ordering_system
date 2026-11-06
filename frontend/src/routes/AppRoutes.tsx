import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { PATHS } from './paths';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import NotFoundPage from '../pages/NotFoundPage';
import { useAuth } from '../hooks/useAuth';

// TEMPORARY placeholders: replaced by real pages in later phases
function Placeholder({ title }: { title: string }) {
  const { user, logout } = useAuth();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="my-2">
        {user?.fullName} ({user?.role})
      </p>
      <button
        onClick={logout}
        className="rounded bg-gray-800 px-3 py-1 text-white"
      >
        Logout
      </button>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path={PATHS.LOGIN} element={<LoginPage />} />
      <Route path={PATHS.REGISTER} element={<RegisterPage />} />
      <Route path={PATHS.UNAUTHORIZED} element={<UnauthorizedPage />} />

      {/* Customer only */}
      <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
        <Route
          path={PATHS.CUSTOMER_HOME}
          element={<Placeholder title="Customer: Menu" />}
        />
      </Route>

      {/* Staff and admin */}
      <Route element={<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']} />}>
        <Route
          path={PATHS.STAFF_HOME}
          element={<Placeholder title="Staff: Incoming Orders" />}
        />
      </Route>

      {/* Admin only */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route
          path={PATHS.ADMIN_HOME}
          element={<Placeholder title="Admin: Dashboard" />}
        />
      </Route>

      <Route path="/" element={<Navigate to={PATHS.LOGIN} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}