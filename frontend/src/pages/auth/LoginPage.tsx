import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { homeByRole, PATHS } from '../../routes/paths';
import { getErrorMessage } from '../../utils/getErrorMessage';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const justRegistered = location.state?.registered === true;

  // Already logged in? Go to your home page
  if (!loading && user) {
    return <Navigate to={homeByRole[user.role]} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedIn = await login({ email, password });
      navigate(homeByRole[loggedIn.role], { replace: true }); // criterion 14
    } catch (err) {
      setError(getErrorMessage(err)); // criterion 15
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow"
      >
        <h1 className="text-2xl font-bold">Login</h1>

        {justRegistered && (
          <p className="rounded bg-green-100 p-2 text-sm text-green-700">
            Account created. Please log in.
          </p>
        )}
        {error && (
          <p className="rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-600 py-2 text-white disabled:opacity-50"
        >
          {submitting ? 'Logging in...' : 'Login'}
        </button>

        <p className="text-center text-sm">
          No account?{' '}
          <Link to={PATHS.REGISTER} className="text-blue-600 underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}