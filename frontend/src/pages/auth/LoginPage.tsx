import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../features/auth/useAuth";
import { useTranslation } from "../../hooks/useTranslation";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useTranslation();
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
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{t("loginTitle")}</h2>
        <p className="mt-1 text-[13px] text-muted">{t("loginSubtitle")}</p>
      </div>

      {justRegistered && (
        <p className="rounded-xl bg-success/10 px-3 py-2 text-[13px] text-success">
          Account created. Log in to continue.
        </p>
      )}

      <Input
        id="email"
        label={t("email")}
        type="email"
        placeholder="admin@habesha.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />

      <Input
        id="password"
        label={t("password")}
        type="password"
        placeholder="••••••••"
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
        {submitting ? t("loading") : t("navLogin")}
      </Button>

      <p className="text-center text-[13px] text-muted">
        {t("noAccount")}{" "}
        <Link to="/register" className="font-semibold text-primary hover:underline">
          {t("navRegister")}
        </Link>
      </p>

      <div className="rounded-xl bg-surface-secondary p-3.5 text-xs text-muted border border-border">
        <p className="mb-1.5 font-semibold text-foreground">Demo Accounts (password: password123)</p>
        <p>• Admin: admin@habesha.com</p>
        <p>• Staff: staff@habesha.com</p>
        <p>• Customer: dawit@email.com</p>
      </div>
    </form>
  );
}
