import { Link } from 'react-router-dom';
import { PATHS } from '../routes/paths';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <h1 className="text-3xl font-bold">404: Page not found</h1>
      <Link to={PATHS.LOGIN} className="text-blue-600 underline">
        Go to login
      </Link>
    </div>
  );
}