import { Link } from "react-router-dom";

import { HOME_BY_ROLE } from "../app/paths";
import { useAuth } from "../features/auth/useAuth";

export default function NotFoundPage() {
  const { user } = useAuth();
  const home = user ? HOME_BY_ROLE[user.role] : "/login";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-6xl font-extrabold text-primary">404</p>
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="text-[13px] text-muted">
        The page you're looking for doesn't exist or was moved.
      </p>
      <Link
        to={home}
        className="mt-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        {user ? "Back to my dashboard" : "Go to login"}
      </Link>
    </main>
  );
}