import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";
import { useTranslation } from "../../hooks/useTranslation";
import { HOME_BY_ROLE } from "../../app/paths";
import ArifLogo from "../ui/ArifLogo";
import Button from "../ui/Button";
import Input from "../ui/Input";

export type AuthMode = "login" | "register";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: AuthMode;
  redirectTo?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({
  isOpen,
  initialMode = "login",
  redirectTo,
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const { login, register } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password dialog state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});

  // Register form state
  const [regFullName, setRegFullName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [regErrors, setRegErrors] = useState<{
    fullName?: string;
    phone?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sync mode when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setFormError("");
      setSuccessMsg("");
      setShowForgotPassword(false);
      setForgotSent(false);
      setLoginErrors({});
      setRegErrors({});
    }
  }, [isOpen, initialMode]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: typeof loginErrors = {};
    if (!loginEmail.trim()) nextErrors.email = "Email is required";
    if (!loginPassword) nextErrors.password = "Password is required";
    setLoginErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setFormError("");
    setSubmitting(true);

    try {
      const loggedUser = await login(loginEmail, loginPassword);
      setSubmitting(false);
      onClose();
      if (onSuccess) {
        onSuccess();
      } else {
        if (redirectTo) {
          navigate(redirectTo);
        } else if (loggedUser.role === "admin" || loggedUser.role === "staff") {
          navigate(HOME_BY_ROLE[loggedUser.role]);
        } else {
          // Customer default destination when logging in
          navigate("/customer/menu");
        }
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Invalid email or password");
      setSubmitting(false);
    }
  }

  async function handleRegisterSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: typeof regErrors = {};
    if (!regFullName.trim()) nextErrors.fullName = "Full name is required";
    if (!regPhone.trim()) nextErrors.phone = "Phone number is required";
    if (!regEmail.trim()) nextErrors.email = "Email is required";
    if (regPassword.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }
    if (regPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }
    setRegErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setFormError("");
    setSubmitting(true);

    try {
      await register({
        name: regFullName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });

      // Automatically log them in after registration
      try {
        const loggedUser = await login(regEmail.trim(), regPassword);
        setSubmitting(false);
        onClose();
        if (onSuccess) {
          onSuccess();
        } else if (redirectTo) {
          navigate(redirectTo);
        } else if (loggedUser.role === "admin" || loggedUser.role === "staff") {
          navigate(HOME_BY_ROLE[loggedUser.role]);
        } else {
          navigate("/customer/menu");
        }
      } catch {
        // Fallback: switch to login mode with prefilled email
        setLoginEmail(regEmail.trim());
        setMode("login");
        setSuccessMsg("Account created successfully! Please log in.");
        setSubmitting(false);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create account");
      setSubmitting(false);
    }
  }

  // Quick fill helper for demo accounts
  function fillDemo(email: string) {
    setLoginEmail(email);
    setLoginPassword("password123");
    setFormError("");
    setLoginErrors({});
  }

  // Eye icon component
  const EyeIcon = ({ visible }: { visible: boolean }) => (
    <svg className="size-4.5 transition-colors hover:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {visible ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </>
      ) : (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
        </>
      )}
    </svg>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm transition-all duration-300 animate-in fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Wide container (max-w-xl) */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-10 shadow-2xl transition-all duration-300 transform scale-100 my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 flex size-9 items-center justify-center rounded-full bg-surface-secondary text-muted transition-colors hover:bg-orange-500/10 hover:text-orange-500"
        >
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header & Brand (Top Navigation Removed) */}
        <div className="flex flex-col items-center text-center pb-2">
          <ArifLogo size="md" asLink={false} />
          <h2 className="mt-3 text-2xl font-black text-foreground tracking-tight">
            {mode === "login" ? t("loginTitle") : t("registerTitle")}
          </h2>
          <p className="mt-1 text-xs text-muted max-w-sm">
            {mode === "login"
              ? "Sign in to order your favorite authentic Ethiopian dishes"
              : "Create an account to start ordering delicious Ethiopian food"}
          </p>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="mt-4 rounded-xl bg-green-500/10 p-3.5 text-xs text-green-600 dark:text-green-400 border border-green-500/20">
            {successMsg}
          </div>
        )}
        {formError && (
          <div className="mt-4 rounded-xl bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400 border border-red-500/20">
            {formError}
          </div>
        )}

        {/* FORGOT PASSWORD MODAL VIEW */}
        {showForgotPassword ? (
          <div className="mt-5 space-y-4 animate-in fade-in">
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 text-xs text-muted leading-relaxed">
              <p className="font-bold text-foreground mb-1">Password Recovery</p>
              Enter your email address and we'll send you instructions to reset your account password.
            </div>

            {forgotSent ? (
              <div className="rounded-xl bg-green-500/10 p-4 text-xs text-green-600 dark:text-green-400 border border-green-500/20 text-center">
                ✓ Reset instructions have been sent to <strong>{forgotEmail}</strong>. Please check your inbox.
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
                  className="rounded-full bg-orange-500 hover:bg-orange-600 py-3 font-bold shadow-md shadow-orange-500/20"
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
        ) : mode === "login" ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4" noValidate>
            <Input
              id="login-email"
              label={t("email")}
              type="email"
              placeholder="e.g. dawit@email.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              error={loginErrors.email}
            />

            <div>
              <Input
                id="login-password"
                label={t("password")}
                type={showLoginPassword ? "text" : "password"}
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                error={loginErrors.password}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    className="focus:outline-none"
                  >
                    <EyeIcon visible={showLoginPassword} />
                  </button>
                }
              />

              {/* Forgot password option */}
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

            <Button
              type="submit"
              fullWidth
              disabled={submitting}
              className="mt-3 rounded-full bg-orange-500 hover:bg-orange-600 py-3 text-sm font-bold shadow-md shadow-orange-500/20"
            >
              {submitting ? t("loading") : t("navLogin")}
            </Button>

            {/* Quick Demo Accounts */}
            <div className="mt-4 rounded-2xl border border-border bg-surface-secondary/70 p-3.5">
              <p className="text-[11px] font-bold text-foreground">
                Demo Accounts (1-click fill):
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo("admin@habesha.com")}
                  className="rounded-lg border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:border-orange-500 hover:text-orange-500"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("staff@habesha.com")}
                  className="rounded-lg border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:border-orange-500 hover:text-orange-500"
                >
                  Staff
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("dawit@email.com")}
                  className="rounded-lg border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:border-orange-500 hover:text-orange-500"
                >
                  Customer
                </button>
              </div>
            </div>

            {/* Bottom link to Register */}
            <p className="pt-3 text-center text-xs text-muted border-t border-border">
              {t("noAccount")}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setFormError("");
                }}
                className="font-bold text-orange-500 hover:underline ml-1"
              >
                {t("navRegister")}
              </button>
            </p>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-3.5" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                id="reg-name"
                label={t("fullName")}
                placeholder="e.g. Abebe Bikila"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                error={regErrors.fullName}
              />

              <Input
                id="reg-phone"
                label={t("phone")}
                type="tel"
                placeholder="+251 911 223344"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                error={regErrors.phone}
              />
            </div>

            <Input
              id="reg-email"
              label={t("email")}
              type="email"
              placeholder="user@example.com"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              error={regErrors.email}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                id="reg-password"
                label={t("password")}
                type={showRegPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                error={regErrors.password}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((prev) => !prev)}
                    aria-label={showRegPassword ? "Hide password" : "Show password"}
                    className="focus:outline-none"
                  >
                    <EyeIcon visible={showRegPassword} />
                  </button>
                }
              />

              <Input
                id="reg-confirm-password"
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={regErrors.confirmPassword}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="focus:outline-none"
                  >
                    <EyeIcon visible={showConfirmPassword} />
                  </button>
                }
              />
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={submitting}
              className="mt-3 rounded-full bg-orange-500 hover:bg-orange-600 py-3 text-sm font-bold shadow-md shadow-orange-500/20"
            >
              {submitting ? t("loading") : t("createAccount")}
            </Button>

            {/* Bottom link to Login */}
            <p className="pt-3 text-center text-xs text-muted border-t border-border">
              {t("alreadyHaveAccount")}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setFormError("");
                }}
                className="font-bold text-orange-500 hover:underline ml-1"
              >
                {t("navLogin")}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
