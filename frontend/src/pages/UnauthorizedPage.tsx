import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { homeByRole, PATHS } from '../routes/paths';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <h1 className="text-3xl font-bold">403: Access denied</h1>
      <p>You don't have permission to view this page.</p>
      <Link
        to={user ? homeByRole[user.role] : PATHS.LOGIN}
        className="text-blue-600 underline"
      >
        Go back
      </Link>
    </div>
  );
}