import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

import Button from "../../../shared/components/ui/Button";
import Input from "../../../shared/components/ui/Input";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../../../shared/hooks/useTranslation";
import { landingPath } from "../../../app/paths";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const justRegistered = (location.state as { registered?: boolean } | null)?.registered;
  const redirectTarget = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

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
      const loggedUser = await login(email, password);
      if (redirectTarget) {
        navigate(redirectTarget, { replace: true });
      } else {
        navigate(landingPath(loggedUser), { replace: true });
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Invalid email or password");
      setSubmitting(false);
    }
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("password123");
    setFormError("");
    setErrors({});
  }

  return (
    <div className="w-full space-y-5">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{t("loginTitle")}</h2>
        <p className="mt-1 text-xs sm:text-sm text-muted">Sign in to your Arif Food account to continue</p>
      </div>

      {justRegistered && (
        <p className="flex items-center gap-2 rounded-xl bg-success/10 px-3.5 py-2.5 text-xs text-success border border-success/20">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Account created successfully. Log in to continue.</span>
        </p>
      )}

      {showForgotPassword ? (
        <div className="space-y-4 animate-in fade-in">
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 text-xs text-muted leading-relaxed">
            <p className="font-bold text-foreground mb-1">Password Recovery</p>
            Enter your account email address and we'll send you a link to reset your password.
          </div>

          {forgotSent ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-green-500/10 p-4 text-xs text-green-600 dark:text-green-400 border border-green-500/20 text-center">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>Reset instructions have been sent to <strong>{forgotEmail}</strong>.</span>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (forgotEmail.trim()) setForgotSent(true);
              }}
              className="space-y-4"
            >
              <Input
                id="forgot-email"
                label={t("email")}
                type="email"
                placeholder="e.g. dawit@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
              <Button
                type="submit"
                fullWidth
                className="rounded-full bg-orange-500 hover:bg-orange-600 py-3 font-bold"
              >
                Send Reset Link
              </Button>
            </form>
          )}

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="text-xs font-bold text-orange-500 hover:underline"
            >
              ← Back to Log In
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            id="email"
            label={t("email")}
            type="email"
            placeholder="admin@habesha.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />

          <div>
            <Input
              id="password"
              label={t("password")}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="focus:outline-none hover:text-orange-500 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="size-4 text-muted hover:text-orange-500 transition-colors" />
                  ) : (
                    <Eye className="size-4 text-muted hover:text-orange-500 transition-colors" />
                  )}
                </button>
              }
            />

            <div className="flex justify-end mt-1.5">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs font-semibold text-orange-500 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {formError && (
            <p role="alert" className="text-xs text-danger">
              {formError}
            </p>
          )}

          <Button type="submit" fullWidth disabled={submitting} className="rounded-full bg-orange-500 hover:bg-orange-600 py-3 font-bold text-sm">
            {submitting ? t("loading") : t("navLogin")}
          </Button>

          {/* Demo Accounts */}
          <div className="rounded-2xl bg-surface-secondary p-3.5 text-xs text-muted border border-border">
            <p className="mb-2 font-bold text-foreground">Demo Accounts (1-click fill):</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillDemo("admin@habesha.com")}
                className="rounded-lg border border-border bg-surface px-3 py-1 font-semibold text-foreground hover:border-orange-500 hover:text-orange-500 transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo("staff@habesha.com")}
                className="rounded-lg border border-border bg-surface px-3 py-1 font-semibold text-foreground hover:border-orange-500 hover:text-orange-500 transition-colors"
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => fillDemo("dawit@email.com")}
                className="rounded-lg border border-border bg-surface px-3 py-1 font-semibold text-foreground hover:border-orange-500 hover:text-orange-500 transition-colors"
              >
                Customer
              </button>
            </div>
          </div>

          {/* Bottom link to Register */}
          <p className="text-center text-xs text-muted pt-2 border-t border-border">
            {t("noAccount")}{" "}
            <Link to="/register" className="font-bold text-orange-500 hover:underline ml-1">
              {t("navRegister")}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
