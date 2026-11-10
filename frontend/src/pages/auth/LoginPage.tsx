import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../features/auth/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const justRegistered = (location.state as { registered?: boolean } | null)
    ?.registered;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const next: typeof errors = {};
    if (!email.trim()) next.email = "Email is required";
    if (!password) next.password = "Password is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError("");
    setSubmitting(true);

    try {
      await login(email, password);
      // Success: GuestRoute redirects to the right area
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <h2 className="text-2xl font-bold">Welcome back</h2>
        <p className="mt-1 text-[13px] text-muted">Log in to continue</p>
      </div>

      {justRegistered && (
        <p className="rounded-lg bg-success/10 px-3 py-2 text-[13px] text-success">
          Account created. Log in to continue.
        </p>
      )}

      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="john@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />

      <Input
        id="password"
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />

      {formError && (
        <p role="alert" className="text-[13px] text-danger">
          {formError}
        </p>
      )}

      <Button type="submit" fullWidth disabled={submitting}>
        {submitting ? "Logging in..." : "Log in"}
      </Button>

      <p className="text-center text-[13px] text-muted">
        No account?{" "}
        <Link to="/register" className="font-semibold text-primary">
          Register
        </Link>
      </p>

      {/* TEMP: remove when the real backend is connected */}
      <div className="rounded-lg bg-surface-secondary p-3 text-xs text-muted">
        <p className="mb-1 font-semibold">Demo accounts (password: password123)</p>
        <p>Customer: john@email.com</p>
        <p>Staff: sara@restro.com</p>
        <p>Admin: admin@restro.com</p>
      </div>
    </form>
  );
}