import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const next: typeof errors = {};
    if (!email.trim()) next.email = "Email is required";
    if (!password) next.password = "Password is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // TEMP: no backend yet. Later AuthContext logs in and redirects by role.
    navigate("/staff/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <h2 className="text-2xl font-bold">Welcome back</h2>
        <p className="mt-1 text-[13px] text-muted">Log in to continue</p>
      </div>

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

      <Button type="submit" fullWidth>
        Log in
      </Button>

      <p className="text-center text-[13px] text-muted">
        No account?{" "}
        <Link to="/register" className="font-semibold text-primary">
          Register
        </Link>
      </p>
    </form>
  );
}